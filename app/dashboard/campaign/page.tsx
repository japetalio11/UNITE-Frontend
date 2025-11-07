"use client";

import React, { useState } from "react";
import Topbar from "@/components/topbar";
import CampaignToolbar from "@/components/campaign-toolbar";
import CampaignCalendar from "@/components/campaign-calendar";

/**
 * Campaign Page Component
 * Main campaign management page with topbar, toolbar, and content area.
 */

export default function CampaignPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Selected date:', date.toLocaleDateString());
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Handler for search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
  };
  
  // Handler for user profile click
  const handleUserClick = () => {
    console.log("User profile clicked");
  };
  
  // Handler for tab changes
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    console.log("Tab changed to:", tab);
  };
  
  // Handler for export action
  const handleExport = () => {
    console.log("Exporting data...");
  };
  
  // Handler for quick filter
  const handleQuickFilter = () => {
    console.log("Opening quick filter...");
  };
  
  // Handler for advanced filter
  const handleAdvancedFilter = () => {
    console.log("Opening advanced filter...");
  };
  
  // Handler for create event
  const handleCreateEvent = () => {
    console.log("Creating new event...");
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Campaign</h1>
      </div>
  
      {/* Topbar Component */}
      <Topbar
        userName="Bicol Medical Center"
        userEmail="bmc@gmail.com"
        onSearch={handleSearch}
        onUserClick={handleUserClick}
      />
  
      {/* Campaign Toolbar Component */}
      <CampaignToolbar
        onExport={handleExport}
        onQuickFilter={handleQuickFilter}
        onAdvancedFilter={handleAdvancedFilter}
        onCreateEvent={handleCreateEvent}
        onTabChange={handleTabChange}
        defaultTab={selectedTab}
      />
  
      {/* Main Content Area */}
      <div className="px-6 py-6">
        <CampaignCalendar />
      </div>
    </div>
  );
}