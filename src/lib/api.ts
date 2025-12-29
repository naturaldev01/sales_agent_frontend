// Backend API Client
// This replaces direct Supabase calls with backend API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface Lead {
  id: string;
  status: string;
  channel: string;
  channel_user_id: string | null;
  language: string | null;
  country: string | null;
  treatment_category: string | null;
  desire_score: number | null;
  desire_band: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  lead_profile?: LeadProfile | null;
}

export interface LeadProfile {
  lead_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  complaint: string | null;
  has_previous_treatment: string | null;
  consent_given: boolean | null;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: string;
  state: string | null;
  last_message_at: string | null;
  message_count: number | null;
  is_active: boolean | null;
  created_at: string;
  leads?: {
    id: string;
    status: string;
    channel: string;
    lead_profile?: {
      name: string | null;
    } | null;
  } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  lead_id: string;
  direction: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  sender_type: string;
  created_at: string;
}

export interface PhotoAsset {
  id: string;
  lead_id: string;
  checklist_key: string | null;
  storage_path: string;
  file_name: string | null;
  quality_score: number | null;
  is_verified: boolean | null;
  uploaded_at: string;
  created_at: string;
  signed_url?: string | null;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  byDesireBand: Record<string, number>;
  readyForDoctor: number;
  hotLeads: number;
}

// API functions

// Leads
export async function getLeads(filters?: {
  status?: string;
  treatment?: string;
  desireBand?: string;
}): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.treatment) params.append("treatment", filters.treatment);
  if (filters?.desireBand) params.append("desireBand", filters.desireBand);

  const query = params.toString();
  return fetchApi<Lead[]>(`/leads${query ? `?${query}` : ""}`);
}

export async function getLead(id: string): Promise<Lead> {
  return fetchApi<Lead>(`/leads/${id}`);
}

export async function updateLeadStatus(id: string, status: string): Promise<Lead> {
  return fetchApi<Lead>(`/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getLeadPhotos(id: string): Promise<PhotoAsset[]> {
  return fetchApi<PhotoAsset[]>(`/leads/${id}/photos`);
}

export async function getLeadStats(): Promise<LeadStats> {
  const stats = await fetchApi<{
    total: number;
    byStatus: Record<string, number>;
    byDesireBand: Record<string, number>;
  }>("/leads/statistics");

  return {
    ...stats,
    readyForDoctor: stats.byStatus?.["READY_FOR_DOCTOR"] || 0,
    hotLeads: stats.byDesireBand?.["high"] || 0,
  };
}

// Conversations
export async function getConversations(limit?: number): Promise<Conversation[]> {
  const params = limit ? `?limit=${limit}` : "";
  return fetchApi<Conversation[]>(`/conversations${params}`);
}

export async function getLeadConversations(leadId: string): Promise<Conversation[]> {
  return fetchApi<Conversation[]>(`/conversations/lead/${leadId}`);
}

export async function getConversation(id: string): Promise<Conversation> {
  return fetchApi<Conversation>(`/conversations/${id}`);
}

export async function getConversationMessages(
  conversationId: string,
  limit?: number
): Promise<Message[]> {
  const params = limit ? `?limit=${limit}` : "";
  return fetchApi<Message[]>(`/conversations/${conversationId}/messages${params}`);
}

// Photos
export interface PhotoAssetWithLead extends PhotoAsset {
  signed_url?: string | null;
  leads?: {
    id: string;
    status: string;
    lead_profile?: {
      name: string | null;
    } | null;
  } | null;
}

export async function getPhotos(limit?: number): Promise<PhotoAssetWithLead[]> {
  const params = limit ? `?limit=${limit}` : "";
  return fetchApi<PhotoAssetWithLead[]>(`/photos${params}`);
}

export async function verifyPhoto(id: string): Promise<PhotoAsset> {
  return fetchApi<PhotoAsset>(`/photos/${id}/verify`, {
    method: "PATCH",
    headers: getAuthHeader(),
  });
}

export async function rejectPhoto(id: string, reason: string): Promise<PhotoAsset> {
  return fetchApi<PhotoAsset>(`/photos/${id}/reject`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ reason }),
  });
}

// Settings
export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: Record<string, unknown>;
  description: string | null;
  is_active: boolean | null;
}

export async function getConfigs(): Promise<SystemConfig[]> {
  return fetchApi<SystemConfig[]>("/settings/configs");
}

// Notifications
export interface NotificationItem {
  id: string;
  type: "new_lead" | "new_photo" | "new_message";
  title: string;
  message: string;
  leadId?: string;
  photoId?: string;
  createdAt: string;
}

export async function getNotifications(since?: string): Promise<NotificationItem[]> {
  const params = since ? `?since=${encodeURIComponent(since)}` : "";
  return fetchApi<NotificationItem[]>(`/notifications${params}`);
}

// Doctor Comments
export interface DoctorComment {
  id: string;
  lead_id: string;
  user_id: string;
  comment: string;
  comment_type: "note" | "diagnosis" | "recommendation" | "internal" | "followup";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
  };
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function getLeadComments(leadId: string): Promise<DoctorComment[]> {
  return fetchApi<DoctorComment[]>(`/comments/lead/${leadId}`, {
    headers: getAuthHeader(),
  });
}

export async function createComment(
  leadId: string,
  data: { comment: string; comment_type?: string; is_pinned?: boolean }
): Promise<DoctorComment> {
  return fetchApi<DoctorComment>(`/comments/lead/${leadId}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: getAuthHeader(),
  });
}

