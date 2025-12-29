"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  User,
  MessageSquare,
  Globe,
  Flame,
  Filter,
} from "lucide-react";
import { getLeads, Lead } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LeadsListProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const statusLabels: Record<string, string> = {
  NEW: "New",
  QUALIFYING: "Qualifying",
  PHOTO_REQUESTED: "Photo Requested",
  PHOTO_COLLECTING: "Collecting Photos",
  READY_FOR_DOCTOR: "Ready for Review",
  WAITING_FOR_USER: "Waiting",
  DORMANT: "Dormant",
  HANDOFF_HUMAN: "Handoff",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

const channelIcons: Record<string, string> = {
  whatsapp: "💬",
  telegram: "✈️",
  web: "🌐",
  instagram: "📸",
};

export function LeadsList({ selectedId, onSelect }: LeadsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [desireFilter, setDesireFilter] = useState<string>("");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", statusFilter, desireFilter],
    queryFn: () =>
      getLeads({
        status: statusFilter || undefined,
        desireBand: desireFilter || undefined,
      }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-semibold text-base sm:text-lg">Leads</h2>
          <span className="text-xs sm:text-sm text-slate-500">{leads?.length || 0} total</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-700 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="" className="text-slate-700">All Status</option>
            <option value="NEW" className="text-slate-700">New</option>
            <option value="QUALIFYING" className="text-slate-700">Qualifying</option>
            <option value="PHOTO_REQUESTED" className="text-slate-700">Photo Requested</option>
            <option value="PHOTO_COLLECTING" className="text-slate-700">Photo Collecting</option>
            <option value="READY_FOR_DOCTOR" className="text-slate-700">Ready for Doctor</option>
            <option value="WAITING_FOR_USER" className="text-slate-700">Waiting for User</option>
            <option value="DORMANT" className="text-slate-700">Dormant</option>
            <option value="HANDOFF_HUMAN" className="text-slate-700">Handoff</option>
            <option value="CONVERTED" className="text-slate-700">Converted</option>
            <option value="CLOSED" className="text-slate-700">Closed</option>
          </select>

          <select
            value={desireFilter}
            onChange={(e) => setDesireFilter(e.target.value)}
            className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-700 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="" className="text-slate-700">All Scores</option>
            <option value="high" className="text-slate-700">🔥 High (70-100)</option>
            <option value="medium" className="text-slate-700">⚡ Medium (40-69)</option>
            <option value="low" className="text-slate-700">💤 Low (0-39)</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
        {leads?.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            isSelected={selectedId === lead.id}
            onClick={() => onSelect(lead.id)}
          />
        ))}

        {leads?.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  isSelected,
  onClick,
}: {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}) {
  const name = lead.lead_profile?.name || "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 cursor-pointer transition-colors",
        isSelected
          ? "bg-emerald-50 border-l-4 border-emerald-500"
          : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white",
            lead.desire_band === "high"
              ? "bg-gradient-to-br from-orange-400 to-red-500"
              : lead.desire_band === "medium"
              ? "bg-gradient-to-br from-yellow-400 to-orange-500"
              : "bg-gradient-to-br from-slate-400 to-slate-500"
          )}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{name}</span>
            <span className="text-base sm:text-lg">{channelIcons[lead.channel] || "💬"}</span>
            {lead.desire_band === "high" && (
              <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500 mt-0.5">
            <span
              className={cn(
                "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                `status-${lead.status.toLowerCase()}`
              )}
            >
              {statusLabels[lead.status] || lead.status}
            </span>
            {lead.treatment_category && (
              <span className="text-slate-400 text-[10px] sm:text-xs truncate">• {lead.treatment_category}</span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="text-right shrink-0">
          {lead.desire_score !== null && (
            <div
              className={cn(
                "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-semibold border",
                `desire-${lead.desire_band}`
              )}
            >
              {lead.desire_score}
            </div>
          )}
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}

