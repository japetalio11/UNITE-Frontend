"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Pencil, TrashBin, Eye, ChevronDown, ChevronUp } from "@gravity-ui/icons";
import { CoverageArea } from "@/hooks/useCoverageAreas";
import { Location } from "@/hooks/useLocations";

interface CoverageAreaCardProps {
  coverageArea: CoverageArea;
  geographicUnits: Location[];
  onEdit?: (coverageArea: CoverageArea) => void;
  onDelete?: (coverageArea: CoverageArea) => void;
  onView?: (coverageArea: CoverageArea) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export default function CoverageAreaCard({
  coverageArea,
  geographicUnits,
  onEdit,
  onDelete,
  onView,
  canUpdate = true,
  canDelete = true,
}: CoverageAreaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const organizationName =
    typeof coverageArea.organizationId === "object" && coverageArea.organizationId
      ? coverageArea.organizationId.name
      : null;

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete "${coverageArea.name}"?`)) {
      onDelete(coverageArea);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">
              {coverageArea.name}
            </h4>
            {coverageArea.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {coverageArea.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onView && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onView(coverageArea)}
                aria-label="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canUpdate && onEdit && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEdit(coverageArea)}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={handleDelete}
                aria-label="Delete"
              >
                <TrashBin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Contains: {summary || "No units"}</span>
          {!coverageArea.isActive && (
            <Chip size="sm" variant="flat" color="default">
              Inactive
            </Chip>
          )}
        </div>

        {/* Organization */}
        {organizationName && (
          <div>
            <Chip size="sm" variant="flat" color="primary">
              {organizationName}
            </Chip>
          </div>
        )}

        {/* Tags */}
        {coverageArea.metadata?.tags && coverageArea.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {coverageArea.metadata.tags.map((tag) => (
              <Chip key={tag} size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
          </div>
        )}

        {/* Expandable Geographic Units List */}
        {geographicUnits.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
            >
              <span>
                {isExpanded ? "Hide" : "Show"} geographic units ({geographicUnits.length})
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
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
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

