"use client";

import {
  Users,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  BarChart3,
  ChevronLeft,
  Shield,
  Sparkles,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Navigation items with role-based visibility
// roles: undefined = visible to all, otherwise array of allowed roles
const allNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ["admin", "doctor"] },
  { name: "Leads", href: "/leads", icon: Users, roles: ["admin", "doctor"] }, // admin and doctor only
  { name: "Conversations", href: "/conversations", icon: MessageSquare, roles: ["admin", "doctor"] },
  { name: "AI Training", href: "/ai-training", icon: Sparkles, roles: ["admin", "doctor", "sales_agent"] }, // AI training center
  { name: "Photos", href: "/photos", icon: ImageIcon, roles: ["admin"] }, // only admin
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] }, // only admin
];

const adminNavigation = [
  { name: "User Management", href: "/admin", icon: Shield },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

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

  // Get dynamic dashboard title based on role
  const getDashboardTitle = () => {
    switch (user?.role) {
      case "admin":
        return "Admin Panel";
      case "doctor":
        return "Doctor Dashboard";
      case "sales_agent":
        return "Sales Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <aside
      className={cn(
        "bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-white/10">
              <NextImage
                src="/Natural_Clinic.jpg"
                alt="Natural Clinic"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            {isOpen && (
              <div className="animate-fade-in">
                <p className="text-xs text-slate-400">{getDashboardTitle()}</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                !isOpen && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {allNavigation
            .filter((item) => {
              // If no roles specified, visible to all
              if (!item.roles) return true;
              // Check if user's role is in the allowed roles
              return user?.role && item.roles.includes(user.role);
            })
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30"
                      : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && (
                    <span className="animate-fade-in font-medium">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}

          {/* Admin Section - Only visible to admins */}
          {user?.role === "admin" && (
            <>
              {isOpen && (
                <div className="pt-4 mt-4 border-t border-slate-700">
                  <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Admin
                  </p>
                </div>
              )}
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30"
                        : "hover:bg-slate-700/50 text-slate-300 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="animate-fade-in font-medium">
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User */}
        {isOpen && user && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-sm font-bold">
                {getUserInitials()}
              </div>
              <div className="animate-fade-in min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