export async function updateComment(
  id: string,
  data: { comment?: string; comment_type?: string; is_pinned?: boolean }
): Promise<DoctorComment> {
  return fetchApi<DoctorComment>(`/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: getAuthHeader(),
  });
}

export async function deleteComment(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/comments/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}

export async function toggleCommentPin(id: string): Promise<DoctorComment> {
  return fetchApi<DoctorComment>(`/comments/${id}/pin`, {
    method: "PATCH",
    headers: getAuthHeader(),
  });
}

// ==================== ADMIN API ====================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  approved_at?: string;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  return fetchApi<AdminUser[]>("/auth/admin/users", {
    headers: getAuthHeader(),
  });
}

export async function getPendingUsers(): Promise<AdminUser[]> {
  return fetchApi<AdminUser[]>("/auth/admin/users/pending", {
    headers: getAuthHeader(),
  });
}

export async function approveUser(userId: string, approved: boolean): Promise<AdminUser> {
  return fetchApi<AdminUser>(`/auth/admin/users/${userId}/approve`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ approved }),
  });
}

export async function updateUserRole(userId: string, role: string): Promise<AdminUser> {
  return fetchApi<AdminUser>(`/auth/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ role }),
  });
}

// ==================== AI TRAINING API ====================

export interface AiMessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  rating: "good" | "bad" | "improvable";
  comment: string | null;
  suggested_response: string | null;
  created_at: string | null;
  updated_at: string | null;
  users?: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
  };
}

export interface AiMessageWithContext {
  id: string;
  content: string | null;
  created_at: string | null;
  sender_type: string;
  conversation_id: string;
  lead_id: string;
  feedback?: AiMessageFeedback | null;
  context_messages: Array<{
    id: string;
    content: string | null;
    sender_type: string;
    created_at: string | null;
  }>;
  lead?: {
    id: string;
    status: string;
    language: string | null;
    treatment_category: string | null;
    lead_profile?: {
      name: string | null;
    } | null;
  } | null;
}

export interface KnowledgeBaseEntry {
  id: string;
  category: string;
  language: string | null;
  trigger_keywords: string[] | null;
  scenario: string | null;
  bad_response: string | null;
  good_response: string;
  context_notes: string | null;
  source_feedback_id: string | null;
  is_active: boolean | null;
  priority: number | null;
  usage_count: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  users?: {
    id: string;
    name: string;
  };
}

export interface FeedbackStats {
  total: number;
  good: number;
  bad: number;
  improvable: number;
  pending: number;
}

// AI Messages
export async function getAiMessages(options?: {
  page?: number;
  limit?: number;
  rating?: "pending" | "good" | "bad" | "improvable";
  leadId?: string;
}): Promise<{ messages: AiMessageWithContext[]; total: number; page: number }> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.rating) params.append("rating", options.rating);
  if (options?.leadId) params.append("leadId", options.leadId);

  const query = params.toString();
  return fetchApi<{ messages: AiMessageWithContext[]; total: number; page: number }>(
    `/ai-training/messages${query ? `?${query}` : ""}`,
    { headers: getAuthHeader() }
  );
}

export async function getAiMessageById(messageId: string): Promise<AiMessageWithContext | null> {
  return fetchApi<AiMessageWithContext | null>(`/ai-training/messages/${messageId}`, {
    headers: getAuthHeader(),
  });
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  return fetchApi<FeedbackStats>("/ai-training/stats", {
    headers: getAuthHeader(),
  });
}

export async function rateAiMessage(
  messageId: string,
  data: {
    rating: "good" | "bad" | "improvable";
    comment?: string;
    suggested_response?: string;
  }
): Promise<AiMessageFeedback> {
  return fetchApi<AiMessageFeedback>(`/ai-training/messages/${messageId}/rate`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
}

export async function updateAiMessageRating(
  messageId: string,
  data: {
    rating?: "good" | "bad" | "improvable";
    comment?: string;
    suggested_response?: string;
  }
): Promise<AiMessageFeedback> {
  return fetchApi<AiMessageFeedback>(`/ai-training/messages/${messageId}/rate`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
}

// Knowledge Base
export async function getKnowledgeBase(options?: {
  category?: string;
  language?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<KnowledgeBaseEntry[]> {
  const params = new URLSearchParams();
  if (options?.category) params.append("category", options.category);
  if (options?.language) params.append("language", options.language);
  if (options?.search) params.append("search", options.search);
  if (options?.activeOnly !== undefined) params.append("activeOnly", options.activeOnly.toString());

  const query = params.toString();
  return fetchApi<KnowledgeBaseEntry[]>(
    `/ai-training/knowledge-base${query ? `?${query}` : ""}`,
    { headers: getAuthHeader() }
  );
}

export async function getKnowledgeBaseById(id: string): Promise<KnowledgeBaseEntry | null> {
  return fetchApi<KnowledgeBaseEntry | null>(`/ai-training/knowledge-base/${id}`, {
    headers: getAuthHeader(),
  });
}

export async function createKnowledgeBaseEntry(data: {
  category: string;
  language?: string;
  trigger_keywords?: string[];
  scenario?: string;
  bad_response?: string;
  good_response: string;
  context_notes?: string;
  source_feedback_id?: string;
  priority?: number;
}): Promise<KnowledgeBaseEntry> {
  return fetchApi<KnowledgeBaseEntry>("/ai-training/knowledge-base", {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
}

export async function updateKnowledgeBaseEntry(
  id: string,
  data: {
    category?: string;
    language?: string;
    trigger_keywords?: string[];
    scenario?: string;
    bad_response?: string;
    good_response?: string;
    context_notes?: string;
    is_active?: boolean;
    priority?: number;
  }
): Promise<KnowledgeBaseEntry> {
  return fetchApi<KnowledgeBaseEntry>(`/ai-training/knowledge-base/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
}

export async function deleteKnowledgeBaseEntry(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/ai-training/knowledge-base/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
}
