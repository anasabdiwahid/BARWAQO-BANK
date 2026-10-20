import { ROLES, ROLE_HIERARCHY } from '../config/constants.js';

/**
 * Middleware to restrict endpoints to specific authorized roles
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role ${req.user.role} does not have required permissions for this action.`,
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
};

/**
 * Validate that an authenticated user is strictly permitted to create the target user role
 * Hierarchy:
 * Super Admin -> Admin, Manager, Employee
 * Admin -> Manager, Employee
 * Manager -> Employee
 * Employee -> (Registers Customer through Customer onboarding)
 */
export const validateRoleCreationHierarchy = (creatorRole, targetRole) => {
  const allowed = ROLE_HIERARCHY[creatorRole] || [];
  return allowed.includes(targetRole);
};

/**
 * Branch scoping guard: Staff users only access their assigned branch.
 * Super Admin has bank-wide access.
 */
export const enforceBranchScope = (req, targetBranchId) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return true; // Super Admin has global scope
  }
  if (!req.user.branchId || !targetBranchId) {
    return false;
  }
  return String(req.user.branchId) === String(targetBranchId);
};

