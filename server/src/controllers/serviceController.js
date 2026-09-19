import prisma from '../models/prisma.js';

/**
 * Controller for Logical Services & Resource Mapping
 * Conforms to PRD.md §5 (FR-02) and DESIGN.md §6.2, §6.3
 */

export async function getServices(req, res, next) {
  try {
    const workspaceId = req.workspaceId;

    const services = await prisma.service.findMany({
      where: { workspaceId },
      include: {
        resources: {
          include: {
            metrics: {
              take: 1,
              orderBy: { timestamp: 'desc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = services.map(svc => {
      const resourceCount = svc.resources.length;
      const totalCost = svc.resources.reduce((acc, r) => acc + r.monthlyCost, 0);
      
      // Extract latest metrics from primary compute resource
      const primaryCompute = svc.resources.find(r => r.type === 'Compute') || svc.resources[0];
      const latestMetric = primaryCompute?.metrics?.[0] || null;

      return {
        id: svc.id,
        name: svc.name,
        environment: svc.environment,
        owner: svc.owner,
        health: svc.health,
        resourceCount,
        monthlyCost: Math.round(totalCost),
        requestRate: latestMetric ? latestMetric.requests : 0,
        latencyMs: latestMetric ? Math.round(latestMetric.latency) : 0,
        p95LatencyMs: latestMetric ? Math.round(latestMetric.latencyP95 || latestMetric.latency) : 0,
        errorRate: latestMetric ? latestMetric.errorRate : 0.0,
      };
    });

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function getServiceById(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const service = await prisma.service.findFirst({
      where: { id, workspaceId },
      include: {
        resources: {
          include: {
            cloudAccount: true,
            scalingRecommendations: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: 'Service not found in current workspace.' },
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
}
