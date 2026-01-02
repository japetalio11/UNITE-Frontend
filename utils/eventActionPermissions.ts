/**
 * Event Action Permissions Utility
 * 
 * Provides permission evaluation for event actions in Calendar Week View.
 * Integrates with backend permission system and authority checks.
 */

import { getUserAuthority } from './getUserAuthority';
import { fetchWithAuth } from './fetchWithAuth';
import { decodeJwt } from './decodeJwt';

const API_BASE =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:3000';

/**
 * Authority threshold for admin access
 */
const ADMIN_AUTHORITY_THRESHOLD = 80;

/**
 * Permission cache per event (TTL: 2 minutes)
 */
interface PermissionCacheEntry {
  permissions: EventActionPermissions;
  timestamp: number;
}

const permissionCache = new Map<string, PermissionCacheEntry>();
const PERMISSION_CACHE_TTL = 30 * 1000; // 30 seconds (reduced from 2 minutes to improve refresh responsiveness)

/**
 * Available actions for events
 */
export type EventAction = 'view' | 'edit' | 'manage-staff' | 'reschedule' | 'cancel' | 'delete';

/**
 * Permission flags for each action
 */
export interface EventActionPermissions {
  canView: boolean;
  canEdit: boolean;
  canManageStaff: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  canDelete: boolean;
}

/**
 * Get user ID from localStorage/sessionStorage or JWT token
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const rawUser = localStorage.getItem('unite_user');
    
    if (rawUser) {
      const user = JSON.parse(rawUser);
      
      const userId = 
        user?._id || 
        user?.id || 
        user?.User_ID || 
        user?.userId || 
        user?.ID ||
        null;
      
      if (userId) {
        return String(userId);
      }
    }
    
    // Fallback: try to get user ID from JWT token
    const token = localStorage.getItem('unite_token') || sessionStorage.getItem('unite_token');
    if (token) {
      try {
        const decoded = decodeJwt(token);
        const tokenUserId = decoded?.id || decoded?.userId || decoded?._id || null;
        if (tokenUserId) {
          return String(tokenUserId);
        }
      } catch (e) {
        // JWT decode failed, continue to return null
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Extract location ID from event
 */
function extractLocationId(event: any): string | null {
  if (!event) return null;
  
  // Try district ID first
  const districtId = 
    event.district?._id ||
    event.district?.District_ID ||
    event.district?.id ||
    event.District_ID ||
    event.districtId ||
    null;
  
  if (districtId) return String(districtId);
  
  // Fallback to municipality
  const municipalityId =
    event.municipality?._id ||
    event.municipality?.Municipality_ID ||
    event.municipality?.id ||
    event.Municipality_ID ||
    event.municipalityId ||
    null;
  
  return municipalityId ? String(municipalityId) : null;
}

/**
 * Extract request ID from event
 */
function extractRequestId(event: any): string | null {
  if (!event) return null;
  
  // Try multiple possible locations for request ID
  const requestId =
    event.request?.Request_ID ||
    event.request?.RequestId ||
    event.request?.id ||
    event.request?._id ||
    event.Request_ID ||
    event.RequestId ||
    event.requestId ||
    event.request_id ||
    // Also check if event has a linked request field
    event.linkedRequest?.Request_ID ||
    event.linkedRequest?.RequestId ||
    event.linkedRequest?.id ||
    // Check in event's raw data if it exists
    event.raw?.request?.Request_ID ||
    event.raw?.request?.RequestId ||
    event.raw?.Request_ID ||
    event.raw?.RequestId ||
    null;
  
  return requestId ? String(requestId) : null;
}

/**
 * Fetch request ID by Event_ID from backend
 * Since events don't have request ID directly, we need to find the request by Event_ID
 */
