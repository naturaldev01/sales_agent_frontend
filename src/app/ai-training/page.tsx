"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  Bot,
  UserCircle,
  User,
} from "lucide-react";
import {
  getFeedbackStats,
  rateAiMessage,
  getConversations,
  getConversationMessages,
  Message,
  Conversation,
} from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function AITrainingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">AI Training Center</h1>
                <p className="text-slate-500">AI mesajlarını değerlendirin - Önerileriniz otomatik olarak AI'a öğretilir</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Conversations */}
          <ConversationsTab />
        </main>
      </div>
    </div>
  );
}

function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ["feedback-stats"],
    queryFn: getFeedbackStats,
  });

  const cards = [
    {
      label: "Toplam AI Mesajı",
      value: stats?.total || 0,
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Bekleyen",
      value: stats?.pending || 0,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "İyi",
      value: stats?.good || 0,
      icon: ThumbsUp,
      color: "from-emerald-500 to-green-600",
    },
    {
      label: "Kötü",
      value: stats?.bad || 0,
      icon: ThumbsDown,
      color: "from-red-500 to-rose-600",
    },
    {
      label: "Geliştirilebilir",
      value: stats?.improvable || 0,
      icon: AlertCircle,
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", card.color)}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationsTab() {
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations-for-training"],
    queryFn: () => getConversations(100),
  });

  const toggleConversation = (id: string) => {
    setExpandedConversations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchTerm) return true;
    const name = conv.leads?.lead_profile?.name?.toLowerCase() || "";
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hasta adına göre ara..."
            className="w-full pl-10 pr-4 py-2 bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
          ))
        ) : filteredConversations?.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Konuşma bulunamadı</p>
          </div>
        ) : (
          filteredConversations?.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              isExpanded={expandedConversations.has(conv.id)}
              onToggle={() => toggleConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationCard({
  conversation,
  isExpanded,
  onToggle,
}: {
  conversation: Conversation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["conversation-messages", conversation.id],
    queryFn: () => getConversationMessages(conversation.id, 100),
    enabled: isExpanded,
  });

  const leadName = conversation.leads?.lead_profile?.name || "Bilinmeyen Hasta";
  const aiMessageCount = messages?.filter((m) => m.sender_type === "ai").length || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {leadName[0]?.toUpperCase() || "?"}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">{leadName}</h3>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {conversation.message_count || 0} mesaj
              </span>
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {aiMessageCount} AI cevabı
              </span>
              <span>
                {conversation.last_message_at
                  ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                  : "-"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              conversation.leads?.status === "READY_FOR_DOCTOR"
                ? "bg-green-100 text-green-700"
                : conversation.leads?.status === "QUALIFYING"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {conversation.leads?.status || "UNKNOWN"}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content - Messages */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : messages?.length === 0 ? (
            <p className="text-center text-slate-500 py-4">Bu konuşmada mesaj yok</p>
          ) : (
            <div className="space-y-4">
              {messages?.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showRating={message.sender_type === "ai"}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  showRating,
}: {
  message: Message;
  showRating: boolean;
}) {
  const [rating, setRating] = useState<"good" | "bad" | "improvable" | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [suggestedResponse, setSuggestedResponse] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [autoLearnedMessage, setAutoLearnedMessage] = useState("");
  const queryClient = useQueryClient();

  // Check if this message already has feedback
  const existingFeedback = message.ai_message_feedback && message.ai_message_feedback.length > 0;

  const rateMutation = useMutation({
    mutationFn: (data: {
      rating: "good" | "bad" | "improvable";
      comment?: string;
      suggested_response?: string;
    }) => rateAiMessage(message.id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedback-stats"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      queryClient.invalidateQueries({ queryKey: ["conversation-messages"] });
      setShowCommentBox(false);
      
      // Show success toast with auto-learn message
      if ((variables.rating === "bad" || variables.rating === "improvable") && variables.suggested_response) {
        setAutoLearnedMessage("✨ AI bu örneği öğrendi! Knowledge Base'e eklendi.");
      } else {
        setAutoLearnedMessage("Değerlendirme kaydedildi.");
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    },
  });

  const handleRate = (newRating: "good" | "bad" | "improvable") => {
    setRating(newRating);
    if (newRating === "good") {
      // Good ratings can be submitted immediately
      rateMutation.mutate({ rating: newRating });
    } else {
      // Show comment box for bad/improvable
      setShowCommentBox(true);
    }
  };

  const handleSubmitWithComment = () => {
    if (rating) {
      rateMutation.mutate({
        rating,
        comment: comment || undefined,
        suggested_response: suggestedResponse || undefined,
      });
    }
  };

  const isPatient = message.sender_type === "patient";
  const isAi = message.sender_type === "ai";

  return (
    <div className={cn("flex flex-col", isPatient ? "items-start" : "items-end")}>
      {/* Sender Label */}
      <div
        className={cn(
          "flex items-center gap-1 text-xs text-slate-500 mb-1",
          isPatient ? "ml-2" : "mr-2"
        )}
      >
        {isPatient ? (
          <>
            <UserCircle className="h-3 w-3" />
            Hasta
          </>
        ) : isAi ? (
          <>
            <Bot className="h-3 w-3" />
            AI
          </>
        ) : (
          <>
            <User className="h-3 w-3" />
            {message.sender_type}
          </>
        )}
        <span className="mx-1">•</span>
        <span>
          {message.created_at
            ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
            : "-"}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          "max-w-[80%] p-3 rounded-2xl",
          isPatient
            ? "bg-white border border-slate-200 rounded-tl-sm"
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-tr-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Rating Buttons - Only for AI messages without existing feedback */}
      {showRating && !rating && !rateMutation.isSuccess && !existingFeedback && (
        <div className="flex items-center gap-2 mt-2 mr-2">
          <span className="text-xs text-slate-400 mr-1">Değerlendir:</span>
          <button
            onClick={() => handleRate("good")}
            disabled={rateMutation.isPending}
            className="p-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
            title="İyi"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRate("improvable")}
            disabled={rateMutation.isPending}
            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
            title="Geliştirilebilir"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRate("bad")}
            disabled={rateMutation.isPending}
            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            title="Kötü"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Rating Badge - After rated */}
      {(rating || rateMutation.isSuccess) && !showCommentBox && (
        <div className="mt-2 mr-2 flex flex-col items-end gap-1">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
              rating === "good" && "bg-green-100 text-green-700",
              rating === "bad" && "bg-red-100 text-red-700",
              rating === "improvable" && "bg-amber-100 text-amber-700"
            )}
          >
            {rating === "good" && (
              <>
                <ThumbsUp className="h-3 w-3" /> İyi
              </>
            )}
            {rating === "bad" && (
              <>
                <ThumbsDown className="h-3 w-3" /> Kötü
              </>
            )}
            {rating === "improvable" && (
              <>
                <AlertCircle className="h-3 w-3" /> Geliştirilebilir
              </>
            )}
          </span>
          
          {/* Success Toast - Auto Learn Message */}
          {showSuccessToast && (
            <div className="animate-in fade-in slide-in-from-top-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs rounded-lg shadow-lg flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              {autoLearnedMessage}
            </div>
          )}
        </div>
      )}

      {/* Existing Feedback Display - Show previous comments below AI messages */}
      {showRating && message.ai_message_feedback && message.ai_message_feedback.length > 0 && (
        <div className="mt-2 mr-2 w-full max-w-[80%] ml-auto space-y-1">
          {message.ai_message_feedback.map((feedback) => (
            <div
              key={feedback.id}
              className={cn(
                "px-3 py-2 rounded-lg border text-xs",
                feedback.rating === "good" && "bg-green-50 border-green-200",
                feedback.rating === "bad" && "bg-red-50 border-red-200",
                feedback.rating === "improvable" && "bg-amber-50 border-amber-200"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-medium",
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
                {feedback.created_at && (
                  <span className="text-slate-400">
                    • {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              {feedback.comment && (
                <p className="text-slate-600 mb-1">{feedback.comment}</p>
              )}
              {feedback.suggested_response && (
                <div className="mt-1 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Önerilen:</span>
                  <p className="text-slate-700 mt-0.5">{feedback.suggested_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Box - For bad/improvable ratings */}
      {showCommentBox && (
        <div className="mt-3 w-full max-w-[80%] bg-white border border-slate-200 rounded-xl p-4 ml-auto">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Yorum (Opsiyonel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bu cevap neden kötü/geliştirilebilir?"
                className="w-full p-2 text-sm bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nasıl Olmalıydı? (Önerilen Cevap)
              </label>
              <textarea
                value={suggestedResponse}
                onChange={(e) => setSuggestedResponse(e.target.value)}
                placeholder="AI'ın vermesi gereken doğru cevap..."
                className="w-full p-2 text-sm bg-white text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCommentBox(false);
                  setRating(null);
                }}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={handleSubmitWithComment}
                disabled={rateMutation.isPending}
                className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {rateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

