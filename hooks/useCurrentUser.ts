import { useState, useEffect, useCallback } from "react";
import { fetchCurrentUser, clearCachedUser, type CurrentUser } from "@/utils/fetchCurrentUser";

interface UseCurrentUserReturn {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage current user information
 * Automatically fetches user info on mount and provides refresh functionality
 */
export function useCurrentUser(initialFetch = true): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(initialFetch);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await fetchCurrentUser(forceRefresh);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || "Failed to load user information");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      loadUser();
    }
  }, [initialFetch, loadUser]);

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      loadUser(true);
    };

    const handleLogout = () => {
      clearCachedUser();
      setUser(null);
    };

    window.addEventListener("unite:auth-changed", handleAuthChange);
    window.addEventListener("unite:logout", handleLogout);

    return () => {
      window.removeEventListener("unite:auth-changed", handleAuthChange);
      window.removeEventListener("unite:logout", handleLogout);
    };
  }, [loadUser]);

  return {
    user,
    loading,
    error,
    refresh: () => loadUser(true),
  };
}

