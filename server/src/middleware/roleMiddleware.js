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

    if (req.user.systemRole === 'SUPERADMIN' || req.user.role === 'ADMIN') {
      return next();
    }

    const effectiveRole = req.workspaceRole || req.user.role || 'VIEWER';

    if (!allowedRoles.includes(effectiveRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] roles. Your role is '${effectiveRole}'.`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRoles('ADMIN');
export const requireOperatorOrAdmin = requireRoles('ADMIN', 'OPERATOR');
