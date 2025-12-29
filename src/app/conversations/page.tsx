"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MessageSquare, User, Clock, ChevronRight } from "lucide-react";
import { getConversations, getConversationMessages, Conversation } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversations(50),
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Conversations</h1>
            <p className="text-slate-500">View all patient conversations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-slate-800">All Conversations</h2>
                    <span className="text-sm text-slate-500">{conversations?.length || 0} total</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-slate-200" />
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                            <div className="h-3 w-24 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : conversations?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    conversations?.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedId === conv.id
                            ? "bg-emerald-50 border-l-4 border-emerald-500"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {conv.leads?.lead_profile?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 truncate">
                                {conv.leads?.lead_profile?.name || "Unknown"}
                              </span>
                              <span className="text-lg">
                                {conv.channel === "whatsapp" ? "💬" : conv.channel === "telegram" ? "✈️" : "🌐"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MessageSquare className="h-3 w-3" />
                              <span>{conv.message_count || 0} messages</span>
                              {conv.state && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                                  {conv.state}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400">
                              {conv.last_message_at
                                ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                                : "No messages"}
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 mt-1 ml-auto" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Detail */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px]">
                {selectedId ? (
                  <ConversationDetail conversationId={selectedId} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm">Choose a conversation from the list to view messages</p>
                    </div>
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

function ConversationDetail({ conversationId }: { conversationId: string }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getConversationMessages(conversationId),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Conversation</h3>
        <p className="text-sm text-slate-500">{messages?.length || 0} messages</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] p-3 rounded-2xl",
              msg.direction === "in"
                ? "bg-slate-100 text-slate-800 mr-auto rounded-bl-sm"
                : "bg-emerald-500 text-white ml-auto rounded-br-sm"
            )}
          >
            <p className="text-sm">{msg.content}</p>
            <p
              className={cn(
                "text-xs mt-1",
                msg.direction === "in" ? "text-slate-400" : "text-emerald-100"
              )}
            >
              {msg.sender_type} • {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
            </p>
          </div>
        ))}

        {messages?.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <p>No messages in this conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

