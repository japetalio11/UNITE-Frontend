"use client";

import { useState } from "react";
import {
  Ellipsis as MoreHorizontal,
  Pencil as Edit3,
  TrashBin,
  Eye as View,
} from "@gravity-ui/icons";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { Role } from "@/hooks/useRoles";
import { formatPermissionsForDisplay } from "@/utils/role-utils";

interface RoleManagementTableProps {
  roles: Role[];
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onView?: (role: Role) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export default function RoleManagementTable({
  roles,
  loading = false,
  onEdit,
  onDelete,
  onView,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}: RoleManagementTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (role: Role) => {
    if (window.confirm(`Are you sure you want to delete "${role.name}"? This action cannot be undone.`)) {
      setDeletingId(role._id);
      try {
        await onDelete(role);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 mb-4">No staff types found.</p>
        <p className="text-sm text-gray-400">
          Create your first staff type to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    <span className="text-xs text-gray-500">{role.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 max-w-md truncate">
                    {role.description || "—"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-md">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {formatPermissionsForDisplay(role.permissions)}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {role.isSystemRole ? (
                    <Chip size="sm" color="warning" variant="flat">
                      System
                    </Chip>
                  ) : (
                    <Chip size="sm" color="success" variant="flat">
                      Custom
                    </Chip>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Role actions">
                      <DropdownSection>
                        {onView && (
                          <DropdownItem
                            key="view"
                            startContent={<View className="h-4 w-4" />}
                            onPress={() => onView(role)}
                          >
                            View Details
                          </DropdownItem>
                        )}
                        {canUpdate && (
                          <DropdownItem
                            key="edit"
                            startContent={<Edit3 className="h-4 w-4" />}
                            onPress={() => onEdit(role)}
                            isDisabled={role.isSystemRole}
                          >
                            Edit
                          </DropdownItem>
                        )}
                        {canDelete && (
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<TrashBin className="h-4 w-4" />}
                            onPress={() => handleDelete(role)}
                            isDisabled={role.isSystemRole || deletingId === role._id}
                          >
                            {deletingId === role._id ? "Deleting..." : "Delete"}
                          </DropdownItem>
                        )}
                      </DropdownSection>
                    </DropdownMenu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
