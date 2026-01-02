import { useState, useEffect } from "react";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";

export interface Settings {
  notificationsEnabled: boolean;
  maxPendingRequests: number;
  maxEventsPerDay: number;
  maxBloodBagsPerDay: number;
  advanceBookingDays: number;
  blockedWeekdays: number[];
  blockedDates: string[];
}

export interface SettingsPermissions {
  canEditRequesting: boolean;
  canEditLocation: boolean;
  canEditStaff: boolean;
  canAccessSettings: boolean;
}

/**
 * Custom hook for settings management
 * Handles all backend logic, API calls, and permission checks
 * Separated from UI components for better separation of concerns
 */
export function useSettings(isOpen: boolean) {
  const [settings, setSettings] = useState<Settings>({
    notificationsEnabled: true,
    maxPendingRequests: 100,
    maxEventsPerDay: 3,
    maxBloodBagsPerDay: 200,
    advanceBookingDays: 30,
    blockedWeekdays: [1, 0, 0, 0, 0, 0, 1], // Sun and Sat blocked
    blockedDates: [],
  });
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<SettingsPermissions>({
    canEditRequesting: false,
    canEditLocation: false,
    canEditStaff: false,
    canAccessSettings: false,
  });
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  /**
   * Check if user has a specific permission
   */
  const checkPermission = async (resource: string, action: string): Promise<boolean> => {
    try {
      const response = await fetchJsonWithAuth("/api/permissions/check", {
        method: "POST",
        body: JSON.stringify({ resource, action }),
      });
      return response?.hasPermission === true;
    } catch (error) {
      console.error(`Error checking permission ${resource}.${action}:`, error);
      return false;
    }
  };

  /**
   * Load user permissions for settings
   */
  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const [canEditRequesting, canEditLocation, canEditStaff, canAccessSettings] = await Promise.all([
        checkPermission("settings", "edit-requesting"),
        checkPermission("settings", "edit-location"),
        checkPermission("settings", "edit-staff"),
        checkPermission("system", "settings"), // General settings access
      ]);

      setPermissions({
        canEditRequesting,
        canEditLocation,
        canEditStaff,
        canAccessSettings,
      });
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setPermissions({
        canEditRequesting: false,
        canEditLocation: false,
        canEditStaff: false,
        canAccessSettings: false,
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  /**
   * Load settings from backend
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetchJsonWithAuth("/api/settings");

      if (response.success) {
        setSettings({
          notificationsEnabled: response.data.notificationsEnabled ?? true,
          maxPendingRequests: response.data.maxPendingRequests ?? 100,
          maxEventsPerDay: response.data.maxEventsPerDay ?? 3,
          maxBloodBagsPerDay: response.data.maxBloodBagsPerDay ?? 200,
          advanceBookingDays: response.data.advanceBookingDays ?? 30,
          blockedWeekdays:
            response.data.blockedWeekdays ?? [1, 0, 0, 0, 0, 0, 1],
          blockedDates: response.data.blockedDates ?? [],
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update settings on backend
   */
  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      
      await fetchJsonWithAuth("/api/settings", {
        method: "POST",
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      // Revert on error
      setSettings(settings);
      throw error;
    }
  };

  /**
   * Load permissions and settings when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadPermissions();
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return {
    settings,
    loading,
    permissions,
    permissionsLoading,
    updateSettings,
    loadSettings,
    loadPermissions,
  };
}
