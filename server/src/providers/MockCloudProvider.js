import { CloudProvider } from './CloudProvider.js';
import prisma from '../models/prisma.js';

export class MockCloudProvider extends CloudProvider {
  constructor() {
    super('MockCloud');
  }

  /**
   * Get filtered resources with account and latest metric metadata
   */
  async getResources(filter = {}) {
    const { provider, region, service, status, search } = filter;

    const where = {};

    if (provider && provider !== 'ALL') {
      where.cloudAccount = { provider };
    }

    if (region && region !== 'ALL') {
      where.region = region;
    }

    if (service && service !== 'ALL') {
      where.service = service;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { service: { contains: search } },
        { region: { contains: search } },
        { type: { contains: search } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        cloudAccount: {
          select: { id: true, provider: true, accountName: true, region: true }
        },
        scalingRecommendations: {
          where: { status: 'PENDING' },
          take: 1
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return resources.map(res => ({
      ...res,
      latestMetric: res.metrics[0] || null,
      hasRecommendation: res.scalingRecommendations.length > 0,
      activeRecommendation: res.scalingRecommendations[0] || null
    }));
  }

  /**
   * Get single resource with recent metrics and active recommendations
   */
  async getResourceById(id) {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        cloudAccount: true,
        scalingRecommendations: {
          orderBy: { createdAt: 'desc' }
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 48
        }
      }
    });

    if (!resource) return null;

    return {
      ...resource,
      latestMetric: resource.metrics[0] || null,
    };
  }

  /**
   * Fetch time-series metric data for a resource
   */
  async getMetrics(resourceId, options = {}) {
    const { timeRange = '24h', limit } = options;

    let takeCount = 48; // default ~24h of 30min intervals
    if (timeRange === '1h') takeCount = 12;
    if (timeRange === '6h') takeCount = 24;
    if (timeRange === '24h') takeCount = 48;
    if (timeRange === '7d') takeCount = 168;
    if (timeRange === '30d') takeCount = 720;

    if (limit) takeCount = parseInt(limit, 10);

    const metrics = await prisma.metric.findMany({
      where: { resourceId },
      orderBy: { timestamp: 'asc' },
      take: takeCount
    });

    return metrics;
  }

