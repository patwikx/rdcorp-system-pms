import type { Session } from "next-auth";

/**
 * Permission utility functions for role-based access control
 */

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  session: Session | null,
  module: string,
  action: string
): boolean {
  if (!session?.user?.role?.permissions) return false;
  
  return session.user.role.permissions.some(
    (p) => p.module === module && p.action === action
  );
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  session: Session | null,
  permissions: Array<{ module: string; action: string }>
): boolean {
  if (!session?.user?.role?.permissions) return false;
  
  return permissions.some(({ module, action }) =>
    session.user.role.permissions.some(
      (p) => p.module === module && p.action === action
    )
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  session: Session | null,
  permissions: Array<{ module: string; action: string }>
): boolean {
  if (!session?.user?.role?.permissions) return false;
  
  return permissions.every(({ module, action }) =>
    session.user.role.permissions.some(
      (p) => p.module === module && p.action === action
    )
  );
}

/**
 * Check if user has permission for a specific module (any action)
 */
export function hasModuleAccess(
  session: Session | null,
  module: string
): boolean {
  if (!session?.user?.role?.permissions) return false;
  
  return session.user.role.permissions.some((p) => p.module === module);
}

/**
 * Check if user is a system admin (has elevated privileges)
 */
export function isSystemAdmin(session: Session | null): boolean {
  if (!session?.user?.role) return false;
  
  const adminRoles = ['Super Admin', 'System Admin', 'Administrator'];
  return adminRoles.includes(session.user.role.name) || session.user.role.isSystem;
}

/**
 * Get all permissions for a user grouped by module
 */
export function getPermissionsByModule(
  session: Session | null
): Record<string, string[]> {
  if (!session?.user?.role?.permissions) return {};
  
  return session.user.role.permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission.action);
    return acc;
  }, {} as Record<string, string[]>);
}

/**
 * Permission constants for commonly used permissions
 */
export const PERMISSIONS = {
  // Property permissions
  PROPERTY_CREATE: { module: 'property', action: 'create' },
  PROPERTY_READ: { module: 'property', action: 'read' },
  PROPERTY_UPDATE: { module: 'property', action: 'update' },
  PROPERTY_DELETE: { module: 'property', action: 'delete' },
  
  // Tax permissions
  TAX_CREATE: { module: 'tax', action: 'create' },
  TAX_READ: { module: 'tax', action: 'read' },
  TAX_UPDATE: { module: 'tax', action: 'update' },
  TAX_DELETE: { module: 'tax', action: 'delete' },
  TAX_APPROVE: { module: 'tax', action: 'approve' },
  
  // Title Movement permissions
  TITLE_MOVEMENT_CREATE: { module: 'title_movement', action: 'create' },
  TITLE_MOVEMENT_READ: { module: 'title_movement', action: 'read' },
  TITLE_MOVEMENT_UPDATE: { module: 'title_movement', action: 'update' },
  TITLE_MOVEMENT_DELETE: { module: 'title_movement', action: 'delete' },
  
  // Approval permissions
  APPROVAL_CREATE: { module: 'approval', action: 'create' },
  APPROVAL_READ: { module: 'approval', action: 'read' },
  APPROVAL_APPROVE: { module: 'approval', action: 'approve' },
  APPROVAL_REJECT: { module: 'approval', action: 'reject' },
  
  // Document permissions
  DOCUMENT_CREATE: { module: 'document', action: 'create' },
  DOCUMENT_READ: { module: 'document', action: 'read' },
  DOCUMENT_UPDATE: { module: 'document', action: 'update' },
  DOCUMENT_DELETE: { module: 'document', action: 'delete' },
  
  // User management permissions
  USER_CREATE: { module: 'user', action: 'create' },
  USER_READ: { module: 'user', action: 'read' },
  USER_UPDATE: { module: 'user', action: 'update' },
  USER_DELETE: { module: 'user', action: 'delete' },
  USER_MANAGE_ROLES: { module: 'user', action: 'manage_roles' },
  
  // Audit permissions
  AUDIT_READ: { module: 'audit', action: 'read' },
  
  // Report permissions
  REPORT_EXPORT: { module: 'report', action: 'export' },
  REPORT_VIEW: { module: 'report', action: 'view' },
} as const;