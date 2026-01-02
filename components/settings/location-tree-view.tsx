"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Pencil, TrashBin, Eye, Xmark } from "@gravity-ui/icons";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Location, LocationTreeNode } from "@/hooks/useLocations";

interface LocationTreeViewProps {
  tree: LocationTreeNode[];
  loading?: boolean;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  onView?: (location: Location) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

interface TreeNodeProps {
  node: LocationTreeNode;
  level: number;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  onView?: (location: Location) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

function TreeNode({ node, level, onEdit, onDelete, onView, canUpdate, canDelete }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 20;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "province":
        return "primary";
      case "district":
        return "secondary";
      case "city":
        return "success";
      case "municipality":
        return "warning";
      case "barangay":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md group ${
          !node.isActive ? "opacity-60" : ""
        }`}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacer for alignment
        )}

        {/* Location Info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
              {node.code && (
                <span className="text-xs text-gray-500 truncate">({node.code})</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Chip size="sm" variant="flat" color={getTypeColor(node.type)}>
                {getTypeLabel(node.type)}
              </Chip>
              {node.metadata?.isCity && (
                <Chip size="sm" variant="flat" color="success">
                  Acts as District
                </Chip>
              )}
              {node.metadata?.isCombined && (
                <Chip size="sm" variant="flat" color="warning">
                  Combined
                </Chip>
              )}
              {!node.isActive && (
                <Chip size="sm" variant="flat" color="default">
                  Inactive
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onView(node)}
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
              onPress={() => onEdit(node)}
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
              onPress={() => onDelete(node)}
              aria-label="Delete"
            >
              <TrashBin className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationTreeView({
  tree,
  loading = false,
  onEdit,
  onDelete,
  onView,
  canUpdate = true,
  canDelete = true,
}: LocationTreeViewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-4"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 mb-2">No geographic units found.</p>
        <p className="text-sm text-gray-400">
          Create your first province to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-200">
        {tree.map((node) => (
          <TreeNode
            key={node._id}
            node={node}
            level={0}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  );
}

