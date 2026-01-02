"use client";

import React from "react";
import { Clock, EllipsisVertical as MoreVertical } from "@gravity-ui/icons";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";

/**
 * Props interface for CalendarEventCard component
 * Defines all required and optional fields for event card display
 */
export interface CalendarEventCardProps {
  // Required fields
  title: string;
  ownerName: string;
  startTime: string;
  category: "blood-drive" | "training" | "advocacy" | "event";
  rawEvent: any; // Raw event object for actions/modals
  
  // Optional fields with defaults
  endTime?: string;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  location?: string;
  countType?: string;
  count?: string;
  color?: string;
  
  // Event handlers
  onViewEvent?: (rawEvent: any) => void;
  onEditEvent?: (rawEvent: any) => void;
  onManageStaff?: (eventId: string) => void;
  onReschedule?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  
  // Menu builder function (from calendar page)
  getMenuByStatus?: (event: any) => React.ReactNode;
  
  // Category label mapping
  categoryLabel?: string;
  
  // Profile helpers
  getProfileInitial?: (name?: string) => string;
  getProfileColor?: (name?: string) => string;
}

/**
 * CalendarEventCard Component
 * 
 * A reusable event card component for displaying event information in calendar views.
 * Accepts well-structured props and handles all UI rendering logic.
 * 
 * @param props - CalendarEventCardProps with all event data and handlers
 */
const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  title,
  ownerName,
  startTime,
  endTime,
  category,
  province,
  district,
  municipality,
  location,
  countType,
  count,
  rawEvent,
  onViewEvent,
  onEditEvent,
  onManageStaff,
  onReschedule,
  onCancel,
  getMenuByStatus,
  categoryLabel,
  getProfileInitial = (name?: string) => {
    if (!name) return "U";
    const trimmed = String(name).trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "U";
  },
  getProfileColor = (name?: string) => {
    const s = (name || "unknown").toString();
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}deg 65% 40%)`;
  },
  color = "#3b82f6",
}) => {
  // Validate required props
  if (!title || !rawEvent) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3">
        <div className="text-xs text-gray-500">Invalid event data</div>
      </div>
    );
  }

  const displayTime = startTime || "—";
  const displayProvince = province || "-";
  const displayDistrict = district || "-";
  const displayMunicipality = municipality || "-";
  const displayLocation = location || "Location to be determined";
  const displayCountType = countType || "Details";
  const displayCount = count || "View event";
  const displayCategoryLabel = categoryLabel || category;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 hover:shadow-md active:shadow-sm transition-shadow touch-manipulation">
      {/* Three-dot menu */}
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-gray-900 text-xs leading-tight pr-2 line-clamp-2 flex-1">
          {title}
        </h4>
        {getMenuByStatus && (
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                aria-label="Event actions"
                className="hover:text-default-800 min-w-6 h-6 flex-shrink-0"
                size="sm"
                variant="light"
              >
                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </DropdownTrigger>
            {getMenuByStatus({ 
              raw: rawEvent, 
              title, 
              ownerName, 
              category, 
              province, 
              district, 
              municipality, 
              location, 
              countType, 
              count,
              coordinatorName: ownerName,
              type: category,
              time: startTime,
            })}
          </Dropdown>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-1 mb-2">
        <div
          className="h-4 w-4 sm:h-6 sm:w-6 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{
            backgroundColor: getProfileColor(ownerName),
          }}
        >
          <span className="text-white text-[10px] sm:text-xs">
            {getProfileInitial(ownerName)}
          </span>
        </div>
        <span className="text-[10px] sm:text-xs text-gray-600 truncate">
          {ownerName}
        </span>
      </div>

      {/* Time and Type Badges */}
      <div className="flex gap-2 mb-3">
        <div className="bg-gray-100 rounded px-2 py-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-700">
            {displayTime}
          </span>
        </div>
        <div className="bg-gray-100 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
          <span className="text-xs text-gray-700">
            {displayCategoryLabel}
          </span>
        </div>
      </div>

      {/* Province */}
      <div className="mb-1">
        <div className="text-xs font-medium text-gray-700 mb-0.5">
          Province
        </div>
        <div className="text-xs text-gray-600 line-clamp-1">
          {displayProvince}
        </div>
      </div>

      {/* District */}
      <div className="mb-1">
        <div className="text-xs font-medium text-gray-700 mb-0.5">
          District
        </div>
        <div className="text-xs text-gray-600 line-clamp-1">
          {displayDistrict}
        </div>
      </div>

      {/* Municipality */}
      <div className="mb-1">
        <div className="text-xs font-medium text-gray-700 mb-0.5">
          Municipality
        </div>
        <div className="text-xs text-gray-600 line-clamp-1">
          {displayMunicipality}
        </div>
      </div>

      {/* Location */}
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-700 mb-0.5">
          Location
        </div>
        <div className="text-xs text-gray-600 line-clamp-2">
          {displayLocation}
        </div>
      </div>

      {/* Count */}
      <div className="border-t border-gray-200 pt-1 sm:pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">
            {displayCountType}
          </span>
          <span className="text-sm sm:text-lg font-bold text-red-500">
            {displayCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventCard;

