/**
 * Calendar Event Data Transformation Utilities
 * 
 * Separates data transformation logic from UI rendering.
 * These utilities transform raw event data from the API into well-structured
 * props for the CalendarEventCard component.
 */

/**
 * Helper to extract ObjectId from various formats (Mongo Extended JSON)
 */
export const extractId = (val: any): string | null => {
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

/**
 * Parse server-provided dates robustly.
 * Handles various date formats including Mongo Extended JSON.
 */
export const parseServerDate = (raw: any): Date | null => {
  if (!raw && raw !== 0) return null;
  try {
    if (typeof raw === "string") {
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        return new Date(y, mo, d);
      }
      return new Date(raw);
    }
    if (typeof raw === "object" && raw.$date) {
      const d = raw.$date;
      if (typeof d === "object" && d.$numberLong)
        return new Date(Number(d.$numberLong));
      return new Date(d as any);
    }
    return new Date(raw as any);
  } catch (e) {
    return null;
  }
};

/**
 * Extract event owner/coordinator name from event data
 */
export const extractEventOwner = (
  event: any,
  detailedEvent: any | null
): string => {
  // Owner name — prioritize stakeholder over coordinator (match campaign card logic)
  const ownerName =
    detailedEvent?.stakeholder?.name ||
    detailedEvent?.coordinator?.name ||
    event.stakeholder?.name ||
    event.coordinator?.name ||
    detailedEvent?.createdByName ||
    event.MadeByStakeholderID ||
    event.MadeByCoordinatorID ||
    event.Email ||
    "Coordinator";

  if (process.env.NODE_ENV === "development") {
    console.log("[extractEventOwner] Extracted owner name:", {
      ownerName,
      hasDetailedEvent: !!detailedEvent,
      hasStakeholder: !!detailedEvent?.stakeholder,
      hasCoordinator: !!detailedEvent?.coordinator,
    });
  }

  return ownerName;
};

/**
 * Resolve location names from ObjectIds or backend-provided names
 */
export const resolveEventLocations = (
  event: any,
  detailedEvent: any | null,
  locationsProvider: {
    getProvinceName: (id: string) => string;
    getDistrictName: (id: string) => string;
    getMunicipalityName: (id: string) => string;
  }
): {
  province: string | null;
  district: string | null;
  municipality: string | null;
} => {
  // Extract location ObjectIds from event
  let provinceId = 
    extractId(detailedEvent?.province) || 
    extractId(event.province) || 
    null;

  let districtId = 
    extractId(detailedEvent?.district) || 
    extractId(event.district) || 
    null;

  let municipalityId = 
    extractId(detailedEvent?.municipality) || 
    extractId(event.municipality) || 
    null;

  // Resolve location names - prefer backend-provided names, fallback to provider
  let provinceName = 
    (typeof detailedEvent?.province === 'string' ? detailedEvent.province : null) ||
    (typeof event.province === 'string' ? event.province : null) ||
    (provinceId ? locationsProvider.getProvinceName(String(provinceId)) : null);

  let districtName = 
    (typeof detailedEvent?.district === 'string' ? detailedEvent.district : null) ||
    (typeof event.district === 'string' ? event.district : null) ||
    (districtId ? locationsProvider.getDistrictName(String(districtId)) : null);

  let municipalityName = 
    (typeof detailedEvent?.municipality === 'string' ? detailedEvent.municipality : null) ||
    (typeof event.municipality === 'string' ? event.municipality : null) ||
    (municipalityId ? locationsProvider.getMunicipalityName(String(municipalityId)) : null);

  // Fallback to null if resolution failed (will display as "-" in UI)
  provinceName = provinceName && provinceName !== "Unknown Province" ? provinceName : null;
  districtName = districtName && districtName !== "Unknown District" ? districtName : null;
  municipalityName = municipalityName && municipalityName !== "Unknown Municipality" ? municipalityName : null;

  if (process.env.NODE_ENV === "development") {
    console.log("[resolveEventLocations] Resolved locations:", {
      provinceId,
      districtId,
      municipalityId,
      provinceName,
      districtName,
      municipalityName,
    });
  }

  return {
    province: provinceName,
    district: districtName,
    municipality: municipalityName,
  };
};

