"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Download, 
  Clock,
  Calendar,
  CalendarDays,
  SlidersHorizontal,
  Filter,
  Plus,
  MoreVertical
} from "lucide-react";

export default function CalendarPage() {
  const [activeView, setActiveView] = useState("week");
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [weekEventsByDate, setWeekEventsByDate] = useState<Record<string, any[]>>({});
  const [monthEventsByDate, setMonthEventsByDate] = useState<Record<string, any[]>>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('Bicol Medical Center');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('bmc@gmail.com');
  const [isDateTransitioning, setIsDateTransitioning] = useState(false);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close create menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // API base (allow override via NEXT_PUBLIC_API_URL)
  const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:3000';

  // Fetch real events from backend and populate week/month maps
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setEventsLoading(true);
      try {
        // Week endpoint (passes currentDate as date param)
        const weekUrl = `${API_BASE}/api/calendar/week?date=${encodeURIComponent(currentDate.toISOString())}&status=Approved`;
        const weekResp = await fetch(weekUrl, { credentials: 'include' });
        const weekJson = await weekResp.json();

        if (mounted && weekResp.ok && weekJson && weekJson.success && weekJson.data) {
          // backend returns week object in `data` with `weekDays` map
          const weekDays = weekJson.data.weekDays || weekJson.data.weekDays || {};
          setWeekEventsByDate(weekDays);
        } else if (mounted) {
          setWeekEventsByDate({});
        }

        // Month endpoint (use year/month from currentDate)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // service expects 1-12
        const monthUrl = `${API_BASE}/api/calendar/month?year=${year}&month=${month}&status=Approved`;
        const monthResp = await fetch(monthUrl, { credentials: 'include' });
        const monthJson = await monthResp.json();

        if (mounted && monthResp.ok && monthJson && monthJson.success && monthJson.data) {
          // backend returns month object in `data` with `eventsByDate` map
          const eventsByDate = monthJson.data.eventsByDate || {};
          setMonthEventsByDate(eventsByDate);
        } else if (mounted) {
          setMonthEventsByDate({});
        }
      } catch (error) {
        if (mounted) {
          setWeekEventsByDate({});
          setMonthEventsByDate({});
        }
        // Optionally log: console.error('Failed to fetch calendar data', error);
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, [currentDate, activeView]);

  const navigateWeek = async (direction: 'prev' | 'next') => {
    setIsDateTransitioning(true);
    setSlideDirection(direction === 'prev' ? 'right' : 'left');
    
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
    
    setTimeout(() => {
      setIsDateTransitioning(false);
    }, 300);
  };

  const navigateMonth = async (direction: 'prev' | 'next') => {
    setIsDateTransitioning(true);
    
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    
    setTimeout(() => {
      setIsDateTransitioning(false);
    }, 300);
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.toLocaleString('default', { month: 'long' });
    const endMonth = endOfWeek.toLocaleString('default', { month: 'long' });
    const year = startOfWeek.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${year}`;
    } else {
      return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()} ${year}`;
    }
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysForWeek = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek;
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      days.push({
        date: dayDate.getDate(),
        day: dayDate.toLocaleString('default', { weekday: 'short' }),
        fullDate: new Date(dayDate),
        isToday: isToday(dayDate),
        month: dayDate.toLocaleString('default', { month: 'short' })
      });
    }
    return days;
  };

  const generateMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: isToday(currentDate),
        events: getEventsForDate(new Date(currentDate))
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const makeOrdinal = (n: number | string) => {
    const num = parseInt(String(n), 10);
    if (isNaN(num)) return String(n);
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    const suffix = (v >= 11 && v <= 13) ? 'th' : (suffixes[num % 10] || 'th');
    return `${num}${suffix}`;
  };

  const getEventsForDate = (date: Date) => {
    const key = date.toISOString().split('T')[0];
    const source = activeView === 'month' ? monthEventsByDate : weekEventsByDate;
    const raw = source[key] || [];

    // Only include events that are explicitly approved
    const approved = raw.filter((e: any) => {
      const status = (e.Status ?? e.status ?? '').toString();
      return status.toLowerCase() === 'approved';
    });

    return approved.map((e: any) => {
      // Start date may come in different shapes (ISO, number, or mongo export object)
      let start: Date | null = null;
      if (e.Start_Date) {
        try {
          if (typeof e.Start_Date === 'object' && e.Start_Date.$date) {
            // mongo export shape: { $date: { $numberLong: '...' } } or { $date: 12345 }
            const d = e.Start_Date.$date;
            if (typeof d === 'object' && d.$numberLong) start = new Date(Number(d.$numberLong));
            else start = new Date(d as any);
          } else {
            start = new Date(e.Start_Date as any);
          }
        } catch (err) {
          start = null;
        }
      }

      const time = start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

      // Coordinator / stakeholder name — check a few possible fields
      const coordinatorName = e.coordinator?.name || e.StakeholderName || e.MadeByCoordinatorName || e.coordinatorName || e.Email || 'Local Government Unit';

      // District number — prefer coordinator nested value but accept other shapes
      const districtNumber = e.coordinator?.district_number ?? e.district_number ?? e.DistrictNumber ?? e.district;
      const districtDisplay = districtNumber ? `${makeOrdinal(districtNumber)} District` : '1st District';

      // Determine category (case-insensitive, check both Category and category)
      const rawCat = ((e.Category ?? e.category ?? '')).toString().toLowerCase();
      let typeKey: string = 'event';
      if (rawCat.includes('blood')) typeKey = 'blood-drive';
      else if (rawCat.includes('train')) typeKey = 'training';
      else if (rawCat.includes('advoc')) typeKey = 'advocacy';

      // Helper to find count values across shapes (main event or categoryData)
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          if (e[k] !== undefined && e[k] !== null) return e[k];
          if (e.categoryData && (e.categoryData[k] !== undefined && e.categoryData[k] !== null)) return e.categoryData[k];
        }
        return undefined;
      };

      let countType = '';
      let count = '';
      const targetDonation = getVal(['Target_Donation', 'TargetDonation', 'Target_Donations']);
      const maxParticipants = getVal(['MaxParticipants', 'Max_Participants', 'MaxParticipant']);
      const expectedAudience = getVal(['ExpectedAudienceSize', 'Expected_AudienceSize', 'ExpectedAudience']);

      if (typeKey === 'blood-drive' && targetDonation !== undefined) {
        countType = 'Goal Count';
        count = `${targetDonation} u.`;
      } else if (typeKey === 'training' && maxParticipants !== undefined) {
        countType = 'Participant Count';
        count = `${maxParticipants} no.`;
      } else if (typeKey === 'advocacy' && expectedAudience !== undefined) {
        countType = 'Audience Count';
        count = `${expectedAudience} no.`;
      } else {
        countType = 'Audience Count';
        count = '205 no.';
      }

      return {
        title: e.Event_Title || e.title || 'Lifesavers Blood Drive',
        time,
        type: typeKey,
        district: districtDisplay,
        location: e.Location || e.location || 'Ateneo Avenue, Bagumbayan Sur, Naga City, 4400 Camarines Sur, Philippine',
        countType,
        count,
        coordinatorName,
        raw: e
      };
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const days = getDaysForWeek(currentDate);

  type EventType = keyof {
    "blood-drive": string;
    training: string;
    advocacy: string;
  };

  const eventLabelsMap: Record<EventType, string> = {
    "blood-drive": "Blood Drive",
    "training": "Training",
    "advocacy": "Advocacy"
  };

  const handleViewChange = (view: string) => {
    setIsViewTransitioning(true);
    setTimeout(() => {
      setActiveView(view);
      setIsViewTransitioning(false);
    }, 500);
  };

  const getViewTransitionStyle = (view: string) => {
    const isActive = activeView === view;
    const isTransitioning = isViewTransitioning;
    
    if (isActive && !isTransitioning) {
      return 'opacity-100 scale-100 translate-y-0';
    } else if (isActive && isTransitioning) {
      return 'opacity-100 scale-100 translate-y-0';
    } else if (!isActive && isTransitioning) {
      return view === 'week' 
        ? 'opacity-0 scale-95 -translate-y-4 absolute inset-0 pointer-events-none'
        : 'opacity-0 scale-95 translate-y-4 absolute inset-0 pointer-events-none';
    } else {
      return 'opacity-0 scale-95 absolute inset-0 pointer-events-none';
    }
  };

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -100 : 100,
      opacity: 0
    })
  };

  return (
    <div className="flex-1 flex flex-col overflow-visible bg-white">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Calendar</h1>
        
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-orange-400 flex items-center justify-center text-white font-semibold">
            B
          </div>
          <div className="flex items-center gap-2">
            <div>
              <div className="text-sm font-medium text-gray-900">{currentUserName}</div>
              <div className="text-xs text-gray-500">{currentUserEmail}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          {/* Left side - View Toggle and Date Navigation */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button 
                onClick={() => handleViewChange("week")}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeView === "week" 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Week
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button 
                onClick={() => handleViewChange("month")}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeView === "month" 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Month
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => activeView === "week" ? navigateWeek('prev') : navigateMonth('prev')}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">
                {activeView === "week" ? formatWeekRange(currentDate) : formatMonthYear(currentDate)}
              </span>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => activeView === "week" ? navigateWeek('next') : navigateMonth('next')}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
              <Filter className="w-4 h-4" />
              Quick Filter
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Advanced Filter
            </button>
            
            {/* Create Event Dropdown */}
            <div className="relative" ref={createMenuRef}>
              <button 
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create an event
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isCreateMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    Blood Drive
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    Training
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    Advocacy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Views Container */}
        <div className="relative min-h-[700px]">
          {/* Week View */}
          <div className={`transition-all duration-500 ease-in-out ${getViewTransitionStyle('week')}`}>
            <div>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                {days.map((day, index) => (
                  <div key={`day-${index}`} className="text-center">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      {day.day}
                    </div>
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold ${
                        day.isToday
                          ? 'bg-red-500 text-white'
                          : 'text-gray-900'
                      }`}>
                        {day.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Event Cards */}
              <div className="grid grid-cols-7 gap-4 mt-6">
                {days.map((day, index) => {
                  const dayEvents = getEventsForDate(day.fullDate);
                  return (
                    <div key={index} className="min-h-[500px]">
                      {dayEvents.length === 0 ? (
                        <div className="h-20 flex items-center justify-center text-gray-400 text-xs">
                          No events
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayEvents.map((event, eventIndex) => (
                            <div 
                              key={eventIndex} 
                              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                            >
                              {/* Three-dot menu */}
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2">
                                  {event.title}
                                </h4>
                                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* Profile */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-6 w-6 rounded-full bg-orange-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{event.coordinatorName}</span>
                              </div>

                              {/* Time and Type Badges */}
                              <div className="flex gap-2 mb-3">
                                <div className="bg-gray-100 rounded px-2 py-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-700">{event.time}</span>
                                </div>
                                <div className="bg-gray-100 rounded px-2 py-1">
                                  <span className="text-xs text-gray-700">{eventLabelsMap[event.type as EventType]}</span>
                                </div>
                              </div>

                              {/* District */}
                              <div className="mb-2">
                                <div className="text-xs font-medium text-gray-700 mb-0.5">District</div>
                                <div className="text-xs text-gray-600">{event.district}</div>
                              </div>

                              {/* Location */}
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-700 mb-0.5">Location</div>
                                <div className="text-xs text-gray-600 line-clamp-2">{event.location}</div>
                              </div>

                              {/* Count */}
                              <div className="border-t border-gray-200 pt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">{event.countType}</span>
                                  <span className="text-lg font-bold text-red-500">{event.count}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Month View */}
          <div className={`transition-all duration-500 ease-in-out ${getViewTransitionStyle('month')}`}>
            <div>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center">
                    <div className="text-sm font-medium text-gray-500 mb-2">{day}</div>
                    <div className="h-10"></div>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {generateMonthDays(currentDate).map((day, index) => (
                    <div
                      key={index}
                      className={`min-h-[100px] bg-white p-2 ${
                        !day.isCurrentMonth && 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                          day.isToday
                            ? 'bg-red-500 text-white'
                            : day.isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {day.date.getDate()}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {day.events.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="text-xs p-1 rounded bg-red-100 text-red-800 font-medium truncate cursor-pointer hover:bg-red-200 transition-colors"
                            title={`${event.time} - ${event.title}`}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}