"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { getUserInfo } from "../../../utils/getUserInfo";
import { debug, warn } from "../../../utils/devLogger";
import { listStakeholders, deleteStakeholder } from "@/services/stakeholderService";
import { useStakeholderManagement } from "@/hooks/useStakeholderManagement";

import Topbar from "@/components/layout/topbar";
import StakeholderToolbar from "@/components/stakeholder-management/stakeholder-management-toolbar";
import StakeholderTable from "@/components/stakeholder-management/stakeholder-management-table";
import AddStakeholderModal from "@/components/stakeholder-management/add-stakeholder-modal";
import QuickFilterModal from "@/components/stakeholder-management/quick-filter-modal";
import AdvancedFilterModal from "@/components/stakeholder-management/advanced-filter-modal";
import EditStakeholderModal from "@/components/stakeholder-management/stakeholder-edit-modal";
import DeleteStakeholderModal from "@/components/stakeholder-management/delete-stakeholder-modal";
import {
  Ticket,
  Calendar as CalIcon,
  PersonPlanetEarth,
  Persons,
  Bell,
  Gear,
  Comments,
} from "@gravity-ui/icons";
import MobileNav from "@/components/tools/mobile-nav";
// Removed verbose debug logging from this page per request

interface StakeholderFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  stakeholderName?: string;
  stakeholderEmail: string;
  contactNumber: string;
  password: string;
  retypePassword: string;
  province: string;
  district: string;
  districtId?: string;
  cityMunicipality?: string;
}

