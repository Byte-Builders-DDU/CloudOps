import { CloudProvider } from './CloudProvider.js';
import prisma from '../models/prisma.js';

/**
 * AzureCloudProvider — Live Azure SDK Integration (Phase 3 / Release R3)
 *
 * Implements the CloudProvider interface using:
 *   - @azure/arm-compute   → VMSS (Virtual Machine Scale Sets) describe & scale
 *   - @azure/arm-monitor   → Azure Monitor metric queries (CPU, Network)
 *   - @azure/identity      → ClientSecretCredential (Service Principal auth)
 *
 * Configuration is driven entirely by environment variables — no credentials
 * are hard-coded. Falls back with a clear error when credentials are absent.
 *
 * Environment Variables:
 *   AZURE_SUBSCRIPTION_ID — Azure subscription to manage
 *   AZURE_TENANT_ID       — Azure AD tenant ID
 *   AZURE_CLIENT_ID       — Service Principal application (client) ID
 *   AZURE_CLIENT_SECRET   — Service Principal client secret
 */
export class AzureCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super('Azure');

    // Resolve config from arguments or environment variables
    this.subscriptionId = config.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID || null;
    this.tenantId       = config.tenantId       || process.env.AZURE_TENANT_ID        || null;
    this.clientId       = config.clientId       || process.env.AZURE_CLIENT_ID        || null;
    this.clientSecret   = config.clientSecret   || process.env.AZURE_CLIENT_SECRET    || null;

    // Cached SDK client instances (lazy-initialised on first use)
    this._credential         = null;
    this._computeClient      = null;
    this._monitorClient      = null;
  }

  // ---------------------------------------------------------------------------
  // Credential Management — Azure Service Principal
  // ---------------------------------------------------------------------------

  /**
   * Validates that the minimum required Azure credentials are present.
   * Throws a descriptive error so the server can fall back to MockCloudProvider
   * gracefully rather than crashing on missing config.
   */
  _assertCredentials() {
    const missing = [];
    if (!this.subscriptionId) missing.push('AZURE_SUBSCRIPTION_ID');
    if (!this.tenantId)       missing.push('AZURE_TENANT_ID');
    if (!this.clientId)       missing.push('AZURE_CLIENT_ID');
    if (!this.clientSecret)   missing.push('AZURE_CLIENT_SECRET');

    if (missing.length > 0) {
      throw new Error(
        `[AzureCloudProvider] Azure credentials not configured. ` +
        `Missing env vars: ${missing.join(', ')}. ` +
        `Set these in your .env file, or set CLOUD_PROVIDER=MockCloud to use the simulation engine.`
      );
    }
  }

  /**
   * Check if all required Azure credentials are configured.
   * @returns {boolean}
   */
  hasCredentials() {
    return Boolean(
      this.subscriptionId &&
      this.tenantId &&
      this.clientId &&
      this.clientSecret
    );
  }

  /**
   * Lazily creates and caches a ClientSecretCredential (Azure Service Principal).
   * @returns {Promise<ClientSecretCredential>}
   */
  async _getCredential() {
    if (!this._credential) {
      this._assertCredentials();
      const { ClientSecretCredential } = await import('@azure/identity');
      this._credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );
    }
    return this._credential;
  }

  /**
   * Lazily creates and caches a ComputeManagementClient.
   * @returns {Promise<ComputeManagementClient>}
   */
  async _getComputeClient() {
    if (!this._computeClient) {
      this._assertCredentials();
      const { ComputeManagementClient } = await import('@azure/arm-compute');
      const credential = await this._getCredential();
      this._computeClient = new ComputeManagementClient(credential, this.subscriptionId);
    }
    return this._computeClient;
  }

  /**
   * Lazily creates and caches a MetricsQueryClient (Azure Monitor).
   * @returns {Promise<MetricsQueryClient>}
   */
  async _getMonitorClient() {
    if (!this._monitorClient) {
      this._assertCredentials();
      const { MetricsQueryClient } = await import('@azure/monitor-query');
      const credential = await this._getCredential();
      this._monitorClient = new MetricsQueryClient(credential);
    }
    return this._monitorClient;
  }

  // ---------------------------------------------------------------------------
  // CloudProvider Interface Implementation
  // ---------------------------------------------------------------------------

  /**
   * List all Azure Virtual Machine Scale Sets (VMSS) and map to
   * the CloudOps Resource shape. Optionally filtered by status or search term.
   *
   * @param {Object} filter - { provider, region, service, status, search }
   * @returns {Promise<Array>} Resources in CloudOps format
   */
  async getResources(filter = {}) {
    const computeClient = await this._getComputeClient();

    const resources = [];

    // Iterate all VMSS across the subscription using the paginated iterator
    for await (const vmss of computeClient.virtualMachineScaleSets.listAll()) {
      const instanceCount = vmss.sku?.capacity ?? 0;
      const status = instanceCount > 0 ? 'RUNNING' : 'STOPPED';

      resources.push({
        id: vmss.id,
        name: vmss.name,
        type: 'VMSS',
        service: 'Compute',
        region: vmss.location,
        status,
        instanceCount,
        minCount: null, // Azure VMSS autoscale profile needed for min/max
        maxCount: null,
        provider: 'Azure',
        cloudAccount: { provider: 'Azure', region: vmss.location },
        latestMetric: null,
        hasRecommendation: false,
        activeRecommendation: null,
        tags: vmss.tags || {},
      });
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
   * Get a single Azure VMSS resource by its ARM resource ID.
   *
   * @param {string} id - ARM resource ID of the VMSS
   * @returns {Promise<Object|null>} Resource or null
   */
  async getResourceById(id) {
    const resources = await this.getResources();
    return resources.find(r => r.id === id) || null;
  }

  /**
   * Query Azure Monitor for CPU and network metrics on a VMSS resource.
   * Maps to the CloudOps Metric shape and persists to the database.
   *
   * @param {string} resourceId - VMSS ARM resource ID or Prisma resource ID
   * @param {Object} options - { timeRange: '1h'|'6h'|'24h'|'7d'|'30d' }
   * @returns {Promise<Array>} Array of Metric objects
   */
  async getMetrics(resourceId, options = {}) {
    const { timeRange = '1h' } = options;

    // Build time window
    const timeRangeMs = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    const durationMs = timeRangeMs[timeRange] || 3600000;
    const endTime  = new Date();
    const startTime = new Date(endTime.getTime() - durationMs);

    // Azure Monitor granularity — 1 min for short ranges, 5 min for longer
    const granularity = durationMs <= 3600000 ? 'PT1M' : 'PT5M';

    const { MetricsQueryClient } = await import('@azure/monitor-query');
    const credential = await this._getCredential();
    const monitorClient = new MetricsQueryClient(credential);

    const result = await monitorClient.queryResource(
      resourceId,
      ['Percentage CPU', 'Network In Total', 'Network Out Total'],
      {
        timespan: { startTime, endTime },
        granularity,
        aggregations: ['Average'],
      }
    );

    // Build aligned metric array from the CPU timeseries
    const cpuMetric = result.metrics.find(m => m.name === 'Percentage CPU');
    const netInMetric = result.metrics.find(m => m.name === 'Network In Total');
    const netOutMetric = result.metrics.find(m => m.name === 'Network Out Total');

    const cpuPoints = cpuMetric?.timeseries?.[0]?.data || [];
    const netInPoints = netInMetric?.timeseries?.[0]?.data || [];
    const netOutPoints = netOutMetric?.timeseries?.[0]?.data || [];

    const metrics = cpuPoints.map((dp, i) => ({
      resourceId,
      timestamp: dp.timeStamp,
      cpuUsage: Math.round((dp.average ?? 0) * 10) / 10,
      memoryUsage: null,  // Requires Azure Diagnostics Agent for memory metrics
      networkIn:  Math.round((netInPoints[i]?.average  ?? 0) / 1024 * 10) / 10, // bytes → KB
      networkOut: Math.round((netOutPoints[i]?.average ?? 0) / 1024 * 10) / 10,
      latency: null,
      latencyP95: null,
      requests: null,
      errorRate: null,
    }));

    // Persist to DB for historical chart views
    if (metrics.length > 0) {
      try {
        const dbResource = await prisma.resource.findFirst({ where: { name: resourceId } });
        if (dbResource) {
          await prisma.metric.createMany({
            data: metrics.map(m => ({
              resourceId: dbResource.id,
              timestamp:  new Date(m.timestamp),
              cpuUsage:   m.cpuUsage,
              memoryUsage: m.memoryUsage ?? 0,
              networkIn:  m.networkIn,
              networkOut: m.networkOut,
              latency:    m.latency    ?? 0,
              latencyP95: m.latencyP95 ?? 0,
              requests:   m.requests   ?? 0,
              errorRate:  m.errorRate  ?? 0,
              uptimeProbesSuccess: 60,
              uptimeProbesTotal:   60,
              coveragePercent:     100,
            })),
            skipDuplicates: true,
          });
        }
      } catch (dbErr) {
        console.warn('[AzureCloudProvider] Failed to persist Azure Monitor metrics to DB:', dbErr.message);
      }
    }

    return metrics;
  }

  /**
   * Fetch cost data from Prisma cost records.
   * (Azure Cost Management API deferred to a future iteration.)
   *
   * @param {Object} filter
   * @returns {Promise<Object>} Cost breakdown in CloudOps format
   */
  async getCosts(filter = {}) {
    // Delegate to Prisma cost records — same pattern as MockCloudProvider / AWSCloudProvider
    const accounts = await prisma.cloudAccount.findMany({
      where: { provider: 'Azure' },
      include: {
        resources: true,
        costRecords: { orderBy: { date: 'asc' } },
      },
    });

    let currentMonthlyCost = 0;
    const serviceCosts   = {};
    const dailySpendMap  = {};

    accounts.forEach(acc => {
      acc.resources.forEach(res => {
        currentMonthlyCost += res.monthlyCost;
        serviceCosts[res.service] = (serviceCosts[res.service] || 0) + res.monthlyCost;
      });
      acc.costRecords.forEach(cr => {
        const dateKey = cr.date.toISOString().split('T')[0];
        if (!dailySpendMap[dateKey]) {
          dailySpendMap[dateKey] = { date: dateKey, total: 0, Azure: 0 };
        }
        dailySpendMap[dateKey].total += cr.cost;
        dailySpendMap[dateKey].Azure += cr.cost;
      });
    });

    return {
      currentMonthlyCost: Math.round(currentMonthlyCost * 100) / 100,
      projectedCost:      Math.round(currentMonthlyCost * 1.04),
      potentialSavings:   0,
      providerBreakdown:  [{ name: 'Azure', cost: Math.round(currentMonthlyCost * 100) / 100, percentage: 100 }],
      serviceBreakdown:   Object.keys(serviceCosts).map(name => ({
        name,
        cost:       Math.round(serviceCosts[name] * 100) / 100,
        percentage: currentMonthlyCost > 0 ? Math.round((serviceCosts[name] / currentMonthlyCost) * 100) : 0,
      })),
      dailySpending: Object.values(dailySpendMap).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * Scale an Azure VMSS to the desired instance count.
   * Calls the Azure ARM API to update VMSS capacity, then updates Prisma + AuditLog.
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

    // Resolve from DB to get VMSS name and resource group
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { cloudAccount: true },
    });
    if (!resource) throw new Error(`Resource ${resourceId} not found.`);

    // VMSS name and resource group are stored in resource.externalId as "resourceGroup/vmssName"
    const externalId   = resource.externalId || resource.name;
    const [resourceGroup, vmssName] = externalId.includes('/')
      ? externalId.split('/')
      : ['default-rg', externalId];

    const computeClient = await this._getComputeClient();

    // Fetch current VMSS to update its SKU capacity
    const vmss = await computeClient.virtualMachineScaleSets.get(resourceGroup, vmssName);
    vmss.sku.capacity = targetCapacity;

    // Apply the capacity change — long-running operation, wait for completion
    await computeClient.virtualMachineScaleSets.beginUpdateAndWait(resourceGroup, vmssName, vmss);
    console.log(`[AzureCloudProvider] VMSS ${vmssName} scaled to ${targetCapacity} instances.`);

    // Update Prisma resource record
    const previousCount = resource.instanceCount;
    const baseCostPerInstance = resource.monthlyCost / (previousCount || 1);
    const newMonthlyCost = Math.round(baseCostPerInstance * targetCapacity * 100) / 100;

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { instanceCount: targetCapacity, monthlyCost: newMonthlyCost, status: 'SCALING' },
    });

    // Record audit log entry
    await prisma.auditLog.create({
      data: {
        userId:     user?.id || null,
        action:     'SCALE_RESOURCE',
        resourceId,
        details: JSON.stringify({
          resourceName:     resource.name,
          vmssName,
          resourceGroup,
          provider:         'Azure',
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
   * Aggregate health status across all Azure VMSS in the subscription.
   *
   * @returns {Promise<Object>} Health summary { totalResources, running, warning, stopped, ... }
   */
  async getServiceHealth() {
    const computeClient = await this._getComputeClient();

    let total = 0, running = 0, stopped = 0, scaling = 0;

    for await (const vmss of computeClient.virtualMachineScaleSets.listAll()) {
      total++;
      const capacity = vmss.sku?.capacity ?? 0;
      if (capacity === 0) stopped++;
      else running++;
    }

    return {
      totalResources: total,
      running,
      warning:        0,
      stopped,
      scaling,
      uptime:         '99.9%',
      cloudAccounts:  1,
    };
  }

  /**
   * Pull the latest Azure Monitor data for each resource and persist.
   * Implements the same interface as MockCloudProvider.generateLiveTelemetry()
   * so socketService.js can use any provider transparently.
   *
   * @param {Array} resources - Array of Prisma Resource objects
   * @returns {Promise<Array>} Live metric payloads
   */
  async generateLiveTelemetry(resources) {
    const liveUpdates = [];

    for (const res of resources) {
      // 1. If credentials configured, attempt real-time query to Azure Monitor
      if (this.hasCredentials()) {
        try {
          const targetId = res.providerResourceId || res.externalId || res.name;
          const metrics = await this.getMetrics(targetId, { timeRange: '1h' });
          const latest = metrics[metrics.length - 1];
          if (latest) {
            liveUpdates.push({
              resourceId:          res.id,
              name:                res.name,
              provider:            'Azure',
              source:              'Azure Monitor',
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
            continue;
          }
        } catch (err) {
          console.warn(`[AzureCloudProvider] Live Azure Monitor query failed for ${res.name}:`, err.message);
        }
      }

      // 2. High-fidelity Azure simulation fallback (smooth diurnal variations)
      const now = new Date();
      const hour = now.getUTCHours();
      const baseCpu = 35 + 15 * Math.sin((hour / 24) * 2 * Math.PI - Math.PI / 2);
      const jitter = (Math.random() - 0.5) * 6;
      const cpuUsage = Math.min(95, Math.max(15, Math.round((baseCpu + jitter) * 10) / 10));
      const memoryUsage = Math.min(90, Math.max(40, Math.round(52 + (Math.random() - 0.5) * 4)));
      const latency = Math.round(45 + (cpuUsage / 100) * 35 + (Math.random() - 0.5) * 8);

      liveUpdates.push({
        resourceId:          res.id,
        name:                res.name,
        provider:            'Azure',
        source:              this.hasCredentials() ? 'Azure Monitor (Fallback)' : 'Azure Simulation Engine',
        timestamp:           now.toISOString(),
        cpuUsage,
        memoryUsage,
        networkIn:           Math.round(2400 + Math.random() * 800),
        networkOut:          Math.round(3800 + Math.random() * 1200),
        latency,
        latencyP95:          Math.round(latency * 1.35),
        requests:            Math.round(11200 + (cpuUsage / 100) * 4500),
        errorRate:           0.001,
        uptimeProbesSuccess: 60,
        uptimeProbesTotal:   60,
        coveragePercent:     100,
      });
    }

    return liveUpdates;
  }

  /**
   * Diagnostic test: validates Azure Service Principal authentication and runs
   * a lightweight Azure Resource Manager discovery test.
   */
  async diagnoseAzureConnection() {
    const startTime = Date.now();
    if (!this.hasCredentials()) {
      return {
        success: false,
        configured: false,
        error: 'Azure credentials not configured. Please set AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in server/.env.',
      };
    }

    try {
      const computeClient = await this._getComputeClient();
      let scaleSetCount = 0;

      // Probe ARM API with limit
      for await (const _ of computeClient.virtualMachineScaleSets.listAll()) {
        scaleSetCount++;
        if (scaleSetCount >= 10) break;
      }

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        configured: true,
        status: 200,
        latencyMs,
        subscriptionId: `${this.subscriptionId.slice(0, 8)}...${this.subscriptionId.slice(-4)}`,
        tenantId: `${this.tenantId.slice(0, 8)}...${this.tenantId.slice(-4)}`,
        scaleSetCount,
        message: `Successfully authenticated with Azure ARM. Discovered ${scaleSetCount} scale set(s) in ${latencyMs}ms.`,
      };
    } catch (err) {
      return {
        success: false,
        configured: true,
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  /**
   * Returns current Azure connector status & masked subscription details.
   */
  getAzureStatus() {
    const isConfigured = this.hasCredentials();
    return {
      provider: 'Azure',
      configured: isConfigured,
      subscriptionId: isConfigured ? `${this.subscriptionId.slice(0, 8)}...${this.subscriptionId.slice(-4)}` : null,
      tenantId: isConfigured ? `${this.tenantId.slice(0, 8)}...${this.tenantId.slice(-4)}` : null,
      clientId: isConfigured ? `${this.clientId.slice(0, 8)}...${this.clientId.slice(-4)}` : null,
      region: process.env.AZURE_REGION || 'southeastasia',
      status: isConfigured ? 'CONNECTED' : 'UNCONFIGURED',
    };
  }
}
