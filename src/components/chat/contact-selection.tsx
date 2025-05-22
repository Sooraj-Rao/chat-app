"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { FiX, FiSearch, FiUser, FiUsers } from "react-icons/fi";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  fullname: string;
  username: string;
  image: string | null;
  phone: string | null;
};

type ContactSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactSelectionModal({
  isOpen,
  onClose,
}: ContactSelectionModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showGroupNameInput, setShowGroupNameInput] = useState(false);
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const fetchContacts = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, fullname, username, image")
        .neq("id", user.id);

      if (error) {
        console.error("Error fetching contacts:", error);
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error("Error in fetchContacts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      // Reset state when modal opens
      setSelectedContacts([]);
      setGroupName("");
      setShowGroupNameInput(false);
    }
  }, [isOpen, fetchContacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.phone && contact.phone.includes(searchQuery))
    );
  }, [contacts, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContacts((prev) => {
      if (prev.includes(contactId)) {
        return prev.filter((id) => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  }, []);

  const handleCreateConversation = useCallback(async () => {
    if (!user || selectedContacts.length === 0) return;

    setIsCreatingConversation(true);
    try {
      const isGroup = selectedContacts.length > 1 || showGroupNameInput;

      if (isGroup) {
        // Create a new group chat
        const title =
          groupName || `Group with ${selectedContacts.length} people`;

        const { data: conversationData, error: createError } = await supabase
          .from("conversations")
          .insert({
            title,
            is_group: true,
            participants: [user.id, ...selectedContacts],
            creator_id: user.id,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating group conversation:", createError);
          return;
        }

        // Add default "Demo" label to the conversation
        await supabase.from("conversation_labels").insert({
          conversation_id: conversationData.id,
          label_id: "1", // Demo label
        });

        onClose();
        router.push(`/chats?selected=${conversationData.id}`);
      } else {
        // Check if a direct conversation already exists with this contact
        const { data: existingConversation, error: checkError } = await supabase
          .from("conversations")
          .select("id")
          .eq("is_group", false)
          .contains("participants", [user.id, selectedContacts[0]])
          .single();

        if (!checkError && existingConversation) {
          // Conversation already exists, navigate to it
          onClose();
          router.push(`/chats?selected=${existingConversation.id}`);
          return;
        }

        // Get contact's name for the conversation title
        const { data: contactData } = await supabase
          .from("users")
          .select("fullname")
          .eq("id", selectedContacts[0])
          .single();

        // Create a new direct conversation
        const { data: conversationData, error: createError } = await supabase
          .from("conversations")
          .insert({
            title: contactData?.fullname || "New Chat",
            is_group: false,
            participants: [user.id, selectedContacts[0]],
            creator_id: user.id,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating direct conversation:", createError);
          return;
        }

        // Add default "Demo" label to the conversation
        await supabase.from("conversation_labels").insert({
          conversation_id: conversationData.id,
          label_id: "1", // Demo label
        });

        onClose();
        router.push(`/chats?selected=${conversationData.id}`);
      }
    } catch (error) {
      console.error("Error in handleCreateConversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [
    user,
    selectedContacts,
    supabase,
    onClose,
    router,
    groupName,
    showGroupNameInput,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedContacts.length > 0
              ? `Selected contacts: ${selectedContacts.length}`
              : "Select contacts to chat"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

          {selectedContacts.length > 1 && (
            <div className="mt-4 flex items-center">
              <button
                onClick={() => setShowGroupNameInput(!showGroupNameInput)}
                className="flex items-center text-sm text-green-600 hover:text-green-700"
              >
                <FiUsers className="mr-1" />
                {showGroupNameInput
                  ? "Cancel group creation"
                  : "Create a group chat"}
              </button>
            </div>
          )}

          {showGroupNameInput && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Enter group name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <li
                  key={contact.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                    selectedContacts.includes(contact.id) ? "bg-green-50" : ""
                  }`}
                  onClick={() => toggleContactSelection(contact.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {contact.image ? (
                        <Image
                          src={contact.image || "/placeholder.svg"}
                          alt={contact.fullname}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <FiUser className="text-white" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.fullname}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{contact.username}
                      </p>
                    </div>
                    {contact.phone && (
                      <p className="text-xs text-gray-500">{contact.phone}</p>
                    )}
                    {selectedContacts.includes(contact.id) && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery
                ? "No contacts found matching your search."
                : "No contacts available."}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreateConversation}
            disabled={selectedContacts.length === 0 || isCreatingConversation}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingConversation ? "Creating chat..." : "Start chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
