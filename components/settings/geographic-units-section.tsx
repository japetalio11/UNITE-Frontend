"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Plus as PlusIcon, Magnifier as Search, ListUl } from "@gravity-ui/icons";
import { useLocations, Location } from "@/hooks/useLocations";
import LocationTreeView from "./location-tree-view";
import LocationFormModal from "./location-form-modal";

interface GeographicUnitsSectionProps {
  isOpen: boolean;
}

export default function GeographicUnitsSection({ isOpen }: GeographicUnitsSectionProps) {
  const {
    tree,
    flat,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    canDeleteLocation,
    refreshLocations,
  } = useLocations(isOpen);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");

  // Filter tree/list based on search
  const filteredTree = searchQuery
    ? tree.filter((node) => {
        const matchesSearch = (n: typeof node): boolean => {
          const matches = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.code?.toLowerCase().includes(searchQuery.toLowerCase());
          if (matches) return true;
          if (n.children) {
            return n.children.some(matchesSearch);
          }
          return false;
        };
        return matchesSearch(node);
      })
    : tree;

  const filteredFlat = searchQuery
    ? flat.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flat;

  const handleCreate = () => {
    setEditingLocation(null);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleDelete = async (location: Location) => {
    try {
      const checkResult = await canDeleteLocation(location._id);
      if (!checkResult.canDelete) {
        alert(checkResult.reason || "Cannot delete this location");
        return;
      }

      if (
        window.confirm(
          `Are you sure you want to delete "${location.name}"? This action cannot be undone.`
        )
      ) {
        await deleteLocation(location._id);
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete location");
    }
  };

  const handleView = (location: Location) => {
    // For now, open edit modal in view mode
    // Could create a separate view modal later
    handleEdit(location);
  };

  const handleSubmit = async (locationData: Omit<Location, "_id" | "createdAt" | "updatedAt">) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingLocation) {
        await updateLocation(editingLocation._id, locationData);
      } else {
        await createLocation(locationData);
      }
      setShowFormModal(false);
      setEditingLocation(null);
    } catch (error: any) {
      setFormError(error.message || "Failed to save location");
      throw error; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Geographic Units</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage provinces, cities, districts, municipalities, and other location types
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="primary"
            onClick={handleCreate}
            startContent={<PlusIcon className="h-4 w-4" />}
            size="sm"
          >
            Create Geographic Unit
          </Button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="h-4 w-4 text-gray-400" />}
          className="flex-1"
          size="sm"
        />
        <div className="flex gap-1 border border-gray-300 rounded-md p-1">
          <Button
            size="sm"
            variant={viewMode === "tree" ? "solid" : "light"}
            color={viewMode === "tree" ? "primary" : "default"}
            onPress={() => setViewMode("tree")}
            aria-label="Tree view"
          >
            Tree
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "solid" : "light"}
            color={viewMode === "list" ? "primary" : "default"}
            onPress={() => setViewMode("list")}
            aria-label="List view"
            startContent={<ListUl className="h-4 w-4" />}
          >
            List
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {viewMode === "tree" ? (
        <LocationTreeView
          tree={filteredTree}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          canUpdate={true}
          canDelete={true}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredFlat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500 mb-2">No geographic units found.</p>
                      <p className="text-sm text-gray-400">
                        {searchQuery
                          ? "Try a different search term."
                          : "Create your first province to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFlat.map((loc) => (
                    <tr key={loc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{loc.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">{loc.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{loc.code || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            loc.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loc.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => handleEdit(loc)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDelete(loc)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <LocationFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingLocation(null);
            setFormError(null);
          }}
          location={editingLocation}
          tree={tree}
          flat={flat}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={formError}
        />
      )}
    </div>
  );
}

