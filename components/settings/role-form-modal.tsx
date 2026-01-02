"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Role, Permission } from "@/hooks/useRoles";
import PermissionSelector from "./permission-selector";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  allPermissions: Permission[];
  onSubmit: (roleData: Omit<Role, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function RoleFormModal({
  isOpen,
  onClose,
  role,
  allPermissions,
  onSubmit,
  isSubmitting = false,
  error: externalError = null,
}: RoleFormModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Role['permissions']>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  // Initialize form when role changes
  useEffect(() => {
    if (role) {
      setName(role.name);
      setCode(role.code);
      setDescription(role.description || "");
      setPermissions(role.permissions || []);
    } else {
      // Reset for new role
      setName("");
      setCode("");
      setDescription("");
      setPermissions([]);
    }
    setErrors({});
    setInternalError(null);
  }, [role, isOpen]);

  // Generate code from name if creating new role
  useEffect(() => {
    if (!role && name) {
      const generatedCode = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setCode(generatedCode);
    }
  }, [name, role]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Role name is required";
    } else if (name.length < 2) {
      newErrors.name = "Role name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name = "Role name must not exceed 100 characters";
    }

    if (!code.trim()) {
      newErrors.code = "Role code is required";
    } else if (!/^[a-z0-9-]+$/.test(code)) {
      newErrors.code = "Role code must contain only lowercase letters, numbers, and hyphens";
    } else if (code.length < 2) {
      newErrors.code = "Role code must be at least 2 characters";
    } else if (code.length > 50) {
      newErrors.code = "Role code must not exceed 50 characters";
    }

    if (description && description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    if (permissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);

    if (!validate()) {
      return;
    }

    try {
      const roleData: Omit<Role, '_id' | 'createdAt' | 'updatedAt'> = {
        code: code.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        isSystemRole: role?.isSystemRole || false,
        permissions,
      };

      await onSubmit(roleData);
      onClose();
    } catch (error: any) {
      setInternalError(error.message || "Failed to save role");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const displayError = externalError || internalError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      classNames={{
        base: "max-h-[90vh]",
        wrapper: "items-center",
      }}
    >
      <ModalContent className="max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          <ModalHeader className="flex-shrink-0 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              {role ? "Edit Staff Type" : "Create Staff Type"}
            </h2>
          </ModalHeader>
          <ModalBody className="gap-4 overflow-y-auto flex-1 min-h-0 py-6">
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}

            <Input
              label="Role Name"
              placeholder="e.g., Coordinator, Nurse, Stakeholder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
              isDisabled={isSubmitting || !!role?.isSystemRole}
              errorMessage={errors.name}
              isInvalid={!!errors.name}
              description="The display name for this staff type"
            />

            <Input
              label="Role Code"
              placeholder="e.g., coordinator, nurse, stakeholder"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              isRequired
              isDisabled={isSubmitting || !!role}
              errorMessage={errors.code}
              isInvalid={!!errors.code}
              description="Unique identifier (lowercase, letters, numbers, and hyphens only). Cannot be changed after creation."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
              </label>
              <textarea
                className={`w-full px-3 py-2 border rounded-md text-sm min-h-[80px] resize-y ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                placeholder="Optional description of this staff type's responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional description of this staff type
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Permissions <span className="text-red-500">*</span>
              </label>
              {errors.permissions && (
                <p className="text-sm text-red-600 mb-2">{errors.permissions}</p>
              )}
              <div className="border border-gray-200 rounded-lg p-4">
                <PermissionSelector
                  allPermissions={allPermissions}
                  selectedPermissions={permissions}
                  onChange={setPermissions}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {role?.isSystemRole && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  This is a system role. Some fields cannot be modified.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="flex-shrink-0 border-t border-gray-200">
            <Button
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              {role ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
