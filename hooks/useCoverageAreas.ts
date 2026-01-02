import { useState, useEffect, useCallback } from "react";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";
import { Location } from "./useLocations";

export interface CoverageArea {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  geographicUnits: string[] | Location[];
  organizationId?: string | { _id: string; name: string; type: string };
  isActive: boolean;
  metadata?: {
    isDefault?: boolean;
    tags?: string[];
    custom?: Record<string, any>;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  _id: string;
  name: string;
  type: string;
  code?: string;
  isActive: boolean;
}

export interface UserCoverageAssignment {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  coverageAreaId: string | CoverageArea;
  isPrimary: boolean;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Custom hook for coverage area management
 * Handles all backend logic, API calls, and data transformations
 */
export function useCoverageAreas(isOpen: boolean) {
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all coverage areas with optional filters
   */
  const loadCoverageAreas = useCallback(async (filters?: {
    organizationId?: string;
    tags?: string[];
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.organizationId) params.append("organizationId", filters.organizationId);
      if (filters?.tags && filters.tags.length > 0) {
        filters.tags.forEach((tag) => params.append("tags", tag));
      }
      if (filters?.search) params.append("search", filters.search);
      if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));

      const queryString = params.toString();
      const url = `/api/coverage-areas${queryString ? `?${queryString}` : ""}`;
      const response = await fetchJsonWithAuth(url);

      if (response.success) {
        const data = response.data || {};
        setCoverageAreas(Array.isArray(data) ? data : data.coverageAreas || []);
      }
    } catch (error: any) {
      console.error("Failed to load coverage areas:", error);
      setError(error.message || "Failed to load coverage areas");
      setCoverageAreas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load all organizations
   */
  const loadOrganizations = useCallback(async () => {
    try {
      const response = await fetchJsonWithAuth("/api/organizations?isActive=true");
      if (response.success) {
        setOrganizations(response.data || []);
      }
    } catch (error: any) {
      console.error("Failed to load organizations:", error);
      // Don't set error state for organizations, just log it
    }
  }, []);

  /**
   * Get single coverage area by ID
   */
  const getCoverageArea = useCallback(async (coverageAreaId: string): Promise<CoverageArea | null> => {
    try {
      const response = await fetchJsonWithAuth(`/api/coverage-areas/${coverageAreaId}`);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error("Failed to get coverage area:", error);
      throw error;
    }
  }, []);

  /**
   * Create a new coverage area
   */
  const createCoverageArea = useCallback(async (coverageAreaData: Omit<CoverageArea, "_id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null);
      const payload: any = {
        name: coverageAreaData.name,
        geographicUnits: coverageAreaData.geographicUnits.map((unit) =>
          typeof unit === "string" ? unit : unit._id
        ),
        isActive: coverageAreaData.isActive ?? true,
      };

      if (coverageAreaData.description) payload.description = coverageAreaData.description;
      if (coverageAreaData.code) payload.code = coverageAreaData.code;
      if (coverageAreaData.organizationId) {
        payload.organizationId = typeof coverageAreaData.organizationId === "string"
          ? coverageAreaData.organizationId
          : coverageAreaData.organizationId._id;
      }
      if (coverageAreaData.metadata) payload.metadata = coverageAreaData.metadata;

      const response = await fetchJsonWithAuth("/api/coverage-areas", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        await loadCoverageAreas(); // Refresh list
        return response.data;
      }
      throw new Error(response.message || "Failed to create coverage area");
    } catch (error: any) {
      console.error("Failed to create coverage area:", error);
      setError(error.message || "Failed to create coverage area");
      throw error;
    }
  }, [loadCoverageAreas]);

