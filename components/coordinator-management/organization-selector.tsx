"use client";

import { useState, useMemo } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Search } from "lucide-react";

interface Organization {
  _id: string;
  name: string;
  type: string;
  code?: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  error?: string;
  label?: string;
}

export default function OrganizationSelector({
  organizations,
  selectedIds,
  onSelectionChange,
  isDisabled = false,
  isRequired = false,
  error,
  label = "Organizations",
}: OrganizationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter organizations based on search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) {
      return organizations;
    }
    const query = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.type.toLowerCase().includes(query) ||
        org.code?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  const handleToggle = (orgId: string) => {
    if (isDisabled) return;
    
    const newSelection = selectedIds.includes(orgId)
      ? selectedIds.filter((id) => id !== orgId)
      : [...selectedIds, orgId];
    
    onSelectionChange(newSelection);
  };

  const handleRemove = (orgId: string) => {
    if (isDisabled) return;
    onSelectionChange(selectedIds.filter((id) => id !== orgId));
  };

  const selectedOrganizations = useMemo(() => {
    return organizations.filter((org) => selectedIds.includes(org._id));
  }, [organizations, selectedIds]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>

      {/* Search Input */}
      {organizations.length > 5 && (
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations..."
            isDisabled={isDisabled}
            classNames={{
              inputWrapper: "border-gray-300 bg-white shadow-sm h-10",
              input: "text-sm placeholder:text-gray-400 pl-9",
            }}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            radius="lg"
            variant="bordered"
          />
        </div>
      )}

      {/* Selected Organizations Display */}
      {selectedOrganizations.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {selectedOrganizations.map((org) => (
            <Chip
              key={org._id}
              onClose={() => handleRemove(org._id)}
              variant="flat"
              color="primary"
              size="sm"
              isDisabled={isDisabled}
            >
              {org.name} ({org.type})
            </Chip>
          ))}
        </div>
      )}

      {/* Organization List */}
      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white">
        {filteredOrganizations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchQuery ? "No organizations found" : "No organizations available"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrganizations.map((org) => {
              const isSelected = selectedIds.includes(org._id);
              return (
                <button
                  key={org._id}
                  type="button"
                  onClick={() => handleToggle(org._id)}
                  disabled={isDisabled}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {org.type}
                        {org.code && ` • ${org.code}`}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}

      {/* Helper Text */}
      {selectedIds.length === 0 && !error && (
        <div className="text-xs text-gray-500">
          Select at least one organization
        </div>
      )}
    </div>
  );
}

