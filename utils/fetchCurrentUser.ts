import { fetchJsonWithAuth } from "./fetchWithAuth";

export interface CurrentUser {
  _id: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  roles?: Array<{
    _id: string;
    code: string;
    name: string;
    description?: string;
  }>;
  permissions?: Array<{ resource: string; actions: string[] }>;
  locations?: any[];
}

let cachedUser: CurrentUser | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch current user information from the API
 * Uses caching to avoid unnecessary API calls
 */
export async function fetchCurrentUser(forceRefresh = false): Promise<CurrentUser | null> {
  // Return cached user if still valid and not forcing refresh
  if (!forceRefresh && cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedUser;
  }

  try {
    const response = await fetchJsonWithAuth("/api/auth/me");
    
    if (response.success && response.user) {
      const user = response.user;
      
      // Build full name from firstName, middleName, lastName
      const nameParts = [
        user.firstName,
        user.middleName,
        user.lastName
      ].filter(Boolean);
      const fullName = nameParts.length > 0 
        ? nameParts.join(" ") 
        : user.fullName || user.email || null;

      cachedUser = {
        _id: user._id || user.id,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        fullName: fullName,
        phoneNumber: user.phoneNumber,
        roles: user.roles || [],
        permissions: user.permissions || [],
        locations: user.locations || [],
      };
      
      cacheTimestamp = Date.now();
      return cachedUser;
    }
    
    return null;
  } catch (error: any) {
    // If 401, clear cache and return null
    if (error.isAuthError || error.status === 401) {
      cachedUser = null;
      cacheTimestamp = 0;
    }
    return null;
  }
}

/**
 * Clear the cached user (useful on logout)
 */
export function clearCachedUser() {
  cachedUser = null;
  cacheTimestamp = 0;
}

/**
 * Get cached user without making API call
 */
export function getCachedUser(): CurrentUser | null {
  return cachedUser;
}

