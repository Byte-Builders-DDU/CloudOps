import prisma from '../models/prisma.js';
import { getCloudProvider } from '../providers/index.js';
import { emitResourceScaled } from '../services/socketService.js';

/**
 * List scaling recommendations
 */
export async function getRecommendations(req, res, next) {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const recommendations = await prisma.scalingRecommendation.findMany({
      where,
      include: {
        resource: {
          include: {
            cloudAccount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = recommendations.filter(r => r.status === 'PENDING').length;
    const totalPotentialSavings = recommendations
      .filter(r => r.status === 'PENDING' && r.estimatedCostChange < 0)
      .reduce((acc, curr) => acc + Math.abs(curr.estimatedCostChange), 0);

    return res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        pendingCount,
        totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply a scaling recommendation (Admin & Operator only)
 */
export async function applyRecommendation(req, res, next) {
  try {
    const { id } = req.params;

    const rec = await prisma.scalingRecommendation.findUnique({
      where: { id },
      include: { resource: { include: { cloudAccount: true } } },
    });

    if (!rec) {
      return res.status(404).json({
        success: false,
        message: `Recommendation with ID ${id} not found.`,
      });
    }

    if (rec.status === 'APPLIED') {
      return res.status(400).json({
        success: false,
        message: 'This recommendation has already been applied.',
      });
    }

    // Use CloudProvider to execute scaling and policy validation
    const cloudProvider = getCloudProvider();
    const result = await cloudProvider.scaleResource(rec.resourceId, rec.recommendedCapacity, req.user);

    // Update recommendation status
    const updatedRec = await prisma.scalingRecommendation.update({
      where: { id },
      data: { status: 'APPLIED' },
    });

    // Notify clients via Socket.IO
    emitResourceScaled(result.resource);

    return res.status(200).json({
      success: true,
      message: `Recommendation successfully applied. ${rec.resource.name} capacity scaled from ${rec.currentCapacity} to ${rec.recommendedCapacity}.`,
      data: {
        recommendation: updatedRec,
        scaleResult: result,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to apply scaling recommendation.',
    });
  }
}

/**
 * Dismiss a scaling recommendation
 */
export async function dismissRecommendation(req, res, next) {
  try {
    const { id } = req.params;

    const updated = await prisma.scalingRecommendation.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DISMISS_RECOMMENDATION',
        resourceId: updated.resourceId,
        details: JSON.stringify({
          recommendationId: id,
          dismissedBy: req.user.name,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Recommendation dismissed.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
