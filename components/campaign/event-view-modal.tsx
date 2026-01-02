"use client";
import React, { useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Persons, Droplet, Megaphone } from "@gravity-ui/icons";
import { useLocations } from "../providers/locations-provider";

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: any;
}

const safe = (v: any) => (v === undefined || v === null ? "" : String(v));

export const EventViewModal: React.FC<EventViewModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const { getProvinceName, getDistrictName, getMunicipalityName, locations } = useLocations();
  
  const event = request?.event || request || {};
  // category-specific document (Training/BloodDrive/Advocacy) attached by the backend
  const categoryData = request?.category || {};

  const title = event.Event_Title || event.title || "Untitled";
  const categoryRaw =
    event.Category || event.categoryType || event.category || "";
  const catKey = String(categoryRaw || "").toLowerCase();
  let category = "Event";

  if (catKey.includes("blood")) category = "Blood Drive";
  else if (catKey.includes("training")) category = "Training";
  else if (catKey.includes("advocacy")) category = "Advocacy";

  const location = event.Location || event.location || request?.Location || "";

  // Fix Event Date/Time Extraction - check multiple field paths
  const parseDate = (v: any): Date | null => {
    if (!v && v !== 0) return null;
    try {
      if (typeof v === "string" || typeof v === "number") {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof v === "object" && v !== null) {
        // Handle Mongo Extended JSON shapes
        if (v.$date) {
          const inner = v.$date.$numberLong || v.$date;
          const n = typeof inner === "string" ? Number(inner) : inner;
          const d = new Date(Number(n));
          if (!isNaN(d.getTime())) return d;
        }
        if (v.$numberLong) {
          const d = new Date(Number(v.$numberLong));
          if (!isNaN(d.getTime())) return d;
        }
      }
    } catch (e) {
      // fall through
    }
    return null;
  };

  // Check multiple paths for start date (including Date field for Mongo Extended JSON)
  const startRaw = 
    request?.Start_Date || 
    request?.Date || // Add Date field support (handles Mongo Extended JSON)
    request?.Start || 
    request?.StartTime ||
    event?.Start_Date || 
    event?.Date ||
    event?.Start ||
    event?.start || 
    "";

  // Check multiple paths for end date
  const endRaw = 
    request?.End_Date || 
    request?.End || 
    request?.EndTime ||
    event?.End_Date || 
    event?.End ||
    event?.end || 
    "";

  const startDateObj = parseDate(startRaw);
  const endDateObj = parseDate(endRaw);

  const formatDate = (d?: Date | null) => {
    if (!d) return "—";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  };

  const formatTime = (d?: Date | null) => {
    if (!d) return "";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  };

  const dateDisplay = startDateObj ? formatDate(startDateObj) : "—";
  const timeDisplay = startDateObj
    ? `${formatTime(startDateObj)}${endDateObj ? " - " + formatTime(endDateObj) : ""}`
    : "—";

  // Common variants for numeric / target fields used by different backends
  // Prefer values from the category document (categoryData) if present, otherwise fallback to event-level fields
  const participants =
    categoryData?.MaxParticipants ||
    categoryData?.Max_Participants ||
    categoryData?.numberOfParticipants ||
    categoryData?.ExpectedAudienceSize ||
    categoryData?.Expected_Audience_Size ||
    event.MaxParticipants ||
    event.Max_Participants ||
    event.numberOfParticipants ||
    event.expectedAudienceSize ||
    event.ExpectedAudienceSize ||
    event.Expected_Audience_Size ||
    "";
  const goal =
    categoryData?.Target_Donation ||
    categoryData?.TargetDonation ||
    categoryData?.Target_Donation_Count ||
    categoryData?.TargetDonationCount ||
    event.Target_Donation ||
    event.TargetDonation ||
    event.goalCount ||
    event.TargetDonationCount ||
    "";
  const audience =
    categoryData?.TargetAudience ||
    categoryData?.audienceType ||
    categoryData?.AudienceType ||
    categoryData?.ExpectedAudience ||
    event.TargetAudience ||
    event.audienceType ||
    event.AudienceType ||
    event.ExpectedAudience ||
    "";

  // Additional category-specific metadata (only those captured by creation modals)
  const trainingType =
    categoryData?.TrainingType ||
    categoryData?.trainingType ||
    categoryData?.Training_Type ||
    event.TrainingType ||
    event.trainingType ||
    event.Training_Type ||
    "";

  const description =
    event.Event_Description ||
    event.Description ||
    event.eventDescription ||
    event.description ||
    "";

  const contactEmail = event.Email || event.email || event.ContactEmail || "";
  const contactNumber =
    event.Phone_Number || event.PhoneNumber || event.contactNumber || "";

  // Fix Coordinator Display - check multiple field paths
  const coordinatorLabel = useMemo(() => {
    // New structure: assignedCoordinator
    if (request?.assignedCoordinator?.userId) {
      const coord = request.assignedCoordinator.userId;
      if (typeof coord === "object" && coord !== null) {
        // Populated User object
        return coord.fullName || 
               `${coord.firstName || ""} ${coord.lastName || ""}`.trim() ||
               coord.name ||
               "";
      }
    }

    // Populated coordinator object (from backend enrichment)
    if (request?.coordinator) {
      const coord = request.coordinator;
      // Check for populated staff object (legacy)
      if (coord.staff) {
        const s = coord.staff;
        const name = [s.First_Name, s.Middle_Name, s.Last_Name]
          .filter(Boolean)
          .join(" ");
        if (name) return name;
      }
      // Check for populated user object (new)
      if (coord.user) {
        const u = coord.user;
        return u.fullName || 
               `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
               u.name ||
               "";
      }
      // Direct name fields
      if (coord.fullName) return coord.fullName;
      if (coord.name) return coord.name;
      if (coord.firstName || coord.lastName) {
        return `${coord.firstName || ""} ${coord.lastName || ""}`.trim();
      }
    }

    // Reviewer may contain coordinator info
    if (request?.reviewer) {
      const reviewer = request.reviewer;
      if (reviewer.name) return reviewer.name;
      if (reviewer.userId && typeof reviewer.userId === "object") {
        const u = reviewer.userId;
        return u.fullName || 
               `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
               u.name ||
               "";
      }
    }

    // Legacy coordinator_id (fallback)
    if (request?.coordinator_id) {
      return safe(request.coordinator_id);
    }

    // Legacy MadeByStakeholderID (fallback)
    if (request?.MadeByStakeholderID) {
      return safe(request.MadeByStakeholderID);
    }

    return "—";
  }, [request]);

  // Helper to extract ObjectId from various formats
  const extractId = (val: any): string | null => {
    if (!val && val !== 0) return null;
    
    // Handle Mongo Extended JSON format: { "$oid": "..." }
    if (typeof val === "object" && val !== null) {
      if (val.$oid) {
        return String(val.$oid);
      }
      // Populated object with _id
      if (val._id) {
        // Handle nested _id that might also be in Mongo Extended JSON format
        if (typeof val._id === "object" && val._id.$oid) {
          return String(val._id.$oid);
        }
        return String(val._id);
      }
      // Direct ObjectId reference (try toString)
      if (val.toString && typeof val.toString === "function") {
        const str = val.toString();
        if (/^[a-f0-9]{24}$/i.test(str)) {
          return str;
        }
      }
    }
    
    // Handle string ObjectId
    if (typeof val === "string") {
      if (/^[a-f0-9]{24}$/i.test(val)) return val;
    }
    
    return null;
  };

  // Extract and resolve location fields with fallback to coordinator's coverage area
  const resolvedLocation = useMemo(() => {
    let provinceId = 
      extractId(request?.province?._id) || 
      extractId(request?.province) || 
      extractId(request?.location?.province?._id) || 
      extractId(request?.location?.province) ||
      extractId(event?.province?._id) ||
      extractId(event?.province) ||
      null;

    let districtId = 
      extractId(request?.district?._id) || 
      extractId(request?.district) || 
      extractId(request?.location?.district?._id) || 
      extractId(request?.location?.district) ||
      extractId(event?.district?._id) ||
      extractId(event?.district) ||
      null;

    let municipalityId = 
      extractId(request?.municipalityId?._id) || 
      extractId(request?.municipalityId) || 
      extractId(request?.municipality?._id) || 
      extractId(request?.municipality) || 
      extractId(request?.location?.municipality?._id) || 
      extractId(request?.location?.municipality) ||
      extractId(event?.municipality?._id) ||
      extractId(event?.municipality) ||
      null;

    // Fallback: If location is missing, try to derive from coordinator's coverage area
    if (!districtId || !provinceId) {
      // Check reviewer's location (if enriched by backend)
      const reviewer = request?.reviewer;
      if (reviewer) {
        const reviewerDistrictId = extractId(reviewer.district) || 
                                   extractId(reviewer.coverageArea?.districtIds?.[0]) ||
                                   extractId((reviewer as any)?.location?.district);
        const reviewerProvinceId = extractId(reviewer.province) ||
                                   extractId(reviewer.coverageArea?.province) ||
                                   extractId((reviewer as any)?.location?.province);

        if (!districtId && reviewerDistrictId) {
          districtId = reviewerDistrictId;
        }
        if (!provinceId && reviewerProvinceId) {
          provinceId = reviewerProvinceId;
        }

        // If we have reviewer userId, check if it's populated with location data
        if (reviewer.userId && typeof reviewer.userId === "object") {
          const coordUser = reviewer.userId as any;
          const coordDistrictId = extractId(coordUser.coverageAreas?.[0]?.districtIds?.[0]) ||
                                 extractId(coordUser.locations?.district);
          const coordProvinceId = extractId(coordUser.coverageAreas?.[0]?.province) ||
                                 extractId(coordUser.locations?.province);

          if (!districtId && coordDistrictId) {
            districtId = coordDistrictId;
          }
          if (!provinceId && coordProvinceId) {
            provinceId = coordProvinceId;
          }
        }
      }

      // Check assignedCoordinator (alternative field)
      const assignedCoord = request?.assignedCoordinator;
      if (assignedCoord) {
        const coordDistrictId = extractId(assignedCoord.district) ||
                               extractId(assignedCoord.coverageArea?.districtIds?.[0]);
        const coordProvinceId = extractId(assignedCoord.province) ||
                               extractId(assignedCoord.coverageArea?.province);

        if (!districtId && coordDistrictId) {
          districtId = coordDistrictId;
        }
        if (!provinceId && coordProvinceId) {
          provinceId = coordProvinceId;
        }

        // Check if userId is populated
        if (assignedCoord.userId && typeof assignedCoord.userId === "object") {
          const coordUser = assignedCoord.userId as any;
          const coordDistrictId = extractId(coordUser.coverageAreas?.[0]?.districtIds?.[0]) ||
                                 extractId(coordUser.locations?.district);
          const coordProvinceId = extractId(coordUser.coverageAreas?.[0]?.province) ||
                                 extractId(coordUser.locations?.province);

          if (!districtId && coordDistrictId) {
            districtId = coordDistrictId;
          }
          if (!provinceId && coordProvinceId) {
            provinceId = coordProvinceId;
          }
        }
      }

      // Last fallback: Check requester's location
      if (!districtId || !provinceId) {
        const requester = request?.requester;
        if (requester?.userId && typeof requester.userId === "object") {
          const reqUser = requester.userId as any;
          const reqDistrictId = extractId(reqUser.locations?.municipalityId) ||
                               extractId(reqUser.coverageAreas?.[0]?.districtIds?.[0]);
          const reqProvinceId = extractId(reqUser.locations?.province) ||
                               extractId(reqUser.coverageAreas?.[0]?.province);

          if (!districtId && reqDistrictId) {
            districtId = reqDistrictId;
          }
          if (!provinceId && reqProvinceId) {
            provinceId = reqProvinceId;
          }
        }
      }
    }

    // If district is available but province is not, try to get province from district
    let finalProvinceId = provinceId;
    if (districtId && !finalProvinceId) {
      // Try to find district in the locations cache to get its province
      const districtObj = Object.values(locations.districts).find(
        (d: any) => String(d._id) === String(districtId)
      );
      if (districtObj) {
        if (districtObj.province) {
          finalProvinceId = String(districtObj.province);
        }
        // If district is found in cache but no province, try to get from parent
        if (!finalProvinceId && (districtObj as any).parent) {
          const parentLocation = Object.values(locations.provinces).find(
            (p: any) => String(p._id) === String((districtObj as any).parent)
          ) || Object.values(locations.districts).find(
            (d: any) => String(d._id) === String((districtObj as any).parent)
          );
          if (parentLocation && (parentLocation as any).type === 'province') {
            finalProvinceId = String(parentLocation._id);
          }
        }
      }
    }

    // Resolve location names - prefer backend-provided names, fallback to provider
    let provinceName = request?.provinceName || 
      (request?.province?.name) || 
      (finalProvinceId ? getProvinceName(String(finalProvinceId)) : null);
    let districtName = request?.districtName || 
      (request?.district?.name) || 
      (districtId ? getDistrictName(String(districtId)) : null);
    let municipalityName = request?.municipalityName || 
      (request?.municipalityId?.name) || 
      (municipalityId ? getMunicipalityName(String(municipalityId)) : null);

    // If resolution failed, try to find directly in the cache
    
    if (districtId && (!districtName || districtName === "Unknown District")) {
      const districtObj = Object.values(locations.districts).find(
        (d: any) => String(d._id) === String(districtId)
      );
      if (districtObj && districtObj.name) {
        districtName = districtObj.name;
      }
    }

    if (finalProvinceId && (!provinceName || provinceName === "Unknown Province")) {
      const provinceObj = Object.values(locations.provinces).find(
        (p: any) => String(p._id) === String(finalProvinceId)
      );
      if (provinceObj && provinceObj.name) {
        provinceName = provinceObj.name;
      }
    }

    if (municipalityId && (!municipalityName || municipalityName === "Unknown Municipality")) {
      const municipalityObj = Object.values(locations.municipalities).find(
        (m: any) => String(m._id) === String(municipalityId)
      );
      if (municipalityObj && municipalityObj.name) {
        municipalityName = municipalityObj.name;
      }
    }

    return {
      province: provinceName && provinceName !== "Unknown Province" ? provinceName : "—",
      district: districtName && districtName !== "Unknown District" ? districtName : "—",
      municipality: municipalityName && municipalityName !== "Unknown Municipality" ? municipalityName : "—",
    };
  }, [request, event, getProvinceName, getDistrictName, getMunicipalityName, locations]);

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
      className="z-[1100000]"
      classNames={{
        wrapper: "z-[1100000]",
        backdrop: "z-[1050000] bg-black/40"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Avatar
              className="bg-default-100 border-1 border-default"
              icon={
                category === "Blood Drive" ? (
                  <Droplet />
                ) : category === "Advocacy" ? (
                  <Megaphone />
                ) : (
                  <Persons />
                )
              }
            />
          </div>
          <h3 className="text-sm font-semibold py-2">{title}</h3>
          <div className="flex items-center">
            <Chip
              classNames={{ content: "text-xs font-medium" }}
              radius="sm"
              size="sm"
              variant="flat"
            >
              {category}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody className="py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-medium">Coordinator</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={coordinatorLabel}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Location</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={location || "—"}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Province</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={resolvedLocation.province}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">District</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={resolvedLocation.district}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Municipality</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={resolvedLocation.municipality}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Date</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={dateDisplay}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Time</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={timeDisplay}
                variant="bordered"
              />
            </div>

            {/* Dynamic fields: show relevant metadata per category */}
            {category === "Training" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Type of training
                  </label>
                  <Input
                    disabled
                    classNames={{
                      inputWrapper: "border-default-200 h-9 bg-default-100",
                    }}
                    radius="md"
                    size="sm"
                    value={trainingType || ""}
                    variant="bordered"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Max participants
                  </label>
                  <Input
                    disabled
                    classNames={{
                      inputWrapper: "border-default-200 h-9 bg-default-100",
                    }}
                    radius="md"
                    size="sm"
                    value={safe(participants)}
                    variant="bordered"
                  />
                </div>
              </>
            )}

            {category === "Blood Drive" && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Target donation</label>
                <Input
                  disabled
                  classNames={{
                    inputWrapper: "border-default-200 h-9 bg-default-100",
                  }}
                  radius="md"
                  size="sm"
                  value={safe(goal)}
                  variant="bordered"
                />
              </div>
            )}

            {category === "Advocacy" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Target audience</label>
                  <Input
                    disabled
                    classNames={{
                      inputWrapper: "border-default-200 h-9 bg-default-100",
                    }}
                    radius="md"
                    size="sm"
                    value={audience || ""}
                    variant="bordered"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Target number</label>
                  <Input
                    disabled
                    classNames={{
                      inputWrapper: "border-default-200 h-9 bg-default-100",
                    }}
                    radius="md"
                    size="sm"
                    value={safe(participants)}
                    variant="bordered"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium">Contact Email</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={contactEmail}
                variant="bordered"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Contact Number</label>
              <Input
                disabled
                classNames={{
                  inputWrapper: "border-default-200 h-9 bg-default-100",
                }}
                radius="md"
                size="sm"
                value={contactNumber}
                variant="bordered"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                disabled
                classNames={{
                  inputWrapper: "border-default-200 bg-default-100",
                }}
                minRows={4}
                radius="md"
                size="sm"
                value={description}
                variant="bordered"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button className="font-medium" variant="bordered" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventViewModal;