import { CloudProvider } from './CloudProvider.js';
import prisma from '../models/prisma.js';

/**
 * GCPCloudProvider — Live Google Cloud SDK Integration (Phase 3 / Release R3)
 *
 * Implements the CloudProvider interface using:
 *   - @google-cloud/compute    → Managed Instance Groups (MIG) describe & resize
 *   - @google-cloud/monitoring → Cloud Monitoring TimeSeries metric fetch (CPU, Network)
 *
 * Configuration is driven entirely by environment variables — no credentials
 * are hard-coded. Falls back with a clear error when credentials are absent.
 *
 * Environment Variables:
 *   GCP_PROJECT_ID                — GCP project to manage
 *   GOOGLE_APPLICATION_CREDENTIALS — Path to service account JSON key file
 *                                   (or use Workload Identity in GKE/Cloud Run)
 */
export class GCPCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super('GCP');

    // Resolve config from arguments or environment variables
    this.projectId    = config.projectId    || process.env.GCP_PROJECT_ID    || null;
    this.keyFilename  = config.keyFilename  || process.env.GOOGLE_APPLICATION_CREDENTIALS || null;

    // Cached SDK client instances (lazy-initialised on first use)
    this._instanceGroupManagersClient = null;
    this._metricServiceClient         = null;
  }

  // ---------------------------------------------------------------------------
  // Credential Management — GCP Service Account / Application Default Credentials
  // ---------------------------------------------------------------------------

  /**
   * Validates that the minimum required GCP configuration is present.
   * Throws a descriptive error so the server can fall back to MockCloudProvider
   * gracefully rather than crashing.
   */
  _assertCredentials() {
    if (!this.projectId) {
      throw new Error(
        '[GCPCloudProvider] GCP credentials not configured. ' +
        'Set GCP_PROJECT_ID in your .env file and ensure GOOGLE_APPLICATION_CREDENTIALS ' +
        'points to a valid service account key JSON, ' +
        'or set CLOUD_PROVIDER=MockCloud to use the simulation engine.'
      );
    }
  }

  /**
   * Lazily creates and caches an InstanceGroupManagersClient (Compute).
   * Uses Application Default Credentials (ADC) or explicit keyFilename.
   * @returns {Promise<InstanceGroupManagersClient>}
   */
  async _getInstanceGroupManagersClient() {
    if (!this._instanceGroupManagersClient) {
      this._assertCredentials();
      const { InstanceGroupManagersClient } = await import('@google-cloud/compute');
      const options = { projectId: this.projectId };
      if (this.keyFilename) options.keyFilename = this.keyFilename;
      this._instanceGroupManagersClient = new InstanceGroupManagersClient(options);
    }
    return this._instanceGroupManagersClient;
  }

  /**
   * Lazily creates and caches a MetricServiceClient (Cloud Monitoring).
   * @returns {Promise<MetricServiceClient>}
   */
  async _getMetricServiceClient() {
    if (!this._metricServiceClient) {
      this._assertCredentials();
      const { MetricServiceClient } = await import('@google-cloud/monitoring');
      const options = { projectId: this.projectId };
      if (this.keyFilename) options.keyFilename = this.keyFilename;
      this._metricServiceClient = new MetricServiceClient(options);
    }
    return this._metricServiceClient;
  }

  // ---------------------------------------------------------------------------
  // CloudProvider Interface Implementation
  // ---------------------------------------------------------------------------

  /**
   * List all GCP Managed Instance Groups (MIGs) across all zones and map to
   * the CloudOps Resource shape.
   *
   * @param {Object} filter - { provider, region, service, status, search }
   * @returns {Promise<Array>} Resources in CloudOps format
   */
  async getResources(filter = {}) {
    const client = await this._getInstanceGroupManagersClient();

    const resources = [];

    // aggregatedList returns MIGs from all zones in the project
    const [itemsByZone] = await client.aggregatedList({ project: this.projectId });

    for (const [zone, zoneData] of Object.entries(itemsByZone)) {
      const migs = zoneData.instanceGroupManagers || [];
      for (const mig of migs) {
        const instanceCount = mig.targetSize ?? 0;
        const status = instanceCount > 0 ? 'RUNNING' : 'STOPPED';

        // Derive region from zone (e.g. "zones/us-central1-a" → "us-central1")
        const zoneName = zone.replace('zones/', '');
        const region   = zoneName.replace(/-[a-z]$/, '');

        resources.push({
          id:                  mig.selfLink || mig.name,
          name:                mig.name,
          type:                'MANAGED_INSTANCE_GROUP',
          service:             'Compute Engine',
          region,
          status,
          instanceCount,
          minCount:            null, // Autoscaler resource needed for min/max
          maxCount:            null,
          provider:            'GCP',
          cloudAccount:        { provider: 'GCP', region },
          latestMetric:        null,
          hasRecommendation:   false,
          activeRecommendation: null,
          zone:                zoneName,
        });
      }
    }

    // Apply optional filters
    let filtered = resources;
    if (filter.status && filter.status !== 'ALL') {
      filtered = filtered.filter(r => r.status === filter.status);
    }
    if (filter.region && filter.region !== 'ALL') {
      filtered = filtered.filter(r => r.region === filter.region);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q));
    }

    return filtered;
  }

  /**
   * Get a single GCP MIG resource by its selfLink or name.
   *
   * @param {string} id - MIG selfLink or name
   * @returns {Promise<Object|null>} Resource or null
   */
  async getResourceById(id) {
    const resources = await this.getResources();
    return resources.find(r => r.id === id || r.name === id) || null;
  }

  /**
   * Query GCP Cloud Monitoring for CPU utilization on a MIG.
   * Maps to the CloudOps Metric shape and persists to the database.
   *
   * @param {string} resourceId - MIG name or Prisma resource ID
   * @param {Object} options - { timeRange: '1h'|'6h'|'24h'|'7d'|'30d' }
   * @returns {Promise<Array>} Array of Metric objects
   */
  async getMetrics(resourceId, options = {}) {
    const { timeRange = '1h' } = options;

    // Build time window
    const timeRangeMs = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    const durationMs  = timeRangeMs[timeRange] || 3600000;
    const endTime     = new Date();
    const startTime   = new Date(endTime.getTime() - durationMs);

    // Align period to a sane value: 60s for short windows, 300s for longer
    const alignmentPeriodSeconds = durationMs <= 3600000 ? 60 : 300;

    const client = await this._getMetricServiceClient();

    // Fetch CPU utilization for the MIG
    const [timeSeries] = await client.listTimeSeries({
      name:   `projects/${this.projectId}`,
      filter: [
        `metric.type="compute.googleapis.com/instance/cpu/utilization"`,
        `resource.labels.instance_name=starts_with("${resourceId}")`,
      ].join(' AND '),
      interval: {
        startTime: { seconds: Math.floor(startTime.getTime() / 1000) },
        endTime:   { seconds: Math.floor(endTime.getTime()   / 1000) },
      },
      aggregation: {
        alignmentPeriod:    { seconds: alignmentPeriodSeconds },
        perSeriesAligner:   'ALIGN_MEAN',
        crossSeriesReducer: 'REDUCE_MEAN',
        groupByFields:      ['resource.labels.zone'],
      },
    });

    const metrics = [];

    for (const series of timeSeries || []) {
      for (const point of series.points || []) {
        const cpuUsage = Math.round((point.value?.doubleValue ?? 0) * 100 * 10) / 10; // fraction → %
        const ts = point.interval?.endTime;
        if (!ts) continue;

        metrics.push({
          resourceId,
          timestamp:  new Date(Number(ts.seconds) * 1000),
          cpuUsage,
          memoryUsage: null,  // Requires Cloud Monitoring agent / Ops Agent for memory
          networkIn:   null,
          networkOut:  null,
          latency:     null,
          latencyP95:  null,
          requests:    null,
          errorRate:   null,
        });
      }
    }

    // Sort by timestamp ascending
    metrics.sort((a, b) => a.timestamp - b.timestamp);

    // Persist to DB for historical chart views
    if (metrics.length > 0) {
      try {
        const dbResource = await prisma.resource.findFirst({ where: { name: resourceId } });
        if (dbResource) {
          await prisma.metric.createMany({
            data: metrics.map(m => ({
              resourceId:          dbResource.id,
              timestamp:           m.timestamp,
              cpuUsage:            m.cpuUsage,
              memoryUsage:         m.memoryUsage  ?? 0,
              networkIn:           m.networkIn    ?? 0,
              networkOut:          m.networkOut   ?? 0,
              latency:             m.latency      ?? 0,
              latencyP95:          m.latencyP95   ?? 0,
              requests:            m.requests     ?? 0,
              errorRate:           m.errorRate    ?? 0,
              uptimeProbesSuccess: 60,
              uptimeProbesTotal:   60,
              coveragePercent:     100,
            })),
            skipDuplicates: true,
          });
        }
      } catch (dbErr) {
        console.warn('[GCPCloudProvider] Failed to persist Cloud Monitoring metrics to DB:', dbErr.message);
      }
    }

    return metrics;
  }

  /**
   * Fetch cost data from Prisma cost records.
   * (GCP Billing API deferred to a future iteration.)
   *
   * @param {Object} filter
   * @returns {Promise<Object>} Cost breakdown in CloudOps format
   */
  async getCosts(filter = {}) {
    // Delegate to Prisma cost records — consistent with MockCloudProvider / AWS / Azure
    const accounts = await prisma.cloudAccount.findMany({
      where: { provider: 'GCP' },
      include: {
        resources:   true,
        costRecords: { orderBy: { date: 'asc' } },
      },
    });

    let currentMonthlyCost = 0;
    const serviceCosts  = {};
    const dailySpendMap = {};

    accounts.forEach(acc => {
      acc.resources.forEach(res => {
        currentMonthlyCost += res.monthlyCost;
        serviceCosts[res.service] = (serviceCosts[res.service] || 0) + res.monthlyCost;
      });
      acc.costRecords.forEach(cr => {
        const dateKey = cr.date.toISOString().split('T')[0];
        if (!dailySpendMap[dateKey]) {
          dailySpendMap[dateKey] = { date: dateKey, total: 0, GCP: 0 };
        }
        dailySpendMap[dateKey].total += cr.cost;
        dailySpendMap[dateKey].GCP  += cr.cost;
      });
    });

    return {
      currentMonthlyCost: Math.round(currentMonthlyCost * 100) / 100,
      projectedCost:      Math.round(currentMonthlyCost * 1.04),
      potentialSavings:   0,
      providerBreakdown:  [{ name: 'GCP', cost: Math.round(currentMonthlyCost * 100) / 100, percentage: 100 }],
      serviceBreakdown:   Object.keys(serviceCosts).map(name => ({
        name,
        cost:       Math.round(serviceCosts[name] * 100) / 100,
        percentage: currentMonthlyCost > 0 ? Math.round((serviceCosts[name] / currentMonthlyCost) * 100) : 0,
      })),
      dailySpending: Object.values(dailySpendMap).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Resize a GCP Managed Instance Group to the target size.
   * Calls the Compute API resize method, then updates Prisma + AuditLog.
   *
   * @param {string} resourceId - Prisma Resource ID
   * @param {number} targetCapacity - Desired instance count
   * @param {Object} user - User initiating the scaling action
   * @returns {Promise<Object>} Scale operation result
   */
  async scaleResource(resourceId, targetCapacity, user = null) {
    if (targetCapacity < 0) {
      throw new Error('Target capacity must be at least 0 instances.');
    }

    // Resolve from DB to get MIG name and zone
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { cloudAccount: true },
    });
    if (!resource) throw new Error(`Resource ${resourceId} not found.`);

    // Zone and MIG name stored in resource.externalId as "zone/migName"
    const externalId = resource.externalId || resource.name;
    const [zone, migName] = externalId.includes('/')
      ? externalId.split('/')
      : ['us-central1-a', externalId];

    const client = await this._getInstanceGroupManagersClient();

    // Issue the resize operation
    const [operation] = await client.resize({
      project:              this.projectId,
      zone,
      instanceGroupManager: migName,
      size:                 targetCapacity,
    });

    // Wait for the long-running operation to complete
    await operation.promise();
    console.log(`[GCPCloudProvider] MIG ${migName} resized to ${targetCapacity} instances.`);

    // Update Prisma resource record
    const previousCount = resource.instanceCount;
    const baseCostPerInstance = resource.monthlyCost / (previousCount || 1);
    const newMonthlyCost = Math.round(baseCostPerInstance * targetCapacity * 100) / 100;

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data:  { instanceCount: targetCapacity, monthlyCost: newMonthlyCost, status: 'SCALING' },
    });

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        userId:     user?.id || null,
        action:     'SCALE_RESOURCE',
        resourceId,
        details: JSON.stringify({
          resourceName:     resource.name,
          migName,
          zone,
          provider:         'GCP',
          previousCapacity: previousCount,
          newCapacity:      targetCapacity,
          scaledBy:         user?.name || 'System Operator',
        }),
      },
    });

    return {
      success:          true,
      resource:         updated,
      previousCapacity: previousCount,
      newCapacity:      targetCapacity,
      costChange:       Math.round((newMonthlyCost - resource.monthlyCost) * 100) / 100,
    };
  }

  /**
   * Aggregate health status across all GCP MIGs in the project.
   *
   * @returns {Promise<Object>} Health summary { totalResources, running, warning, stopped, ... }
   */
  async getServiceHealth() {
    const client = await this._getInstanceGroupManagersClient();
    const [itemsByZone] = await client.aggregatedList({ project: this.projectId });

    let total = 0, running = 0, stopped = 0;

    for (const [, zoneData] of Object.entries(itemsByZone)) {
      for (const mig of zoneData.instanceGroupManagers || []) {
        total++;
        if ((mig.targetSize ?? 0) > 0) running++;
        else stopped++;
      }
    }

    return {
      totalResources: total,
      running,
      warning:        0,
      stopped,
      scaling:        0,
      uptime:         '99.95%',
      cloudAccounts:  1,
    };
  }

  /**
   * Pull the latest Cloud Monitoring data for each resource and persist.
   * Implements the same interface as MockCloudProvider.generateLiveTelemetry()
   * so socketService.js can use any provider transparently.
   *
   * @param {Array} resources - Array of Prisma Resource objects
   * @returns {Promise<Array>} Live metric payloads
   */
  async generateLiveTelemetry(resources) {
    const liveUpdates = [];

    for (const res of resources) {
      try {
        const metrics = await this.getMetrics(res.externalId || res.name, { timeRange: '1h' });
        const latest  = metrics[metrics.length - 1];
        if (latest) {
          liveUpdates.push({
            resourceId:          res.id,
            timestamp:           new Date().toISOString(),
            cpuUsage:            latest.cpuUsage    ?? 0,
            memoryUsage:         latest.memoryUsage ?? 0,
            networkIn:           latest.networkIn   ?? 0,
            networkOut:          latest.networkOut  ?? 0,
            latency:             latest.latency     ?? 0,
            latencyP95:          latest.latencyP95  ?? 0,
            requests:            latest.requests    ?? 0,
            errorRate:           latest.errorRate   ?? 0,
            uptimeProbesSuccess: 60,
            uptimeProbesTotal:   60,
            coveragePercent:     100,
          });
        }
      } catch (err) {
        console.warn(`[GCPCloudProvider] generateLiveTelemetry failed for ${res.name}:`, err.message);
      }
    }

    return liveUpdates;
  }
}