/**
 * Extract category-specific data (participant count, target donation, etc.)
 */
export const extractCategoryData = (
  event: any,
  detailedEvent: any | null,
  category: string
): {
  countType: string;
  count: string;
} => {
  // Helper to find count values across shapes (main event or categoryData)
  // Backend returns categoryData directly on event, so check event.categoryData first
  const getVal = (keys: string[]) => {
    // First check basic event categoryData (backend returns it directly)
    if (event.categoryData) {
      for (const k of keys) {
        if (
          event.categoryData[k] !== undefined &&
          event.categoryData[k] !== null
        )
          return event.categoryData[k];
      }
    }
    // Then check detailed event categoryData
    if (detailedEvent?.categoryData) {
      for (const k of keys) {
        if (
          detailedEvent.categoryData[k] !== undefined &&
          detailedEvent.categoryData[k] !== null
        )
          return detailedEvent.categoryData[k];
      }
    }
    // Then check basic event data (direct properties)
    for (const k of keys) {
      if (event[k] !== undefined && event[k] !== null) return event[k];
    }
    // Finally check detailed event data (direct properties)
    for (const k of keys) {
      if (
        detailedEvent &&
        detailedEvent[k] !== undefined &&
        detailedEvent[k] !== null
      )
        return detailedEvent[k];
    }
    return undefined;
  };

  let countType = "";
  let count = "";
  
  const targetDonation = getVal([
    "Target_Donation",
    "TargetDonation",
    "Target_Donations",
  ]);
  const maxParticipants = getVal([
    "MaxParticipants",
    "Max_Participants",
    "MaxParticipant",
  ]);
  const expectedAudience = getVal([
    "ExpectedAudienceSize",
    "Expected_AudienceSize",
    "ExpectedAudience",
  ]);

  if (category === "blood-drive" && targetDonation !== undefined) {
    countType = "Goal Count";
    count = `${targetDonation} u.`;
  } else if (category === "training" && maxParticipants !== undefined) {
    countType = "Participant Count";
    count = `${maxParticipants} no.`;
  } else if (category === "advocacy" && expectedAudience !== undefined) {
    countType = "Audience Count";
    count = `${expectedAudience} no.`;
  } else {
    countType = "Details";
    count = "View event";
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[extractCategoryData] Extracted category data:", {
      category,
      countType,
      count,
      targetDonation,
      maxParticipants,
      expectedAudience,
      eventCategoryData: event.categoryData,
      detailedEventCategoryData: detailedEvent?.categoryData,
    });
  }

  return { countType, count };
};

/**
 * Determine event category type from raw category string
 */
export const determineEventCategory = (rawCategory: string): "blood-drive" | "training" | "advocacy" | "event" => {
  const rawCat = (rawCategory || "").toString().toLowerCase();
  
  if (rawCat.includes("blood")) return "blood-drive";
  else if (rawCat.includes("train")) return "training";
  else if (rawCat.includes("advoc")) return "advocacy";
  
  return "event";
};

/**
 * Get category color based on event type
 */
export const getCategoryColor = (category: "blood-drive" | "training" | "advocacy" | "event"): string => {
  if (category === "blood-drive") return "#ef4444";
  else if (category === "training") return "#f97316"; // orange-500
  else if (category === "advocacy") return "#3b82f6"; // blue-500
  
  return "#3b82f6"; // default blue
};

/**
 * Get category label for display
 */
export const getCategoryLabel = (category: "blood-drive" | "training" | "advocacy" | "event"): string => {
  const labels: Record<string, string> = {
    "blood-drive": "Blood Drive",
    "training": "Training",
    "advocacy": "Advocacy",
    "event": "Event",
  };
  return labels[category] || "Event";
};

