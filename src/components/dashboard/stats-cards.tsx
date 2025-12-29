"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, Flame, Clock } from "lucide-react";
import { getLeadStats } from "@/lib/api";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: getLeadStats,
  });

  const cards = [
    {
      title: "Total Leads",
      value: stats?.total || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "Ready for Doctor",
      value: stats?.readyForDoctor || 0,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      title: "Hot Leads",
      value: stats?.hotLeads || 0,
      icon: Flame,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      title: "Waiting Response",
      value: stats?.byStatus?.["WAITING_FOR_USER"] || 0,
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4" />
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-shadow`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}
          >
            <card.icon className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-slate-600">{card.title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

