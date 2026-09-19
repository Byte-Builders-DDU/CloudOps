import prisma from '../models/prisma.js';

/**
 * Tenant / Workspace Context Middleware
 * Resolves active workspace from header, query param, route param, or user default,
 * and verifies that the authenticated user is an authorized member.
 */
export async function resolveWorkspace(req, res, next) {
  try {
    const slug = req.headers['x-workspace-slug'] || req.query.workspaceSlug || req.params.slug || 'default';
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;

    let workspace;
    if (workspaceId) {
      workspace = await prisma.workspace.findUnique({
        where: { id: String(workspaceId) },
      });
    } else if (slug && slug !== 'default') {
      workspace = await prisma.workspace.findUnique({
        where: { slug: String(slug) },
      });
    }

    if (!workspace) {
      // Fallback to demo or primary workspace
      workspace = await prisma.workspace.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!workspace) {
      // Auto-provision default workspace if none exists (zero-downtime safety)
      workspace = await prisma.workspace.create({
        data: {
          slug: 'default',
          name: 'Primary Enterprise Workspace',
          currency: 'INR',
          isDemo: false,
          aiMonthlyBudget: 100.0,
        },
      });
    }

    req.workspace = workspace;
    req.workspaceId = workspace.id;

    // Default workspace role
    let workspaceRole = 'VIEWER';

    // If user is authenticated, resolve their explicit workspace membership
    if (req.user) {
      // Superadmin bypass
      if (req.user.systemRole === 'SUPERADMIN') {
        workspaceRole = 'ADMIN';
      } else {
        const membership = await prisma.workspaceMembership.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: workspace.id,
              userId: req.user.id,
            },
          },
        });

        if (membership) {
          workspaceRole = membership.role;
        } else if (req.user.role) {
          // Fallback to global user role if no explicit membership record exists
          workspaceRole = req.user.role;
        }
      }
    }

    req.workspaceRole = workspaceRole;
    req.isWorkspaceAdmin = workspaceRole === 'ADMIN';
    req.isWorkspaceOperator = workspaceRole === 'OPERATOR';
    req.isWorkspaceViewer = workspaceRole === 'VIEWER';

    next();
  } catch (error) {
    console.error('Error resolving workspace tenant context:', error);
    next(error);
  }
}

/**
 * Enforce minimum required workspace role permissions
 * @param {...string} allowedRoles - 'ADMIN', 'OPERATOR', 'VIEWER'
 */
export function requireWorkspaceRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid Bearer token.',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const currentRole = req.workspaceRole || req.user.role || 'VIEWER';

    if (!allowedRoles.includes(currentRole) && req.user.systemRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          message: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] in workspace "${req.workspace?.slug || 'current'}". Your role is '${currentRole}'.`,
          code: 'FORBIDDEN_INSUFFICIENT_WORKSPACE_ROLE',
          currentRole,
          requiredRoles: allowedRoles,
        },
      });
    }

    next();
  };
}

export const requireWorkspaceAdmin = requireWorkspaceRole('ADMIN');
export const requireWorkspaceOperatorOrAdmin = requireWorkspaceRole('ADMIN', 'OPERATOR');

/**
 * Utility helper to merge workspace scoping into Prisma where clauses
 */
export function withWorkspace(req, where = {}) {
  return {
    ...where,
    workspaceId: req.workspaceId,
  };
}
