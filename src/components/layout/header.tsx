"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Bell, Search, RefreshCw, User, Image, MessageSquare, X, Trash2, Loader2, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification, NotificationType } from "@/lib/notifications";
import { getLeads, Lead } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "new_lead":
      return <User className="h-4 w-4 text-emerald-500" />;
    case "new_photo":
      return <Image className="h-4 w-4 text-blue-500" />;
    case "new_message":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-slate-500" />;
  }
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // Fetch leads for search
  const { data: allLeads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => getLeads(),
  });

  // Normalize Turkish characters for search
  const normalizeForSearch = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filter leads based on search query
  const searchResults = searchQuery.length >= 2
    ? allLeads.filter((lead) => {
        const name = normalizeForSearch(lead.lead_profile?.name || "");
        const phone = lead.lead_profile?.phone?.toLowerCase() || "";
        const email = lead.lead_profile?.email?.toLowerCase() || "";
        const query = normalizeForSearch(searchQuery);
        return name.includes(query) || phone.includes(query) || email.includes(query);
      }).slice(0, 5)
    : [];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return "??";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.leadId) {
      router.push(`/leads?selected=${notification.leadId}`);
    } else if (notification.type === "new_photo") {
      router.push("/photos");
    }
    setShowNotifications(false);
  };

  const handleSearchResultClick = (lead: Lead) => {
    setSearchQuery("");
    setShowSearchResults(false);
    router.push(`/leads?selected=${lead.id}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    }
    if (e.key === "Escape") {
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 relative z-50">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length >= 2);
            }}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search leads..."
            className="pl-10 pr-8 py-2 w-64 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <Search className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No leads found for "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {searchResults.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleSearchResultClick(lead)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {(lead.lead_profile?.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {lead.lead_profile?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {lead.lead_profile?.phone || lead.lead_profile?.email || lead.channel}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        lead.status === "READY_FOR_DOCTOR" && "bg-emerald-100 text-emerald-700",
                        lead.status === "QUALIFYING" && "bg-blue-100 text-blue-700",
                        lead.status === "PHOTO_COLLECTING" && "bg-amber-100 text-amber-700",
                        !["READY_FOR_DOCTOR", "QUALIFYING", "PHOTO_COLLECTING"].includes(lead.status) && "bg-slate-100 text-slate-600"
                      )}>
                        {lead.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-slate-100 relative disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={cn("h-5 w-5 text-slate-600", isRefreshing && "animate-spin")} />
        </button>
        
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-100 relative"
            title="Notifications"
          >
          <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
        </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1 hover:bg-slate-100 rounded"
                      title="Clear all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-3",
                        !notification.read && "bg-emerald-50/50"
                      )}
                    >
                      <div className="mt-0.5">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", !notification.read && "font-medium text-slate-800")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-emerald-500 rounded-full mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
          >
          <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role || "User"}
              </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
              {getUserInitials()}
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
          </div>
          )}
        </div>
      </div>
    </header>
  );
}

