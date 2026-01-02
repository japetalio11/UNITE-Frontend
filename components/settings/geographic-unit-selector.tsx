"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Magnifier as Search } from "@gravity-ui/icons";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Location, LocationTreeNode } from "@/hooks/useLocations";

interface GeographicUnitSelectorProps {
  tree: LocationTreeNode[];
  flat: Location[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled?: string[]; // IDs that cannot be selected
}

interface TreeNodeSelectorProps {
  node: LocationTreeNode;
  level: number;
  selected: Set<string>;
  disabled: Set<string>;
  onToggle: (id: string) => void;
  searchQuery: string;
}

function TreeNodeSelector({
  node,
  level,
  selected,
  disabled,
  onToggle,
  searchQuery,
}: TreeNodeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selected.has(node._id);
  const isDisabled = disabled.has(node._id);
  const indent = level * 20;

  // Check if node or any children match search
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nodeMatches =
      node.name.toLowerCase().includes(query) ||
      node.code?.toLowerCase().includes(query);
    if (nodeMatches) return true;
    if (hasChildren) {
      return node.children!.some((child) => {
        const childMatches =
          child.name.toLowerCase().includes(query) ||
          child.code?.toLowerCase().includes(query);
        if (childMatches) return true;
        // Check grandchildren
        if (child.children) {
          return child.children.some(
            (grandchild) =>
              grandchild.name.toLowerCase().includes(query) ||
              grandchild.code?.toLowerCase().includes(query)
          );
        }
        return false;
      });
    }
    return false;
  }, [node, searchQuery, hasChildren]);

  if (!matchesSearch && !isSelected) {
    // Don't render if doesn't match search and not selected
    return null;
  }

  const handleToggle = () => {
    if (!isDisabled) {
      onToggle(node._id);
    }
  };

  // Get all descendant IDs
  const getAllDescendantIds = (n: LocationTreeNode): string[] => {
    const ids = [n._id];
    if (n.children) {
      n.children.forEach((child) => {
        ids.push(...getAllDescendantIds(child));
      });
    }
    return ids;
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled) {
      const allIds = getAllDescendantIds(node);
      const allSelected = allIds.every((id) => selected.has(id));
      if (allSelected) {
        // Deselect all
        allIds.forEach((id) => {
          if (!disabled.has(id)) {
            onToggle(id);
          }
        });
      } else {
        // Select all
        allIds.forEach((id) => {
          if (!disabled.has(id) && !selected.has(id)) {
            onToggle(id);
          }
        });
      }
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md ${
          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isSelected ? "bg-blue-50" : ""}`}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
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
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <Checkbox
          isSelected={isSelected}
          onValueChange={handleToggle}
          isDisabled={isDisabled}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Location Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
            {node.code && (
              <span className="text-xs text-gray-500 truncate">({node.code})</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Chip size="sm" variant="flat">
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </Chip>
            {node.metadata?.isCity && (
              <Chip size="sm" variant="flat" color="success">
                Acts as District
              </Chip>
            )}
            {!node.isActive && (
              <Chip size="sm" variant="flat" color="default">
                Inactive
              </Chip>
            )}
          </div>
        </div>

        {/* Select All Button (for nodes with children) */}
        {hasChildren && !isDisabled && (
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
            title="Select all descendants"
          >
            Select All
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeSelector
              key={child._id}
              node={child}
              level={level + 1}
              selected={selected}
              disabled={disabled}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GeographicUnitSelector({
  tree,
  flat,
  selected,
  onSelectionChange,
  disabled = [],
}: GeographicUnitSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

  const handleToggle = (id: string) => {
    const newSelected = [...selected];
    const index = newSelected.indexOf(id);
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(id);
    }
    onSelectionChange(newSelected);
  };

  // Group selected units by type for summary
  const selectedUnits = useMemo(() => {
    return selected.map((id) => flat.find((loc) => loc._id === id)).filter(Boolean) as Location[];
  }, [selected, flat]);

  const groupedByType = useMemo(() => {
    const groups: Record<string, number> = {};
    selectedUnits.forEach((unit) => {
      groups[unit.type] = (groups[unit.type] || 0) + 1;
    });
    return groups;
  }, [selectedUnits]);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;
    // Filter tree based on search - keep nodes that match or have matching descendants
    return tree.filter((node) => {
      const matchesSearch = (n: LocationTreeNode): boolean => {
        const matches =
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.code?.toLowerCase().includes(searchQuery.toLowerCase());
        if (matches) return true;
        if (n.children) {
          return n.children.some(matchesSearch);
        }
        return false;
      };
      return matchesSearch(node);
    });
  }, [tree, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search geographic units..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        startContent={<Search className="h-4 w-4 text-gray-400" />}
        size="sm"
      />

      {/* Selected Summary */}
      {selected.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              {selected.length} unit{selected.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(groupedByType).map(([type, count]) => (
              <Chip key={type} size="sm" variant="flat" color="primary">
                {count} {type}
                {count !== 1 ? "s" : ""}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Tree View */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        {filteredTree.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No geographic units found.</p>
            {searchQuery && <p className="text-sm mt-2">Try a different search term.</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTree.map((node) => (
              <TreeNodeSelector
                key={node._id}
                node={node}
                level={0}
                selected={selectedSet}
                disabled={disabledSet}
                onToggle={handleToggle}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Units List (Collapsible) */}
      {selectedUnits.length > 0 && (
        <details className="border border-gray-200 rounded-lg p-3">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer">
            View Selected Units ({selectedUnits.length})
          </summary>
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {selectedUnits.map((unit) => (
              <div
                key={unit._id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-900">{unit.name}</span>
                <span className="text-gray-500 text-xs capitalize">{unit.type}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

