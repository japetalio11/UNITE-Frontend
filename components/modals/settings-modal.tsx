"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { DateValue } from "@react-types/datepicker";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { TrashBin, Plus as PlusIcon } from "@gravity-ui/icons";
import { parseDate } from "@internationalized/date";
import { useSettings } from "@/hooks/useSettings";
import { useRoles, Role } from "@/hooks/useRoles";
import RoleManagementTable from "@/components/settings/role-management-table";
import RoleFormModal from "@/components/settings/role-form-modal";
import LocationManagement from "@/components/settings/location-management";
import NotificationSettings from "@/components/settings/notification-settings";
import { getUserAuthority } from "@/utils/getUserAuthority";
import { decodeJwt } from "@/utils/decodeJwt";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "general" | "requesting" | "location" | "staff";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const {
    settings,
    loading,
    permissions,
    permissionsLoading,
    updateSettings,
  } = useSettings(isOpen);
  
  // Role management
  const {
    roles,
    permissions: allPermissions,
    loading: rolesLoading,
    permissionsLoading: permissionsListLoading,
    error: rolesError,
    createRole,
    updateRole,
    deleteRole,
    getRoleUsersCount,
    checkPermission,
  } = useRoles(isOpen);
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<TabType>("general");
  
  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);
  
  // Permission checks for role management
  const [canCreateRole, setCanCreateRole] = useState(false);
  const [canUpdateRole, setCanUpdateRole] = useState(false);
  const [canDeleteRole, setCanDeleteRole] = useState(false);
  const [userAuthority, setUserAuthority] = useState<number | null>(null);

  // Get current user ID from token or localStorage
  const getCurrentUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const rawUser = localStorage.getItem('unite_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const userId = user?._id || user?.id || user?.User_ID || user?.userId || user?.ID;
        if (userId) return String(userId);
      }
      
      // Fallback: get from JWT token
      const token = localStorage.getItem('unite_token') || sessionStorage.getItem('unite_token');
      if (token) {
        const decoded = decodeJwt(token);
        const tokenUserId = decoded?.id || decoded?.userId || decoded?._id;
        if (tokenUserId) return String(tokenUserId);
      }
    } catch (error) {
      console.error("Error getting current user ID:", error);
    }
    
    return null;
  };

  // Load user authority
  useEffect(() => {
    if (isOpen) {
      const userId = getCurrentUserId();
      if (userId) {
        getUserAuthority(userId)
          .then((authority) => {
            setUserAuthority(authority);
          })
          .catch((error) => {
            console.error("Failed to get user authority:", error);
            setUserAuthority(null);
          });
      }
    }
  }, [isOpen]);

  // Check role management permissions with authority safeguard
  useEffect(() => {
    if (isOpen && permissions.canEditStaff) {
      // System admins (authority >= 80) get full access regardless of permission check
      // This bypasses the permission API which may not properly handle wildcard permissions
      const isSystemAdmin = userAuthority !== null && userAuthority >= 80;
      
      if (isSystemAdmin) {
        // System admins bypass permission checks - they have full access
        // This ensures system admins with wildcard permissions (*.*) can always edit/delete
        setCanCreateRole(true);
        setCanUpdateRole(true);
        setCanDeleteRole(true);
      } else if (userAuthority !== null) {
        // Authority is loaded but user is not a system admin
        // Check permissions normally, but still require authority >= 80 for edit/delete
        Promise.all([
          checkPermission("role", "create"),
          checkPermission("role", "update"),
          checkPermission("role", "delete"),
        ]).then(([create, update, del]) => {
          // Authority safeguard: only users with authority >= 80 can update or delete roles
          const hasHighAuthority = userAuthority >= 80;
          
          setCanCreateRole(create);
          setCanUpdateRole(update && hasHighAuthority);
          setCanDeleteRole(del && hasHighAuthority);
        });
      }
      // If userAuthority is null, wait for it to load before making decisions
    } else {
      // Reset permissions when modal closes or user doesn't have staff edit permission
      setCanCreateRole(false);
      setCanUpdateRole(false);
      setCanDeleteRole(false);
    }
  }, [isOpen, permissions.canEditStaff, checkPermission, userAuthority]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Set initial tab - General is now default for all users
      setActiveTab("general");
    } else {
      document.body.style.overflow = "";
      // Reset role form state when modal closes
      setShowRoleForm(false);
      setEditingRole(null);
      setRoleFormError(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, permissions]);

  const handleLogout = () => {
    localStorage.removeItem("unite_token");
    sessionStorage.removeItem("unite_token");
    onClose();
    router.push("/");
  };

  const handleBlockedDateAdd = (date: DateValue | null) => {
    if (date) {
      const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

      if (!settings.blockedDates.includes(dateStr)) {
        updateSettings({ blockedDates: [...settings.blockedDates, dateStr] });
      }
    }
  };

  const handleBlockedDateRemove = (dateStr: string) => {
    updateSettings({
      blockedDates: settings.blockedDates.filter((d) => d !== dateStr),
    });
  };

  const handleWeekdayChange = (selected: string[]) => {
    const weekdays = [0, 1, 2, 3, 4, 5, 6].map((day) =>
      selected.includes(
        ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][day],
      )
        ? 1
        : 0,
    );

    updateSettings({ blockedWeekdays: weekdays });
  };

  const selectedWeekdays = settings.blockedWeekdays
    .map((blocked, index) =>
      blocked
        ? ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][index]
        : null,
    )
    .filter(Boolean) as string[];

  // Role management handlers
  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleFormError(null);
    setShowRoleForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormError(null);
    setShowRoleForm(true);
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      // Check user count first
      const userCount = await getRoleUsersCount(role._id);
      
      if (userCount > 0) {
        const message = `Cannot delete "${role.name}": ${userCount} user(s) are currently assigned to this role. Please reassign users before deleting.`;
        if (window.confirm(message + "\n\nDo you want to proceed anyway?")) {
          // User confirmed, but backend will still reject if users exist
          await deleteRole(role._id);
        }
      } else {
        if (window.confirm(`Are you sure you want to delete "${role.name}"? This action cannot be undone.`)) {
          await deleteRole(role._id);
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete role");
    }
  };

  const handleRoleSubmit = async (roleData: Omit<Role, '_id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmittingRole(true);
    setRoleFormError(null);
    
    try {
      if (editingRole) {
        await updateRole(editingRole._id, roleData);
      } else {
        await createRole(roleData);
      }
      setShowRoleForm(false);
      setEditingRole(null);
    } catch (error: any) {
      setRoleFormError(error.message || "Failed to save role");
      throw error; // Re-throw to let form handle it
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleViewRole = (role: Role) => {
    // For now, just open edit modal in view mode
    // Could create a separate view modal later
    handleEditRole(role);
  };

  const blockedDateValues = settings.blockedDates.map((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return parseDate(`${year}-${month}-${day}`);
  });

  const renderField = (
    label: string,
    description: string,
    value: number,
    key: keyof typeof settings,
    disabled = false,
  ) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-2 md:gap-0">
      <div className="flex-1 pr-0 md:pr-8">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500 mt-1 md:mt-0">{description}</p>
      </div>
      <div className="w-full md:w-auto mt-2 md:mt-0">
        <Input
          aria-label={label}
          className="w-full md:w-48"
          type="number"
          value={value.toString()}
          onChange={(e) =>
            updateSettings({ [key]: parseInt(e.target.value) || 0 })
          }
          isDisabled={disabled}
        />
      </div>
    </div>
  );

  // Check if user has any settings access (General tab is now accessible to all authenticated users)
  const hasAnyAccess = true; // All authenticated users can access General tab for notification settings

  // Show loading state
  if (permissionsLoading || loading) {
    return (
      <Modal
        backdrop="opaque"
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        classNames={{
          base: "!m-0 !p-0 !w-full !h-full !max-h-full !max-w-none !rounded-none md:!rounded-xl md:!h-[85vh] md:!max-h-[900px] md:!m-auto md:!w-[90vw] md:!max-w-[1200px]",
          wrapper: "!p-0 md:!p-10",
        }}
        onClose={onClose}
      >
        <ModalContent className="h-full md:h-full flex flex-col">
          <ModalBody className="p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600">Loading settings...</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      classNames={{
        base: "!m-0 !p-0 !w-full !h-full !max-h-full !max-w-none !rounded-none md:!rounded-xl md:!h-[85vh] md:!max-h-[900px] md:!m-auto md:!w-[90vw] md:!max-w-[1200px]",
        wrapper: "!p-0 md:!p-10",
      }}
      onClose={onClose}
    >
      <ModalContent className="h-full md:h-full flex flex-col">
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold">Settings</h2>
            </ModalHeader>
            <ModalBody className="flex-1 min-h-0 overflow-hidden p-0">
              {hasAnyAccess ? (
                <div className="flex flex-col md:flex-row h-full">
                  {/* Sidebar */}
                  <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 bg-gray-50 md:bg-transparent shrink-0">
                    <nav className="space-y-1">
                      {/* General tab is now accessible to all authenticated users */}
                      <button
                        onClick={() => setActiveTab("general")}
                        className={`w-full block rounded-md px-3 py-2 text-sm font-semibold text-center md:text-left transition-colors ${
                          activeTab === "general"
                            ? "bg-white md:bg-gray-100 border border-gray-200 text-gray-900 shadow-sm md:shadow-none"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        General
                      </button>
                      {permissions.canEditRequesting && (
                        <button
                          onClick={() => setActiveTab("requesting")}
                          className={`w-full block rounded-md px-3 py-2 text-sm font-semibold text-center md:text-left transition-colors mt-1 ${
                            activeTab === "requesting"
                              ? "bg-white md:bg-gray-100 border border-gray-200 text-gray-900 shadow-sm md:shadow-none"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          Requesting
                        </button>
                      )}
                      {permissions.canEditLocation && (
                        <button
                          onClick={() => setActiveTab("location")}
                          className={`w-full block rounded-md px-3 py-2 text-sm font-semibold text-center md:text-left transition-colors mt-1 ${
                            activeTab === "location"
                              ? "bg-white md:bg-gray-100 border border-gray-200 text-gray-900 shadow-sm md:shadow-none"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          Location
                        </button>
                      )}
                      {permissions.canEditStaff && (
                        <button
                          onClick={() => setActiveTab("staff")}
                          className={`w-full block rounded-md px-3 py-2 text-sm font-semibold text-center md:text-left transition-colors mt-1 ${
                            activeTab === "staff"
                              ? "bg-white md:bg-gray-100 border border-gray-200 text-gray-900 shadow-sm md:shadow-none"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          Staff
                        </button>
                      )}
                    </nav>
                    <div className="mt-4 hidden md:block">
                      <Button
                        color="danger"
                        variant="light"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        Log Out
                      </Button>
                    </div>
                  </div>

                  {/* Right Content - Scrollable */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <ScrollShadow className="h-full overflow-y-auto" size={10}>
                      <div className="p-4 md:p-6 pb-10 md:pb-8">
                        {/* General Settings Tab - Accessible to all users */}
                        {activeTab === "general" && (
                          <section className="w-full transition-all duration-200 ease-in-out">
                            <h3 className="text-base font-semibold text-gray-900 mb-6">
                              General Settings
                            </h3>
                            
                            {/* Admin-only System Settings Section */}
                            {permissions.canAccessSettings && (
                              <div className="mb-8 pb-8 border-b border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">
                                  System Settings
                                </h4>
                                <div className="divide-y divide-gray-200 w-full">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-2 md:gap-0 w-full">
                                    <div className="flex-1 pr-0 md:pr-8">
                                      <h4 className="text-sm font-medium text-gray-900">
                                        Notifications
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1 md:mt-0">
                                        Enable or disable application notifications system-wide.
                                      </p>
                                    </div>
                                    <div className="w-full md:w-auto mt-2 md:mt-0">
                                      <Switch
                                        isSelected={settings.notificationsEnabled}
                                        onValueChange={(isSelected) =>
                                          updateSettings({
                                            notificationsEnabled: isSelected,
                                          })
                                        }
                                        aria-label="Enable notifications"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Notification Settings Section - Available to all users */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Notification Preferences
                              </h4>
                              <p className="text-sm text-gray-500 mb-6">
                                Configure your personal email notification preferences.
                              </p>
                              <NotificationSettings isOpen={isOpen && activeTab === "general"} />
                            </div>
                          </section>
                        )}

                        {/* Requesting Settings Tab */}
                        {activeTab === "requesting" && permissions.canEditRequesting && (
                          <section className="w-full transition-all duration-200 ease-in-out">
                            <h3 className="text-base font-semibold text-gray-900 mb-6">
                              Requesting Settings
                            </h3>
                            <div className="divide-y divide-gray-200 w-full">
                              {renderField(
                                "Maximum pending requests allowed",
                                "Maximum number of pending requests a user can have.",
                                settings.maxPendingRequests,
                                "maxPendingRequests",
                              )}
                              {renderField(
                                "Minimum days in advance for a request",
                                "Days before an event a request must be made.",
                                settings.advanceBookingDays,
                                "advanceBookingDays",
                              )}
                              {renderField(
                                "Maximum events per day",
                                "The maximum number of separate events per day.",
                                settings.maxEventsPerDay,
                                "maxEventsPerDay",
                              )}
                              {renderField(
                                "Maximum blood bags per day",
                                "The maximum number of blood bags the facility can process.",
                                settings.maxBloodBagsPerDay,
                                "maxBloodBagsPerDay",
                              )}
                              
                              {/* Blocked Operational Days */}
                              <div className="py-4">
                                <h4 className="text-sm font-medium text-gray-900">
                                  Permanently blocked weekdays
                                </h4>
                                <p className="text-sm text-gray-500 mb-3 md:mb-0">
                                  Select weekdays that should never be available.
                                </p>
                                <div className="overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:pb-0">
                                  <CheckboxGroup
                                    className="mt-2 md:mt-4"
                                    value={selectedWeekdays}
                                    onChange={handleWeekdayChange}
                                    orientation="horizontal"
                                    classNames={{
                                      wrapper:
                                        "gap-4 md:gap-2 flex-nowrap md:flex-wrap",
                                    }}
                                  >
                                    <Checkbox value="sun">Sun</Checkbox>
                                    <Checkbox value="mon">Mon</Checkbox>
                                    <Checkbox value="tue">Tue</Checkbox>
                                    <Checkbox value="wed">Wed</Checkbox>
                                    <Checkbox value="thu">Thu</Checkbox>
                                    <Checkbox value="fri">Fri</Checkbox>
                                    <Checkbox value="sat">Sat</Checkbox>
                                  </CheckboxGroup>
                                </div>
                              </div>

                              {/* Specified Blocked Dates */}
                              <div className="py-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                      Specific blocked dates
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Add specific calendar dates (one-off).
                                    </p>
                                  </div>
                                  <DatePicker
                                    aria-label="Pick a date"
                                    className="w-full md:w-auto min-w-[200px]"
                                    hideTimeZone
                                    label={null}
                                    showMonthAndYearPickers
                                    variant="bordered"
                                    onChange={handleBlockedDateAdd}
                                  />
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {blockedDateValues.map((date) => (
                                    <Chip
                                      key={date.toString()}
                                      color="danger"
                                      endContent={<TrashBin className="h-4 w-4" />}
                                      variant="flat"
                                      onClose={() =>
                                        handleBlockedDateRemove(
                                          `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
                                        )
                                      }
                                    >
                                      {new Date(
                                        date.year,
                                        date.month - 1,
                                        date.day,
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </Chip>
                                  ))}
                                  {blockedDateValues.length === 0 && (
                                    <span className="text-xs text-gray-400 italic">
                                      No dates blocked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Location Settings Tab */}
                        {activeTab === "location" && permissions.canEditLocation && (
                          <section className="w-full transition-all duration-200 ease-in-out">
                            <LocationManagement isOpen={isOpen} />
                          </section>
                        )}

                        {/* Staff Settings Tab */}
                        {activeTab === "staff" && permissions.canEditStaff && (
                          <section className="w-full transition-all duration-200 ease-in-out">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-base font-semibold text-gray-900">
                                Staff Type Management
                              </h3>
                              {canCreateRole && (
                                <Button
                                  color="primary"
                                  onClick={handleCreateRole}
                                  startContent={<PlusIcon className="h-4 w-4" />}
                                  size="sm"
                                >
                                  Create Staff Type
                                </Button>
                              )}
                            </div>
                            
                            {rolesError && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">{rolesError}</p>
                              </div>
                            )}

                            <RoleManagementTable
                              roles={roles}
                              loading={rolesLoading || permissionsListLoading}
                              onEdit={handleEditRole}
                              onDelete={handleDeleteRole}
                              onView={handleViewRole}
                              canCreate={canCreateRole}
                              canUpdate={canUpdateRole}
                              canDelete={canDeleteRole}
                            />

                            {showRoleForm && (
                              <RoleFormModal
                                isOpen={showRoleForm}
                                onClose={() => {
                                  setShowRoleForm(false);
                                  setEditingRole(null);
                                  setRoleFormError(null);
                                }}
                                role={editingRole}
                                allPermissions={allPermissions}
                                onSubmit={handleRoleSubmit}
                                isSubmitting={isSubmittingRole}
                                error={roleFormError}
                              />
                            )}
                          </section>
                        )}

                        {/* Mobile Logout */}
                        <div className="mt-8 md:hidden border-t border-gray-200 pt-6">
                          <Button
                            color="danger"
                            variant="flat"
                            onClick={handleLogout}
                            className="w-full"
                            size="lg"
                          >
                            Log Out
                          </Button>
                        </div>
                      </div>
                    </ScrollShadow>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 h-full flex flex-col justify-center">
                  <p className="text-sm text-gray-600 mb-6">
                    You are not allowed to change settings. You need appropriate
                    permissions to access settings.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      color="danger"
                      variant="light"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </div>
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
