"use client";

import { useState, useEffect, useMemo } from "react";
import { useRoles } from "@/hooks/useRoles";
import { roleHasCapability, getAssignableRoles } from "@/services/coordinatorService";
import type { Role } from "@/types/coordinator.types";

interface RoleAssignmentSectionProps {
  selectedRoleId: string;
  onSelectionChange: (roleId: string) => void;
  allowedStaffTypes?: string[]; // Role codes that are allowed (backward compatibility)
  requiredCapabilities?: string[]; // Required permission capabilities (e.g., ['request.review'])
  isRequired?: boolean;
  error?: string;
  useAssignableRoles?: boolean; // NEW: Use authority-filtered assignable roles
}

export default function RoleAssignmentSection({
  selectedRoleId,
  onSelectionChange,
  allowedStaffTypes,
  requiredCapabilities,
  isRequired = true,
  error,
  useAssignableRoles = true, // Default to using authority filtering
}: RoleAssignmentSectionProps) {
  const { roles: allRoles, loading: allRolesLoading } = useRoles(true);
  const [assignableRoles, setAssignableRoles] = useState<Role[]>([]);
  const [loadingAssignable, setLoadingAssignable] = useState(false);

  // Load assignable roles (authority-filtered) if enabled
  useEffect(() => {
    if (useAssignableRoles) {
      const loadAssignable = async () => {
        try {
          setLoadingAssignable(true);
          // Pass coordinator-management context to skip capability filtering
          const response = await getAssignableRoles('coordinator-management');
          if (response.success && response.data) {
            setAssignableRoles(response.data);
          }
        } catch (err) {
          console.error('Failed to load assignable roles:', err);
          setAssignableRoles([]);
        } finally {
          setLoadingAssignable(false);
        }
      };
      loadAssignable();
    }
  }, [useAssignableRoles]);

  // Use assignable roles if enabled, otherwise use all roles
  const baseRoles = useAssignableRoles ? assignableRoles : allRoles;
  const loading = useAssignableRoles ? loadingAssignable : allRolesLoading;

  // Filter roles based on capabilities or allowed staff types
  const availableRoles = useMemo(() => {
    let filtered = baseRoles;

    // Priority: Use capability-based filtering if provided
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      filtered = baseRoles.filter((role) => {
        // Role must have at least one of the required capabilities
        return requiredCapabilities.some((capability) =>
          roleHasCapability(role, capability)
        );
      });
    } else if (allowedStaffTypes && allowedStaffTypes.length > 0) {
      // Fallback to role code filtering (backward compatibility)
      if (allowedStaffTypes.includes("*")) {
        filtered = baseRoles; // "*" means all roles allowed
      } else {
        filtered = baseRoles.filter((role) => allowedStaffTypes.includes(role.code));
      }
    }

    return filtered;
  }, [baseRoles, allowedStaffTypes, requiredCapabilities]);

  const handleRoleChange = (roleId: string) => {
    onSelectionChange(roleId);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Roles <span className="text-red-500">*</span>
        </label>
        <div className="text-sm text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Role {isRequired && <span className="text-red-500">*</span>}
      </label>

      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}

      {availableRoles.length === 0 ? (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
          No roles available. You may not have permission to assign roles, or no
          roles are configured in the system.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {availableRoles.map((role) => {
            const isSelected = selectedRoleId === role._id;
            return (
              <div
                key={role._id}
                onClick={() => handleRoleChange(role._id)}
                className={`
                  relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {role.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          Code: <span className="font-mono">{role.code}</span>
                        </span>
                        {role.authority !== undefined && (
                          <span className="text-xs text-gray-500">
                            Authority: <span className="font-semibold">{role.authority}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!selectedRoleId && isRequired && (
        <div className="text-xs text-amber-600 mt-1">
          A role must be selected
        </div>
      )}

      {selectedRoleId && (
        <div className="text-xs text-gray-500 mt-1">
          Role selected
        </div>
      )}
    </div>
  );
}

