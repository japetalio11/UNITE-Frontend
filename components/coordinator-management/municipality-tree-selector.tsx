"use client";

import { useState, useMemo } from "react";
import { Input } from "@heroui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@heroui/checkbox";

interface Barangay {
  _id: string;
  name: string;
  code?: string;
  type: string;
  parent: string;
}

interface Municipality {
  _id: string;
  name: string;
  code?: string;
  type: string;
  parent?: string;
  districtId?: string;
  province?: string;
  barangays?: Barangay[];
}

interface MunicipalityTreeSelectorProps {
  municipalities: Municipality[];
  selectedMunicipalityIds: string[];
  selectedBarangayIds: string[];
  onMunicipalityChange: (ids: string[]) => void;
  onBarangayChange: (ids: string[]) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  error?: string;
  label?: string;
}

export default function MunicipalityTreeSelector({
  municipalities,
  selectedMunicipalityIds,
  selectedBarangayIds,
  onMunicipalityChange,
  onBarangayChange,
  isDisabled = false,
  isRequired = false,
  error,
  label = "Municipalities",
}: MunicipalityTreeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMunicipalities, setExpandedMunicipalities] = useState<Set<string>>(new Set());

  // Filter municipalities based on search query
  const filteredMunicipalities = useMemo(() => {
    if (!searchQuery.trim()) {
      return municipalities;
    }
    const query = searchQuery.toLowerCase();
    return municipalities.filter(
      (muni) =>
        muni.name.toLowerCase().includes(query) ||
        muni.code?.toLowerCase().includes(query) ||
        muni.barangays?.some((b) => b.name.toLowerCase().includes(query))
    );
  }, [municipalities, searchQuery]);

  const handleMunicipalityToggle = (municipalityId: string) => {
    if (isDisabled) return;
    
    const newSelection = selectedMunicipalityIds.includes(municipalityId)
      ? selectedMunicipalityIds.filter((id) => id !== municipalityId)
      : [...selectedMunicipalityIds, municipalityId];
    
    onMunicipalityChange(newSelection);
    
    // If deselecting municipality, also deselect all its barangays
    if (!newSelection.includes(municipalityId)) {
      const municipality = municipalities.find((m) => m._id === municipalityId);
      if (municipality?.barangays) {
        const barangayIdsToRemove = municipality.barangays.map((b) => b._id);
        onBarangayChange(
          selectedBarangayIds.filter((id) => !barangayIdsToRemove.includes(id))
        );
      }
    }
  };

  const handleBarangayToggle = (barangayId: string, municipalityId: string) => {
    if (isDisabled) return;
    
    // Ensure municipality is selected when selecting a barangay
    if (!selectedMunicipalityIds.includes(municipalityId)) {
      onMunicipalityChange([...selectedMunicipalityIds, municipalityId]);
    }
    
    const newSelection = selectedBarangayIds.includes(barangayId)
      ? selectedBarangayIds.filter((id) => id !== barangayId)
      : [...selectedBarangayIds, barangayId];
    
    onBarangayChange(newSelection);
  };

  const toggleExpanded = (municipalityId: string) => {
    if (isDisabled) return;
    const newExpanded = new Set(expandedMunicipalities);
    if (newExpanded.has(municipalityId)) {
      newExpanded.delete(municipalityId);
    } else {
      newExpanded.add(municipalityId);
    }
    setExpandedMunicipalities(newExpanded);
  };

  const selectedMunicipalities = useMemo(() => {
    return municipalities.filter((m) => selectedMunicipalityIds.includes(m._id));
  }, [municipalities, selectedMunicipalityIds]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>

      {/* Search Input */}
      {municipalities.length > 5 && (
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search municipalities or barangays..."
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

      {/* Selected Summary */}
      {selectedMunicipalities.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Selected: {selectedMunicipalities.length} municipality
            {selectedMunicipalities.length !== 1 ? "ies" : ""}
            {selectedBarangayIds.length > 0 && (
              <> • {selectedBarangayIds.length} barangay{selectedBarangayIds.length !== 1 ? "s" : ""}</>
            )}
          </div>
        </div>
      )}

      {/* Municipality Tree */}
      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-white">
        {filteredMunicipalities.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchQuery ? "No municipalities found" : "No municipalities available"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMunicipalities.map((municipality) => {
              const isMunicipalitySelected = selectedMunicipalityIds.includes(municipality._id);
              const hasBarangays = municipality.barangays && municipality.barangays.length > 0;
              const isExpanded = expandedMunicipalities.has(municipality._id);
              const selectedBarangaysInMuni = municipality.barangays?.filter((b) =>
                selectedBarangayIds.includes(b._id)
              ) || [];

              return (
                <div key={municipality._id}>
                  {/* Municipality Row */}
                  <div
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isMunicipalitySelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Expand/Collapse Button */}
                      {hasBarangays && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(municipality._id)}
                          disabled={isDisabled}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      )}
                      {!hasBarangays && <div className="w-5" />}

                      {/* Municipality Checkbox */}
                      <Checkbox
                        isSelected={isMunicipalitySelected}
                        onValueChange={() => handleMunicipalityToggle(municipality._id)}
                        isDisabled={isDisabled}
                        size="sm"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {municipality.name}
                          </div>
                          {municipality.code && (
                            <div className="text-xs text-gray-500">
                              {municipality.code}
                            </div>
                          )}
                        </div>
                      </Checkbox>
                    </div>
                  </div>

                  {/* Barangays (Nested) */}
                  {hasBarangays && isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {municipality.barangays!.map((barangay) => {
                        const isBarangaySelected = selectedBarangayIds.includes(barangay._id);
                        return (
                          <div
                            key={barangay._id}
                            className="px-4 py-2 pl-12 hover:bg-gray-100 transition-colors"
                          >
                            <Checkbox
                              isSelected={isBarangaySelected}
                              onValueChange={() =>
                                handleBarangayToggle(barangay._id, municipality._id)
                              }
                              isDisabled={isDisabled}
                              size="sm"
                            >
                              <div>
                                <div className="text-sm text-gray-700">
                                  {barangay.name}
                                </div>
                                {barangay.code && (
                                  <div className="text-xs text-gray-500">
                                    {barangay.code}
                                  </div>
                                )}
                              </div>
                            </Checkbox>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
      {selectedMunicipalityIds.length === 0 && !error && (
        <div className="text-xs text-gray-500">
          Select at least one municipality
        </div>
      )}
    </div>
  );
}

