"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  X,
  User,
  MessageSquare,
  Image,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Send,
  Pin,
  Trash2,
  Edit3,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Bot,
} from "lucide-react";
import {
  getLead,
  getLeadConversations,
  getConversationMessages,
  getLeadPhotos,
  updateLeadStatus,
  getLeadComments,
  createComment,
  deleteComment,
  toggleCommentPin,
  verifyPhoto,
  rejectPhoto,
  Lead,
  Message,
  DoctorComment,
  PhotoAsset,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface LeadDetailProps {
  leadId: string | null;
  onClose?: () => void;
}

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "QUALIFYING", label: "Qualifying" },
  { value: "PHOTO_REQUESTED", label: "Photo Requested" },
  { value: "PHOTO_COLLECTING", label: "Photo Collecting" },
  { value: "READY_FOR_DOCTOR", label: "Ready for Doctor" },
  { value: "WAITING_FOR_USER", label: "Waiting for User" },
  { value: "DORMANT", label: "Dormant" },
  { value: "HANDOFF_HUMAN", label: "Handoff to Human" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED", label: "Closed" },
];

export function LeadDetail({ leadId, onClose }: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<"info" | "messages" | "photos" | "notes">("info");
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    enabled: !!leadId,
    queryFn: () => getLead(leadId!),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", leadId],
    enabled: !!leadId,
    queryFn: () => getLeadConversations(leadId!),
  });

  const { data: photos } = useQuery({
    queryKey: ["photos", leadId],
    enabled: !!leadId,
    queryFn: () => getLeadPhotos(leadId!),
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", leadId],
    enabled: !!leadId && isAuthenticated,
    queryFn: () => getLeadComments(leadId!),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateLeadStatus(leadId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });

  if (!leadId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center text-slate-500">
          <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Select a lead</p>
          <p className="text-sm">Choose a lead from the list to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading || !lead) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
    );
  }

  const profile = lead.lead_profile;
  const name = profile?.name || "Unknown Lead";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div
              className={cn(
                "h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold text-white shadow-lg",
                lead.desire_band === "high"
                  ? "bg-gradient-to-br from-orange-400 to-red-500"
                  : lead.desire_band === "medium"
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              )}
            >
              {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">{name}</h2>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                <span
                  className={cn(
                    "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium",
                    `status-${lead.status.toLowerCase()}`
                  )}
                >
                  {lead.status}
                </span>
                {lead.treatment_category && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm">
                    {lead.treatment_category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Update */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-xs sm:text-sm font-medium text-slate-600">
            Update Status:
          </label>
          <div className="flex items-center gap-2">
            <select
              value={lead.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              disabled={statusMutation.isPending}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {statusMutation.isPending && (
              <span className="text-xs sm:text-sm text-slate-500">Updating...</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex min-w-max">
          {[
            { id: "info", label: "Info", icon: User },
            { id: "messages", label: "Messages", icon: MessageSquare },
            { id: "photos", label: "Photos", icon: Image, count: photos?.length },
            { id: "notes", label: "Notes", icon: MessageCircle, count: comments?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {activeTab === "info" && <InfoTab lead={lead} />}
        {activeTab === "messages" && conversations?.[0] && (
          <MessagesTab conversationId={conversations[0].id} />
        )}
        {activeTab === "photos" && <PhotosTab photos={photos || []} leadId={leadId!} />}
        {activeTab === "notes" && (
          <NotesTab 
            leadId={leadId!} 
            comments={comments || []} 
            currentUserId={user?.id}
            userRole={user?.role}
          />
        )}
      </div>
    </div>
  );
}

function InfoTab({ lead }: { lead: Lead }) {
  const profile = lead.lead_profile;

  const infoItems = [
    { icon: User, label: "Name", value: profile?.name },
    { icon: Phone, label: "Phone", value: profile?.phone },
    { icon: Mail, label: "Email", value: profile?.email },
    { icon: MapPin, label: "Location", value: [profile?.city, lead.country].filter(Boolean).join(", ") },
    { icon: Globe, label: "Language", value: lead.language?.toUpperCase() },
    { icon: Clock, label: "Created", value: format(new Date(lead.created_at), "PPp") },
  ];

  return (
    <div className="space-y-6">
      {/* Score */}
      {lead.desire_score !== null && (
        <div className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Lead Score</h3>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "text-4xl font-bold",
                lead.desire_band === "high"
                  ? "text-green-600"
                  : lead.desire_band === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              )}
            >
              {lead.desire_score}
            </div>
            <div className="flex-1">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    lead.desire_band === "high"
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : lead.desire_band === "medium"
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                      : "bg-gradient-to-r from-red-400 to-rose-500"
                  )}
                  style={{ width: `${lead.desire_score}%` }}
                />
              </div>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium capitalize",
                `desire-${lead.desire_band}`
              )}
            >
              {lead.desire_band}
            </span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <item.icon className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="font-medium">{item.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Complaint */}
      {profile?.complaint && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Complaint / Concern
          </h3>
          <p className="text-amber-900">{profile.complaint}</p>
        </div>
      )}
    </div>
  );
}

function MessagesTab({ conversationId }: { conversationId: string }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getConversationMessages(conversationId),
  });

  if (isLoading) {
    return <div className="text-center text-slate-500 py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-4">
      {messages?.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {messages?.length === 0 && (
        <div className="text-center text-slate-500 py-8">
          No messages yet
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isIncoming = message.direction === "in";
  const isAi = message.sender_type === "ai";

  return (
    <div className={cn("flex flex-col", isIncoming ? "items-start" : "items-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isIncoming
            ? "bg-slate-100 rounded-tl-sm"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-sm"
        )}
      >
        <p className="text-sm">{message.content}</p>
        <div
          className={cn(
            "text-xs mt-1",
            isIncoming ? "text-slate-400" : "text-white/70"
          )}
        >
          {format(new Date(message.created_at), "p")} •{" "}
          {isAi ? (
            <span className="inline-flex items-center gap-0.5">
              <Bot className="h-3 w-3" /> AI
            </span>
          ) : (
            message.sender_type
          )}
        </div>
      </div>

      {/* Show feedback below AI messages */}
      {isAi && message.ai_message_feedback && message.ai_message_feedback.length > 0 && (
        <div className="mt-1.5 max-w-[80%] space-y-1">
          {message.ai_message_feedback.map((feedback) => (
            <div
              key={feedback.id}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border text-xs",
                feedback.rating === "good" && "bg-green-50 border-green-200",
                feedback.rating === "bad" && "bg-red-50 border-red-200",
                feedback.rating === "improvable" && "bg-amber-50 border-amber-200"
              )}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    feedback.rating === "good" && "text-green-700",
                    feedback.rating === "bad" && "text-red-700",
                    feedback.rating === "improvable" && "text-amber-700"
                  )}
                >
                  {feedback.rating === "good" && <ThumbsUp className="h-3 w-3" />}
                  {feedback.rating === "bad" && <ThumbsDown className="h-3 w-3" />}
                  {feedback.rating === "improvable" && <AlertCircle className="h-3 w-3" />}
                  {feedback.rating === "good" ? "İyi" : feedback.rating === "bad" ? "Kötü" : "Geliştirilebilir"}
                </span>
                {feedback.users?.name && (
                  <span className="text-slate-500">• {feedback.users.name}</span>
                )}
              </div>
              {feedback.comment && (
                <p className="text-slate-600 mt-0.5">{feedback.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Roles that can add doctor comments
const DOCTOR_COMMENT_ROLES = ['doctor', 'admin'];

function NotesTab({ 
  leadId, 
  comments, 
  currentUserId,
  userRole
}: { 
  leadId: string; 
  comments: DoctorComment[]; 
  currentUserId?: string;
  userRole?: string;
}) {
  const canAddComments = userRole && DOCTOR_COMMENT_ROLES.includes(userRole);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<string>("note");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { comment: string; comment_type: string }) =>
      createComment(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", leadId] });
      setNewComment("");
    },
    onError: (error: Error) => {
      console.error("Failed to create comment:", error);
      alert("Failed to add note: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", leadId] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => toggleCommentPin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", leadId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ comment: newComment, comment_type: commentType });
  };

  const commentTypeColors: Record<string, string> = {
    note: "bg-slate-100 text-slate-700",
    diagnosis: "bg-purple-100 text-purple-700",
    recommendation: "bg-blue-100 text-blue-700",
    internal: "bg-amber-100 text-amber-700",
    followup: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Form - Only for doctors and admins */}
      {canAddComments ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[120px]"
            >
              <option value="note">📝 Note</option>
              <option value="diagnosis">🔬 Diagnosis</option>
              <option value="recommendation">💡 Recommendation</option>
              <option value="internal">🔒 Internal</option>
              <option value="followup">📅 Follow-up</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your note..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none min-w-0"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || createMutation.isPending}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end sm:self-end shrink-0"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-sm">
          <p>📋 Only doctors and admins can add notes. Your role: <strong className="capitalize">{userRole || 'unknown'}</strong></p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p>No notes yet</p>
            <p className="text-sm">Add your first note above</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "p-3 sm:p-4 rounded-xl border",
                comment.is_pinned
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-slate-200"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                    {comment.users?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {comment.users?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-start shrink-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                      commentTypeColors[comment.comment_type] || commentTypeColors.note
                    )}
                  >
                    {comment.comment_type}
                  </span>
                  {comment.user_id === currentUserId && (
                    <>
                      <button
                        onClick={() => pinMutation.mutate(comment.id)}
                        className={cn(
                          "p-1 rounded hover:bg-slate-100 transition-colors",
                          comment.is_pinned ? "text-amber-500" : "text-slate-400"
                        )}
                        title={comment.is_pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this note?")) {
                            deleteMutation.mutate(comment.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                {comment.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PhotosTab({ photos, leadId }: { photos: PhotoAsset[]; leadId: string }) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyPhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", leadId] });
      setSelectedPhoto(null);
    },
    onError: (error) => {
      console.error("Failed to verify photo:", error);
      alert("Failed to verify photo. Please try again.");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPhoto(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", leadId] });
      setSelectedPhoto(null);
      setShowRejectModal(false);
      setRejectReason("");
    },
    onError: (error) => {
      console.error("Failed to reject photo:", error);
      alert("Failed to reject photo. Please try again.");
    },
  });

  const handleVerify = () => {
    if (selectedPhoto) {
      verifyMutation.mutate(selectedPhoto.id);
    }
  };

  const handleOpenRejectModal = () => {
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (selectedPhoto && rejectReason.trim()) {
      rejectMutation.mutate({ id: selectedPhoto.id, reason: rejectReason.trim() });
    }
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason("");
  };

  // Stats
  const stats = {
    total: photos.length,
    pending: photos.filter(p => !p.is_verified).length,
    verified: photos.filter(p => p.is_verified).length,
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Stats Summary */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-slate-400"></span>
          <span className="text-slate-600">{stats.total} Total</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span className="text-slate-600">{stats.pending} Pending</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600">{stats.verified} Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className={cn(
              "aspect-square bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer transition-all",
              photo.is_verified 
                ? "ring-2 ring-emerald-500 hover:ring-emerald-400" 
                : "hover:ring-2 hover:ring-amber-500"
            )}
          >
            {photo.signed_url ? (
              <img
                src={photo.signed_url}
                alt={photo.checklist_key || "Photo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image className="h-8 w-8 text-slate-300" />
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <p className="text-xs text-white truncate">
                {photo.checklist_key || "Photo"}
              </p>
            </div>
            {/* Status badge */}
            <div className="absolute top-2 right-2">
              {photo.is_verified ? (
                <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal with Approve/Reject */}
      {selectedPhoto && !showRejectModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
              {selectedPhoto.signed_url ? (
                <img
                  src={selectedPhoto.signed_url}
                  alt={selectedPhoto.checklist_key || "Photo"}
                  className="w-full h-full object-contain"
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

            {/* Info and Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">
                    {selectedPhoto.checklist_key || "Photo"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Uploaded {format(new Date(selectedPhoto.created_at), "PPp")}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              {selectedPhoto.is_verified && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-emerald-700 text-sm font-medium">
                    This photo has been verified ✓
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending || selectedPhoto.is_verified === true}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {verifyMutation.isPending ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={handleOpenRejectModal}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <X className="h-5 w-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
          onClick={handleCloseRejectModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Reject Photo</h3>
                <p className="text-sm text-slate-500">The patient will be notified</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejection. This message will be sent to the patient so they can submit better photos.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Photo is blurry, please send a clearer one from the front angle..."
              className="w-full p-3 border border-slate-200 rounded-lg resize-none h-28 focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-700 placeholder:text-slate-400"
              autoFocus
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCloseRejectModal}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Reject & Notify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

