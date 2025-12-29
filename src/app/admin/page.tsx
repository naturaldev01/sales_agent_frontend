"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Briefcase,
  Stethoscope,
  CheckCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, getPendingUsers, approveUser, updateUserRole, AdminUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const roleIcons: Record<string, typeof Users> = {
  admin: Shield,
  doctor: Stethoscope,
  sales_agent: Briefcase,
  staff: Users,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  doctor: "bg-blue-100 text-blue-700",
  sales_agent: "bg-amber-100 text-amber-700",
  staff: "bg-slate-100 text-slate-700",
};

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === "admin";

  // All hooks must be called unconditionally
  const { data: pendingUsers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "pending-users"],
    queryFn: getPendingUsers,
    enabled: isAdmin,
  });

  const { data: allUsers = [], isLoading: allLoading } = useQuery({
    queryKey: ["admin", "all-users"],
    queryFn: getAllUsers,
    enabled: isAdmin && activeTab === "all",
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      approveUser(userId, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ userId, approved: true });
  };

  const handleReject = (userId: string) => {
    if (confirm("Are you sure you want to reject this user? They will not be able to access the system.")) {
      approveMutation.mutate({ userId, approved: false });
    }
  };

  const displayUsers = activeTab === "pending" ? pendingUsers : allUsers;
  const isLoading = activeTab === "pending" ? pendingLoading : allLoading;

  // Check if current user is admin - after all hooks
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h2>
              <p className="text-slate-600">
                You don't have permission to access this page. Only administrators can manage users.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                <p className="text-slate-600 mt-1">Approve new users and manage roles</p>
              </div>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{pendingUsers.length}</p>
                    <p className="text-sm text-slate-600">Pending Approval</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {allUsers.filter((u) => u.is_approved).length}
                    </p>
                    <p className="text-sm text-slate-600">Approved Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{allUsers.length}</p>
                    <p className="text-sm text-slate-600">Total Users</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                      activeTab === "pending"
                        ? "border-amber-500 text-amber-600 bg-amber-50"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    Pending Approval
                    {pendingUsers.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                        {pendingUsers.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                      activeTab === "all"
                        ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    All Users
                  </button>
                </div>
              </div>

              {/* User List */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : displayUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 mb-4">
                      {activeTab === "pending" ? (
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                      ) : (
                        <Users className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-1">
                      {activeTab === "pending" ? "No Pending Approvals" : "No Users Found"}
                    </h3>
                    <p className="text-slate-600">
                      {activeTab === "pending"
                        ? "All user registrations have been processed."
                        : "No users have registered yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayUsers.map((u) => {
                      const RoleIcon = roleIcons[u.role] || Users;
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>

                            {/* User Info */}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-800">{u.name}</h4>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                                    roleColors[u.role] || roleColors.staff
                                  )}
                                >
                                  <RoleIcon className="h-3 w-3" />
                                  {u.role}
                                </span>
                                {u.is_approved ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500">{u.email}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Registered {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                                {u.approved_at && (
                                  <span className="ml-2">
                                    • Approved {format(new Date(u.approved_at), "MMM d, yyyy")}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!u.is_approved && (
                              <>
                                <button
                                  onClick={() => handleApprove(u.id)}
                                  disabled={approveMutation.isPending}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {approveMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(u.id)}
                                  disabled={approveMutation.isPending}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <UserX className="h-4 w-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {u.is_approved && u.id !== user?.id && (
                              <select
                                value={u.role}
                                onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                                disabled={roleMutation.isPending}
                                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                <option value="doctor">Doctor</option>
                                <option value="sales_agent">Sales Agent</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
