import { getCloudProvider } from '../providers/index.js';
import prisma from '../models/prisma.js';

/**
 * Get time-series metrics for a specific resource
 */
export async function getResourceMetrics(req, res, next) {
  try {
    const { resourceId } = req.params;
    const { timeRange = '24h', limit } = req.query;

    const cloudProvider = getCloudProvider();
    const metrics = await cloudProvider.getMetrics(resourceId, { timeRange, limit });

    return res.status(200).json({
      success: true,
      resourceId,
      timeRange,
      count: metrics.length,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregated system-wide metrics for dashboard/monitoring overview
 */
export async function getAggregatedMetrics(req, res, next) {
  try {
    const { provider, region } = req.query;

    const where = {};
    if (provider && provider !== 'ALL') {
      where.cloudAccount = { provider };
    }
    if (region && region !== 'ALL') {
      where.region = region;
    }

    const resources = await prisma.resource.findMany({
      where,
      select: { id: true, name: true, service: true, status: true, cpu: true, memory: true },
    });

    const resourceIds = resources.map(r => r.id);

    // Fetch latest 48 metric points for each resource to build aggregate timeline
    const allMetrics = await prisma.metric.findMany({
      where: {
        resourceId: { in: resourceIds },
      },
      orderBy: { timestamp: 'asc' },
      take: 288,
    });

    // Group by timestamp intervals
    const timelineMap = {};
    allMetrics.forEach(m => {
      const timeKey = m.timestamp.toISOString().substring(0, 16); // up to minute
      if (!timelineMap[timeKey]) {
        timelineMap[timeKey] = {
          timestamp: m.timestamp,
          timeStr: m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cpuTotal: 0,
          memoryTotal: 0,
          requestsTotal: 0,
          latencyTotal: 0,
          count: 0,
        };
      }
      timelineMap[timeKey].cpuTotal += m.cpuUsage;
      timelineMap[timeKey].memoryTotal += m.memoryUsage;
      timelineMap[timeKey].requestsTotal += m.requests;
      timelineMap[timeKey].latencyTotal += m.latency;
      timelineMap[timeKey].count += 1;
    });

    const aggregatedTimeline = Object.values(timelineMap).map(item => ({
      timestamp: item.timestamp,
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpuUsage: Math.round((item.cpuTotal / (item.count || 1)) * 10) / 10,
      memoryUsage: Math.round((item.memoryTotal / (item.count || 1)) * 10) / 10,
      requests: Math.round(item.requestsTotal),
      latency: Math.round((item.latencyTotal / (item.count || 1)) * 10) / 10,
    }));

    return res.status(200).json({
      success: true,
      data: aggregatedTimeline.slice(-24), // return recent 24 intervals
      resourcesTracked: resources.length,
    });
  } catch (error) {
    next(error);
  }
}