  /**
   * Update an existing coverage area
   */
  const updateCoverageArea = useCallback(async (coverageAreaId: string, updates: Partial<CoverageArea>) => {
    try {
      setError(null);
      const payload: any = {};

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.code !== undefined) payload.code = updates.code;
      if (updates.isActive !== undefined) payload.isActive = updates.isActive;
      if (updates.metadata !== undefined) payload.metadata = updates.metadata;
      if (updates.organizationId !== undefined) {
        payload.organizationId = typeof updates.organizationId === "string"
          ? updates.organizationId
          : updates.organizationId?._id || null;
      }
      if (updates.geographicUnits !== undefined) {
        payload.geographicUnits = updates.geographicUnits.map((unit) =>
          typeof unit === "string" ? unit : unit._id
        );
      }

      const response = await fetchJsonWithAuth(`/api/coverage-areas/${coverageAreaId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        await loadCoverageAreas(); // Refresh list
        return response.data;
      }
      throw new Error(response.message || "Failed to update coverage area");
    } catch (error: any) {
      console.error("Failed to update coverage area:", error);
      setError(error.message || "Failed to update coverage area");
      throw error;
    }
  }, [loadCoverageAreas]);

  /**
   * Delete a coverage area (soft delete)
   */
  const deleteCoverageArea = useCallback(async (coverageAreaId: string) => {
    try {
      setError(null);
      const response = await fetchJsonWithAuth(`/api/coverage-areas/${coverageAreaId}`, {
        method: "DELETE",
      });

      if (response.success) {
        await loadCoverageAreas(); // Refresh list
        return true;
      }
      throw new Error(response.message || "Failed to delete coverage area");
    } catch (error: any) {
      console.error("Failed to delete coverage area:", error);
      setError(error.message || "Failed to delete coverage area");
      throw error;
    }
  }, [loadCoverageAreas]);

  /**
   * Get geographic units in a coverage area
   */
  const getCoverageAreaGeographicUnits = useCallback(async (coverageAreaId: string): Promise<Location[]> => {
    try {
      const response = await fetchJsonWithAuth(`/api/coverage-areas/${coverageAreaId}/geographic-units`);
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error: any) {
      console.error("Failed to get geographic units:", error);
      return [];
    }
  }, []);

  /**
   * Get users assigned to a coverage area
   */
  const getCoverageAreaUsers = useCallback(async (coverageAreaId: string): Promise<UserCoverageAssignment[]> => {
    try {
      const response = await fetchJsonWithAuth(`/api/coverage-areas/${coverageAreaId}/users`);
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error: any) {
      console.error("Failed to get coverage area users:", error);
      return [];
    }
  }, []);

  /**
   * Check if coverage area can be deleted
   */
  const canDeleteCoverageArea = useCallback(async (coverageAreaId: string): Promise<{ canDelete: boolean; reason?: string; userCount?: number }> => {
    try {
      const users = await getCoverageAreaUsers(coverageAreaId);
      const activeUsers = users.filter((u) => u.isActive);
      
      if (activeUsers.length > 0) {
        return {
          canDelete: false,
          reason: `This coverage area has ${activeUsers.length} user(s) assigned. Reassign users before deleting.`,
          userCount: activeUsers.length,
        };
      }

      return { canDelete: true };
    } catch (error: any) {
      console.error("Failed to check if coverage area can be deleted:", error);
      return { canDelete: false, reason: "Unable to verify if coverage area can be deleted" };
    }
  }, [getCoverageAreaUsers]);

  /**
   * Get coverage areas containing a specific geographic unit
   */
  const getCoverageAreasByGeographicUnit = useCallback(async (geographicUnitId: string): Promise<CoverageArea[]> => {
    try {
      const response = await fetchJsonWithAuth(`/api/geographic-units/${geographicUnitId}/coverage-areas`);
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (error: any) {
      console.error("Failed to get coverage areas by geographic unit:", error);
      return [];
    }
  }, []);

  /**
   * Load coverage areas and organizations when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadCoverageAreas();
      loadOrganizations();
    }
  }, [isOpen, loadCoverageAreas, loadOrganizations]);

  return {
    coverageAreas,
    organizations,
    loading,
    error,
    loadCoverageAreas,
    loadOrganizations,
    getCoverageArea,
    createCoverageArea,
    updateCoverageArea,
    deleteCoverageArea,
    getCoverageAreaGeographicUnits,
    getCoverageAreaUsers,
    canDeleteCoverageArea,
    getCoverageAreasByGeographicUnit,
    refreshCoverageAreas: loadCoverageAreas,
  };
}

