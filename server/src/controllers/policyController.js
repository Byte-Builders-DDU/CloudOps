import prisma from '../models/prisma.js';
import { emitPolicyChanged } from '../services/socketService.js';

/**
 * List all governance policies
 */
export async function getPolicies(req, res, next) {
  try {
    const policies = await prisma.policy.findMany({
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
 * Toggle policy active status (Admin only)
 */
export async function togglePolicy(req, res, next) {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy with ID ${id} not found.`,
      });
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: { enabled: !policy.enabled },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'TOGGLE_POLICY',
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
    const { name, maxInstanceCount, maxMonthlyBudget, requireApproval, enabled = true } = req.body;

    if (!name || !maxInstanceCount || !maxMonthlyBudget) {
      return res.status(400).json({
        success: false,
        message: 'Policy name, max instance count, and monthly budget limit are required.',
      });
    }

    const policy = await prisma.policy.create({
      data: {
        name: name.trim(),
        maxInstanceCount: parseInt(maxInstanceCount, 10),
        maxMonthlyBudget: parseFloat(maxMonthlyBudget),
        requireApproval: Boolean(requireApproval),
        enabled: Boolean(enabled),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_POLICY',
        details: JSON.stringify({
          policyName: policy.name,
          maxInstanceCount: policy.maxInstanceCount,
          maxMonthlyBudget: policy.maxMonthlyBudget,
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
    const { name, maxInstanceCount, maxMonthlyBudget, requireApproval, enabled } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (maxInstanceCount !== undefined) data.maxInstanceCount = parseInt(maxInstanceCount, 10);
    if (maxMonthlyBudget !== undefined) data.maxMonthlyBudget = parseFloat(maxMonthlyBudget);
    if (requireApproval !== undefined) data.requireApproval = Boolean(requireApproval);
    if (enabled !== undefined) data.enabled = Boolean(enabled);

    const updated = await prisma.policy.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_POLICY',
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

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy with ID ${id} not found.`,
      });
    }

    await prisma.policy.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_POLICY',
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
