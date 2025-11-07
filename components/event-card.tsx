"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Calendar, MapIcon } from "lucide-react";

interface EventCardProps {
  title: string;
  organization: string;
  organizationType: string;
  district: string;
  category: string;
  status: "Approved" | "Pending" | "Rejected";
  location: string;
  date: string;
}

/**
 * EventCard Component
 * Displays summarized event details in a clean card layout.
 */
const EventCard: React.FC<EventCardProps> = ({
  title,
  organization,
  organizationType,
  district,
  category,
  status,
  location,
  date,
}) => {
  return (
    <Card className="w-full max-w-md rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      {/* Header Section */}
      <CardHeader className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar
            alt={organization}
            name={organization.charAt(0)}
            size="sm"
            className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white font-semibold"
          />
          <div>
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{organizationType}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{district}</p>
      </CardHeader>

      <Divider />

      {/* Body Section */}
      <CardBody>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Chip color="primary" variant="flat" size="sm">
            {category}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color={status === "Approved" ? "success" : status === "Pending" ? "warning" : "danger"}
          >
            {status}
          </Chip>
        </div>
      </CardBody>

      <Divider />

      {/* Footer Section */}
      <CardFooter className="flex flex-col items-start gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-gray-500" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{date}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