  /**
   * Aggregate cost data by provider, service, and time
   */
  async getCosts(filter = {}) {
    const { provider, region, timeRange = '30d' } = filter;

    const whereAccount = {};
    if (provider && provider !== 'ALL') {
      whereAccount.provider = provider;
    }
    if (region && region !== 'ALL') {
      whereAccount.region = region;
    }

    const accounts = await prisma.cloudAccount.findMany({
      where: whereAccount,
      include: {
        resources: true,
        costRecords: {
          orderBy: { date: 'asc' }
        }
      }
    });

    // Calculate current monthly run-rate from active resources
    let currentMonthlyCost = 0;
    const providerCosts = { AWS: 0, Azure: 0, GCP: 0 };
    const serviceCosts = {};

    accounts.forEach(acc => {
      acc.resources.forEach(res => {
        currentMonthlyCost += res.monthlyCost;
        providerCosts[acc.provider] = (providerCosts[acc.provider] || 0) + res.monthlyCost;
        serviceCosts[res.service] = (serviceCosts[res.service] || 0) + res.monthlyCost;
      });
    });

    // Aggregate cost records by date for time-series charts
    const dailySpendMap = {};
    accounts.forEach(acc => {
      acc.costRecords.forEach(cr => {
        const dateKey = cr.date.toISOString().split('T')[0];
        if (!dailySpendMap[dateKey]) {
          dailySpendMap[dateKey] = {
            date: dateKey,
            total: 0,
            AWS: 0,
            Azure: 0,
            GCP: 0
          };
        }
        dailySpendMap[dateKey].total += cr.cost;
        dailySpendMap[dateKey][acc.provider] = (dailySpendMap[dateKey][acc.provider] || 0) + cr.cost;
      });
    });

    const dailySpending = Object.values(dailySpendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Forecasted end-of-month cost (simple 30-day projection)
    const projectedCost = Math.round(currentMonthlyCost * 1.04);
    const potentialSavings = 345.50; // based on active scaling recommendations

    return {
      currentMonthlyCost: Math.round(currentMonthlyCost * 100) / 100,
      projectedCost,
      potentialSavings,
      providerBreakdown: Object.keys(providerCosts).map(name => ({
        name,
        cost: Math.round(providerCosts[name] * 100) / 100,
        percentage: currentMonthlyCost > 0 ? Math.round((providerCosts[name] / currentMonthlyCost) * 100) : 0
      })),
      serviceBreakdown: Object.keys(serviceCosts).map(name => ({
        name,
        cost: Math.round(serviceCosts[name] * 100) / 100,
        percentage: currentMonthlyCost > 0 ? Math.round((serviceCosts[name] / currentMonthlyCost) * 100) : 0
      })),
      dailySpending
    };
  }

  /**
   * Scale resource capacity and update state
   */
  async scaleResource(resourceId, targetCapacity, user = null) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { cloudAccount: true }
    });

    if (!resource) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    if (targetCapacity < 1) {
      throw new Error("Target capacity must be at least 1 instance");
    }

    // Check active policy constraints
    const policies = await prisma.policy.findMany({ where: { enabled: true } });
    for (const policy of policies) {
      if (targetCapacity > policy.maxInstanceCount) {
        throw new Error(`Scale request exceeds Policy "${policy.name}" limit (Max: ${policy.maxInstanceCount} instances)`);
      }
    }

    const previousCount = resource.instanceCount;
    const baseCostPerInstance = resource.monthlyCost / (previousCount || 1);
    const newMonthlyCost = Math.round(baseCostPerInstance * targetCapacity * 100) / 100;

    // Update resource in DB
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        instanceCount: targetCapacity,
        monthlyCost: newMonthlyCost,
        status: 'RUNNING'
      }
    });

    // Mark any related pending recommendations as APPLIED
    await prisma.scalingRecommendation.updateMany({
      where: {
        resourceId,
        status: 'PENDING'
      },
      data: {
        status: 'APPLIED'
      }
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        action: 'SCALE_RESOURCE',
        resourceId,
        details: JSON.stringify({
          resourceName: resource.name,
          provider: resource.cloudAccount.provider,
          previousCapacity: previousCount,
          newCapacity: targetCapacity,
          previousCost: resource.monthlyCost,
          newCost: newMonthlyCost,
          scaledBy: user?.name || 'System Operator'
        })
      }
    });

    return {
      success: true,
      resource: updated,
      previousCapacity: previousCount,
      newCapacity: targetCapacity,
      costChange: Math.round((newMonthlyCost - resource.monthlyCost) * 100) / 100
    };
  }

  /**
   * Generate live diurnal telemetry and inject Journey A surge
   */
  async generateLiveTelemetry(resources) {
    const liveUpdates = [];
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    
    // Diurnal cycle: peaks around hour 14 (2 PM)
    const diurnalFactor = (Math.sin((hour - 8) * Math.PI / 12) + 1) / 2; // 0.0 to 1.0

    for (const res of resources) {
      // Base generation based on resource type
      let baseCpu = 20 + diurnalFactor * 40; // 20% to 60%
      let baseMem = 40 + diurnalFactor * 20; // 40% to 60%
      let baseReq = 5000 + diurnalFactor * 10000;
      let baseLat = 40 + diurnalFactor * 20;
      let errorRate = 0.005 + diurnalFactor * 0.01;

      // Add random noise
      baseCpu += (Math.random() - 0.5) * 5;
      baseMem += (Math.random() - 0.5) * 5;
      baseReq += (Math.random() - 0.5) * 500;
      baseLat += (Math.random() - 0.5) * 5;

      // Inject Journey A surge scenario on api-asg
      if (res.name === 'api-asg' || res.name === 'prod-api') {
        baseCpu = 82.0 + (Math.random() * 3 - 1.5); // Fixed around 82%
        baseReq = 18000 * 1.34; // +34% traffic (24,120)
        baseLat = 142.0 + (Math.random() * 10 - 5);
        errorRate = 0.05;
      }

      // Cap bounds
      const cpuUsage = Math.max(1, Math.min(100, Math.round(baseCpu * 10) / 10));
      const memoryUsage = Math.max(1, Math.min(100, Math.round(baseMem * 10) / 10));
      const latency = Math.max(5, Math.round(baseLat * 10) / 10);
      const requests = Math.round(Math.max(10, baseReq));

      const updatePayload = {
        resourceId: res.id,
        timestamp: now.toISOString(),
        cpuUsage,
        memoryUsage,
        networkIn: Math.round((requests / 1000) * 2 * 10) / 10,
        networkOut: Math.round((requests / 1000) * 4 * 10) / 10,
        latency,
        latencyP95: Math.round(latency * 1.2 * 10) / 10,
        requests,
        errorRate: Math.round(errorRate * 1000) / 1000,
        uptimeProbesSuccess: 60,
        uptimeProbesTotal: 60,
        coveragePercent: 100.0
      };

      liveUpdates.push(updatePayload);
    }

    // Persist to database so historical queries reflect the live simulation
    if (liveUpdates.length > 0) {
      await prisma.metric.createMany({
        data: liveUpdates.map(u => ({
          resourceId: u.resourceId,
          timestamp: new Date(u.timestamp),
          cpuUsage: u.cpuUsage,
          memoryUsage: u.memoryUsage,
          networkIn: u.networkIn,
          networkOut: u.networkOut,
          latency: u.latency,
          latencyP95: u.latencyP95,
          requests: u.requests,
          errorRate: u.errorRate,
          uptimeProbesSuccess: u.uptimeProbesSuccess,
          uptimeProbesTotal: u.uptimeProbesTotal,
          coveragePercent: u.coveragePercent
        }))
      });
    }

    return liveUpdates;
  }

  /**
   * Calculate aggregated health status across cloud infrastructure
   */
  async getServiceHealth() {
    const resources = await prisma.resource.findMany();
    const accounts = await prisma.cloudAccount.findMany();

    const summary = {
      totalResources: resources.length,
      running: resources.filter(r => r.status === 'RUNNING').length,
      warning: resources.filter(r => r.status === 'DEGRADED').length,
      stopped: resources.filter(r => r.status === 'STOPPED').length,
      scaling: resources.filter(r => r.status === 'SCALING').length,
      uptime: '99.98%',
      cloudAccounts: accounts.length
    };

    return summary;
  }
}
