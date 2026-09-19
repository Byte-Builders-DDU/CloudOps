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
            cloudAccount: true,
            metrics: {
              take: 1,
              orderBy: { timestamp: 'desc' },
            },
          },
        },
        changeRequests: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = services.map(svc => {
      const resourceCount = svc.resources.length;
      const totalCost = svc.resources.reduce((acc, r) => acc + (r.monthlyCost || 0), 0);
      
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
        resources: svc.resources.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          provider: r.cloudAccount?.provider || 'AWS',
          region: r.region,
          status: r.status,
          instanceCount: r.instanceCount,
          monthlyCost: r.monthlyCost,
        })),
        recentChangesCount: svc.changeRequests.length,
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
            metrics: {
              take: 10,
              orderBy: { timestamp: 'desc' },
            },
          },
        },
        changeRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            approver: { select: { id: true, name: true, email: true } },
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

/**
 * Create a new logical service (Admin/Operator only)
 */
export async function createService(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const { name, environment = 'PRODUCTION', owner, health = 'HEALTHY' } = req.body;

    if (!name || !owner) {
      return res.status(400).json({
        success: false,
        error: { message: 'Service name and owner are required.' },
      });
    }

    const service = await prisma.service.create({
      data: {
        workspaceId,
        name: name.trim(),
        environment,
        owner: owner.trim(),
        health,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'CREATE_SERVICE',
        targetType: 'SERVICE',
        targetId: service.id,
        details: JSON.stringify({ name: service.name, environment: service.environment, owner: service.owner }),
        outcome: 'SUCCESS',
      },
    });

    res.status(201).json({
      success: true,
      data: service,
      message: `Logical service "${service.name}" created successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing service (Admin/Operator only)
 */
export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;
    const { name, environment, owner, health } = req.body;

    const existing = await prisma.service.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { message: 'Service not found in workspace.' },
      });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (environment !== undefined) data.environment = environment;
    if (owner !== undefined) data.owner = owner.trim();
    if (health !== undefined) data.health = health;

    const updated = await prisma.service.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'UPDATE_SERVICE',
        targetType: 'SERVICE',
        targetId: id,
        details: JSON.stringify(data),
        outcome: 'SUCCESS',
      },
    });

    res.json({
      success: true,
      data: updated,
      message: `Service "${updated.name}" updated successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a service (Admin only)
 */
export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const existing = await prisma.service.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { message: 'Service not found in workspace.' },
      });
    }

    // Set serviceId to null for any linked resources before deleting service
    await prisma.resource.updateMany({
      where: { serviceId: id },
      data: { serviceId: null },
    });

    await prisma.service.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'DELETE_SERVICE',
        targetType: 'SERVICE',
        targetId: id,
        details: JSON.stringify({ name: existing.name }),
        outcome: 'SUCCESS',
      },
    });

    res.json({
      success: true,
      message: `Service "${existing.name}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
