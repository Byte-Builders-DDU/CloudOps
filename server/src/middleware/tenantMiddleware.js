import prisma from '../models/prisma.js';

/**
 * Tenant / Workspace Context Middleware
 * Resolves active workspace from header, query param, or user default,
 * and verifies that the authenticated user is an authorized member.
 */
export async function resolveWorkspace(req, res, next) {
  try {
    const slug = req.headers['x-workspace-slug'] || req.query.workspaceSlug || 'default';
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;

    let workspace;
    if (workspaceId) {
      workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
    } else {
      workspace = await prisma.workspace.findUnique({
        where: { slug: String(slug) },
      });
    }

    if (!workspace) {
      // Fallback to first available workspace
      workspace = await prisma.workspace.findFirst();
    }

    if (!workspace) {
      return res.status(500).json({
        success: false,
        error: { message: 'No active workspace found in platform environment.', code: 'WORKSPACE_NOT_FOUND' },
      });
    }

    req.workspace = workspace;
    req.workspaceId = workspace.id;

    // If user is authenticated, resolve their workspace role
    if (req.user) {
      const membership = await prisma.workspaceMembership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: req.user.id,
          },
        },
      });

      // If user is explicitly mapped, use their workspace role; otherwise fallback to their default role
      req.workspaceRole = membership ? membership.role : (req.user.role || 'VIEWER');
    }

    next();
  } catch (error) {
    console.error('Error resolving workspace tenant context:', error);
    next(error);
  }
}
