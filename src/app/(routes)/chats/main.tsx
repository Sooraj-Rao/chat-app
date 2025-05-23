"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import Sidebar from "@/components/sidebar/sidebar";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import {
  FiRefreshCw,
  FiHelpCircle,
  FiPhone,
  FiBell,
  FiSettings,
} from "react-icons/fi";
import AuthModal from "@/components/auth/auth-modal";
import { dbManager } from "@/lib/indexdb";

export default function ChatsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, isLoading]);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected) {
      setSelectedConversationId(selected);
    }
  }, [searchParams]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await dbManager.clear("messages");
      await dbManager.clear("conversations");

      const response = await fetch("/api/seed");
      const data = await response.json();

      if (data.success) {
        alert("Database refreshed successfully!");
        window.location.reload();
      } else {
        alert("Failed to refresh database: " + data.error);
      }
    } catch (error) {
      console.error("Error refreshing database:", error);
      alert("An error occurred while refreshing the database");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 flex">
          <ChatList
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />

          <div className="flex-1 flex flex-col">
            <header className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-4">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleRefresh}
                  title="Refresh database with seed data"
                >
                  <FiRefreshCw size={18} />
                </button>
                <span className="text-gray-500">5 / 6 phones</span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700">
                  <FiHelpCircle size={18} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <FiPhone size={18} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <FiBell size={18} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <FiSettings size={18} />
                </button>
              </div>
            </header>

            <ChatWindow conversationId={selectedConversationId} />
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  );
}