async function fetchRequestIdByEventId(eventId: string): Promise<string | null> {
  try {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('unite_token') || sessionStorage.getItem('unite_token')
        : null;
    
    if (!token) {
      return null;
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // Try to get event details which includes request info
    const response = await fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}`, {
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const body = await response.json();
    const eventData = body.data || body.event || body;
    
    // Extract request ID from event details
    const requestId = 
      eventData?.request?.Request_ID ||
      eventData?.request?.RequestId ||
      eventData?.request?.id ||
      eventData?.Request_ID ||
      eventData?.RequestId ||
      null;
    
    return requestId ? String(requestId) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user permissions from localStorage
 * Handles comma-separated string format: "event.create,read,update"
 * Also handles array format: [{ resource: 'event', actions: ['create', 'read', 'update'] }]
 */
function getUserPermissionsFromStorage(): Array<{ resource: string; actions: string[] }> {
  if (typeof window === 'undefined') return [];
  
  try {
    const rawUser = localStorage.getItem('unite_user');
    if (!rawUser) {
      return [];
    }
    
    const user = JSON.parse(rawUser);
    
    // Try to get permissions from various possible locations
    let permissionsRaw = 
      user.permissions ||
      user.Permissions ||
      user.user?.permissions ||
      user.data?.permissions ||
      null;
    
    if (!permissionsRaw) {
      return [];
    }
    
    // Handle string format: "event.create,read,update" or "event.create,read,update,request.reschedule"
    // Format: resource.action1,action2,action3 where actions without dots belong to the last resource
    if (typeof permissionsRaw === 'string') {
      const permissionMap = new Map<string, Set<string>>();
      let currentResource: string | null = null;
      
      // Split by comma and process each permission
      const parts = permissionsRaw.split(',').map(p => p.trim()).filter(Boolean);
      
      for (const part of parts) {
        // Check if it's in format "resource.action"
        if (part.includes('.')) {
          const [resource, action] = part.split('.');
          if (resource && action) {
            currentResource = resource; // Track current resource
            if (!permissionMap.has(resource)) {
              permissionMap.set(resource, new Set());
            }
            permissionMap.get(resource)!.add(action);
          }
        } else {
          // If no dot, it's an action for the current resource (or 'event' if none set)
          const resource = currentResource || 'event';
          if (!permissionMap.has(resource)) {
            permissionMap.set(resource, new Set());
          }
          permissionMap.get(resource)!.add(part);
        }
      }
      
      // Convert to array format
      const permissionsArray = Array.from(permissionMap.entries()).map(([resource, actions]) => ({
        resource,
        actions: Array.from(actions),
      }));
      
      return permissionsArray;
    }
    
    // Handle array format: [{ resource: 'event', actions: ['create', 'read', 'update'] }]
    if (Array.isArray(permissionsRaw)) {
      return permissionsRaw;
    }
    
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Map permissions to event actions based on event status
 * For approved/published events: use event permissions
 * For other states: use request permissions
 */
function mapPermissionsToActions(
  permissions: Array<{ resource: string; actions: string[] }>,
  eventStatus: string
): EventAction[] {
  const actions: EventAction[] = ['view']; // Always allow view
  
  const normalizedStatus = (eventStatus || 'Approved').toLowerCase();
  const isApproved = normalizedStatus.includes('approve');
  const isCancelled = normalizedStatus.includes('cancel');
  const isCompleted = normalizedStatus.includes('complete');
  
  // Find event permissions
  const eventPerms = permissions.find(p => p.resource === 'event');
  const requestPerms = permissions.find(p => p.resource === 'request');
  
  // For approved/completed events, check event permissions
  if (isApproved || isCompleted) {
    if (eventPerms) {
      const eventActions = eventPerms.actions || [];
      
      // Map event.update to edit (backend checks event.update for approved events)
      if (eventActions.includes('update')) {
        actions.push('edit');
      }
      
      // Map event.manage-staff to manage-staff
      if (eventActions.includes('manage-staff') || eventActions.includes('managestaff')) {
        actions.push('manage-staff');
      }
    }
    
    // Reschedule and cancel use request permissions
    if (requestPerms) {
      const requestActions = requestPerms.actions || [];
      
      if (requestActions.includes('reschedule')) {
        actions.push('reschedule');
      }
      
      if (requestActions.includes('cancel')) {
        actions.push('cancel');
      }
    }
  } else if (isCancelled) {
    // Cancelled events: only view and delete (if has delete permission)
    if (requestPerms && requestPerms.actions.includes('delete')) {
      actions.push('delete');
    }
  } else {
    // Other states: use request permissions
    if (requestPerms) {
      const requestActions = requestPerms.actions || [];
      
      if (requestActions.includes('update')) {
        actions.push('edit');
      }
      
      if (requestActions.includes('reschedule')) {
        actions.push('reschedule');
      }
      
      if (requestActions.includes('cancel')) {
        actions.push('cancel');
      }
    }
    
    // Manage staff always uses event permission
    if (eventPerms) {
      const eventActions = eventPerms.actions || [];
      if (eventActions.includes('manage-staff') || eventActions.includes('managestaff')) {
        actions.push('manage-staff');
      }
    }
  }
  
  return actions;
}

/**
 * Fetch available actions from backend
 * Uses the event's linked request to get available actions
 * Falls back to parsing permissions from localStorage if backend fails
 */
async function fetchAvailableActionsFromBackend(
  event: any,
  userId: string
): Promise<EventAction[]> {
  try {
    const eventId = event?.Event_ID || event?.EventId || event?.id;
    const eventStatus = event?.Status || event?.status || 'Approved';
    
    let requestId = extractRequestId(event);
    
    // If no request ID found in event, try to fetch it by Event_ID
    if (!requestId && eventId) {
      requestId = await fetchRequestIdByEventId(eventId);
    }
    
    // Try to fetch from backend if we have a requestId
    if (requestId) {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('unite_token') || sessionStorage.getItem('unite_token')
          : null;
      
      if (token) {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        
        try {
          const response = await fetch(`${API_BASE}/api/event-requests/${encodeURIComponent(requestId)}/actions`, {
            headers,
            credentials: 'include',
          });
          
          if (response.ok) {
            const body = await response.json();
            
            const actions = body.data?.actions || body.actions || [];
            
            // Normalize action names to match our EventAction type
            const normalizedActions: EventAction[] = actions
              .map((action: string) => {
                const lower = action.toLowerCase();
                if (lower === 'manage-staff' || lower === 'managestaff') return 'manage-staff';
                if (['view', 'edit', 'reschedule', 'cancel', 'delete'].includes(lower)) {
                  return lower as EventAction;
                }
                return null;
              })
              .filter((action: EventAction | null): action is EventAction => action !== null);
            
            // Always include view
            if (!normalizedActions.includes('view')) {
              normalizedActions.unshift('view');
            }
            
            // If backend returned more than just view, use it
            if (normalizedActions.length > 1) {
              return normalizedActions;
            }
          }
        } catch (fetchError) {
          // Error calling backend, fall through to permission parsing
        }
      }
    }
    
    // Fallback: Parse permissions from localStorage
    const permissions = getUserPermissionsFromStorage();
    
    if (permissions.length > 0) {
      const actionsFromPermissions = mapPermissionsToActions(permissions, eventStatus);
      return actionsFromPermissions;
    }
    
    return ['view'];
  } catch (error) {
    // Final fallback: try to parse permissions
    try {
      const permissions = getUserPermissionsFromStorage();
      if (permissions.length > 0) {
        const eventStatus = event?.Status || event?.status || 'Approved';
        return mapPermissionsToActions(permissions, eventStatus);
      }
    } catch (fallbackError) {
      // Fallback also failed
    }
    
    return ['view']; // Final fallback to view only
  }
}


/**
 * Get event action permissions
 * 
 * @param event - Event object
 * @param userId - User ID (optional, will be fetched if not provided)
 * @param forceRefresh - Force refresh from backend (ignore cache)
 * @returns Permission flags for each action
 */
export async function getEventActionPermissions(
  event: any,
  userId?: string | null,
  forceRefresh: boolean = false
): Promise<EventActionPermissions> {
  // Get user ID
  const actualUserId = userId || getUserId();
  
  if (!actualUserId) {
    // Unauthenticated: view only
    return {
      canView: true,
      canEdit: false,
      canManageStaff: false,
      canReschedule: false,
      canCancel: false,
      canDelete: false,
    };
  }
  
  // Check cache
  const eventId = event?.Event_ID || event?.EventId || event?.id || 'unknown';
  const cacheKey = `${eventId}_${actualUserId}`;
  
  if (!forceRefresh && permissionCache.has(cacheKey)) {
    const cached = permissionCache.get(cacheKey)!;
    const now = Date.now();
    
    if (now - cached.timestamp < PERMISSION_CACHE_TTL) {
      return cached.permissions;
    } else {
      permissionCache.delete(cacheKey);
    }
  }
  
  // Get user authority
  const authority = await getUserAuthority(actualUserId, forceRefresh);
  const isAdminByAuthority = authority !== null && authority >= ADMIN_AUTHORITY_THRESHOLD;
  
  // If admin by authority, show all actions (backend will still validate)
  if (isAdminByAuthority) {
    const permissions: EventActionPermissions = {
      canView: true,
      canEdit: true,
      canManageStaff: true,
      canReschedule: true,
      canCancel: true,
      canDelete: true, // Only for cancelled events, but we'll let backend handle that
    };
    
    // Cache the result
    permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now(),
    });
    
    return permissions;
  }
  
  // For non-admin users, fetch available actions from backend
  const availableActions = await fetchAvailableActionsFromBackend(event, actualUserId);
  
  // Convert available actions array to permission flags
  const permissions: EventActionPermissions = {
    canView: availableActions.includes('view'),
    canEdit: availableActions.includes('edit'),
    canManageStaff: availableActions.includes('manage-staff'),
    canReschedule: availableActions.includes('reschedule'),
    canCancel: availableActions.includes('cancel'),
    canDelete: availableActions.includes('delete'),
  };
  
  // Cache the result
  permissionCache.set(cacheKey, {
    permissions,
    timestamp: Date.now(),
  });
  
  // Invalidate cache for this event if forceRefresh was used (to ensure fresh data)
  if (forceRefresh && eventId !== 'unknown') {
    // Clear any stale entries for this event
    clearPermissionCache(eventId);
    // Re-cache with fresh data
    permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now(),
    });
  }
  
  return permissions;
}

/**
 * Get available actions array for an event
 * 
 * @param event - Event object
 * @param userId - User ID (optional)
 * @param forceRefresh - Force refresh from backend
 * @returns Array of available action names
 */
export async function getAvailableActions(
  event: any,
  userId?: string | null,
  forceRefresh: boolean = false
): Promise<EventAction[]> {
  const permissions = await getEventActionPermissions(event, userId, forceRefresh);
  
  const actions: EventAction[] = [];
  
  if (permissions.canView) actions.push('view');
  if (permissions.canEdit) actions.push('edit');
  if (permissions.canManageStaff) actions.push('manage-staff');
  if (permissions.canReschedule) actions.push('reschedule');
  if (permissions.canCancel) actions.push('cancel');
  if (permissions.canDelete) actions.push('delete');
  
  return actions;
}

/**
 * Clear permission cache for a specific event or all events
 * 
 * @param eventId - Event ID to clear, or undefined to clear all
 */
export function clearPermissionCache(eventId?: string): void {
  if (eventId) {
    // Clear all entries for this event (immediate synchronous clearing)
    const keysToDelete: string[] = [];
    permissionCache.forEach((value, key) => {
      if (key.startsWith(`${eventId}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => permissionCache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[EventActionPermissions] Cleared permission cache for event ${eventId} (${keysToDelete.length} entries)`);
    }
  } else {
    const clearedCount = permissionCache.size;
    permissionCache.clear();
    if (clearedCount > 0) {
      console.log(`[EventActionPermissions] Cleared all permission cache (${clearedCount} entries)`);
    }
  }
}

/**
 * Check if user is admin by authority
 * 
 * @param userId - User ID (optional)
 * @returns True if user has authority >= 80
 */
export async function isAdminByAuthority(userId?: string | null): Promise<boolean> {
  const actualUserId = userId || getUserId();
  if (!actualUserId) return false;
  
  const authority = await getUserAuthority(actualUserId);
  return authority !== null && authority >= ADMIN_AUTHORITY_THRESHOLD;
}

