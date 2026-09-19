import prisma from '../models/prisma.js';
import { emitPolicyChanged } from '../services/socketService.js';

/**
 * List all governance policies for the active workspace
 */
export async function getPolicies(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const { scopeType } = req.query;

    const where = { workspaceId };
    if (scopeType && scopeType !== 'ALL') {
      where.scopeType = scopeType;
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        linkedBudget: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: policies,
      count: policies.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific policy by ID
 */
export async function getPolicyById(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const policy = await prisma.policy.findFirst({
      where: { id, workspaceId },
      include: { linkedBudget: true },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: `Policy ${id} not found in workspace.` },
      });
    }

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle policy active status (Admin only)
 */
export async function togglePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const policy = await prisma.policy.findFirst({
      where: { id, workspaceId },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: `Policy with ID ${id} not found in this workspace.` },
      });
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: { enabled: !policy.enabled },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'TOGGLE_POLICY',
        targetType: 'POLICY',
        targetId: id,
        details: JSON.stringify({
          policyName: updated.name,
          enabled: updated.enabled,
          toggledBy: req.user.name,
        }),
      },
    });

    emitPolicyChanged(updated);

    return res.status(200).json({
      success: true,
      message: `Policy "${updated.name}" is now ${updated.enabled ? 'Enabled' : 'Disabled'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new governance policy (Admin only)
 */
export async function createPolicy(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const {
      name,
      scopeType = 'WORKSPACE',
      scopeTargetId = null,
      minInstanceCount = 1,
      maxInstanceCount = 10,
      maxStepSize = 2,
      cooldownMinutes = 5,
      allowedActions = 'SCALE_UP,SCALE_DOWN,RESTART',
      requireApproval = true,
      requireSeparateAdmin = true,
      linkedBudgetId = null,
      enabled = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Policy name is required.' },
      });
    }

    const policy = await prisma.policy.create({
      data: {
        workspaceId,
        name: name.trim(),
        scopeType,
        scopeTargetId: scopeTargetId || null,
        minInstanceCount: parseInt(minInstanceCount, 10) || 1,
        maxInstanceCount: parseInt(maxInstanceCount, 10) || 10,
        maxStepSize: parseInt(maxStepSize, 10) || 2,
        cooldownMinutes: parseInt(cooldownMinutes, 10) || 5,
        allowedActions,
        requireApproval: Boolean(requireApproval),
        requireSeparateAdmin: Boolean(requireSeparateAdmin),
        linkedBudgetId: linkedBudgetId || null,
        enabled: Boolean(enabled),
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'CREATE_POLICY',
        targetType: 'POLICY',
        targetId: policy.id,
        details: JSON.stringify({
          policyName: policy.name,
          scopeType: policy.scopeType,
          minInstanceCount: policy.minInstanceCount,
          maxInstanceCount: policy.maxInstanceCount,
          createdBy: req.user.name,
        }),
      },
    });

    emitPolicyChanged(policy);

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully.',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing policy (Admin only)
 */
export async function updatePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;
    const {
      name,
      scopeType,
      scopeTargetId,
      minInstanceCount,
      maxInstanceCount,
      maxStepSize,
      cooldownMinutes,
      allowedActions,
      requireApproval,
      requireSeparateAdmin,
      linkedBudgetId,
      enabled,
    } = req.body;

    const existing = await prisma.policy.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { message: `Policy ${id} not found in workspace.` },
      });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (scopeType !== undefined) data.scopeType = scopeType;
    if (scopeTargetId !== undefined) data.scopeTargetId = scopeTargetId;
    if (minInstanceCount !== undefined) data.minInstanceCount = parseInt(minInstanceCount, 10);
    if (maxInstanceCount !== undefined) data.maxInstanceCount = parseInt(maxInstanceCount, 10);
    if (maxStepSize !== undefined) data.maxStepSize = parseInt(maxStepSize, 10);
    if (cooldownMinutes !== undefined) data.cooldownMinutes = parseInt(cooldownMinutes, 10);
    if (allowedActions !== undefined) data.allowedActions = allowedActions;
    if (requireApproval !== undefined) data.requireApproval = Boolean(requireApproval);
    if (requireSeparateAdmin !== undefined) data.requireSeparateAdmin = Boolean(requireSeparateAdmin);
    if (linkedBudgetId !== undefined) data.linkedBudgetId = linkedBudgetId;
    if (enabled !== undefined) data.enabled = Boolean(enabled);

    const updated = await prisma.policy.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'UPDATE_POLICY',
        targetType: 'POLICY',
        targetId: id,
        details: JSON.stringify({
          policyName: updated.name,
          updatedBy: req.user.name,
          changes: data,
        }),
      },
    });

    emitPolicyChanged(updated);

    return res.status(200).json({
      success: true,
      message: 'Policy updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a policy (Admin only)
 */
export async function deletePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const policy = await prisma.policy.findFirst({
      where: { id, workspaceId },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: `Policy with ID ${id} not found in workspace.` },
      });
    }

    await prisma.policy.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user.id,
        action: 'DELETE_POLICY',
        targetType: 'POLICY',
        targetId: id,
        details: JSON.stringify({
          policyName: policy.name,
          deletedBy: req.user.name,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Policy "${policy.name}" deleted.`,
    });
  } catch (error) {
    next(error);
  }
}