export default function StakeholderManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>(
    [],
  );
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [signupRequests, setSignupRequests] = useState<any[]>([]);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    province?: string;
    districtId?: string;
  }>({});
  const [openQuickFilter, setOpenQuickFilter] = useState(false);
  const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<any | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStakeholder, setDeletingStakeholder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // map of District_ID -> district object to resolve province and formatted district
  const [districtsMap, setDistrictsMap] = useState<Record<string, any> | null>(
    null,
  );
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [provincesList, setProvincesList] = useState<any[]>([]);
  const [provincesMap, setProvincesMap] = useState<Record<string, string>>({});
  const [municipalityCache, setMunicipalityCache] = useState<
    Record<string, string>
  >({});
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Do not call getUserInfo() synchronously — read it on mount so server and client
  // produce the same initial HTML; update user-derived state after hydration.
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState("Bicol Medical Center");
  const [displayEmail, setDisplayEmail] = useState("bmc@gmail.com");
  const [canManageStakeholders, setCanManageStakeholders] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  // Use stakeholder management hook for business logic
  const { isSystemAdmin } = useStakeholderManagement();
  // Add Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Or whatever size you prefer

  // Mobile navigation state (handled by MobileNav component)
  const [isMobile, setIsMobile] = useState(false);

  // Reset to page 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTab, filters]);

  // 1. Determine the source data based on the selected tab
  const rawData = useMemo(() => {
  // 1. PENDING TAB: Return signup requests directly
  if (selectedTab === "pending") {
    return signupRequests;
  }

  // 2. APPROVED TAB: Return all stakeholders (approved means not pending)
  if (selectedTab === "approved") {
    return stakeholders;
  }

  // 3. ALL TAB: Combine both approved stakeholders and pending signup requests
  // Mark stakeholders as approved and signup requests as pending
  const approvedItems = stakeholders.map((s: any) => ({ ...s, _isRequest: false }));
  const pendingItems = signupRequests.map((r: any) => ({ ...r, _isRequest: true }));
  return [...approvedItems, ...pendingItems]; 
}, [selectedTab, signupRequests, stakeholders]);

  // 2. Apply Search Filtering (Lifted from Table)
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return rawData;

    return rawData.filter((coordinator: any) => {
      return (
        (coordinator.name || "").toLowerCase().includes(q) ||
        (coordinator.email || "").toLowerCase().includes(q) ||
        (coordinator.organization || coordinator.entity || "").toLowerCase().includes(q) ||
        (coordinator.province || "").toLowerCase().includes(q) ||
        (coordinator.district || "").toLowerCase().includes(q) ||
        (
          (municipalityCache && municipalityCache[String(coordinator.municipality)]) ||
          coordinator.municipality ||
          ""
        ).toLowerCase().includes(q)
      );
    });
  }, [rawData, searchQuery, municipalityCache]);

  // 3. Calculate Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);
  const router = useRouter();

  const ordinalSuffix = (n: number | string) => {
    const num = Number(n);

    if (Number.isNaN(num)) return String(n);
    const j = num % 10,
      k = num % 100;

    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;

    return `${num}th`;
  };

  const formatDistrict = (districtObj: any) => {
    if (!districtObj) return "";
    // Support both legacy and new district shapes
    if (districtObj.District_Number)
      return `${ordinalSuffix(districtObj.District_Number)} District`;
    if (districtObj.District_Name) return districtObj.District_Name;
    if (districtObj.name) return districtObj.name;
    if (districtObj.District_Name) return districtObj.District_Name;

    return "";
  };

  const updateStakeholderNames = () => {
    setStakeholders(prev => prev.map(s => {
      let districtObj = s.District || s.District_Details || null;

      if (!districtObj && districtsMap && (s.District_ID || s.DistrictId)) {
        districtObj = districtsMap[String(s.District_ID || s.DistrictId)] || null;
      }

      let newProvince = "";
      if (s.Province_Name) newProvince = s.Province_Name;
      else if (districtObj && districtObj.province) {
        if (typeof districtObj.province === "string" || typeof districtObj.province === "number") {
          newProvince = provincesMap[String(districtObj.province)] || "";
        } else if (districtObj.province && (districtObj.province.name || districtObj.province.Province_Name)) {
          newProvince = districtObj.province.name || districtObj.province.Province_Name || "";
        }
      }
      if (!newProvince && s.province) {
        newProvince = provincesMap[String(s.province)] || "";
      }

      let newDistrict = "";
      if (districtObj) {
        newDistrict = formatDistrict(districtObj);
      } else if (s.District_Name) {
        newDistrict = s.District_Name;
      } else if (s.District_ID || s.district) {
        const idCandidate = s.District_ID || s.district;
        const m = String(idCandidate).match(/(\d+)$/);

        if (m) {
          const num = Number(m[1]);

          if (!Number.isNaN(num))
            newDistrict = `${ordinalSuffix(num)} District`;
        } else {
          newDistrict = String(idCandidate);
        }
      }

      return {
        ...s,
        province: newProvince || s.province,
        district: newDistrict || s.district,
      };
    }));
  };

  // Detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    if (typeof window !== "undefined") {
      checkViewport();
      window.addEventListener("resize", checkViewport);
      return () => window.removeEventListener("resize", checkViewport);
    }
  }, []);

  // Permission-based access check using backend API
  useEffect(() => {
    const checkPageAccess = async () => {
      try {
        const info = getUserInfo();
        setUserInfo(info);
        
        // Check page access via backend API
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("unite_token") ||
              sessionStorage.getItem("unite_token")
            : null;

        if (!token) {
          router.replace('/auth/signin');
          return;
        }

        const url = base
          ? `${base}/api/pages/check/stakeholder-management`
          : `/api/pages/check/stakeholder-management`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.canAccess) {
          setCanManageStakeholders(true);
          setDisplayName(info?.displayName || info?.raw?.First_Name || "Bicol Medical Center");
          setDisplayEmail(info?.email || info?.raw?.Email || "bmc@gmail.com");
          
          // Access is now permission-based, no need for account type logic
        } else {
          // Access denied - redirect to error page
          setCanManageStakeholders(false);
          try {
            router.replace('/error');
          } catch (e) {
            /* ignore navigation errors */
          }
        }
      } catch (e) {
        console.error('Error checking page access:', e);
        // On error, deny access for security
        setCanManageStakeholders(false);
        try {
          router.replace('/error');
        } catch (err) {
          /* ignore navigation errors */
        }
      } finally {
        setCheckingAccess(false);
      }
    };

    checkPageAccess();
  }, [router]);


  // Load districts once so we can resolve District_ID -> friendly names and province
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const url = base
          ? `${base}/api/districts?limit=1000`
          : `/api/districts?limit=1000`;
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("unite_token") ||
              sessionStorage.getItem("unite_token")
            : null;
        const headers: any = {};

        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(url, { headers });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;

        if (!res.ok) return;
        const items = json.data || [];
        const map: Record<string, any> = {};

        for (const d of items) {
          // Support legacy and new shapes: prefer legacy District_ID, but also index by _id
          if (d.District_ID) map[String(d.District_ID)] = d;
          if (d._id) map[String(d._id)] = d;
        }
        setDistrictsMap(map);
        setDistrictsList(items);
      } catch (e) {
        // ignore district load errors
      }
    };

    loadDistricts();
  }, []);

  // Load provinces so we can resolve province ObjectIds to human-friendly names
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        const url = base
          ? `${base}/api/locations/provinces`
          : `/api/locations/provinces`;
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("unite_token") ||
              sessionStorage.getItem("unite_token")
            : null;
        const headers: any = {};

        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(url, { headers });

        if (!res.ok) return;
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        const items = (json && (json.data || json.provinces)) || [];

        setProvincesList(items || []);
        const pm: Record<string, string> = {};

        for (const p of items || []) {
          if (p._id)
            pm[String(p._id)] =
              p.name || p.Province_Name || p.Name || String(p._id);
          if (p.id)
            pm[String(p.id)] =
              p.name || p.Province_Name || p.Name || String(p.id);
        }
        setProvincesMap(pm);
      } catch (e) {
        // ignore
      }
    };

    loadProvinces();
  }, []);

  // Update stakeholder names when provinces are loaded
  useEffect(() => {
    if (provincesMap) {
      updateStakeholderNames();
    }
  }, [provincesMap]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserClick = () => {
    debug("User profile clicked");
  };

  const handleExport = () => {
    debug("Exporting data...");
  };

  // generate-code functionality removed from toolbar per new design

  const handleQuickFilter = () => {
    setOpenQuickFilter(true);
  };

  const handleAdvancedFilter = () => {
    setOpenAdvancedFilter(true);
  };

  const handleAddStakeholder = () => {
    // Recompute user district id at the moment of opening the modal to ensure we capture
    // the latest stored user shape (some sessions store different key names).
    try {
      let uid: any = null;
      let parsed: any = null;

      // First, use getUserInfo() which centralizes parsing logic
      try {
        const info = getUserInfo();

        if (info && info.raw) {
          const r = info.raw;

          uid =
            r?.District_ID ||
            r?.DistrictId ||
            r?.districtId ||
            r?.district_id ||
            null;
        }
      } catch (e) {
        /* ignore */
      }

      // If still not found, try reading from localStorage / sessionStorage variants
      if (!uid) {
        try {
          const raw =
            localStorage.getItem("unite_user") ||
            sessionStorage.getItem("unite_user");

          parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
          parsed = null;
        }

        const searchPaths = [
          parsed,
          parsed?.user,
          parsed?.data,
          parsed?.staff,
          parsed?.profile,
          parsed?.User,
          parsed?.result,
          parsed?.userInfo,
        ];

        for (const p of searchPaths) {
          if (!p) continue;
          if (p.District_ID) {
            uid = p.District_ID;
            break;
          }
          if (p.DistrictId) {
            uid = p.DistrictId;
            break;
          }
          if (p.districtId) {
            uid = p.districtId;
            break;
          }
          if (p.district_id) {
            uid = p.district_id;
            break;
          }
          if (
            p.District &&
            (p.District.District_ID ||
              p.District.DistrictId ||
              p.District.districtId ||
              p.District.district_id)
          ) {
            uid =
              p.District.District_ID ||
              p.District.DistrictId ||
              p.District.districtId ||
              p.District.district_id;
            break;
          }
          if (
            p.district &&
            (p.district.District_ID ||
              p.district.DistrictId ||
              p.district.districtId ||
              p.district.district_id)
          ) {
            uid =
              p.district.District_ID ||
              p.district.DistrictId ||
              p.district.districtId ||
              p.district.district_id;
            break;
          }
          if (
            p.role_data &&
            (p.role_data.district_id ||
              p.role_data.districtId ||
              p.role_data.district)
          ) {
            uid =
              p.role_data.district_id ||
              p.role_data.districtId ||
              p.role_data.district;
            break;
          }
          if (
            p.user &&
            (p.user.District_ID ||
              p.user.DistrictId ||
              p.user.districtId ||
              p.user.district_id)
          ) {
            uid =
              p.user.District_ID ||
              p.user.DistrictId ||
              p.user.districtId ||
              p.user.district_id;
            break;
          }
        }
      }

      setUserDistrictId(uid || null);
      setOpenUserDistrictId(uid || null);
      // Include both centralized getUserInfo and raw parsed object for diagnostics
      let infoForDebug = null;

      try {
        infoForDebug = getUserInfo();
      } catch (e) {
        infoForDebug = null;
      }
      debug(
        "[StakeholderManagement] handleAddStakeholder getUserInfo():",
        infoForDebug,
      );
      debug(
        "[StakeholderManagement] handleAddStakeholder parsed fallback object:",
        parsed,
      );
      debug(
        "[StakeholderManagement] handleAddStakeholder computed userDistrictId:",
        uid,
      );
    } catch (e) {
      // ignore
    }
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setOpenUserDistrictId(null);
  };

  const handleCodeCreated = (code: any) => {
    // kept for compatibility; generate-code modal removed from toolbar
  };

  const handleModalSubmit = async (data: any) => {
    setModalError(null);
    setIsCreating(true);
    try {
      // Use stakeholderService to create stakeholder
      const { createStakeholder } = await import("@/services/stakeholderService");
      await createStakeholder(data);
      
      setLoading(true);
      setError(null);
      try {
        await fetchStakeholders();
      } catch (e) {
        /* ignore */
      } finally {
        setLoading(false);
      }

      setIsAddModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || "Failed to create stakeholder");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStakeholders(stakeholders.map((c) => c.id));
    } else {
      setSelectedStakeholders([]);
    }
  };

  const handleSelectStakeholder = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStakeholders([...selectedStakeholders, id]);
    } else {
      setSelectedStakeholders(selectedStakeholders.filter((cId) => cId !== id));
    }
  };

  const handleActionClick = (id: string) => {
    // action handler
  };

  const handleUpdateStakeholder = (id: string) => {
    // Find stakeholder from current list
    const stakeholder = stakeholders.find((s: any) => s.id === id || s._id === id);
    if (stakeholder) {
      setEditingStakeholder(stakeholder);
      setIsEditModalOpen(true);
    }
  };

  // Instead of immediate delete, show confirm modal that requires typing full name
  const handleDeleteStakeholder = (id: string, name?: string) => {
    setDeletingStakeholder({ id, name: name || "" });
    setIsDeleteModalOpen(true);
  };

  // Confirm delete stakeholder
  const confirmDeleteStakeholder = async (id: string) => {
    try {
      setLoading(true);
      // Use centralized stakeholderService delete helper which calls DELETE /api/users/:id
      const resp = await deleteStakeholder(id);
      if (!resp || !resp.success) {
        throw new Error(resp?.message || 'Failed to delete stakeholder');
      }
      // Reload both stakeholders and signup requests
      await Promise.all([fetchStakeholders(), fetchSignupRequests()]);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch stakeholders from backend using capability-based endpoint
  const fetchStakeholders = async (appliedFilters?: {
    province?: string;
    districtId?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      // Build filters for capability-based endpoint
      const af = appliedFilters || filters || {};
      const apiFilters: any = {
        isActive: true,
      };

      // Add organization type filter if specified
      if (af.organizationType) {
        apiFilters.organizationType = String(af.organizationType);
      }

      // Use capability-based endpoint to get users with request.review permission
      const response = await listStakeholders(apiFilters);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch stakeholders");
      }

      // Transform response data to match expected format
      let items = response.data || [];

      // Defensive client-side filter: remove any users that are system admins or coordinators
      // (server should already enforce this, but double-check on client for safety)
      items = items.filter((s: any) => {
        if (s.isSystemAdmin) return false;
        const roles = s.roles || s.Roles || s.rolesAssigned || null;
        if (Array.isArray(roles)) {
          for (const r of roles) {
            const code = (r.code || r.code?.toLowerCase?.() || r || '').toString().toLowerCase();
            if (code === 'coordinator' || code === 'system-admin' || code === 'system_admin') return false;
          }
        }
        return true;
      });
      
      // Map users to stakeholder format
      const mapped = items.map((s: any) => {
        // Build full name supporting both legacy (First_Name) and normalized (firstName) keys
        const fullName = [
          s.First_Name || s.firstName,
          s.Middle_Name || s.middleName,
          s.Last_Name || s.lastName,
        ]
          .filter(Boolean)
          .join(" ");
        // Prefer a populated District object when available
        let districtObj = s.District || s.District_Details || null;

        // If not populated, try to resolve from prefetched districtsMap using District_ID
        if (!districtObj && districtsMap && (s.District_ID || s.DistrictId)) {
          districtObj =
            districtsMap[String(s.District_ID || s.DistrictId)] || null;
        }

        // If still not populated, try to resolve using the districtsList by matching
        // against known id fields (DB _id, id, or District_ID). This covers cases
        // where the backend returns `district` as an ObjectId reference instead
        // of a populated object or a legacy District_ID string.
        if (
          !districtObj &&
          Array.isArray(districtsList) &&
          districtsList.length > 0
        ) {
          const candidate = districtsList.find((d: any) => {
            const sid =
              s.district ||
              s.district_id ||
              s.districtId ||
              s.District_ID ||
              s.DistrictId ||
              s.District;

            if (!sid) return false;

            return (
              String(d._id) === String(sid) ||
              String(d.id) === String(sid) ||
              String(d.District_ID) === String(sid) ||
              String(d.District_ID) === String(s.District_ID)
            );
          });

          if (candidate) districtObj = candidate;
        }
        // Compute province display: prefer explicit Province_Name, else use populated province
        let province = s.Province_Name || s.province?.name || "";

        let districtDisplay = "";

        if (s.district?.name) {
          districtDisplay = s.district.name;
        } else if (districtObj) {
          districtDisplay = formatDistrict(districtObj);
        } else if (s.District_Name) {
          districtDisplay = s.District_Name;
        } else if (s.District_ID || s.district) {
          // fallback: try to infer number from District_ID like CSUR-001 -> 1
          const idCandidate = s.District_ID || s.district;
          const m = String(idCandidate).match(/(\d+)$/);

          if (m) {
            const num = Number(m[1]);

            if (!Number.isNaN(num))
              districtDisplay = `${ordinalSuffix(num)} District`;
          } else {
            districtDisplay = String(idCandidate);
          }
        }

        return {
          id: s.Stakeholder_ID || s.id || "",
          name: fullName,
          email: s.Email || s.email || "",
          phone: s.Phone_Number || s.phoneNumber || s.phone || "",
          province: province || "",
          municipality:
            s.municipality?.name ||
            s.City_Municipality ||
            s.Municipality ||
            s.City ||
            s.cityMunicipality ||
            s.municipality ||
            s.municipality_id ||
            "",
          // Resolve organization from multiple possible shapes, including nested objects
          organization: ((): string => {
            const tryValues = [
              s.Organization_Institution,
              s.Organization,
              s.organization,
              s.OrganizationName,
              s.Organization_Name,
              s.organization_institution,
              s.Organisation,
              s.organisation,
              s.OrganizationInstitution,
              s.data && s.data.Organization_Institution,
              s.data && s.data.organization,
              s.stakeholder && s.stakeholder.Organization_Institution,
              s.stakeholder && s.stakeholder.organization,
              s.result && s.result.Organization_Institution,
              s.details && s.details.Organization_Institution,
            ];

            for (const v of tryValues) {
              if (v !== undefined && v !== null && String(v).trim() !== "")
                return String(v).trim();
            }
            // As a last resort, do a shallow scan for any key name that looks like organization/institution
            for (const k of Object.keys(s || {})) {
              const key = String(k).toLowerCase();

              if (
                key.includes("organ") ||
                key.includes("institut") ||
                key.includes("organisation")
              ) {
                const v = s[k];

                if (v !== undefined && v !== null && String(v).trim() !== "")
                  return String(v).trim();
              }
            }

            return "";
          })(),
          district: districtDisplay,
        };

        return {
          id: s.Stakeholder_ID || s.id || "",
          name: fullName,
          email: s.Email || s.email || "",
          phone: s.Phone_Number || s.phoneNumber || s.phone || "",
          province: province || "",
          municipality:
            s.City_Municipality ||
            s.Municipality ||
            s.City ||
            s.cityMunicipality ||
            s.municipality ||
            s.municipality_id ||
            "",
          // Resolve organization from multiple possible shapes, including nested objects
          organization: ((): string => {
            const tryValues = [
              s.Organization_Institution,
              s.Organization,
              s.organization,
              s.OrganizationName,
              s.Organization_Name,
              s.organization_institution,
              s.Organisation,
              s.organisation,
              s.OrganizationInstitution,
              s.data && s.data.Organization_Institution,
              s.data && s.data.organization,
              s.stakeholder && s.stakeholder.Organization_Institution,
              s.stakeholder && s.stakeholder.organization,
              s.result && s.result.Organization_Institution,
              s.details && s.details.Organization_Institution,
            ];

            for (const v of tryValues) {
              if (v !== undefined && v !== null && String(v).trim() !== "")
                return String(v).trim();
            }
            // As a last resort, do a shallow scan for any key name that looks like organization/institution
            for (const k of Object.keys(s || {})) {
              const key = String(k).toLowerCase();

              if (
                key.includes("organ") ||
                key.includes("institut") ||
                key.includes("organisation")
              ) {
                const v = s[k];

                if (v !== undefined && v !== null && String(v).trim() !== "")
                  return String(v).trim();
              }
            }

            return "";
          })(),
          district: districtDisplay,
        };
      });

      // Apply client-side filters
      const extra: any = appliedFilters || filters || {};
      let finalMapped = mapped;

      try {
        if (extra.organization) {
          finalMapped = finalMapped.filter((m: any) =>
            (m.organization || "")
              .toLowerCase()
              .includes(String(extra.organization).toLowerCase()),
          );
        }
        if (extra.type) {
          finalMapped = finalMapped.filter((m: any) =>
            (m.type || "")
              .toLowerCase()
              .includes(String(extra.type).toLowerCase()),
          );
        }
        if (extra.q) {
          const q = String(extra.q).toLowerCase();

          finalMapped = finalMapped.filter(
            (m: any) =>
              (m.name || "").toLowerCase().includes(q) ||
              (m.email || "").toLowerCase().includes(q) ||
              (m.organization || "").toLowerCase().includes(q),
          );
        }
        if (extra.name) {
          const v = String(extra.name).toLowerCase();

          finalMapped = finalMapped.filter((m: any) =>
            (m.name || "").toLowerCase().includes(v),
          );
        }
        if (extra.email) {
          const v = String(extra.email).toLowerCase();

          finalMapped = finalMapped.filter((m: any) =>
            (m.email || "").toLowerCase().includes(v),
          );
        }
        if (extra.phone) {
          const v = String(extra.phone).toLowerCase();

          finalMapped = finalMapped.filter((m: any) =>
            (m.phone || "").toLowerCase().includes(v),
          );
        }
        if (extra.date_from || extra.date_to) {
          finalMapped = finalMapped.filter((m: any) => {
            const created = m.created_at ? new Date(m.created_at) : null;

            if (!created) return true;
            if (extra.date_from) {
              const from = new Date(extra.date_from);

              if (created < from) return false;
            }
            if (extra.date_to) {
              const to = new Date(extra.date_to);

              to.setHours(23, 59, 59, 999);
              if (created > to) return false;
            }

            return true;
          });
        }
      } catch (e) {
        /* ignore filtering errors */
      }

      setStakeholders(finalMapped);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  // If we prefetch districts after the initial load, re-run stakeholder fetch so
  // province/district can be resolved from the districtsMap.
  useEffect(() => {
    if (districtsMap) {
      // update to pick up province names from districtsMap when available
      updateStakeholderNames();
    }
  }, [districtsMap]);

  // Integrate top-level search bar with current filters. Whenever searchQuery changes
  // re-run fetch with combined filters so search and quick/advanced filters combine.
  useEffect(() => {
    // avoid running on first render where searchQuery is empty
    fetchStakeholders({ ...(filters as any), q: searchQuery || undefined });
  }, [searchQuery]);

  async function fetchSignupRequests() {
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/signup-requests` : `/api/signup-requests`;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("unite_token") ||
            sessionStorage.getItem("unite_token")
          : null;
      const headers: any = {};

      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(json?.message || "Failed to fetch requests");
      const items = json.data || [];
      // Populate with resolved names
  const mapped = items.map((req: any) => ({
    id: req._id,
    name: `${req.firstName} ${req.middleName || ''} ${req.lastName}`.trim(),
    email: req.email,
    phone: req.phoneNumber,
    organization: req.organization || '',
    province: req.province?.name || req.province?.Province_Name || provincesMap[req.province] || req.province,
    district: req.district?.name || req.district?.District_Name || districtsMap?.[req.district]?.name || req.district,
    municipality: req.municipality?.name || req.municipality?.Name || req.municipality?.City_Municipality || municipalityCache[req.municipality] || req.municipality,
    status: req.status || "Pending",
    submittedAt: req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : "",
  }));

      setSignupRequests(mapped);
    } catch (err: any) {
      console.error("Failed to fetch signup requests:", err);
      setError(err.message || "Failed to fetch signup requests");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStakeholders(), fetchSignupRequests()]);
      // Don't set loading to false here - let fetchStakeholders handle it with its delay
    };
    init();
  }, []);

  const handleAcceptRequest = async (id: string) => {
    setPendingAcceptId(id);
    setIsAcceptModalOpen(true);
  };

  const confirmAcceptRequest = async () => {
    if (!pendingAcceptId) return;
    setIsAcceptModalOpen(false);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/signup-requests/${pendingAcceptId}/approve` : `/api/signup-requests/${pendingAcceptId}/approve`;
      const token = typeof window !== "undefined" ? localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { method: "PUT", headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to accept request");
      }
      // Refresh both lists
      await fetchStakeholders();
      await fetchSignupRequests();
    } catch (err: any) {
      console.error("Failed to accept request:", err);
      setError(err.message || "Failed to accept request");
    } finally {
      setPendingAcceptId(null);
    }
  };

  const handleRejectRequest = async (id: string) => {
    setPendingRejectId(id);
    setIsRejectModalOpen(true);
  };

  const confirmRejectRequest = async () => {
    if (!pendingRejectId) return;
    setIsRejectModalOpen(false);
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/signup-requests/${pendingRejectId}/reject` : `/api/signup-requests/${pendingRejectId}/reject`;
      const token = typeof window !== "undefined" ? localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ reason: rejectReason }) });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to reject request");
      }
      // Remove the rejected request from local state since it's deleted
      setSignupRequests(prev => prev.filter(req => req.id !== pendingRejectId));
      setRejectReason("");
    } catch (err: any) {
      console.error("Failed to reject request:", err);
      setError(err.message || "Failed to reject request");
    } finally {
      setPendingRejectId(null);
    }
  };

  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-danger mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If access denied, don't render (redirect will happen)
  if (!canManageStakeholders) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-4 right-4 md:hidden z-[9999]">
        <MobileNav />
      </div>

      {/* Page Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Stakeholders <span className="hidden md:inline">(Review & Approval)</span></h1>
        {/* MobileNav component renders hamburger and notifications on small screens */}
      </div>

      {/* Topbar Component */}
      <Topbar
        userEmail={displayEmail}
        userName={displayName}
        onUserClick={handleUserClick}
      />

      {/* Toolbar with Search and Actions */}
      <StakeholderToolbar
        defaultTab={selectedTab}
        onAddCoordinator={handleAddStakeholder}
        onAdvancedFilter={handleAdvancedFilter}
        onExport={handleExport}
        onQuickFilter={handleQuickFilter}
        onSearch={handleSearch}
        onTabChange={(t) => setSelectedTab(t)}
        // Pass pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pendingCount={signupRequests.length}
        isMobile={isMobile}
      />

      {/* Table Content */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50">
        <StakeholderTable
          // Pass the SLICED data here
          coordinators={paginatedData} 
          municipalityCache={municipalityCache}
          selectedCoordinators={selectedStakeholders}
          onActionClick={handleActionClick}
          onDeleteCoordinator={handleDeleteStakeholder}
          onSelectAll={handleSelectAll}
          onSelectCoordinator={handleSelectStakeholder}
          onUpdateCoordinator={handleUpdateStakeholder}
          // We still pass searchQuery to the table so it can highlight if implemented, 
          // or we can remove it if the table's internal filtering is no longer needed.
          // Since we filter outside, the table's internal filter will just match everything in the slice.
          searchQuery={searchQuery} 
          loading={loading}
          isAdmin={canManageStakeholders}
          isRequests={selectedTab === "pending"}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
        />
      </div>

      {/* Add Stakeholder Modal */}
      <AddStakeholderModal
        isOpen={isAddModalOpen}
        isSubmitting={isCreating}
        modalError={modalError}
        onClearError={() => setModalError(null)}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
      <DeleteStakeholderModal
        coordinatorId={deletingStakeholder?.id || null}
        coordinatorName={deletingStakeholder?.name || null}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingStakeholder(null);
        }}
        onConfirmDelete={async (id: string) => {
          await confirmDeleteStakeholder(id);
          setIsDeleteModalOpen(false);
          setDeletingStakeholder(null);
        }}
      />
      {/* Edit Stakeholder Modal */}
      <EditStakeholderModal
        stakeholder={editingStakeholder}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStakeholder(null);
        }}
        onSaved={async () => {
          try {
            // Reload both stakeholders and signup requests
            await Promise.all([fetchStakeholders(), fetchSignupRequests()]);
          } catch (e) {
            // Fallback to refresh if fetch fails
            try {
              router.refresh();
            } catch (e2) {
              if (typeof window !== "undefined") window.location.reload();
            }
          }
          setIsEditModalOpen(false);
          setEditingStakeholder(null);
        }}
      />

      <QuickFilterModal
        isOpen={openQuickFilter}
        isMobile={isMobile}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onApply={(f) => {
          setFilters(f);
          // If search query is in filters, update it
          if (f.searchQuery !== undefined && isMobile) {
            setSearchQuery(f.searchQuery);
          }
          // quick filter is instant: refresh immediately; do not auto-close modal
          fetchStakeholders(f);
        }}
        onClose={() => setOpenQuickFilter(false)}
      />
      <AdvancedFilterModal
        isOpen={openAdvancedFilter}
        onApply={(f) => {
          setFilters(f);
          setOpenAdvancedFilter(false);
          fetchStakeholders(f);
        }}
        onClose={() => setOpenAdvancedFilter(false)}
      />
      {/* Generate code modal removed from toolbar per new design */}

      {/* Accept Request Confirmation Modal */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200"
            style={{ zIndex: 10000, position: 'relative', minHeight: '200px' }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Acceptance</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to accept this signup request? This will create a stakeholder account and send a confirmation email to the user.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsAcceptModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                onClick={() => {
                  confirmAcceptRequest();
                }}
              >
                Accept Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Request Confirmation Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200"
            style={{ zIndex: 10000, position: 'relative', minHeight: '250px' }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Rejection</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject this signup request? This action cannot be undone and the request will be permanently deleted.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                onClick={confirmRejectRequest}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
