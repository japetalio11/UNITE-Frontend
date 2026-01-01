"use client";

import { useState, useEffect } from "react";
import { Switch } from "@heroui/switch";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { useNotificationPreferences, NotificationPreferences } from "@/hooks/useNotificationPreferences";
import { parseDate, CalendarDate, today, getLocalTimeZone } from "@internationalized/date";

// Critical notification types (cannot be disabled)
const CRITICAL_TYPES = [
  { value: "request.approved", label: "Event Approved" },
  { value: "request.rejected", label: "Event Rejected" },
  { value: "request.rescheduled", label: "Event Rescheduled" },
];

// Optional notification types (user-controlled)
const OPTIONAL_TYPES = [
  { value: "request.pending-review", label: "Review Requests" },
  { value: "request.cancelled", label: "Request Cancelled" },
  { value: "event.published", label: "Event Published" },
  { value: "event.edited", label: "Event Edited" },
  { value: "event.staff-added", label: "Staff Added to Event" },
  { value: "event.cancelled", label: "Event Cancelled" },
  { value: "event.deleted", label: "Event Deleted" },
  { value: "NewMessage", label: "Chat Messages" },
];

interface NotificationSettingsProps {
  isOpen: boolean;
}

export default function NotificationSettings({ isOpen }: NotificationSettingsProps) {
  const {
    preferences,
    loading,
    error,
    saving,
    updatePreferences,
    muteNotifications,
  } = useNotificationPreferences(isOpen);

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [muteDate, setMuteDate] = useState<CalendarDate | null>(null);

  // Initialize local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        emailDigestMode: preferences.emailDigestMode,
        emailDigestFrequency: preferences.emailDigestFrequency,
        enabledNotificationTypes: preferences.enabledNotificationTypes || [],
      });

      // Set mute date if muted
      if (preferences.mutedUntil) {
        try {
          const mutedDate = new Date(preferences.mutedUntil);
          if (!isNaN(mutedDate.getTime())) {
            const dateStr = mutedDate.toISOString().split("T")[0];
            setMuteDate(parseDate(dateStr));
          } else {
            setMuteDate(null);
          }
        } catch (err) {
          console.error("Error parsing mute date:", err);
          setMuteDate(null);
        }
      } else {
        setMuteDate(null);
      }
    }
  }, [preferences]);

  const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
    setLocalPreferences((prev) => ({ ...prev, [field]: value }));
    handleSave({ [field]: value });
  };

  const handleNotificationTypeChange = (selected: string[]) => {
    // Ensure critical types are always included
    const criticalValues = CRITICAL_TYPES.map((t) => t.value);
    const allSelected = Array.from(new Set([...criticalValues, ...selected]));
    
    // If all optional types are selected, we can use empty array (means all enabled)
    // But we'll keep explicit list for clarity
    setLocalPreferences((prev) => ({ ...prev, enabledNotificationTypes: allSelected }));
    handleSave({ enabledNotificationTypes: allSelected });
  };

  const handleDigestFrequencyChange = (frequency: "hourly" | "daily" | "never") => {
    setLocalPreferences((prev) => ({ ...prev, emailDigestFrequency: frequency }));
    handleSave({ emailDigestFrequency: frequency });
  };

  const handleSave = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaveSuccess(false);
      await updatePreferences(updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleMuteToggle = async (muted: boolean) => {
    try {
      if (muted) {
        // Set mute to 24 hours from now by default
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await muteNotifications(tomorrow);
        setMuteDate(parseDate(tomorrow.toISOString().split("T")[0]));
      } else {
        await muteNotifications(null);
        setMuteDate(null);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleMuteDateChange = async (date: CalendarDate | null) => {
    setMuteDate(date);
    if (date) {
      const muteUntil = new Date(date.year, date.month - 1, date.day, 23, 59, 59);
      await muteNotifications(muteUntil);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-600">Loading notification preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600">Failed to load notification preferences</p>
      </div>
    );
  }

  const isMuted = preferences.mutedUntil && new Date(preferences.mutedUntil) > new Date();
  
  // If enabledNotificationTypes is empty, all types are enabled (default behavior)
  // So we show all optional types as selected
  const enabledTypes = localPreferences.enabledNotificationTypes || [];
  const allTypesEnabled = enabledTypes.length === 0;
  const selectedOptionalTypes = allTypesEnabled
    ? OPTIONAL_TYPES.map((t) => t.value)
    : enabledTypes.filter((type) => !CRITICAL_TYPES.some((ct) => ct.value === type));

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">Settings saved successfully</p>
        </div>
      )}

      {/* Email Notifications Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-2 md:gap-0 border-b border-gray-200">
        <div className="flex-1 pr-0 md:pr-8">
          <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
          <p className="text-sm text-gray-500 mt-1 md:mt-0">
            Enable or disable all email notifications. When disabled, you will only receive in-app notifications.
          </p>
        </div>
        <div className="w-full md:w-auto mt-2 md:mt-0">
          <Switch
            isSelected={localPreferences.emailNotificationsEnabled ?? true}
            onValueChange={(value) => handleToggle("emailNotificationsEnabled", value)}
            aria-label="Enable email notifications"
            isDisabled={saving}
          />
        </div>
      </div>

      {/* Critical Notifications Section */}
      <div className="py-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Critical Notifications (Required)</h4>
        <p className="text-sm text-gray-500 mb-4">
          These notifications are important and cannot be disabled. You will always receive emails for these events.
        </p>
        <div className="space-y-2">
          {CRITICAL_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <Checkbox
                value={type.value}
                isSelected={true}
                isDisabled={true}
                aria-label={type.label}
              >
                {type.label}
              </Checkbox>
              <span className="text-xs text-gray-400">(Required)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Notifications Section */}
      <div className="py-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Optional Notifications</h4>
        <p className="text-sm text-gray-500 mb-4">
          Choose which additional notifications you want to receive via email.
        </p>
        <CheckboxGroup
          value={selectedOptionalTypes}
          onValueChange={handleNotificationTypeChange}
          isDisabled={saving || !localPreferences.emailNotificationsEnabled}
        >
          <div className="space-y-2">
            {OPTIONAL_TYPES.map((type) => (
              <Checkbox key={type.value} value={type.value}>
                {type.label}
              </Checkbox>
            ))}
          </div>
        </CheckboxGroup>
      </div>

      {/* Digest Mode Section */}
      <div className="py-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Digest Mode</h4>
        <p className="text-sm text-gray-500 mb-4">
          When enabled, notifications will be batched and sent together instead of individually. This reduces email frequency.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
            <div className="flex-1 pr-0 md:pr-8">
              <p className="text-sm text-gray-700">Enable Digest Mode</p>
            </div>
            <div className="w-full md:w-auto">
              <Switch
                isSelected={localPreferences.emailDigestMode ?? false}
                onValueChange={(value) => handleToggle("emailDigestMode", value)}
                aria-label="Enable digest mode"
                isDisabled={saving || !localPreferences.emailNotificationsEnabled}
              />
            </div>
          </div>

          {localPreferences.emailDigestMode && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
              <div className="flex-1 pr-0 md:pr-8">
                <p className="text-sm text-gray-700">Digest Frequency</p>
                <p className="text-xs text-gray-500 mt-1">
                  How often to receive digest emails
                </p>
              </div>
              <div className="w-full md:w-auto min-w-[200px]">
                <Select
                  selectedKeys={[localPreferences.emailDigestFrequency || "hourly"]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleDigestFrequencyChange(selected as "hourly" | "daily" | "never");
                  }}
                  isDisabled={saving || !localPreferences.emailNotificationsEnabled}
                  aria-label="Digest frequency"
                >
                  <SelectItem key="hourly">
                    Hourly
                  </SelectItem>
                  <SelectItem key="daily">
                    Daily
                  </SelectItem>
                  <SelectItem key="never">
                    Never (queue only)
                  </SelectItem>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mute Notifications Section */}
      <div className="py-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Mute Notifications</h4>
        <p className="text-sm text-gray-500 mb-4">
          Temporarily stop receiving email notifications. You can set a specific date or unmute anytime.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
            <div className="flex-1 pr-0 md:pr-8">
              <p className="text-sm text-gray-700">Mute Email Notifications</p>
              {isMuted && preferences.mutedUntil && (
                <p className="text-xs text-gray-500 mt-1">
                  Muted until: {new Date(preferences.mutedUntil).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="w-full md:w-auto">
              <Switch
                isSelected={!!isMuted}
                onValueChange={handleMuteToggle}
                aria-label="Mute notifications"
                isDisabled={saving}
              />
            </div>
          </div>

          {isMuted && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
              <div className="flex-1 pr-0 md:pr-8">
                <p className="text-sm text-gray-700">Mute Until Date</p>
                <p className="text-xs text-gray-500 mt-1">
                  Select a date to automatically unmute (max 30 days)
                </p>
              </div>
              <div className="w-full md:w-auto min-w-[200px]">
                <DatePicker
                  value={muteDate}
                  onChange={handleMuteDateChange}
                  minValue={today(getLocalTimeZone())}
                  maxValue={today(getLocalTimeZone()).add({ days: 30 })}
                  aria-label="Mute until date"
                  isDisabled={saving}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rate Limiting Info */}
      <div className="py-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Rate Limiting Information</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>If you receive more than 5 emails per hour, digest mode will be automatically enabled</li>
            <li>Auto-digest mode will revert after 24 hours of normal activity</li>
            <li>Daily email limit: 200 emails per day (system-wide)</li>
            <li>Duplicate notifications within 1 minute are automatically filtered</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

