"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Plus as PlusIcon, Magnifier as Search } from "@gravity-ui/icons";
import { useCoverageAreas, CoverageArea } from "@/hooks/useCoverageAreas";
import { useLocations } from "@/hooks/useLocations";
import CoverageAreaCard from "./coverage-area-card";
import CoverageAreaFormModal from "./coverage-area-form-modal";
import CoverageAreaDetailsModal from "./coverage-area-details-modal";

interface CoverageAreasSectionProps {
  isOpen: boolean;
}

export default function CoverageAreasSection({ isOpen }: CoverageAreasSectionProps) {
  const {
    coverageAreas,
    organizations,
    loading,
    error,
    createCoverageArea,
    updateCoverageArea,
    deleteCoverageArea,
    getCoverageAreaGeographicUnits,
    getCoverageAreaUsers,
    canDeleteCoverageArea,
    refreshCoverageAreas,
  } = useCoverageAreas(isOpen);

  const { tree, flat } = useLocations(isOpen);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCoverageArea, setEditingCoverageArea] = useState<CoverageArea | null>(null);
  const [viewingCoverageArea, setViewingCoverageArea] = useState<CoverageArea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null);
  const [geographicUnitsMap, setGeographicUnitsMap] = useState<Record<string, any[]>>({});
  const [userAssignmentsMap, setUserAssignmentsMap] = useState<Record<string, any[]>>({});

  // Load geographic units for all coverage areas
  useEffect(() => {
    if (coverageAreas.length > 0) {
      Promise.all(
        coverageAreas.map(async (ca) => {
          const units = await getCoverageAreaGeographicUnits(ca._id);
          return { id: ca._id, units };
        })
      ).then((results) => {
        const map: Record<string, any[]> = {};
        results.forEach(({ id, units }) => {
          map[id] = units;
        });
        setGeographicUnitsMap(map);
      });
    }
  }, [coverageAreas, getCoverageAreaGeographicUnits]);

  // Load user assignments for viewing coverage area
  useEffect(() => {
    if (viewingCoverageArea) {
      getCoverageAreaUsers(viewingCoverageArea._id).then((assignments) => {
        setUserAssignmentsMap((prev) => ({
          ...prev,
          [viewingCoverageArea._id]: assignments,
        }));
      });
    }
  }, [viewingCoverageArea, getCoverageAreaUsers]);

  // Filter coverage areas
  const filteredCoverageAreas = useMemo(() => {
    return coverageAreas.filter((ca) => {
      if (searchQuery) {
        const matchesSearch =
          ca.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ca.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ca.description?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
      }
      if (organizationFilter) {
        const caOrgId =
          typeof ca.organizationId === "string"
            ? ca.organizationId
            : ca.organizationId?._id;
        if (caOrgId !== organizationFilter) return false;
      }
      return true;
    });
  }, [coverageAreas, searchQuery, organizationFilter]);

  const handleCreate = () => {
    setEditingCoverageArea(null);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleEdit = (coverageArea: CoverageArea) => {
    setEditingCoverageArea(coverageArea);
    setFormError(null);
    setViewingCoverageArea(null);
    setShowFormModal(true);
  };

  const handleView = async (coverageArea: CoverageArea) => {
    setViewingCoverageArea(coverageArea);
    // Load user assignments if not already loaded
    if (!userAssignmentsMap[coverageArea._id]) {
      const assignments = await getCoverageAreaUsers(coverageArea._id);
      setUserAssignmentsMap((prev) => ({
        ...prev,
        [coverageArea._id]: assignments,
      }));
    }
  };

  const handleDelete = async (coverageArea: CoverageArea) => {
    try {
      const checkResult = await canDeleteCoverageArea(coverageArea._id);
      if (!checkResult.canDelete) {
        alert(checkResult.reason || "Cannot delete this coverage area");
        return;
      }

      if (
        window.confirm(
          `Are you sure you want to delete "${coverageArea.name}"? This action cannot be undone.`
        )
      ) {
        await deleteCoverageArea(coverageArea._id);
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete coverage area");
    }
  };

  const handleSubmit = async (
    coverageAreaData: Omit<CoverageArea, "_id" | "createdAt" | "updatedAt">
  ) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingCoverageArea) {
        await updateCoverageArea(editingCoverageArea._id, coverageAreaData);
      } else {
        await createCoverageArea(coverageAreaData);
      }
      setShowFormModal(false);
      setEditingCoverageArea(null);
    } catch (error: any) {
      setFormError(error.message || "Failed to save coverage area");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Coverage Areas</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create logical groupings of geographic units. Coverage areas can overlap and are used
            for staff assignments.
          </p>
        </div>
        <Button
          color="primary"
          onClick={handleCreate}
          startContent={<PlusIcon className="h-4 w-4" />}
          size="sm"
        >
          Create Coverage Area
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search coverage areas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="h-4 w-4 text-gray-400" />}
          className="flex-1"
          size="sm"
        />
        <Select
          placeholder="Filter by organization"
          selectedKeys={organizationFilter ? [organizationFilter] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string | null;
            setOrganizationFilter(selected || null);
          }}
          className="w-full sm:w-64"
          size="sm"
        >
          <SelectItem key="all">
            All Organizations
          </SelectItem>
          <>
            {organizations.map((org) => (
              <SelectItem key={org._id}>
                {org.name}
              </SelectItem>
            ))}
          </>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredCoverageAreas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-2">No coverage areas found.</p>
          <p className="text-sm text-gray-400">
            {searchQuery || organizationFilter
              ? "Try adjusting your filters."
              : "Create your first coverage area to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoverageAreas.map((coverageArea) => (
            <CoverageAreaCard
              key={coverageArea._id}
              coverageArea={coverageArea}
              geographicUnits={geographicUnitsMap[coverageArea._id] || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              canUpdate={true}
              canDelete={true}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <CoverageAreaFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingCoverageArea(null);
            setFormError(null);
          }}
          coverageArea={editingCoverageArea}
          tree={tree}
          flat={flat}
          organizations={organizations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={formError}
        />
      )}

      {/* Details Modal */}
      {viewingCoverageArea && (
        <CoverageAreaDetailsModal
          isOpen={!!viewingCoverageArea}
          onClose={() => setViewingCoverageArea(null)}
          coverageArea={viewingCoverageArea}
          geographicUnits={geographicUnitsMap[viewingCoverageArea._id] || []}
          userAssignments={userAssignmentsMap[viewingCoverageArea._id] || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canUpdate={true}
          canDelete={true}
        />
      )}
    </div>
  );
}

