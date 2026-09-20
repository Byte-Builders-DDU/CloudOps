/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Permitted Roles:
 * - ADMIN: Full access (infrastructure, scaling, policies, security)
 * - OPERATOR: View, manage resources, trigger scaling
 * - VIEWER: Read-only access
 */

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.',
      });
    }

    const currentRole = req.workspaceRole || req.user.role || 'VIEWER';

    if (!allowedRoles.includes(currentRole) && req.user.systemRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] roles. Your role is '${currentRole}'.`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRoles('ADMIN');
export const requireOperatorOrAdmin = requireRoles('ADMIN', 'OPERATOR');
