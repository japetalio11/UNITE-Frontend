/**
 * Authority Utilities
 * 
 * Client-side authority calculation and filtering functions (read-only for UI).
 * These utilities help filter UI elements based on authority levels, but
 * all security enforcement happens on the backend.
 */

// Authority tier constants (must match backend)
export const AUTHORITY_TIERS = {
  SYSTEM_ADMIN: 100,
  OPERATIONAL_ADMIN: 80,
  COORDINATOR: 60,
  STAKEHOLDER: 30,
  BASIC_USER: 20
} as const;

export type AuthorityTier = typeof AUTHORITY_TIERS[keyof typeof AUTHORITY_TIERS];
export type AuthorityTierName = 'SYSTEM_ADMIN' | 'OPERATIONAL_ADMIN' | 'COORDINATOR' | 'STAKEHOLDER' | 'BASIC_USER';

/**
 * Permission object structure (from backend)
 */
export interface Permission {
  resource: string;
  actions: string[];
  metadata?: {
    allowedStaffTypes?: string[];
    [key: string]: any;
  };
}

/**
 * Calculate authority tier from permissions (client-side, read-only)
 * This matches the backend calculation logic for UI filtering
 * @param permissions - Array of permission objects
 * @returns Authority tier number (20-100)
 */
export function calculateAuthorityFromPermissions(permissions: Permission[]): AuthorityTier {
  if (!permissions || permissions.length === 0) {
    return AUTHORITY_TIERS.BASIC_USER;
  }

  // Check for system admin (wildcard permission)
  if (permissions.some(p => p.resource === '*' && p.actions.includes('*'))) {
    return AUTHORITY_TIERS.SYSTEM_ADMIN;
  }

  // Check for operational admin (can manage all staff types)
  const staffPerms = permissions.filter(p => p.resource === 'staff');
  const hasOperationalAdmin = staffPerms.some(p => {
    const hasCreateOrUpdate = p.actions.includes('create') || p.actions.includes('update');
    const canManageAllTypes = !p.metadata?.allowedStaffTypes || 
                              p.metadata.allowedStaffTypes.includes('*') ||
                              p.metadata.allowedStaffTypes.length === 0;
    return hasCreateOrUpdate && canManageAllTypes;
  });

  if (hasOperationalAdmin) {
    return AUTHORITY_TIERS.OPERATIONAL_ADMIN;
  }

  // Check for stakeholder (review-only capabilities) - MUST check BEFORE coordinator
  // A user is STAKEHOLDER if they have review capabilities but NO operational capabilities
  const hasReview = permissions.some(p => {
    if (p.resource === '*' && (p.actions.includes('*') || p.actions.includes('review'))) {
      return true;
    }
    if (p.resource === 'request' && (p.actions.includes('*') || p.actions.includes('review'))) {
      return true;
    }
    return false;
  });

  // Check for coordinator (operational capabilities)
  const operationalCapabilities = [
    { resource: 'request', action: 'create' },
    { resource: 'event', action: 'create' },
    { resource: 'staff', action: 'create' }
  ];

  const hasOperational = permissions.some(p => {
    return operationalCapabilities.some(cap => {
      if (p.resource === '*' && (p.actions.includes('*') || p.actions.includes(cap.action))) {
        return true;
      }
      if (p.resource === cap.resource && (p.actions.includes('*') || p.actions.includes(cap.action))) {
        return true;
      }
      return false;
    });
  });

  // If user has review but NO operational capabilities, it's a STAKEHOLDER
  if (hasReview && !hasOperational) {
    return AUTHORITY_TIERS.STAKEHOLDER;
  }

  // If user has operational capabilities, it's a COORDINATOR
  if (hasOperational) {
    return AUTHORITY_TIERS.COORDINATOR;
  }

  // If user only has review (but we already checked above), fall through
  if (hasReview) {
    return AUTHORITY_TIERS.STAKEHOLDER;
  }

  return AUTHORITY_TIERS.BASIC_USER;
}

/**
 * Check if viewer can view target user
 * @param viewerAuthority - Viewer's authority tier
 * @param targetAuthority - Target user's authority tier
 * @returns True if viewer can see target
 */
export function canViewUser(viewerAuthority: AuthorityTier, targetAuthority: AuthorityTier): boolean {
  // System admins can view everyone
  if (viewerAuthority === AUTHORITY_TIERS.SYSTEM_ADMIN) {
    return true;
  }
  // Viewer must have higher authority than target
  return viewerAuthority > targetAuthority;
}

/**
 * Check if assigner can assign role
 * @param assignerAuthority - Assigner's authority tier
 * @param roleAuthority - Role's authority tier
 * @returns True if assigner can assign role
 */
export function canAssignRole(assignerAuthority: AuthorityTier, roleAuthority: AuthorityTier): boolean {
  // System admins can assign any role
  if (assignerAuthority === AUTHORITY_TIERS.SYSTEM_ADMIN) {
    return true;
  }
  // Assigner must have higher authority than role
  return assignerAuthority > roleAuthority;
}

/**
 * Filter users by authority (exclude users with equal/higher authority)
 * @param viewerAuthority - Viewer's authority tier
 * @param users - Array of users with authority property
 * @returns Filtered array of users
 */
export function filterUsersByAuthority<T extends { authority?: AuthorityTier }>(
  viewerAuthority: AuthorityTier,
  users: T[]
): T[] {
  // System admins can see everyone
  if (viewerAuthority === AUTHORITY_TIERS.SYSTEM_ADMIN) {
    return users;
  }
  // Filter users with lower authority
  return users.filter(user => {
    const userAuthority = user.authority || AUTHORITY_TIERS.BASIC_USER;
    return viewerAuthority > userAuthority;
  });
}

/**
 * Get authority tier name from numeric value
 * @param authority - Authority tier value
 * @returns Authority tier name
 */
export function getAuthorityTierName(authority: AuthorityTier): AuthorityTierName {
  if (authority >= AUTHORITY_TIERS.SYSTEM_ADMIN) return 'SYSTEM_ADMIN';
  if (authority >= AUTHORITY_TIERS.OPERATIONAL_ADMIN) return 'OPERATIONAL_ADMIN';
  if (authority >= AUTHORITY_TIERS.COORDINATOR) return 'COORDINATOR';
  if (authority >= AUTHORITY_TIERS.STAKEHOLDER) return 'STAKEHOLDER';
  return 'BASIC_USER';
}

/**
 * Filter roles by authority (only show roles with lower authority than assigner)
 * @param assignerAuthority - Assigner's authority tier
 * @param roles - Array of roles with authority property
 * @returns Filtered array of roles
 */
export function filterRolesByAuthority<T extends { authority?: AuthorityTier }>(
  assignerAuthority: AuthorityTier,
  roles: T[]
): T[] {
  // System admins can assign any role
  if (assignerAuthority === AUTHORITY_TIERS.SYSTEM_ADMIN) {
    return roles;
  }
  // Filter roles with lower authority
  return roles.filter(role => {
    const roleAuthority = role.authority || AUTHORITY_TIERS.BASIC_USER;
    return assignerAuthority > roleAuthority;
  });
}

