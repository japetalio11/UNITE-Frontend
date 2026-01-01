"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { CoverageArea, Organization } from "@/hooks/useCoverageAreas";
import { Location, LocationTreeNode } from "@/hooks/useLocations";
import GeographicUnitSelector from "./geographic-unit-selector";

interface CoverageAreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverageArea?: CoverageArea | null;
  tree: LocationTreeNode[];
  flat: Location[];
  organizations: Organization[];
  onSubmit: (coverageAreaData: Omit<CoverageArea, "_id" | "createdAt" | "updatedAt">) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

type Step = "basic" | "units" | "review";

export default function CoverageAreaFormModal({
  isOpen,
  onClose,
  coverageArea,
  tree,
  flat,
  organizations,
  onSubmit,
  isSubmitting = false,
  error: externalError = null,
}: CoverageAreaFormModalProps) {
  const [step, setStep] = useState<Step>("basic");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  // Initialize form when coverage area changes
  useEffect(() => {
    if (coverageArea) {
      setName(coverageArea.name);
      setDescription(coverageArea.description || "");
      setOrganizationId(
        typeof coverageArea.organizationId === "string"
          ? coverageArea.organizationId
          : coverageArea.organizationId?._id || null
      );
      setCode(coverageArea.code || "");
      setSelectedUnits(
        coverageArea.geographicUnits.map((unit) =>
          typeof unit === "string" ? unit : unit._id
        )
      );
    } else {
      setName("");
      setDescription("");
      setOrganizationId(null);
      setCode("");
      setSelectedUnits([]);
    }
    setStep("basic");
    setErrors({});
    setInternalError(null);
  }, [coverageArea, isOpen]);

  // Generate code from name if creating new coverage area
  useEffect(() => {
    if (!coverageArea && name) {
      const generatedCode = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setCode(generatedCode);
    }
  }, [name, coverageArea]);

  // Get selected units as Location objects
  const selectedUnitsData = useMemo(() => {
    return selectedUnits
      .map((id) => flat.find((loc) => loc._id === id))
      .filter(Boolean) as Location[];
  }, [selectedUnits, flat]);

  // Group selected units by type
  const groupedByType = useMemo(() => {
    const groups: Record<string, number> = {};
    selectedUnitsData.forEach((unit) => {
      groups[unit.type] = (groups[unit.type] || 0) + 1;
    });
    return groups;
  }, [selectedUnitsData]);

  const validateBasic = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Coverage area name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 200) {
      newErrors.name = "Name must not exceed 200 characters";
    }

    if (description && description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUnits = (): boolean => {
    if (selectedUnits.length === 0) {
      setErrors({ units: "At least one geographic unit must be selected" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === "basic") {
      if (validateBasic()) {
        setStep("units");
      }
    } else if (step === "units") {
      if (validateUnits()) {
        setStep("review");
      }
    }
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("units");
    } else if (step === "units") {
      setStep("basic");
    }
  };

  const handleSubmit = async () => {
    setInternalError(null);

    if (!validateBasic() || !validateUnits()) {
      setStep("basic");
      return;
    }

    try {
      const coverageAreaData: Omit<CoverageArea, "_id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        description: description.trim() || undefined,
        geographicUnits: selectedUnits,
        organizationId: organizationId || undefined,
        code: code.trim() || undefined,
        isActive: true,
      };

      await onSubmit(coverageAreaData);
      onClose();
    } catch (error: any) {
      setInternalError(error.message || "Failed to save coverage area");
    }
  };

  const errorMessage = externalError || internalError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
                  {coverageArea ? "Edit Coverage Area" : "Create Coverage Area"}
                </h2>
                {/* Step Indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`flex-1 h-1 rounded ${
                      step === "basic" ? "bg-primary" : "bg-primary"
                    }`}
                  />
                  <div
                    className={`flex-1 h-1 rounded ${
                      step === "units" || step === "review" ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`flex-1 h-1 rounded ${
                      step === "review" ? "bg-primary" : "bg-gray-300"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span className={step === "basic" ? "font-medium text-primary" : ""}>
                    Basic Info
                  </span>
                  <span className={step === "units" ? "font-medium text-primary" : ""}>
                    Select Units
                  </span>
                  <span className={step === "review" ? "font-medium text-primary" : ""}>
                    Review
                  </span>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* Step 1: Basic Information */}
              {step === "basic" && (
                <div className="space-y-4">
                  <Input
                    label="Name"
                    placeholder="e.g., Camarines Norte – Unified"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    description="Name for this coverage area (2-200 characters)"
                  />

                  <Textarea
                    label="Description"
                    placeholder="Optional description of this coverage area"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    isInvalid={!!errors.description}
                    errorMessage={errors.description}
                    description="Optional description (max 500 characters)"
                    minRows={3}
                  />

                  <Select
                    label="Organization"
                    placeholder="Select organization (optional)"
                    selectedKeys={organizationId ? [organizationId] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string | null;
                      setOrganizationId(selected || null);
                    }}
                    description="Optional: Link this coverage area to an organization"
                  >
                    {organizations.map((org) => (
                      <SelectItem key={org._id}>
                        {org.name} ({org.type})
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Code"
                    placeholder="Auto-generated from name"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toLowerCase())}
                    description="Unique identifier (optional, auto-generated)"
                  />
                </div>
              )}

              {/* Step 2: Select Geographic Units */}
              {step === "units" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Select Geographic Units
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose one or more geographic units to include in this coverage area. You can
                      select provinces, cities, districts, municipalities, or any combination.
                    </p>
                  </div>
                  {errors.units && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{errors.units}</p>
                    </div>
                  )}
                  <GeographicUnitSelector
                    tree={tree}
                    flat={flat}
                    selected={selectedUnits}
                    onSelectionChange={setSelectedUnits}
                  />
                </div>
              )}

              {/* Step 3: Review */}
              {step === "review" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Review Coverage Area</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Name:</span>
                        <p className="text-sm text-gray-900">{name}</p>
                      </div>
                      {description && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Description:</span>
                          <p className="text-sm text-gray-900">{description}</p>
                        </div>
                      )}
                      {organizationId && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Organization:</span>
                          <p className="text-sm text-gray-900">
                            {organizations.find((o) => o._id === organizationId)?.name || "—"}
                          </p>
                        </div>
                      )}
                      {code && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Code:</span>
                          <p className="text-sm text-gray-900">{code}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Geographic Units:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(groupedByType).map(([type, count]) => (
                            <Chip key={type} size="sm" variant="flat" color="primary">
                              {count} {type}
                              {count !== 1 ? "s" : ""}
                            </Chip>
                          ))}
                        </div>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
                          {selectedUnitsData.map((unit) => (
                            <div
                              key={unit._id}
                              className="flex items-center justify-between py-1 text-sm"
                            >
                              <span className="text-gray-900">{unit.name}</span>
                              <span className="text-gray-500 text-xs capitalize">{unit.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              {step !== "basic" && (
                <Button variant="light" onPress={handleBack} isDisabled={isSubmitting}>
                  Back
                </Button>
              )}
              {step !== "review" ? (
                <Button color="primary" onPress={handleNext} isDisabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
                  {coverageArea ? "Update" : "Create"}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

