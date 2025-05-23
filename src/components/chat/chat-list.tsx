/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import type { Conversation, Label } from "@/types/chats";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiSave,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/components/providers/auth-provider";
import ContactSelectionModal from "./contact-selection-modal";
import ChatListItem from "./chat-list-item";
import { dataSyncService } from "@/lib/data-sync";
import { formatChatListDate } from "@/utils/date-util";

export default function ChatList({
  selectedConversationId,
  onSelectConversation,
}: {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected && selected !== selectedConversationId) {
      onSelectConversation(selected);
    }
  }, [searchParams, selectedConversationId, onSelectConversation]);

  const fetchLabels = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("labels").select("*");

      if (error) {
        console.error("Error fetching labels:", error);
        return;
      }

      setLabels(data || []);
    } catch (error) {
      console.error("Error in fetchLabels:", error);
    }
  }, [supabase]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    console.log("Fetching conversations for user:", user.id);

    try {
      const localConversations = await dataSyncService.getLocalConversations();

      if (localConversations.length > 0) {
        setConversations(localConversations);
        setIsLoading(false);
      }

      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("*")
          .contains("participants", [user.id])
          .order("last_message_at", { ascending: false });

      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const allParticipantIds = new Set<string>();
      conversationsData.forEach((conv) => {
        conv.participants.forEach((id: string) => {
          if (id !== user.id) {
            allParticipantIds.add(id);
          }
        });
      });

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, fullname, username, image, phone")
        .in("id", Array.from(allParticipantIds));

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return;
      }

      const userMap = new Map();
      usersData.forEach((userData) => {
        userMap.set(userData.id, userData);
      });

      const { data: labelData, error: labelError } = await supabase
        .from("conversation_labels")
        .select(
          `
          conversation_id,
          label:label_id(id, name, color)
        `
        )
        .in(
          "conversation_id",
          conversationsData.map((c) => c.id)
        );

      if (labelError) {
        console.error("Error fetching conversation labels:", labelError);
        return;
      }

      const labelMap = new Map<string, Label[]>();
      labelData.forEach((item) => {
        if (!labelMap.has(item.conversation_id)) {
          labelMap.set(item.conversation_id, []);
        }
        labelMap.get(item.conversation_id)?.push(item.label as unknown as Label);
      });

      const unreadCounts = new Map<string, number>();
      for (const conv of conversationsData) {
        const { count, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .not("read_by", "cs", `{${user.id}}`);

        if (countError) {
          console.error("Error counting unread messages:", countError);
          unreadCounts.set(conv.id, 0);
        } else {
          unreadCounts.set(conv.id, count || 0);
        }
      }

      const processedConversations = conversationsData.map((conv) => {
        const participantsInfo = conv.participants
          .filter((id: string) => id !== user.id)
          .map(
            (id: string) =>
              userMap.get(id) || {
                id,
                fullname: "Unknown",
                username: "unknown",
                image: null,
                phone: null,
              }
          );

        let title = conv.title;
        if (!conv.is_group && participantsInfo.length > 0) {
          title = participantsInfo[0].fullname;
        }

        const processedConv = {
          ...conv,
          title,
          labels: labelMap.get(conv.id) || [],
          unread_count: unreadCounts.get(conv.id) || 0,
          participants_info: participantsInfo,
        };

        dataSyncService.saveConversationLocally(processedConv);

        return processedConv;
      });

      setConversations(processedConversations);
    } catch (error) {
      console.error("Error in fetchConversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchLabels();
      fetchConversations();
    }
  }, [user, fetchLabels, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const conversationsSubscription = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participants=cs.{${user.id}}`,
        },
        (payload) => {
          console.log("Conversations changed:", payload);
          fetchConversations();
        }
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message:", payload);
          fetchConversations();
        }
      )
      .subscribe();

    const labelsSubscription = supabase
      .channel("conversation-labels-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_labels",
        },
        (payload) => {
          console.log("Conversation labels changed:", payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      labelsSubscription.unsubscribe();
    };
  }, [supabase, user, fetchConversations]);

  const filteredConversations = useMemo(() => {
    return conversations?.filter((conversation) => {
      const matchesSearch =
        conversation?.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (conversation?.last_message &&
          conversation.last_message
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        conversation.participants_info?.some(
          (p) =>
            p?.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.phone && p.phone.includes(searchQuery))
        );

      if (selectedFilter) {
        return (
          matchesSearch &&
          conversation.labels?.some((label) => label.id === selectedFilter)
        );
      }

      return matchesSearch;
    });
  }, [conversations, searchQuery, selectedFilter]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const toggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
      const url = new URL(window.location.href);
      url.searchParams.set("selected", conversationId);
      window.history.pushState({}, "", url);
    },
    [onSelectConversation]
  );

  const handleFilterSelect = useCallback((labelId: string | null) => {
    setSelectedFilter(labelId);
    setIsFilterOpen(false);
  }, []);

  const addLabelToConversation = useCallback(
    async (conversationId: string, labelId: string) => {
      if (!user) return;

      try {
        const { data, error: checkError } = await supabase
          .from("conversation_labels")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("label_id", labelId)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Error checking label:", checkError);
          return;
        }

        if (data) return;

        const { error } = await supabase.from("conversation_labels").insert({
          conversation_id: conversationId,
          label_id: labelId,
        });

        if (error) {
          console.error("Error adding label:", error);
          return;
        }

        fetchConversations();
      } catch (error) {
        console.error("Error in addLabelToConversation:", error);
      }
    },
    [supabase, user, fetchConversations]
  );

  const removeLabelFromConversation = useCallback(
    async (conversationId: string, labelId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("conversation_labels")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("label_id", labelId);

        if (error) {
          console.error("Error removing label:", error);
          return;
        }

        fetchConversations();
      } catch (error) {
        console.error("Error in removeLabelFromConversation:", error);
      }
    },
    [supabase, user, fetchConversations]
  );

  const openContactModal = useCallback(() => {
    setIsContactModalOpen(true);
  }, []);

  return (
    <div className="w-80 border-r border-gray-200 h-full flex flex-col bg-white relative">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">
              <FiMessageCircle size={18} />
            </span>
            <span className="text-gray-600 font-medium">chats</span>
          </div>
          <button
            onClick={openContactModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiPlus size={18} />
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <button
            className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm"
            onClick={toggleFilter}
          >
            <FiFilter size={14} />
            <span>Custom filter</span>
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <FiSave size={18} />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center mt-3">
          <button
            className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
              isFilterOpen ? "bg-gray-100" : ""
            }`}
            onClick={toggleFilter}
          >
            <FiFilter size={14} className="text-gray-500" />
            <span className="text-sm text-gray-600">Filtered</span>
            {selectedFilter && (
              <span className="flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs rounded-full">
                1
              </span>
            )}
          </button>

          {selectedFilter && (
            <button
              onClick={() => handleFilterSelect(null)}
              className="ml-2 text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              Clear <FiX size={12} className="ml-1" />
            </button>
          )}
        </div>

        {isFilterOpen && (
          <div className="mt-2 p-2 bg-white border border-gray-200 rounded-md shadow-md">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Filter by label:
            </div>
            <div className="space-y-1">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleFilterSelect(label.id)}
                  className={`w-full text-left px-2 py-1 rounded-md text-sm hover:bg-gray-100 flex items-center ${
                    selectedFilter === label.id ? "bg-gray-100" : ""
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color || "#ccc" }}
                  ></span>
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ChatListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
              onAddLabel={(labelId) =>
                addLabelToConversation(conversation.id, labelId)
              }
              onRemoveLabel={(labelId) =>
                removeLabelFromConversation(conversation.id, labelId)
              }
              availableLabels={labels}
              formatDate={formatChatListDate}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No conversations found.{" "}
            {searchQuery ? "Try a different search term." : "Start a new chat!"}
          </div>
        )}
      </div>

      <button
        onClick={openContactModal}
        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        aria-label="New chat"
      >
        <FiPlus size={24} />
      </button>

      <ContactSelectionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
