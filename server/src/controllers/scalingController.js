import prisma from '../models/prisma.js';
import { evaluateScalingImpact } from '../services/scalingEngine.js';

/**
 * List scaling recommendations
 */
export async function getRecommendations(req, res, next) {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else {
      where.status = { in: ['ACTIVE', 'PENDING'] };
    }

    const recommendations = await prisma.scalingRecommendation.findMany({
      where,
      include: {
        resource: {
          include: {
            cloudAccount: true,
            logicalService: true,
          },
        },
      },
      orderBy: { urgency: 'asc' },
    });

    const pendingCount = recommendations.length;
    const totalPotentialSavings = recommendations
      .filter(r => r.estimatedCostChange < 0)
      .reduce((acc, curr) => acc + Math.abs(curr.estimatedCostChange), 0);

    return res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        pendingCount,
        totalPotentialSavings: Math.round(totalPotentialSavings),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss or snooze a recommendation
 */
export async function dismissRecommendation(req, res, next) {
  try {
    const { id } = req.params;
    const { reason, snoozeMinutes } = req.body;

    const status = snoozeMinutes ? 'SNOOZED' : 'DISMISSED';
    const snoozedUntil = snoozeMinutes ? new Date(Date.now() + snoozeMinutes * 60 * 1000) : null;

    const updated = await prisma.scalingRecommendation.update({
      where: { id },
      data: {
        status,
        dismissReason: reason || null,
        snoozedUntil,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manual preview scaling
 */
export async function previewScaling(req, res, next) {
  try {
    const { resourceId, targetCapacity } = req.body;
    const workspaceId = req.workspaceId || 'ws-prod-001';
    const userId = req.user?.id;
    const userRole = req.workspaceRole || req.user?.role || 'VIEWER';

    const preview = await evaluateScalingImpact({
      workspaceId,
      resourceId,
      proposedCapacity: Number(targetCapacity),
      userId,
      userRole,
    });

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
}
