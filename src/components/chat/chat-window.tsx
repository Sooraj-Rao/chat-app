"use client";

import type React from "react";
import type { Message } from "@/types/chats";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  FiMoreHorizontal,
  FiSearch,
  FiPaperclip,
  FiSmile,
  FiMic,
  FiSend,
} from "react-icons/fi";
import Image from "next/image";
import ChatMessage from "./chat-message";
import { groupMessagesByDate } from "@/utils/date-util";
import { dataSyncService } from "@/lib/data-sync";

type ConversationDetails = {
  id: string;
  title: string;
  is_group: boolean;
  participants: string[];
  creator_id: string | null;
  participants_info: {
    id: string;
    fullname: string;
    username: string;
    image: string | null;
    phone: string | null;
  }[];
};

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationDetails, setConversationDetails] =
    useState<ConversationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sentMessageIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user) return;

    console.log(
      "Fetching conversation details for conversation:",
      conversationId
    );
    try {
      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select("id, title, is_group, participants, creator_id")
          .eq("id", conversationId)
          .single();

      if (conversationError) {
        console.error(
          "Error fetching conversation details:",
          conversationError
        );
        return;
      }

      console.log("Conversation data:", conversationData);

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, fullname, username, image, phone")
        .in("id", conversationData.participants);

      if (usersError) {
        console.error("Error fetching participants:", usersError);
        return;
      }

      console.log("Participants data:", usersData);

      setConversationDetails({
        ...conversationData,
        participants_info: usersData,
      });
    } catch (error) {
      console.error("Error in fetchConversationDetails:", error);
    }
  }, [conversationId, supabase, user]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    setIsLoading(true);
    console.log("Fetching messages for conversation:", conversationId);

    try {
      sentMessageIds.current.clear();

      const localMessages = await dataSyncService.getLocalMessages(
        conversationId
      );

      if (localMessages.length > 0) {
        setMessages(localMessages);
        setIsLoading(false);
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, message, created_at, sender_id, read_by, conversation_id")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      console.log("Messages data:", messagesData);

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      const senderIds = [
        ...Array.from(new Set(messagesData.map((message) => message.sender_id))),
      ];

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, fullname, image")
        .in("id", senderIds);

      if (usersError) {
        console.error("Error fetching user details:", usersError);
        return;
      }

      console.log("Users data for messages:", usersData);

      const userMap = usersData.reduce((acc, user) => {
        acc[user.id] = {
          fullname: user.fullname,
          image: user.image,
        };
        return acc;
      }, {} as Record<string, { fullname: string; image: string | null }>);

      const formattedMessages = messagesData.map((message) => ({
        ...message,
        sender: userMap[message.sender_id] || {
          fullname: "Unknown User",
          image: null,
        },
      }));

      for (const message of formattedMessages) {
        await dataSyncService.saveMessageLocally(message);
      }

      setMessages(formattedMessages);

      const unreadMessages = messagesData
        .filter((msg) => !msg.read_by?.includes(user.id))
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        for (const msgId of unreadMessages) {
          const { data: msgData } = await supabase
            .from("messages")
            .select("read_by")
            .eq("id", msgId)
            .single();

          const readBy = msgData?.read_by || [];

          await supabase
            .from("messages")
            .update({ read_by: [...readBy, user.id] })
            .eq("id", msgId);
        }
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, supabase, user]);

  useEffect(() => {
    if (conversationId && user) {
      fetchConversationDetails();
      fetchMessages();
    }
  }, [conversationId, user, fetchConversationDetails, fetchMessages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const subscription = supabase
      .channel(`conversation-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);

          if (
            payload.new.sender_id === user.id &&
            sentMessageIds.current.has(payload.new.id)
          ) {
            console.log("Ignoring already displayed message:", payload.new.id);
            return;
          }

          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("fullname, image")
            .eq("id", payload.new.sender_id)
            .single();

          if (userError) {
            console.error("Error fetching sender details:", userError);
            return;
          }

          const newMsg: Message = {
            id: payload.new.id,
            conversation_id: payload.new.conversation_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_id: payload.new.sender_id,
            read_by: payload.new.read_by || [],
            sender: {
              fullname: userData.fullname,
              image: userData.image,
            },
          };

          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === newMsg.id);
            if (messageExists) {
              return prev;
            }
            return [...prev, newMsg];
          });

          dataSyncService.saveMessageLocally(newMsg);

          if (payload.new.sender_id !== user.id) {
            await supabase
              .from("messages")
              .update({
                read_by: [...(payload.new.read_by || []), user.id],
              })
              .eq("id", payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, supabase, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim() || !conversationId || !user) return;

      console.log("Sending message:", newMessage);

      try {
        const messageId = crypto.randomUUID();
        const now = new Date().toISOString();

        const newMsg: Message = {
          id: messageId,
          conversation_id: conversationId,
          sender_id: user.id,
          message: newMessage,
          created_at: now,
          read_by: [user.id],
        };

        sentMessageIds.current.add(messageId);

        setMessages((prev) => [
          ...prev,
          {
            ...newMsg,
            sender: {
              fullname: user.fullname,
              image: user.image,
            },
          },
        ]);

        await dataSyncService.saveMessageLocally({
          ...newMsg,
          sender: {
            fullname: user.fullname,
            image: user.image,
          },
        });

        setNewMessage("");

        const { error } = await supabase.from("messages").insert(newMsg);

        if (error) {
          console.error("Error sending message:", error);
          return;
        }

        await supabase
          .from("conversations")
          .update({
            last_message: newMessage,
            last_message_at: now,
          })
          .eq("id", conversationId);
      } catch (error) {
        console.error("Error in handleSendMessage:", error);
      }
    },
    [newMessage, conversationId, user, supabase]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
    },
    []
  );

  const groupedMessages = useMemo(() => {
    try {
      return groupMessagesByDate(messages);
    } catch (error) {
      console.error("Error grouping messages by date:", error);
      return {};
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          {conversationDetails?.is_group ? (
            <div className="flex -space-x-2">
              {conversationDetails.participants_info
                .slice(0, 3)
                .map((participant) => (
                  <div
                    key={participant.id}
                    className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-300 flex items-center justify-center"
                  >
                    {participant.image ? (
                      <Image
                        src={participant.image || "/placeholder.svg"}
                        alt={participant.fullname}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {participant.fullname
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              {conversationDetails.participants_info.length > 3 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">
                    +{conversationDetails.participants_info.length - 3}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
              {conversationDetails?.participants_info.find(
                (p) => p.id !== user?.id
              )?.image ? (
                <Image
                  src={
                    conversationDetails.participants_info.find(
                      (p) => p.id !== user?.id
                    )?.image || "/placeholder.svg"
                  }
                  alt={conversationDetails.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {conversationDetails?.title
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>
          )}
          <div>
            <h2 className="font-medium text-gray-900">
              {conversationDetails?.title}
            </h2>
            {conversationDetails?.is_group && (
              <p className="text-xs text-gray-500">
                {conversationDetails.participants_info
                  .map((p) => p.fullname)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <FiSearch size={18} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <FiMoreHorizontal size={18} />
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto p-4 bg-gray-50 max-h-[33rem]"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).length > 0 ? (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex justify-center my-4">
                    <div className="bg-white px-3 py-1 rounded-lg shadow-sm text-xs text-gray-500">
                      {date === "Invalid Date" || date === "Unknown Date"
                        ? "Unknown Date"
                        : date}
                    </div>
                  </div>
                  {dateMessages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwnMessage={message.sender_id === user?.id}
                      isGroupChat={conversationDetails?.is_group || false}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-3">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-2"
        >
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <FiPaperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            value={newMessage}
            onChange={handleInputChange}
          />
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <FiSmile size={20} />
          </button>
          <button type="button" className="text-gray-500 hover:text-gray-700">
            <FiMic size={20} />
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
            disabled={!newMessage.trim()}
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
