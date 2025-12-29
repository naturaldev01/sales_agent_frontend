"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Image, User, Check, X, Eye, Download, Filter } from "lucide-react";
import { getPhotos, PhotoAssetWithLead } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function PhotosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAssetWithLead | null>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: () => getPhotos(50),
  });

  const filteredPhotos = photos?.filter((p) => {
    if (filter === "pending") return !p.is_verified;
    if (filter === "verified") return p.is_verified;
    return true;
  });

  const stats = {
    total: photos?.length || 0,
    pending: photos?.filter((p) => !p.is_verified).length || 0,
    verified: photos?.filter((p) => p.is_verified).length || 0,
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Photo Gallery</h1>
            <p className="text-slate-500">Review and verify patient photos</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-500">Total Photos</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
              <div className="text-sm text-slate-500">Pending Review</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-emerald-500">{stats.verified}</div>
              <div className="text-sm text-slate-500">Verified</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg text-slate-800">All Photos</h2>
                <div className="flex gap-2">
                  {(["all", "pending", "verified"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-colors",
                        filter === f
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Grid */}
            <div className="p-4">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredPhotos?.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Image className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No photos found</p>
                  <p className="text-sm">Photos will appear here when patients upload them</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredPhotos?.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-emerald-500 transition-all"
                    >
                      {/* Photo Image */}
                      {photo.signed_url ? (
                        <img
                          src={photo.signed_url}
                          alt={photo.checklist_key || "Photo"}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <Image className="h-8 w-8 text-slate-400" />
                      </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="h-8 w-8 text-white" />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {photo.is_verified ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">?</span>
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-xs truncate">
                          {photo.leads?.lead_profile?.name || "Unknown"}
                        </p>
                        <p className="text-white/70 text-xs">
                          {photo.checklist_key || "General"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-slate-200 flex items-center justify-center">
              {selectedPhoto.signed_url ? (
                <img
                  src={selectedPhoto.signed_url}
                  alt={selectedPhoto.checklist_key || "Photo"}
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
              <Image className="h-16 w-16 text-slate-400" />
              )}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">
                    {selectedPhoto.leads?.lead_profile?.name || "Unknown Patient"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedPhoto.checklist_key || "General Photo"} • {formatDistanceToNow(new Date(selectedPhoto.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedPhoto.signed_url && (
                    <a
                      href={selectedPhoto.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                    <Download className="h-5 w-5 text-slate-600" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" />
                  Verify
                </button>
                <button className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                  <X className="h-5 w-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

