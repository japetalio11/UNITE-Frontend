import { Permission, Role } from "@/hooks/useRoles";

/**
 * Format permissions for display in table
 */
export function formatPermissionsForDisplay(permissions: Role['permissions']): string {
  if (!permissions || permissions.length === 0) {
    return "No permissions";
  }

  const formatted = permissions.map(perm => {
    if (perm.resource === '*' && perm.actions.includes('*')) {
      return "All permissions";
    }
    const actions = perm.actions.join(", ");
    return `${perm.resource}: ${actions}`;
  });

  return formatted.join("; ");
}

/**
 * Group permissions by resource
 */
export function groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(perm => {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push(perm);
  });

  return grouped;
}

/**
 * Group permissions by type
 */
export function groupPermissionsByType(permissions: Permission[]): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(perm => {
    const type = perm.type || 'resource';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(perm);
  });

  return grouped;
}

/**
 * Validate role permissions structure
 */
export function validateRolePermissions(permissions: Role['permissions']): boolean {
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }

  return permissions.every(perm => {
    return (
      typeof perm.resource === 'string' &&
      Array.isArray(perm.actions) &&
      perm.actions.length > 0 &&
      perm.actions.every(action => typeof action === 'string')
    );
  });
}

/**
 * Convert role permissions to permission selector format
 * Returns a map of resource -> selected actions
 */
export function rolePermissionsToSelector(permissions: Role['permissions']): Record<string, string[]> {
  const selector: Record<string, string[]> = {};
  
  permissions.forEach(perm => {
    if (perm.resource === '*' && perm.actions.includes('*')) {
      // Wildcard permission - select all
      selector['*'] = ['*'];
    } else {
      selector[perm.resource] = perm.actions;
    }
  });

  return selector;
}

/**
 * Convert permission selector format to role permissions
 */
export function selectorToRolePermissions(
  selector: Record<string, string[]>,
  allPermissions: Permission[]
): Role['permissions'] {
  const rolePermissions: Role['permissions'] = [];

  Object.entries(selector).forEach(([resource, actions]) => {
    if (resource === '*' && actions.includes('*')) {
      rolePermissions.push({
        resource: '*',
        actions: ['*'],
        metadata: {}
      });
    } else {
      // Get metadata from first permission of this resource if it's a staff permission
      const firstPerm = allPermissions.find(p => p.resource === resource && p.type === 'staff');
      const metadata = firstPerm?.metadata || {};
      
      rolePermissions.push({
        resource,
        actions,
        metadata
      });
    }
  });

  return rolePermissions;
}

/**
 * Get permission metadata for a resource
 */
export function getPermissionMetadata(permissions: Permission[], resource: string): Record<string, any> {
  const perm = permissions.find(p => p.resource === resource);
  return perm?.metadata || {};
}
