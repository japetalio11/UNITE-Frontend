import { useState, useEffect, useCallback } from "react";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";

export interface Location {
  _id: string;
  name: string;
  type: "province" | "district" | "city" | "municipality" | "barangay" | "custom";
  code?: string;
  parent?: string | Location;
  level?: number;
  province?: string | Location;
  administrativeCode?: string;
  metadata?: {
    isCity?: boolean;
    isCombined?: boolean;
    operationalGroup?: string;
    custom?: Record<string, any>;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationTreeNode extends Location {
  children?: LocationTreeNode[];
}

/**
 * Custom hook for location (geographic unit) management
 * Handles all backend logic, API calls, and data transformations
 */
export function useLocations(isOpen: boolean) {
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [flat, setFlat] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Build tree structure from flat list
   */
  const buildTree = useCallback((locations: Location[]): LocationTreeNode[] => {
    const locationMap = new Map<string, LocationTreeNode>();
    const roots: LocationTreeNode[] = [];

    // First pass: create all nodes
    locations.forEach((loc) => {
      locationMap.set(loc._id, { ...loc, children: [] });
    });

    // Second pass: build parent-child relationships
    locations.forEach((loc) => {
      const node = locationMap.get(loc._id)!;
      const parentId = typeof loc.parent === "string" ? loc.parent : loc.parent?._id;

      if (parentId && locationMap.has(parentId)) {
        const parent = locationMap.get(parentId)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by name
    const sortChildren = (nodes: LocationTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children) {
          node.children.sort((a, b) => a.name.localeCompare(b.name));
          sortChildren(node.children);
        }
      });
    };

    sortChildren(roots);
    roots.sort((a, b) => a.name.localeCompare(b.name));

    return roots;
  }, []);

  /**
   * Load location tree from backend
   */
  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchJsonWithAuth("/api/locations/tree?includeInactive=true");

      if (response.success) {
        const treeData = response.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];
        setTree(treeData);
        
        // Flatten tree for easier access
        const flattenTree = (nodes: LocationTreeNode[]): Location[] => {
          const result: Location[] = [];
          nodes.forEach((node) => {
            result.push(node);
            if (node.children) {
              result.push(...flattenTree(node.children));
            }
          });
          return result;
        };
        setFlat(flattenTree(treeData));
      }
    } catch (error: any) {
      console.error("Failed to load location tree:", error);
      setError(error.message || "Failed to load locations");
      setTree([]);
      setFlat([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load flat list of locations
   */
  const loadFlat = useCallback(async (filters?: { type?: string; isActive?: boolean; search?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
      if (filters?.search) params.append("search", filters.search);
      
      const queryString = params.toString();
      const url = `/api/locations${queryString ? `?${queryString}` : ""}`;
      const response = await fetchJsonWithAuth(url);

      if (response.success) {
        const locations = response.data || [];
        setFlat(locations);
        setTree(buildTree(locations));
      }
    } catch (error: any) {
      console.error("Failed to load locations:", error);
      setError(error.message || "Failed to load locations");
      setFlat([]);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [buildTree]);

  /**
   * Get single location by ID
   */
  const getLocation = useCallback(async (locationId: string): Promise<Location | null> => {
    try {
      const response = await fetchJsonWithAuth(`/api/locations/${locationId}`);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error("Failed to get location:", error);
      throw error;
    }
  }, []);

  /**
   * Create a new location
   */
  const createLocation = useCallback(async (locationData: Omit<Location, "_id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null);
      const payload: any = {
        name: locationData.name,
        type: locationData.type,
        isActive: locationData.isActive ?? true,
      };

      if (locationData.parent) {
        payload.parentId = typeof locationData.parent === "string" ? locationData.parent : locationData.parent._id;
      }

      if (locationData.code) payload.code = locationData.code;
      if (locationData.administrativeCode) payload.administrativeCode = locationData.administrativeCode;
      if (locationData.metadata) payload.metadata = locationData.metadata;

      const response = await fetchJsonWithAuth("/api/locations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        await loadTree(); // Refresh tree
        return response.data;
      }
      throw new Error(response.message || "Failed to create location");
    } catch (error: any) {
      console.error("Failed to create location:", error);
      setError(error.message || "Failed to create location");
      throw error;
    }
  }, [loadTree]);

  /**
   * Update an existing location
   */
  const updateLocation = useCallback(async (locationId: string, updates: Partial<Location>) => {
    try {
      setError(null);
      const payload: any = {};

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.code !== undefined) payload.code = updates.code;
      if (updates.administrativeCode !== undefined) payload.administrativeCode = updates.administrativeCode;
      if (updates.isActive !== undefined) payload.isActive = updates.isActive;
      if (updates.metadata !== undefined) payload.metadata = updates.metadata;
      if (updates.parent !== undefined) {
        payload.parentId = typeof updates.parent === "string" ? updates.parent : updates.parent?._id || null;
      }

      const response = await fetchJsonWithAuth(`/api/locations/${locationId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        await loadTree(); // Refresh tree
        return response.data;
      }
      throw new Error(response.message || "Failed to update location");
    } catch (error: any) {
      console.error("Failed to update location:", error);
      setError(error.message || "Failed to update location");
      throw error;
    }
  }, [loadTree]);

  /**
   * Delete a location (soft delete)
   */
  const deleteLocation = useCallback(async (locationId: string) => {
    try {
      setError(null);
      const response = await fetchJsonWithAuth(`/api/locations/${locationId}`, {
        method: "DELETE",
      });

      if (response.success) {
        await loadTree(); // Refresh tree
        return true;
      }
      throw new Error(response.message || "Failed to delete location");
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      setError(error.message || "Failed to delete location");
      throw error;
    }
  }, [loadTree]);

  /**
   * Get location descendants
   */
  const getDescendants = useCallback(async (locationId: string, includeSelf = false): Promise<Location[]> => {
    try {
      const response = await fetchJsonWithAuth(
        `/api/locations/${locationId}/descendants?includeSelf=${includeSelf}&includeInactive=true`
      );
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error: any) {
      console.error("Failed to get descendants:", error);
      return [];
    }
  }, []);

  /**
   * Get location ancestors
   */
  const getAncestors = useCallback(async (locationId: string, includeSelf = false): Promise<Location[]> => {
    try {
      const response = await fetchJsonWithAuth(
        `/api/locations/${locationId}/ancestors?includeSelf=${includeSelf}&includeInactive=true`
      );
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error: any) {
      console.error("Failed to get ancestors:", error);
      return [];
    }
  }, []);

  /**
   * Check if location can be deleted (has no children, not in use)
   */
  const canDeleteLocation = useCallback(async (locationId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    try {
      const descendants = await getDescendants(locationId, false);
      if (descendants.length > 0) {
        return {
          canDelete: false,
          reason: `This location has ${descendants.length} child location(s). Delete children first or reassign them.`,
        };
      }

      // Check if used in coverage areas
      const coverageResponse = await fetchJsonWithAuth(`/api/geographic-units/${locationId}/coverage-areas`);
      if (coverageResponse.success && coverageResponse.data && coverageResponse.data.length > 0) {
        const activeCoverageAreas = coverageResponse.data.filter((ca: any) => ca.isActive);
        if (activeCoverageAreas.length > 0) {
          return {
            canDelete: false,
            reason: `This location is used in ${activeCoverageAreas.length} active coverage area(s). Remove it from coverage areas first.`,
          };
        }
      }

      return { canDelete: true };
    } catch (error: any) {
      console.error("Failed to check if location can be deleted:", error);
      return { canDelete: false, reason: "Unable to verify if location can be deleted" };
    }
  }, [getDescendants]);

  /**
   * Load locations when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen, loadTree]);

  return {
    tree,
    flat,
    loading,
    error,
    loadTree,
    loadFlat,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    getDescendants,
    getAncestors,
    canDeleteLocation,
    refreshLocations: loadTree,
  };
}

