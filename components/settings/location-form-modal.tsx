"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Checkbox } from "@heroui/checkbox";
import { Location, LocationTreeNode } from "@/hooks/useLocations";

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
  tree: LocationTreeNode[];
  flat: Location[];
  onSubmit: (locationData: Omit<Location, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

const LOCATION_TYPES = [
  { value: "province", label: "Province" },
  { value: "district", label: "District" },
  { value: "city", label: "City" },
  { value: "municipality", label: "Municipality" },
  { value: "barangay", label: "Barangay" },
  { value: "custom", label: "Custom" },
] as const;

// Define valid parent types for each location type
const VALID_PARENT_TYPES: Record<string, string[]> = {
  province: [], // No parent
  district: ["province"],
  city: ["province"],
  municipality: ["district", "city"], // Can be under district or city acting as district
  barangay: ["municipality"],
  custom: ["province", "district", "city", "municipality", "barangay", "custom"], // Flexible
};

export default function LocationFormModal({
  isOpen,
  onClose,
  location,
  tree,
  flat,
  onSubmit,
  isSubmitting = false,
  error: externalError = null,
}: LocationFormModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Location["type"]>("province");
  const [parentId, setParentId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [administrativeCode, setAdministrativeCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCity, setIsCity] = useState(false);
  const [isCombined, setIsCombined] = useState(false);
  const [operationalGroup, setOperationalGroup] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  // Initialize form when location changes
  useEffect(() => {
    if (location) {
      setName(location.name);
      setType(location.type);
      setParentId(
        typeof location.parent === "string" ? location.parent : location.parent?._id || null
      );
      setCode(location.code || "");
      setAdministrativeCode(location.administrativeCode || "");
      setIsActive(location.isActive ?? true);
      setIsCity(location.metadata?.isCity || false);
      setIsCombined(location.metadata?.isCombined || false);
      setOperationalGroup(location.metadata?.operationalGroup || "");
    } else {
      // Reset for new location
      setName("");
      setType("province");
      setParentId(null);
      setCode("");
      setAdministrativeCode("");
      setIsActive(true);
      setIsCity(false);
      setIsCombined(false);
      setOperationalGroup("");
    }
    setErrors({});
    setInternalError(null);
  }, [location, isOpen]);

  // Generate code from name if creating new location
  useEffect(() => {
    if (!location && name) {
      const generatedCode = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setCode(generatedCode);
    }
  }, [name, location]);

  // Get valid parent options based on selected type
  const validParentOptions = useMemo(() => {
    const validTypes = VALID_PARENT_TYPES[type] || [];
    if (validTypes.length === 0) return [];

    return flat.filter((loc) => {
      if (!loc.isActive && loc._id !== location?._id) return false; // Only show active locations (except current)
      if (loc._id === location?._id) return false; // Can't be its own parent
      if (!validTypes.includes(loc.type)) return false;

      // Prevent circular references: can't select a descendant
      if (location) {
        const isDescendant = (node: LocationTreeNode, targetId: string): boolean => {
          if (node._id === targetId) return true;
          if (node.children) {
            return node.children.some((child) => isDescendant(child, targetId));
          }
          return false;
        };

        const findNode = (nodes: LocationTreeNode[], targetId: string): LocationTreeNode | null => {
          for (const node of nodes) {
            if (node._id === targetId) return node;
            if (node.children) {
              const found = findNode(node.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };

        const currentNode = findNode(tree, location._id);
        if (currentNode && isDescendant(currentNode, loc._id)) return false;
      }

      return true;
    });
  }, [type, flat, tree, location]);

  // Build hierarchy path for display
  const getLocationPath = (loc: Location): string => {
    const parts: string[] = [loc.name];
    let current = loc;
    let depth = 0;
    const maxDepth = 5; // Prevent infinite loops

    while (current.parent && depth < maxDepth) {
      const parentId = typeof current.parent === "string" ? current.parent : current.parent._id;
      const parent = flat.find((l) => l._id === parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
      depth++;
    }

    return parts.join(" > ");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Location name is required";
    } else if (name.length < 2) {
      newErrors.name = "Location name must be at least 2 characters";
    } else if (name.length > 200) {
      newErrors.name = "Location name must not exceed 200 characters";
    }

    if (!type) {
      newErrors.type = "Location type is required";
    }

    // Validate parent selection
    if (parentId) {
      const parent = flat.find((l) => l._id === parentId);
      if (!parent) {
        newErrors.parentId = "Selected parent location not found";
      } else if (!parent.isActive) {
        newErrors.parentId = "Parent location must be active";
      } else {
        const validTypes = VALID_PARENT_TYPES[type] || [];
        if (validTypes.length > 0 && !validTypes.includes(parent.type)) {
          newErrors.parentId = `Parent must be of type: ${validTypes.join(", ")}`;
        }
      }
    } else {
      // Check if parent is required
      const validTypes = VALID_PARENT_TYPES[type] || [];
      if (validTypes.length > 0) {
        newErrors.parentId = "Parent location is required for this type";
      }
    }

    if (code && !/^[a-z0-9-]+$/.test(code)) {
      newErrors.code = "Code must contain only lowercase letters, numbers, and hyphens";
    }

    if (operationalGroup && operationalGroup.length > 200) {
      newErrors.operationalGroup = "Operational group must not exceed 200 characters";
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
      const locationData: Omit<Location, "_id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        type,
        isActive,
        code: code.trim() || undefined,
        administrativeCode: administrativeCode.trim() || undefined,
        parent: parentId || undefined,
        metadata: {
          isCity: type === "city" ? isCity : undefined,
          isCombined: type === "district" ? isCombined : undefined,
          operationalGroup: operationalGroup.trim() || undefined,
        },
      };

      await onSubmit(locationData);
      onClose();
    } catch (error: any) {
      setInternalError(error.message || "Failed to save location");
    }
  };

  const errorMessage = externalError || internalError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              <h2 className="text-lg font-semibold">
                {location ? "Edit Geographic Unit" : "Create Geographic Unit"}
              </h2>
            </ModalHeader>
            <ModalBody className="gap-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              <Input
                label="Name"
                placeholder="Enter location name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                description="Display name for this geographic unit (2-200 characters)"
              />

              <Select
                label="Type"
                placeholder="Select location type"
                selectedKeys={type ? [type] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setType(selected as Location["type"]);
                  // Reset parent when type changes if invalid
                  if (parentId) {
                    const parent = flat.find((l) => l._id === parentId);
                    const validTypes = VALID_PARENT_TYPES[selected] || [];
                    if (parent && validTypes.length > 0 && !validTypes.includes(parent.type)) {
                      setParentId(null);
                    }
                  }
                }}
                isRequired
                isInvalid={!!errors.type}
                errorMessage={errors.type}
              >
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              {VALID_PARENT_TYPES[type] && VALID_PARENT_TYPES[type].length > 0 && (
                <Select
                  label="Parent Location"
                  placeholder="Select parent location"
                  selectedKeys={parentId ? [parentId] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string | null;
                    setParentId(selected || null);
                  }}
                  isRequired
                  isInvalid={!!errors.parentId}
                  errorMessage={errors.parentId}
                  description={`Must be of type: ${VALID_PARENT_TYPES[type].join(", ")}`}
                >
                  {validParentOptions.map((loc) => (
                    <SelectItem key={loc._id}>
                      {getLocationPath(loc)}
                    </SelectItem>
                  ))}
                </Select>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code"
                  placeholder="Auto-generated from name"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase())}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code}
                  description="Unique identifier (optional, auto-generated)"
                />

                <Input
                  label="Administrative Code"
                  placeholder="Official administrative code"
                  value={administrativeCode}
                  onChange={(e) => setAdministrativeCode(e.target.value)}
                  description="Official administrative code (optional)"
                />
              </div>

              {type === "city" && (
                <Checkbox isSelected={isCity} onValueChange={setIsCity}>
                  Acts as District
                </Checkbox>
              )}

              {type === "district" && (
                <div className="space-y-2">
                  <Checkbox isSelected={isCombined} onValueChange={setIsCombined}>
                    Combined District
                  </Checkbox>
                  {isCombined && (
                    <Input
                      label="Operational Group"
                      placeholder="e.g., Camarines Norte All LGUs"
                      value={operationalGroup}
                      onChange={(e) => setOperationalGroup(e.target.value)}
                      isInvalid={!!errors.operationalGroup}
                      errorMessage={errors.operationalGroup}
                      description="Operational grouping identifier"
                    />
                  )}
                </div>
              )}

              <Switch isSelected={isActive} onValueChange={setIsActive}>
                Active
              </Switch>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {location ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