/**
 * Transform raw event data into CalendarEventCardProps
 * 
 * This is the main transformation function that combines all utilities
 * to create a well-structured event object for the card component.
 */
export const transformEventData = (
  event: any,
  detailedEvent: any | null,
  locationsProvider: {
    getProvinceName: (id: string) => string;
    getDistrictName: (id: string) => string;
    getMunicipalityName: (id: string) => string;
  }
): {
  title: string;
  ownerName: string;
  startTime: string;
  endTime: string;
  category: "blood-drive" | "training" | "advocacy" | "event";
  province: string | null;
  district: string | null;
  municipality: string | null;
  location: string;
  countType: string;
  count: string;
  color: string;
  categoryLabel: string;
  rawEvent: any;
} => {
  // Parse start and end dates
  let start: Date | null = null;
  if (event.Start_Date || detailedEvent?.Start_Date) {
    try {
      const startDate = event.Start_Date || detailedEvent?.Start_Date;
      if (typeof startDate === "object" && startDate.$date) {
        const d = startDate.$date;
        if (typeof d === "object" && d.$numberLong)
          start = new Date(Number(d.$numberLong));
        else start = new Date(d as any);
      } else {
        start = parseServerDate(startDate);
      }
    } catch (err) {
      start = null;
    }
  }

  const startTime = start
    ? start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  let end: Date | null = null;
  if (event.End_Date || detailedEvent?.End_Date) {
    try {
      const endDate = event.End_Date || detailedEvent?.End_Date;
      if (typeof endDate === "object" && endDate.$date) {
        const d = endDate.$date;
        if (typeof d === "object" && d.$numberLong)
          end = new Date(Number(d.$numberLong));
        else end = new Date(d as any);
      } else {
        end = parseServerDate(endDate);
      }
    } catch (err) {
      end = null;
    }
  }
  const endTime = end
    ? end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  // Extract owner name
  const ownerName = extractEventOwner(event, detailedEvent);

  // Resolve locations
  const locations = resolveEventLocations(event, detailedEvent, locationsProvider);

  // Determine category - check event.category first (backend returns it directly)
  // Then fallback to event.Category, detailedEvent.category, etc.
  const rawCat = event.category || event.Category || detailedEvent?.category || detailedEvent?.Category || "";
  const category = determineEventCategory(rawCat);
  const categoryLabel = getCategoryLabel(category);

  // Debug logging for category resolution
  if (process.env.NODE_ENV === "development") {
    console.log("[transformEventData] Category resolution:", {
      rawCat,
      category,
      categoryLabel,
      eventCategory: event.category,
      eventCategoryCapital: event.Category,
      detailedEventCategory: detailedEvent?.category,
    });
  }

  // Extract category-specific data
  const categoryData = extractCategoryData(event, detailedEvent, category);

  // Extract event title
  const title = 
    detailedEvent?.Event_Title ||
    event.Event_Title ||
    event.Title ||
    event.title ||
    "Event Title";

  // Get location text
  const location =
    detailedEvent?.Location ||
    detailedEvent?.location ||
    event.Location ||
    event.location ||
    "Location to be determined";

  // Get color
  const color = getCategoryColor(category);

  if (process.env.NODE_ENV === "development") {
    console.log("[transformEventData] Transformed event:", {
      title,
      ownerName,
      startTime,
      endTime,
      category,
      locations,
      location,
      categoryData,
      color,
      hasDetailedEvent: !!detailedEvent,
    });
  }

  return {
    title,
    ownerName,
    startTime,
    endTime,
    category,
    province: locations.province,
    district: locations.district,
    municipality: locations.municipality,
    location,
    countType: categoryData.countType,
    count: categoryData.count,
    color,
    categoryLabel,
    rawEvent: event,
  };
};

