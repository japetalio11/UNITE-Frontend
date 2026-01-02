"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Magnifier as Search } from "@gravity-ui/icons";
import { Chip } from "@heroui/chip";
import { useCoverageAreas, CoverageArea, UserCoverageAssignment } from "@/hooks/useCoverageAreas";

interface AssignmentsSectionProps {
  isOpen: boolean;
}

export default function AssignmentsSection({ isOpen }: AssignmentsSectionProps) {
  const { coverageAreas, loading, getCoverageAreaUsers } = useCoverageAreas(isOpen);

  const [assignments, setAssignments] = useState<UserCoverageAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coverageAreaFilter, setCoverageAreaFilter] = useState<string | null>(null);

  // Load all assignments
  useEffect(() => {
    if (isOpen && coverageAreas.length > 0) {
      setAssignmentsLoading(true);
      Promise.all(
        coverageAreas.map(async (ca) => {
          const users = await getCoverageAreaUsers(ca._id);
          return users.map((assignment) => ({
            ...assignment,
            coverageArea: ca,
          }));
        })
      )
        .then((allAssignments) => {
          setAssignments(allAssignments.flat());
        })
        .finally(() => {
          setAssignmentsLoading(false);
        });
    }
  }, [isOpen, coverageAreas, getCoverageAreaUsers]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (searchQuery) {
        const user =
          typeof assignment.userId === "object"
            ? assignment.userId
            : { name: "", email: "" };
        const matchesSearch =
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
      }
      if (coverageAreaFilter) {
        const caId =
          typeof assignment.coverageAreaId === "string"
            ? assignment.coverageAreaId
            : assignment.coverageAreaId?._id;
        if (caId !== coverageAreaFilter) return false;
      }
      return true;
    });
  }, [assignments, searchQuery, coverageAreaFilter]);

  // Statistics
  const stats = useMemo(() => {
    const activeAssignments = assignments.filter((a) => a.isActive);
    const primaryAssignments = activeAssignments.filter((a) => a.isPrimary);
    const coverageAreasWithAssignments = new Set(
      activeAssignments.map((a) => {
        const caId =
          typeof a.coverageAreaId === "string" ? a.coverageAreaId : a.coverageAreaId?._id;
        return caId;
      })
    ).size;
    const unassignedCoverageAreas = coverageAreas.filter((ca) => {
      return !activeAssignments.some((a) => {
        const caId =
          typeof a.coverageAreaId === "string" ? a.coverageAreaId : a.coverageAreaId?._id;
        return caId === ca._id;
      });
    }).length;

    return {
      total: activeAssignments.length,
      primary: primaryAssignments.length,
      coverageAreasWithAssignments,
      unassignedCoverageAreas,
    };
  }, [assignments, coverageAreas]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">Assignments & Usage</h3>
        <p className="text-sm text-gray-500 mt-1">
          View which users are assigned to which coverage areas
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Assignments</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Primary Assignments</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.primary}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Coverage Areas with Assignments</p>
          <p className="text-2xl font-semibold text-gray-900">
            {stats.coverageAreasWithAssignments}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Unassigned Coverage Areas</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.unassignedCoverageAreas}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="h-4 w-4 text-gray-400" />}
          className="flex-1"
          size="sm"
        />
        <Select
          placeholder="Filter by coverage area"
          selectedKeys={coverageAreaFilter ? [coverageAreaFilter] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string | null;
            setCoverageAreaFilter(selected || null);
          }}
          className="w-full sm:w-64"
          size="sm"
        >
          <SelectItem key="all">
            All Coverage Areas
          </SelectItem>
          <>
            {coverageAreas.map((ca) => (
              <SelectItem key={ca._id}>
                {ca.name}
              </SelectItem>
            ))}
          </>
        </Select>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Coverage Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Primary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assigned Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignmentsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-500 mb-2">No assignments found.</p>
                    <p className="text-sm text-gray-400">
                      {searchQuery || coverageAreaFilter
                        ? "Try adjusting your filters."
                        : "No users are currently assigned to coverage areas."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => {
                  const user =
                    typeof assignment.userId === "object"
                      ? assignment.userId
                      : { _id: assignment.userId, name: "Unknown", email: "" };
                  const coverageArea =
                    typeof assignment.coverageAreaId === "object"
                      ? assignment.coverageAreaId
                      : coverageAreas.find((ca) => ca._id === assignment.coverageAreaId) ||
                        (assignment as any).coverageArea;

                  return (
                    <tr
                      key={assignment._id}
                      className={`hover:bg-gray-50 ${!assignment.isActive ? "opacity-60" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          {user.email && (
                            <p className="text-xs text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {coverageArea?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {assignment.isPrimary ? (
                          <Chip size="sm" variant="flat" color="primary">
                            Primary
                          </Chip>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={assignment.isActive ? "success" : "default"}
                        >
                          {assignment.isActive ? "Active" : "Inactive"}
                        </Chip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

