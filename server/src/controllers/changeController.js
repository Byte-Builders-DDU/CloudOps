import prisma from '../models/prisma.js';
import { evaluateScalingImpact } from '../services/scalingEngine.js';

/**
 * Controller for Changes, Approvals & Operations Execution
 * Implements the shared change review contract conforming to PRD.md §5 (FR-09, FR-10) and DESIGN.md §6.6, §6.7.
 */

// 1. Compute Deterministic Preview
export async function previewChange(req, res, next) {
  try {
    const { resourceId, proposedCapacity } = req.body;
    const workspaceId = req.workspaceId;
    const userId = req.user?.id;
    const userRole = req.workspaceRole || req.user?.role || 'VIEWER';

    if (!resourceId || proposedCapacity === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'resourceId and proposedCapacity are required.' },
      });
    }

    const preview = await evaluateScalingImpact({
      workspaceId,
      resourceId,
      proposedCapacity: Number(proposedCapacity),
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

// 2. Submit Change Request
export async function submitChange(req, res, next) {
  try {
    const {
      resourceId,
      proposedCapacity,
      changeNote,
      source = 'MANUAL',
      sourceRecommendationId,
    } = req.body;

    const workspaceId = req.workspaceId;
    const userId = req.user.id;
    const userRole = req.workspaceRole || req.user.role;

    if (userRole === 'VIEWER') {
      return res.status(403).json({
        success: false,
        error: { message: 'Viewers cannot submit operational changes. Only Operators and Admins are permitted.' },
      });
    }

    // Re-evaluate deterministic preview at submission time
    const evaluation = await evaluateScalingImpact({
      workspaceId,
      resourceId,
      proposedCapacity: Number(proposedCapacity),
      userId,
      userRole,
    });

    if (!evaluation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Change submission rejected by policy guardrails.',
          details: evaluation.validationErrors,
        },
      });
    }

    const { policyChecks, resource } = evaluation;

    // Determine initial status based on policy requirements
    const requiresApproval = policyChecks.requireApproval;
    const initialStatus = requiresApproval ? 'AWAITING_APPROVAL' : 'APPROVED';

    const changeRequest = await prisma.changeRequest.create({
      data: {
        workspaceId,
        requesterId: userId,
        resourceId,
        serviceId: resource.serviceId || null,
        actionType: 'SCALE_CAPACITY',
        source,
        sourceRecommendationId,
        targetVersion: resource.version,
        currentAllocation: resource.currentReplicas,
        proposedAllocation: proposedCapacity,
        monthlyRateDelta: evaluation.monthlyRateDelta,
        periodCostDelta: evaluation.periodCostDelta,
        budgetHeadroomAfter: evaluation.budgetHeadroomAfter,
        currency: evaluation.currency,
        policyChecksJson: JSON.stringify(policyChecks),
        status: initialStatus,
        changeNote: changeNote || null,
        previewExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15m approval validity
      },
    });

    // Create linked ChangeOperation
    const operation = await prisma.changeOperation.create({
      data: {
        changeRequestId: changeRequest.id,
        idempotencyKey: `op-${changeRequest.id}-${Date.now()}`,
        status: requiresApproval ? 'QUEUED' : 'QUEUED',
      },
    });

    // Log audit record
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: 'SUBMIT_CHANGE_REQUEST',
        targetType: 'RESOURCE',
        targetId: resourceId,
        source,
        details: JSON.stringify({
          changeRequestId: changeRequest.id,
          proposedAllocation: proposedCapacity,
          requiresApproval,
          monthlyRateDelta: evaluation.monthlyRateDelta,
        }),
        outcome: 'SUCCESS',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        changeRequest,
        operationId: operation.id,
        status: changeRequest.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 3. List Changes
export async function getChanges(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const { tab = 'all' } = req.query;

    let whereClause = { workspaceId };
    if (tab === 'needs_approval') {
      whereClause.status = 'AWAITING_APPROVAL';
    } else if (tab === 'in_progress') {
      whereClause.status = { in: ['AWAITING_APPROVAL', 'APPROVED'] };
      whereClause.operation = { status: { in: ['QUEUED', 'RUNNING', 'RECONCILING'] } };
    } else if (tab === 'history') {
      whereClause.status = { in: ['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'] };
    }

    const changes = await prisma.changeRequest.findMany({
      where: whereClause,
      include: {
        resource: true,
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        operation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: changes,
    });
  } catch (error) {
    next(error);
  }
}

// 4. Approve Change (Enforcing Separate Approver Rule)
export async function approveChange(req, res, next) {
  try {
    const { id } = req.params;
    const approverId = req.user.id;
    const approverRole = req.workspaceRole || req.user.role;

    if (approverRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only workspace Administrators can approve operational changes.' },
      });
    }

    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id },
      include: { resource: true },
    });

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Change request not found.' },
      });
    }

    if (changeRequest.status !== 'AWAITING_APPROVAL') {
      return res.status(400).json({
        success: false,
        error: { message: `Change is already ${changeRequest.status}.` },
      });
    }

    // Parse policy checks to verify Separate Approver Rule
    const policyChecks = JSON.parse(changeRequest.policyChecksJson || '{}');
    if (policyChecks.requireSeparateAdmin && changeRequest.requesterId === approverId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Two-Person Rule Enforced: Governance policy requires approval from a separate Administrator. You cannot approve your own change request.',
          code: 'SEPARATE_APPROVER_REQUIRED',
        },
      });
    }

    // Update ChangeRequest to APPROVED
    const updated = await prisma.changeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
      },
    });

    // Ensure linked operation is ready to be claimed by worker
    await prisma.changeOperation.upsert({
      where: { changeRequestId: id },
      create: {
        changeRequestId: id,
        idempotencyKey: `op-${id}-${Date.now()}`,
        status: 'QUEUED',
      },
      update: {
        status: 'QUEUED',
      },
    });

    // Log approval audit record
    await prisma.auditLog.create({
      data: {
        workspaceId: changeRequest.workspaceId,
        userId: approverId,
        action: 'APPROVE_CHANGE_REQUEST',
        targetType: 'CHANGE_REQUEST',
        targetId: id,
        source: 'MANUAL',
        details: JSON.stringify({
          requesterId: changeRequest.requesterId,
          approverId,
          targetResource: changeRequest.resource?.name,
          proposedAllocation: changeRequest.proposedAllocation,
        }),
        outcome: 'SUCCESS',
      },
    });

    res.json({
      success: true,
      data: {
        changeRequest: updated,
        message: 'Change request approved. Durable execution worker claimed the task.',
      },
    });
  } catch (error) {
    next(error);
  }
}

// 5. Reject Change
export async function rejectChange(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverId = req.user.id;
    const approverRole = req.workspaceRole || req.user.role;

    if (approverRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only workspace Administrators can reject operational changes.' },
      });
    }

    const updated = await prisma.changeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        rejectionReason: reason || 'Rejected by Administrator.',
      },
    });

    await prisma.changeOperation.updateMany({
      where: { changeRequestId: id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 6. Inspect Execution Timeline & Operation Status
export async function getOperationTimeline(req, res, next) {
  try {
    const { id } = req.params;
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id },
      include: {
        operation: true,
        resource: true,
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Change request not found.' },
      });
    }

    res.json({
      success: true,
      data: changeRequest,
    });
  } catch (error) {
    next(error);
  }
}
