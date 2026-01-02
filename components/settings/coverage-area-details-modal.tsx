"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pencil, TrashBin } from "@gravity-ui/icons";
import { CoverageArea, UserCoverageAssignment } from "@/hooks/useCoverageAreas";
import { Location } from "@/hooks/useLocations";

interface CoverageAreaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverageArea: CoverageArea | null;
  geographicUnits: Location[];
  userAssignments: UserCoverageAssignment[];
  onEdit?: (coverageArea: CoverageArea) => void;
  onDelete?: (coverageArea: CoverageArea) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export default function CoverageAreaDetailsModal({
  isOpen,
  onClose,
  coverageArea,
  geographicUnits,
  userAssignments,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: CoverageAreaDetailsModalProps) {
  if (!coverageArea) return null;

  const organizationName =
    typeof coverageArea.organizationId === "object" && coverageArea.organizationId
      ? coverageArea.organizationId.name
      : null;

  // Group geographic units by type
  const groupedByType = geographicUnits.reduce((acc, unit) => {
    acc[unit.type] = (acc[unit.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryParts: string[] = [];
  Object.entries(groupedByType).forEach(([type, count]) => {
    summaryParts.push(`${count} ${type}${count !== 1 ? "s" : ""}`);
  });
  const summary = summaryParts.join(", ");

  const activeAssignments = userAssignments.filter((a) => a.isActive);
  const primaryAssignments = activeAssignments.filter((a) => a.isPrimary);

  const handleDelete = () => {
    if (onDelete) {
      if (activeAssignments.length > 0) {
        const message = `This coverage area has ${activeAssignments.length} user(s) assigned. Reassign users before deleting.\n\nDo you want to proceed anyway?`;
        if (window.confirm(message)) {
          onDelete(coverageArea);
        }
      } else {
        if (window.confirm(`Are you sure you want to delete "${coverageArea.name}"?`)) {
          onDelete(coverageArea);
        }
      }
    }
  };

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
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{coverageArea.name}</h2>
                  <div className="flex items-center gap-2">
                    {canUpdate && onEdit && (
                      <Button
                        size="sm"
                        variant="light"
                        startContent={<Pencil className="h-4 w-4" />}
                        onPress={() => {
                          onClose();
                          onEdit(coverageArea);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && onDelete && (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        startContent={<TrashBin className="h-4 w-4" />}
                        onPress={handleDelete}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Name:</span>
                    <p className="text-sm text-gray-900">{coverageArea.name}</p>
                  </div>
                  {coverageArea.code && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Code:</span>
                      <p className="text-sm text-gray-900">{coverageArea.code}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={coverageArea.isActive ? "success" : "default"}
                      >
                        {coverageArea.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </div>
                  </div>
                  {organizationName && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Organization:</span>
                      <div className="mt-1">
                        <Chip size="sm" variant="flat" color="primary">
                          {organizationName}
                        </Chip>
                      </div>
                    </div>
                  )}
                </div>
                {coverageArea.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-900 mt-1">{coverageArea.description}</p>
                  </div>
                )}
                {coverageArea.metadata?.tags && coverageArea.metadata.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {coverageArea.metadata.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="flat">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Geographic Units */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Geographic Units</h3>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Contains: {summary}</p>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-1">
                      {geographicUnits.map((unit) => (
                        <div
                          key={unit._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <span className="text-gray-900">{unit.name}</span>
                          <span className="text-gray-500 text-xs capitalize">{unit.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Information */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">Usage Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total Assignments:</span>
                    <p className="text-sm text-gray-900">{activeAssignments.length}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Primary Assignments:</span>
                    <p className="text-sm text-gray-900">{primaryAssignments.length}</p>
                  </div>
                </div>
                {activeAssignments.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 mb-2 block">
                      Assigned Users:
                    </span>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {activeAssignments.map((assignment) => {
                          const user =
                            typeof assignment.userId === "object"
                              ? assignment.userId
                              : { _id: assignment.userId, name: "Unknown", email: "" };
                          return (
                            <div
                              key={assignment._id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                            >
                              <div>
                                <span className="text-gray-900">{user.name}</span>
                                {user.email && (
                                  <span className="text-gray-500 text-xs ml-2">({user.email})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {assignment.isPrimary && (
                                  <Chip size="sm" variant="flat" color="primary">
                                    Primary
                                  </Chip>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(assignment.assignedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {activeAssignments.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No users assigned to this coverage area.</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

