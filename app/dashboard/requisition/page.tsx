"use client";

import { useState, useEffect } from "react";
import { getUserInfo } from "../../../utils/getUserInfo";
import { Search, Download, Filter, Plus, ChevronDown, X } from "lucide-react";
import Topbar from "@/components/topbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Input,
} from "@heroui/react";

interface RequisitionFormData {
  bloodType: string;
  units: number;
  requestDate: string; // Change to string for input type="date"
  location: string;
  status: string;
  bloodbankLocation: string;
}

interface Requisition {
  id: string;
  orderId: string;
  hospital: string;
  department: string;
  units: number;
  bloodType: string;
  priority: "New-Urgent" | "Emergent" | "Urgent" | "Normal";
  requestDate: string;
  requiredDate: string;
  eta?: string;
  status: "Created" | "Open" | "Completed" | "Cancelled";
}

export default function RequisitionManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequisitions, setSelectedRequisitions] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab filters
  const [directionFilter, setDirectionFilter] = useState<"All" | "Incoming" | "Outgoing">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  
  const [filters, setFilters] = useState<{
    hospital?: string;
    department?: string;
    bloodType?: string;
    priority?: string;
    status?: string;
  }>({});
  const [openQuickFilter, setOpenQuickFilter] = useState(false);
  
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState("Bicol Medical Center");
  const [displayEmail, setDisplayEmail] = useState("bmc@gmail.com");
  const [canManageRequisitions, setCanManageRequisitions] = useState(false);

  // Helper function to format date as YYYY-MM-DD
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state for "Make a Request" modal - USING string for date input
  const [formData, setFormData] = useState<RequisitionFormData>({
    bloodType: "",
    units: 1,
    requestDate: formatDateForInput(new Date()), // Initialize with today's date
    location: "",
    status: "",
    bloodbankLocation: "",
  });

  useEffect(() => {
    try {
      const info = getUserInfo();
      setUserInfo(info);
      
      const rawUser = info?.raw || null;
      const staffType = rawUser?.StaffType || rawUser?.staff_type || null;
      const isStaffAdmin = !!staffType && String(staffType).toLowerCase() === "admin";
      const resolvedRole = info?.role || null;
      const roleLower = resolvedRole ? String(resolvedRole).toLowerCase() : "";
      const isSystemAdmin = !!info?.isAdmin || (roleLower.includes("sys") && roleLower.includes("admin"));

      setCanManageRequisitions(
        Boolean(isSystemAdmin || isStaffAdmin || roleLower.includes("coordinator"))
      );
      setDisplayName(info?.displayName || "Bicol Medical Center");
      setDisplayEmail(info?.email || "bmc@gmail.com");
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserClick = () => {
    // User profile clicked
  };

  const handleExport = () => {
    // Export data logic
    const dataStr = JSON.stringify(filteredRequisitions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'requisitions-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickFilter = () => {
    setOpenQuickFilter(true);
  };

  const handleAdvancedFilter = () => {
    // Implement advanced filter logic
    console.log("Advanced filter clicked");
  };

  const handleAddRequisition = () => {
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setFormData({
      bloodType: "",
      units: 1,
      requestDate: formatDateForInput(new Date()),
      location: "",
      status: "",
      bloodbankLocation: "",
    });
  };

  const handleModalSubmit = async () => {
    setIsCreating(true);
    try {
      // API call to create requisition
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
      const token = typeof window !== "undefined"
        ? localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token")
        : null;

      const url = base ? `${base}/api/requisitions` : `/api/requisitions`;

      const requestDate = new Date(formData.requestDate);
      
      const requisitionData = {
        bloodType: formData.bloodType,
        units: formData.units,
        requestDate: requestDate.toISOString().split('T')[0],
        location: formData.location,
        status: formData.status,
        bloodbankLocation: formData.bloodbankLocation,
        orderId: `ORDER-${Date.now().toString().slice(-6)}`,
        hospital: "Bicol Medical Center",
        department: "ER",
        priority: formData.status === "Emergent" ? "Emergent" : "New-Urgent",
        requiredDate: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eta: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requisitionData),
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch (err) {
        throw new Error(
          `Invalid JSON response when creating requisition: ${text.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        throw new Error(
          json?.message || `Failed to create requisition (status ${res.status})`
        );
      }

      await fetchRequisitions();
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to create requisition");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequisitions(filteredRequisitions.map((r) => r.id));
    } else {
      setSelectedRequisitions([]);
    }
  };

  const handleSelectRequisition = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequisitions([...selectedRequisitions, id]);
    } else {
      setSelectedRequisitions(selectedRequisitions.filter((rId) => rId !== id));
    }
  };

  const handleActionClick = (id: string) => {
    // Handle specific actions for requisition
    console.log("Action clicked for requisition:", id);
  };

  const fetchRequisitions = async () => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    
    try {
      // Mock data based on the image
      const mockRequisitions: Requisition[] = [
        {
          id: "1",
          orderId: "ORDER 1234",
          hospital: "Bicol Medical Center",
          department: "ER",
          units: 1,
          bloodType: "A",
          priority: "New-Urgent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Created"
        },
        {
          id: "2",
          orderId: "ORDER 1234",
          hospital: "Bicol Medical Center",
          department: "ER",
          units: 1,
          bloodType: "A",
          priority: "Emergent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Open"
        },
        {
          id: "3",
          orderId: "ORDER 1234",
          hospital: "Bicol Medical Center",
          department: "ER",
          units: 1,
          bloodType: "A",
          priority: "New-Urgent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Created"
        },
        {
          id: "4",
          orderId: "ORDER 1234",
          hospital: "Bicol Medical Center",
          department: "ER",
          units: 1,
          bloodType: "A",
          priority: "Emergent",
          requestDate: "October 28, 2025",
          requiredDate: "October 28, 2025",
          eta: "October 29, 2025",
          status: "Open"
        },
      ];

      setRequisitions(mockRequisitions);

      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1000;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  // Apply filters whenever requisitions or filters change
  useEffect(() => {
    let filtered = [...requisitions];

    // Apply text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.orderId.toLowerCase().includes(query) ||
        r.hospital.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query) ||
        r.bloodType.toLowerCase().includes(query) ||
        r.priority.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query)
      );
    }

    // Apply tab filters
    if (directionFilter === "Incoming") {
      // Filter for incoming requisitions
      filtered = filtered.filter(r => r.status === "Created" || r.status === "Open");
    } else if (directionFilter === "Outgoing") {
      // Filter for outgoing requisitions
      filtered = filtered.filter(r => r.status === "Completed");
    }

    if (statusFilter === "Open") {
      filtered = filtered.filter(r => r.status === "Created" || r.status === "Open");
    } else if (statusFilter === "Closed") {
      filtered = filtered.filter(r => r.status === "Completed" || r.status === "Cancelled");
    }

    // Apply other filters
    if (filters.hospital) {
      filtered = filtered.filter(r => r.hospital === filters.hospital);
    }
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department);
    }
    if (filters.bloodType) {
      filtered = filtered.filter(r => r.bloodType === filters.bloodType);
    }
    if (filters.priority) {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    setFilteredRequisitions(filtered);
  }, [requisitions, filters, searchQuery, directionFilter, statusFilter]);

  useEffect(() => {
    const init = async () => {
      await fetchRequisitions();
      setLoading(false);
    };
    init();
  }, []);

  const handleApplyFilters = (newFilters: {
    hospital?: string;
    department?: string;
    bloodType?: string;
    priority?: string;
    status?: string;
  }) => {
    setFilters(newFilters);
    setOpenQuickFilter(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setDirectionFilter("All");
    setStatusFilter("All");
  };

  // Blood types for dropdown
  const bloodTypes = [
    { key: "A", label: "A" },
    { key: "B", label: "B" },
    { key: "AB", label: "AB" },
    { key: "O", label: "O" },
    { key: "A+", label: "A+" },
    { key: "A-", label: "A-" },
    { key: "B+", label: "B+" },
    { key: "B-", label: "B-" },
    { key: "AB+", label: "AB+" },
    { key: "AB-", label: "AB-" },
    { key: "O+", label: "O+" },
    { key: "O-", label: "O-" },
  ];

  // Status options
  const statusOptions = [
    { key: "New-Urgent", label: "New-Urgent" },
    { key: "Emergent", label: "Emergent" },
    { key: "Urgent", label: "Urgent" },
    { key: "Normal", label: "Normal" },
  ];

  // Bloodbank locations
  const bloodbankLocations = [
    { key: "main", label: "Main Blood Bank" },
    { key: "north", label: "North Wing Blood Bank" },
    { key: "south", label: "South Wing Blood Bank" },
    { key: "emergency", label: "Emergency Blood Bank" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Requisition Management
        </h1>
      </div>

      {/* Topbar Component */}
      <Topbar
        userEmail={displayEmail}
        userName={displayName}
        onUserClick={handleUserClick}
      />

      {/* Toolbar with Search, Filter Tabs, and Action Buttons - ALL ON SAME LINE */}
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left side - Filter Tabs and Compact Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* Direction filter tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 transition-all duration-300">
              {["All", "Incoming", "Outgoing"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 ${
                    directionFilter === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setDirectionFilter(tab as any)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Status filter tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 transition-all duration-300">
              {["All", "Open", "Closed"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 ${
                    statusFilter === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setStatusFilter(tab as any)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Compact Search - After tabs */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <Button
              variant="bordered"
              className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50"
              startContent={<Download className="w-4 h-4" />}
              onPress={handleExport}
            >
              Export
            </Button>

            {/* Quick Filter Button */}
            <Button
              variant="bordered"
              className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50"
              startContent={<Filter className="w-4 h-4" />}
              onPress={handleQuickFilter}
            >
              Quick Filter
            </Button>

            {/* Advanced Filter Button */}
            <Button
              variant="bordered"
              className="border-gray-300 text-gray-700 transition-all duration-300 hover:bg-gray-50"
              startContent={<Filter className="w-4 h-4" />}
              onPress={handleAdvancedFilter}
            >
              Advanced Filter
            </Button>

            {/* Make a Request Button */}
            <Button
              className="bg-black text-white transition-all duration-300 hover:bg-gray-800 hover:scale-105"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleAddRequisition}
            >
              Make a request
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.hospital || filters.department || filters.bloodType || filters.priority || filters.status || directionFilter !== "All" || statusFilter !== "All") && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-blue-900">Active Filters:</span>
            
            {directionFilter !== "All" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                {directionFilter}
              </span>
            )}
            
            {statusFilter !== "All" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                {statusFilter}
              </span>
            )}
            
            {filters.hospital && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                Hospital: {filters.hospital}
              </span>
            )}
            
            {filters.department && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                Department: {filters.department}
              </span>
            )}
            
            {filters.bloodType && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                Blood Type: {filters.bloodType}
              </span>
            )}
            
            {filters.priority && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                Priority: {filters.priority}
              </span>
            )}
            
            {filters.status && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md transition-all duration-300 hover:bg-blue-200">
                Status: {filters.status}
              </span>
            )}
            
            <button
              onClick={handleClearFilters}
              className="ml-2 text-blue-600 hover:text-blue-800 underline transition-colors duration-300"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all duration-300"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedRequisitions.length === filteredRequisitions.length && filteredRequisitions.length > 0}
                    />
                    <span className="ml-2">ORDER ID</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  HOSPITAL
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  DEPARTMENT
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  UNITS
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  BLOOD TYPE
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  PRIORITY
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  RD
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  ETA
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  STATUS
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton
                [...Array(4)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-4 bg-gray-200 rounded w-4"></div>
                        <div className="ml-2 h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </td>
                    {[...Array(9)].map((_, cellIndex) => (
                      <td key={cellIndex} className="py-4 px-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-gray-500">
                    No requisitions found
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((requisition) => (
                  <tr key={requisition.id} className="hover:bg-gray-50 transition-colors duration-300">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all duration-300"
                          checked={selectedRequisitions.includes(requisition.id)}
                          onChange={(e) => handleSelectRequisition(requisition.id, e.target.checked)}
                        />
                        <span className="ml-2 font-medium text-gray-900">
                          {requisition.orderId}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.hospital}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.department}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.units}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.bloodType}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                        requisition.priority === "Emergent" 
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : requisition.priority === "New-Urgent"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : requisition.priority === "Urgent"
                          ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}>
                        {requisition.priority === "New-Urgent" ? "Non-urgent" : requisition.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.requestDate}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {requisition.eta}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                        requisition.status === "Created" 
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : requisition.status === "Open"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : requisition.status === "Completed"
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}>
                        {requisition.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            variant="light"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110"
                          >
                            <span className="sr-only">Actions</span>
                            •••
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Requisition actions">
                          <DropdownItem 
                            key="view" 
                            onPress={() => handleActionClick(requisition.id)}
                            className="transition-colors duration-300"
                          >
                            View Details
                          </DropdownItem>
                          <DropdownItem 
                            key="edit" 
                            onPress={() => handleActionClick(requisition.id)}
                            className="transition-colors duration-300"
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem 
                            key="cancel" 
                            className="text-danger transition-colors duration-300" 
                            color="danger"
                          >
                            Cancel
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Make a Request" Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Make a request</h2>
            <p className="text-sm text-gray-500 font-normal">
              Start providing your information by selecting your blood type. Add details below to proceed.
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type *
                  </label>
                  <Select
                    placeholder="Select one"
                    className="w-full transition-all duration-300"
                    selectedKeys={formData.bloodType ? [formData.bloodType] : []}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                  >
                    {bloodTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit/s *
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter unit"
                    min="1"
                    value={formData.units.toString()}
                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 1})}
                    className="transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Input
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Status *
                </label>
                <Select
                  placeholder="Select one"
                  className="w-full transition-all duration-300"
                  selectedKeys={formData.status ? [formData.status] : []}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.key}>{status.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bloodbank Location *
                </label>
                <Select
                  placeholder="Select one"
                  className="w-full transition-all duration-300"
                  selectedKeys={formData.bloodbankLocation ? [formData.bloodbankLocation] : []}
                  onChange={(e) => setFormData({...formData, bloodbankLocation: e.target.value})}
                >
                  {bloodbankLocations.map((location) => (
                    <SelectItem key={location.key}>{location.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={handleModalClose}
              className="border-gray-300 transition-all duration-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              className="bg-black text-white transition-all duration-300 hover:bg-gray-800 hover:scale-105"
              onPress={handleModalSubmit}
              isLoading={isCreating}
            >
              {isCreating ? "Creating..." : "Make Request"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Quick Filter Modal */}
      <Modal 
        isOpen={openQuickFilter} 
        onClose={() => setOpenQuickFilter(false)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Quick Filter</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital
                </label>
                <Select
                  placeholder="Select hospital"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.hospital ? [filters.hospital] : []}
                  onChange={(e) => handleApplyFilters({...filters, hospital: e.target.value})}
                >
                  <SelectItem key="Bicol Medical Center">Bicol Medical Center</SelectItem>
                  <SelectItem key="General Hospital">General Hospital</SelectItem>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Select
                  placeholder="Select department"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.department ? [filters.department] : []}
                  onChange={(e) => handleApplyFilters({...filters, department: e.target.value})}
                >
                  <SelectItem key="ER">ER</SelectItem>
                  <SelectItem key="ICU">ICU</SelectItem>
                  <SelectItem key="OR">OR</SelectItem>
                  <SelectItem key="Pediatrics">Pediatrics</SelectItem>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <Select
                  placeholder="Select blood type"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.bloodType ? [filters.bloodType] : []}
                  onChange={(e) => handleApplyFilters({...filters, bloodType: e.target.value})}
                >
                  {bloodTypes.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <Select
                  placeholder="Select priority"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.priority ? [filters.priority] : []}
                  onChange={(e) => handleApplyFilters({...filters, priority: e.target.value})}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.key}>{status.label}</SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  placeholder="Select status"
                  className="w-full transition-all duration-300"
                  selectedKeys={filters.status ? [filters.status] : []}
                  onChange={(e) => handleApplyFilters({...filters, status: e.target.value})}
                >
                  <SelectItem key="Created">Created</SelectItem>
                  <SelectItem key="Open">Open</SelectItem>
                  <SelectItem key="Completed">Completed</SelectItem>
                  <SelectItem key="Cancelled">Cancelled</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={() => setOpenQuickFilter(false)}
              className="border-gray-300 transition-all duration-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              onPress={() => {
                handleClearFilters();
                setOpenQuickFilter(false);
              }}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
            >
              Clear Filters
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}