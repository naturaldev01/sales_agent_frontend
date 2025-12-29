"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  Settings,
  Bell,
  Clock,
  MessageSquare,
  Globe,
  Save,
  RefreshCw,
} from "lucide-react";
import { getConfigs, SystemConfig } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  const { data: configs, isLoading } = useQuery({
    queryKey: ["configs"],
    queryFn: getConfigs,
  });

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "followups", label: "Follow-ups", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "languages", label: "Languages", icon: Globe },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-slate-500">Configure your AI Sales Agent</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tabs */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                        activeTab === tab.id
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === "general" && <GeneralSettings />}
                {activeTab === "followups" && <FollowupSettings configs={configs} />}
                {activeTab === "notifications" && <NotificationSettings />}
                {activeTab === "messages" && <MessageSettings />}
                {activeTab === "languages" && <LanguageSettings />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">General Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Clinic Name
          </label>
          <input
            type="text"
            defaultValue="Natural Clinic"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Language
          </label>
          <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white">
            <option value="en">English</option>
            <option value="tr">Turkish</option>
            <option value="ar">Arabic</option>
            <option value="ru">Russian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Timezone
          </label>
          <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white">
            <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowupSettings({ configs }: { configs?: SystemConfig[] }) {
  const followupConfig = configs?.find((c) => c.config_key === "followup_settings");
  const settings = (followupConfig?.config_value || {
    intervals_hours: [2, 24, 72],
    max_attempts: 3,
    working_hours_start: "09:00",
    working_hours_end: "19:00",
  }) as Record<string, unknown>;

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Follow-up Settings</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Follow-up Intervals (hours)
          </label>
          <div className="flex gap-2">
            {(settings.intervals_hours as number[] || [2, 24, 72]).map((hours, i) => (
              <input
                key={i}
                type="number"
                defaultValue={hours}
                className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white text-center"
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Time between each follow-up message
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Maximum Attempts
          </label>
          <input
            type="number"
            defaultValue={settings.max_attempts as number || 3}
            className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white text-center"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Working Hours Start
            </label>
            <input
              type="time"
              defaultValue={settings.working_hours_start as string || "09:00"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Working Hours End
            </label>
            <input
              type="time"
              defaultValue={settings.working_hours_end as string || "19:00"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Notification Settings</h2>

      <div className="space-y-4">
        {[
          { label: "New lead notifications", description: "Get notified when a new lead arrives", enabled: true },
          { label: "Handoff alerts", description: "Alert when AI requests human intervention", enabled: true },
          { label: "High-desire leads", description: "Notify for leads with score > 70", enabled: true },
          { label: "Photo uploads", description: "Notify when patients upload photos", enabled: false },
          { label: "Daily summary", description: "Receive daily lead summary at 9 AM", enabled: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">{item.label}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-200">
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function MessageSettings() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Message Templates</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Welcome Message
          </label>
          <textarea
            rows={3}
            defaultValue="Hello! Welcome to Natural Clinic. I'm here to help you with your beauty journey. How can I assist you today? 🙂"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Photo Request Message
          </label>
          <textarea
            rows={3}
            defaultValue="To better understand your needs and provide an accurate assessment, could you please share some photos? This will help our doctors give you the best recommendation."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Handoff Message
          </label>
          <textarea
            rows={3}
            defaultValue="I'll connect you with our team member who can better assist you. They'll reach out shortly! 🙂"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 bg-white resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function LanguageSettings() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Language Settings</h2>

      <div className="space-y-4">
        {[
          { code: "en", name: "English", flag: "🇬🇧", enabled: true },
          { code: "tr", name: "Turkish", flag: "🇹🇷", enabled: true },
          { code: "ar", name: "Arabic", flag: "🇸🇦", enabled: true },
          { code: "ru", name: "Russian", flag: "🇷🇺", enabled: true },
          { code: "de", name: "German", flag: "🇩🇪", enabled: false },
          { code: "fr", name: "French", flag: "🇫🇷", enabled: false },
        ].map((lang) => (
          <div key={lang.code} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <p className="font-medium text-slate-800">{lang.name}</p>
                <p className="text-sm text-slate-500">{lang.code.toUpperCase()}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={lang.enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-200">
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

