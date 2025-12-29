"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LeadsList } from "@/components/leads/leads-list";
import { LeadDetail } from "@/components/leads/lead-detail";
import { StatsCards } from "@/components/dashboard/stats-cards";

export default function DashboardPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="mb-6">
            <StatsCards />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Leads List */}
            <div className={`${selectedLeadId ? "lg:col-span-5" : "lg:col-span-12"}`}>
              <LeadsList
                selectedId={selectedLeadId}
                onSelect={setSelectedLeadId}
              />
            </div>

            {/* Lead Detail */}
            {selectedLeadId && (
              <div className="lg:col-span-7 animate-fade-in">
                <LeadDetail
                  leadId={selectedLeadId}
                  onClose={() => setSelectedLeadId(null)}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

