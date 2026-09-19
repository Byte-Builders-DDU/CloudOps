import { getCloudProvider } from '../providers/index.js';
import prisma from '../models/prisma.js';
import { emitResourceScaled } from '../services/socketService.js';

/**
 * Get all resources with filtering options
 */
export async function getResources(req, res, next) {
  try {
    const { provider, region, service, status, search } = req.query;
    const cloudProvider = getCloudProvider();

    const resources = await cloudProvider.getResources({
      provider,
      region,
      service,
      status,
      search,
    });

    const healthSummary = await cloudProvider.getServiceHealth();

    return res.status(200).json({
      success: true,
      data: resources,
      summary: healthSummary,
      count: resources.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single resource by ID with historical metrics
 */
export async function getResourceById(req, res, next) {
  try {
    const { id } = req.params;
    const cloudProvider = getCloudProvider();

    const resource = await cloudProvider.getResourceById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Scale resource capacity (Admin & Operator only)
 */
export async function scaleResource(req, res, next) {
  try {
    const { id } = req.params;
    const { targetCapacity } = req.body;

    if (!targetCapacity || targetCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid target capacity (positive integer) is required.',
      });
    }

    const cloudProvider = getCloudProvider();
    const result = await cloudProvider.scaleResource(id, parseInt(targetCapacity, 10), req.user);

    // Notify connected clients via Socket.IO
    emitResourceScaled(result.resource);

    return res.status(200).json({
      success: true,
      message: `Resource scaled successfully to ${targetCapacity} instances.`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to scale resource.',
    });
  }
}

/**
 * Toggle or restart a resource status
 */
export async function restartResource(req, res, next) {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id } });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource with ID ${id} not found.`,
      });
    }

    const nextStatus = resource.status === 'RUNNING' ? 'RUNNING' : 'RUNNING';

    const updated = await prisma.resource.update({
      where: { id },
      data: { status: nextStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RESTART_RESOURCE',
        resourceId: id,
        details: JSON.stringify({
          resourceName: resource.name,
          restartedBy: req.user.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Resource "${resource.name}" restarted successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new mock cloud resource (Admin only)
 */
export async function createResource(req, res, next) {
  try {
    const { cloudAccountId, name, type, service, region, cpu, memory, storage, instanceCount, monthlyCost } = req.body;

    if (!cloudAccountId || !name || !type || !service || !region) {
      return res.status(400).json({
        success: false,
        message: 'Missing required resource fields.',
      });
    }

    const resource = await prisma.resource.create({
      data: {
        cloudAccountId,
        name,
        type,
        service,
        region,
        cpu: parseFloat(cpu) || 4.0,
        memory: parseFloat(memory) || 16.0,
        storage: parseFloat(storage) || 100.0,
        instanceCount: parseInt(instanceCount, 10) || 1,
        monthlyCost: parseFloat(monthlyCost) || 120.0,
        status: 'RUNNING',
      },
      include: {
        cloudAccount: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_RESOURCE',
        resourceId: resource.id,
        details: JSON.stringify({
          resourceName: resource.name,
          service: resource.service,
          region: resource.region,
          createdBy: req.user.name,
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Resource provisioned successfully.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
}
