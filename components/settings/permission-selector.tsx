"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Permission, Role } from "@/hooks/useRoles";
import { groupPermissionsByResource } from "@/utils/role-utils";

interface PermissionSelectorProps {
  allPermissions: Permission[];
  selectedPermissions: Role['permissions'];
  onChange: (permissions: Role['permissions']) => void;
  disabled?: boolean;
}

export default function PermissionSelector({
  allPermissions,
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    return groupPermissionsByResource(allPermissions);
  }, [allPermissions]);

  // Filter permissions based on search query
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.keys(groupedPermissions);
    }
    
    const query = searchQuery.toLowerCase();
    return Object.keys(groupedPermissions).filter(resource => {
      const perms = groupedPermissions[resource];
      return (
        resource.toLowerCase().includes(query) ||
        perms.some(p => 
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.action.toLowerCase().includes(query)
        )
      );
    });
  }, [groupedPermissions, searchQuery]);

  // Convert selected permissions to a map for easier checking
  const selectedMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    selectedPermissions.forEach(perm => {
      if (perm.resource === '*' && perm.actions.includes('*')) {
        map['*'] = new Set(['*']);
      } else {
        if (!map[perm.resource]) {
          map[perm.resource] = new Set();
        }
        perm.actions.forEach(action => {
          map[perm.resource].add(action);
        });
      }
    });
    return map;
  }, [selectedPermissions]);

  // Check if all permissions for a resource are selected
  const isResourceFullySelected = (resource: string): boolean => {
    if (selectedMap['*']?.has('*')) return true;
    const perms = groupedPermissions[resource] || [];
    if (perms.length === 0) return false;
    return perms.every(perm => selectedMap[resource]?.has(perm.action));
  };

  // Check if any permissions for a resource are selected
  const isResourcePartiallySelected = (resource: string): boolean => {
    if (selectedMap['*']?.has('*')) return true;
    const perms = groupedPermissions[resource] || [];
    return perms.some(perm => selectedMap[resource]?.has(perm.action));
  };

  // Toggle all permissions for a resource
  const toggleResource = (resource: string) => {
    const perms = groupedPermissions[resource] || [];
    const allSelected = isResourceFullySelected(resource);
    
    if (allSelected) {
      // Deselect all
      const newPermissions = selectedPermissions.filter(p => p.resource !== resource);
      onChange(newPermissions);
    } else {
      // Select all
      const existingPerm = selectedPermissions.find(p => p.resource === resource);
      const actions = perms.map(p => p.action);
      const metadata = perms.find(p => p.metadata)?.metadata || {};
      
      const newPermissions = selectedPermissions
        .filter(p => p.resource !== resource)
        .concat([{ resource, actions, metadata }]);
      onChange(newPermissions);
    }
  };

  // Toggle a specific permission action
  const togglePermission = (resource: string, action: string) => {
    const existingPerm = selectedPermissions.find(p => p.resource === resource);
    const perm = allPermissions.find(p => p.resource === resource && p.action === action);
    const metadata = perm?.metadata || {};

    if (existingPerm) {
      const hasAction = existingPerm.actions.includes(action);
      if (hasAction) {
        // Remove action
        const newActions = existingPerm.actions.filter(a => a !== action);
        if (newActions.length === 0) {
          // Remove entire permission if no actions left
          onChange(selectedPermissions.filter(p => p.resource !== resource));
        } else {
          // Update actions
          onChange(
            selectedPermissions.map(p =>
              p.resource === resource
                ? { ...p, actions: newActions }
                : p
            )
          );
        }
      } else {
        // Add action
        onChange(
          selectedPermissions.map(p =>
            p.resource === resource
              ? { ...p, actions: [...p.actions, action] }
              : p
          )
        );
      }
    } else {
      // Create new permission
      onChange([...selectedPermissions, { resource, actions: [action], metadata }]);
    }
  };

  // Toggle resource expansion
  const toggleResourceExpansion = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  // Expand all / collapse all
  const toggleAllExpanded = () => {
    if (expandedResources.size === filteredResources.length) {
      setExpandedResources(new Set());
    } else {
      setExpandedResources(new Set(filteredResources));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search permissions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        isDisabled={disabled}
        size="sm"
      />

      {/* Expand/Collapse All */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={toggleAllExpanded}
          className="text-sm text-blue-600 hover:text-blue-800"
          disabled={disabled}
        >
          {expandedResources.size === filteredResources.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Permissions by Resource */}
      <div className="space-y-2">
        {filteredResources.map(resource => {
          const perms = groupedPermissions[resource];
          const isExpanded = expandedResources.has(resource);
          const isFullySelected = isResourceFullySelected(resource);
          const isPartiallySelected = isResourcePartiallySelected(resource);

          return (
            <div key={resource} className="border border-gray-200 rounded-lg p-3">
              {/* Resource Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    isSelected={isFullySelected}
                    isIndeterminate={isPartiallySelected && !isFullySelected}
                    onValueChange={() => toggleResource(resource)}
                    isDisabled={disabled}
                  >
                    <span className="font-medium text-sm">{resource}</span>
                  </Checkbox>
                  <Chip size="sm" variant="flat" color="default">
                    {perms.length} permission{perms.length !== 1 ? 's' : ''}
                  </Chip>
                </div>
                <button
                  type="button"
                  onClick={() => toggleResourceExpansion(resource)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  disabled={disabled}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              {/* Permission Actions */}
              {isExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                  {perms.map(perm => (
                    <Checkbox
                      key={perm._id}
                      isSelected={selectedMap[resource]?.has(perm.action) || false}
                      onValueChange={() => togglePermission(resource, perm.action)}
                      isDisabled={disabled}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{perm.name}</span>
                        {perm.description && (
                          <span className="text-xs text-gray-500">{perm.description}</span>
                        )}
                      </div>
                    </Checkbox>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No permissions found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
