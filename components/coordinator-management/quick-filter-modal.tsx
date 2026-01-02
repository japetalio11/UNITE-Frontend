"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Checkbox } from "@heroui/checkbox";
import { useRoles } from "@/hooks/useRoles";
import { listCoverageAreas } from "@/services/coordinatorService";
import type { StaffFilters } from "@/types/coordinator.types";

interface QuickFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: StaffFilters) => void;
  currentFilters?: StaffFilters;
}

export default function QuickFilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters = {},
}: QuickFilterModalProps) {
  const { roles, loading: rolesLoading } = useRoles(isOpen);
  const [coverageAreas, setCoverageAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [coverageAreasLoading, setCoverageAreasLoading] = useState(false);

  // Filter state
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    new Set(currentFilters.role || [])
  );
  const [selectedCoverageAreaIds, setSelectedCoverageAreaIds] = useState<Set<string>>(
    new Set(currentFilters.coverageAreaId || [])
  );
  const [selectedOrganizationTypes, setSelectedOrganizationTypes] = useState<Set<string>>(
    new Set(currentFilters.organizationType || [])
  );

  // Load coverage areas when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadCoverageAreas = async () => {
      setCoverageAreasLoading(true);
      try {
        const response = await listCoverageAreas({ isActive: true, limit: 1000 });
        if (response.success && response.data) {
          setCoverageAreas(
            response.data.map((ca: any) => ({
              id: ca._id,
              name: ca.name,
            }))
          );
        }
      } catch (err: any) {
        console.error("Failed to load coverage areas:", err);
        setCoverageAreas([]);
      } finally {
        setCoverageAreasLoading(false);
      }
    };

    loadCoverageAreas();
  }, [isOpen]);

  // Reset filters when modal opens with current filters
  useEffect(() => {
    if (isOpen) {
      setSelectedRoles(new Set(currentFilters.role || []));
      setSelectedCoverageAreaIds(new Set(currentFilters.coverageAreaId || []));
      setSelectedOrganizationTypes(new Set(currentFilters.organizationType || []));
    }
  }, [isOpen, currentFilters]);

  const handleToggleRole = (roleCode: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleCode)) {
        next.delete(roleCode);
      } else {
        next.add(roleCode);
      }
      return next;
    });
  };

  const handleToggleCoverageArea = (coverageAreaId: string) => {
    setSelectedCoverageAreaIds((prev) => {
      const next = new Set(prev);
      if (next.has(coverageAreaId)) {
        next.delete(coverageAreaId);
      } else {
        next.add(coverageAreaId);
      }
      return next;
    });
  };

  const handleToggleOrganizationType = (orgType: string) => {
    setSelectedOrganizationTypes((prev) => {
      const next = new Set(prev);
      if (next.has(orgType)) {
        next.delete(orgType);
      } else {
        next.add(orgType);
      }
      return next;
    });
  };

  const handleApply = () => {
    const filters: StaffFilters = {};

    if (selectedRoles.size > 0) {
      filters.role = Array.from(selectedRoles);
    }

    if (selectedCoverageAreaIds.size > 0) {
      filters.coverageAreaId = Array.from(selectedCoverageAreaIds);
    }

    if (selectedOrganizationTypes.size > 0) {
      filters.organizationType = Array.from(selectedOrganizationTypes);
    }

    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setSelectedRoles(new Set());
    setSelectedCoverageAreaIds(new Set());
    setSelectedOrganizationTypes(new Set());
  };

  const organizationTypes: Array<{ key: string; label: string }> = [
    { key: "LGU", label: "LGU" },
    { key: "NGO", label: "NGO" },
    { key: "Hospital", label: "Hospital" },
    { key: "RedCross", label: "Red Cross" },
    { key: "Non-LGU", label: "Non-LGU" },
    { key: "Other", label: "Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      size="md"
      onClose={onClose}
      classNames={{
        base: "max-w-[500px]",
      }}
    >
      <ModalContent>
        <ModalHeader className="pb-1.5 pt-4 px-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Filter</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Filter staff by roles, coverage areas, or organization types
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="px-5 py-3 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Roles Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-900">Roles</label>
              {rolesLoading ? (
                <div className="text-xs text-gray-500">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-xs text-gray-500">No roles available</div>
              ) : (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                  {roles.map((role) => (
                    <div key={role._id} className="flex items-center gap-2">
                      <Checkbox
                        isSelected={selectedRoles.has(role.code)}
                        onValueChange={() => handleToggleRole(role.code)}
                        size="sm"
                      >
                        <span className="text-xs text-gray-700">{role.name}</span>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coverage Areas Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-900">Coverage Areas</label>
              {coverageAreasLoading ? (
                <div className="text-xs text-gray-500">Loading coverage areas...</div>
              ) : coverageAreas.length === 0 ? (
                <div className="text-xs text-gray-500">No coverage areas available</div>
              ) : (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                  {coverageAreas.map((ca) => (
                    <div key={ca.id} className="flex items-center gap-2">
                      <Checkbox
                        isSelected={selectedCoverageAreaIds.has(ca.id)}
                        onValueChange={() => handleToggleCoverageArea(ca.id)}
                        size="sm"
                      >
                        <span className="text-xs text-gray-700">{ca.name}</span>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Organization Types Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-900">Organization Types</label>
              <div className="space-y-1.5 border border-gray-200 rounded p-2 bg-gray-50">
                {organizationTypes.map((orgType) => (
                  <div key={orgType.key} className="flex items-center gap-2">
                    <Checkbox
                      isSelected={selectedOrganizationTypes.has(orgType.key)}
                      onValueChange={() => handleToggleOrganizationType(orgType.key)}
                      size="sm"
                    >
                      <span className="text-xs text-gray-700">{orgType.label}</span>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="px-5 pb-4 pt-3 gap-2.5">
          <Button
            variant="bordered"
            radius="lg"
            size="sm"
            className="flex-1 h-9 border-gray-300 font-medium text-xs"
            onPress={handleClear}
          >
            Clear
          </Button>
          <Button
            className="flex-1 h-9 bg-black text-white font-medium text-xs hover:bg-gray-800"
            color="default"
            radius="lg"
            size="sm"
            onPress={handleApply}
          >
            Apply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
