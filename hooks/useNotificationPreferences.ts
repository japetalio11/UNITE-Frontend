import { useState, useEffect, useCallback } from "react";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";

export interface NotificationPreferences {
  userId: string;
  emailNotificationsEnabled: boolean;
  emailDigestMode: boolean;
  emailDigestFrequency: "hourly" | "daily" | "never";
  enabledNotificationTypes: string[];
  mutedUntil: string | null;
  autoDigestThreshold: number;
  autoDigestRevertHours: number;
  temporaryDigestMode: boolean;
  temporaryDigestUntil: string | null;
  lastDigestSentAt: string | null;
  lastEmailSentAt: string | null;
  emailCountLastHour: number;
  emailCountResetAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom hook for notification preferences management
 * Handles fetching, updating, and muting notification preferences
 */
export function useNotificationPreferences(isOpen: boolean) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Load notification preferences from backend
   */
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchJsonWithAuth("/api/users/me/notification-preferences");

      if (response.success && response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (err: any) {
      console.error("Failed to load notification preferences:", err);
      setError(err.message || "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetchJsonWithAuth("/api/users/me/notification-preferences", {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (response.success && response.data?.preferences) {
        setPreferences(response.data.preferences);
        return response.data.preferences;
      }
    } catch (err: any) {
      console.error("Failed to update notification preferences:", err);
      const errorMessage = err.body?.message || err.message || "Failed to update notification preferences";
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Mute notifications until a specific date
   */
  const muteNotifications = useCallback(async (mutedUntil: Date | null) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetchJsonWithAuth("/api/users/me/notification-preferences/mute", {
        method: "POST",
        body: JSON.stringify({ mutedUntil: mutedUntil ? mutedUntil.toISOString() : null }),
      });

      if (response.success && response.data?.preferences) {
        setPreferences(response.data.preferences);
        return response.data.preferences;
      }
    } catch (err: any) {
      console.error("Failed to mute notifications:", err);
      const errorMessage = err.body?.message || err.message || "Failed to mute notifications";
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Load preferences when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen, loadPreferences]);

  return {
    preferences,
    loading,
    error,
    saving,
    updatePreferences,
    muteNotifications,
    loadPreferences,
  };
}

