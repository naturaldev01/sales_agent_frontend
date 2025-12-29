"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LeadsList } from "@/components/leads/leads-list";
import { LeadDetail } from "@/components/leads/lead-detail";

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Read selected lead from URL on mount and when URL changes
  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      setSelectedLeadId(selected);
    }
  }, [searchParams]);

  // Update URL when lead is selected
  const handleSelectLead = (leadId: string | null) => {
    setSelectedLeadId(leadId);
    if (leadId) {
      router.push(`/leads?selected=${leadId}`, { scroll: false });
    } else {
      router.push("/leads", { scroll: false });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Leads Management</h1>
            <p className="text-xs sm:text-sm text-slate-500">View and manage all your leads</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Leads List - Hidden on mobile when a lead is selected */}
            <div className={`lg:col-span-5 ${selectedLeadId ? 'hidden lg:block' : 'block'}`}>
              <LeadsList
                selectedId={selectedLeadId}
                onSelect={handleSelectLead}
              />
            </div>

            {/* Lead Detail - Full width on mobile when a lead is selected */}
            <div className={`lg:col-span-7 ${selectedLeadId ? 'block' : 'hidden lg:block'}`}>
              <LeadDetail 
                leadId={selectedLeadId} 
                onClose={() => handleSelectLead(null)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

