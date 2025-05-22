"use client";

import { useState, useRef, useEffect } from "react";
import type React from "react";

import Image from "next/image";
import { FiMoreVertical, FiTag } from "react-icons/fi";

type Label = {
  id: string;
  name: string;
  color: string;
};

type Conversation = {
  id: string;
  title: string;
  is_group: boolean;
  participants: string[];
  last_message: string | null;
  last_message_at: string | null;
  creator_id: string | null;
  labels: Label[];
  unread_count: number;
  participants_info: {
    id: string;
    fullname: string;
    username: string;
    image: string | null;
    phone: string | null;
  }[];
};

export default function ChatListItem({
  conversation,
  isSelected,
  onClick,
  onAddLabel,
  onRemoveLabel,
  availableLabels,
  formatDate,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onAddLabel: (labelId: string) => void;
  onRemoveLabel: (labelId: string) => void;
  availableLabels: Label[];
  formatDate: (dateString: string | null) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAddLabel = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    onAddLabel(labelId);
    setShowMenu(false);
  };

  const handleRemoveLabel = (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    onRemoveLabel(labelId);
    setShowMenu(false);
  };

  const chatLabelIds = conversation.labels.map((label) => label.id);
  const primaryParticipant = conversation.participants_info[0] || null;
  const phone = primaryParticipant?.phone || null;

  return (
    <div
      className={`p-3 border-b border-gray-200 cursor-pointer relative ${
        isSelected ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {conversation.is_group ? (
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              <span className="text-sm font-medium">
                {getInitials(conversation.title)}
              </span>
            </div>
          ) : primaryParticipant?.image ? (
            <Image
              src={primaryParticipant.image || "/placeholder.svg"}
              alt={conversation.title}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white">
              {getInitials(conversation.title)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title}
            </h3>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">
                {formatDate(conversation.last_message_at)}
              </span>
              <button
                onClick={handleMenuClick}
                className="text-gray-400 hover:text-gray-600"
                aria-label="More options"
              >
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center mt-1 flex-wrap">
            {conversation.labels.map((label) => (
              <span
                key={label.id}
                className={`badge badge-${label.name.toLowerCase()} mr-1 mb-1 flex items-center`}
                style={{
                  backgroundColor: `${label.color}20`, // 20% opacity
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-500 truncate mt-1">
            {conversation.last_message || "No messages yet"}
          </p>

          {phone && (
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>{phone}</span>
            </div>
          )}
        </div>

        {conversation.unread_count > 0 && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs rounded-full">
              {conversation.unread_count}
            </span>
          </div>
        )}
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-2 top-10 z-10 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200"
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 flex items-center">
            <FiTag className="mr-1" /> Manage Labels
          </div>
          {availableLabels.map((label) => {
            const isApplied = chatLabelIds.includes(label.id);
            return (
              <button
                key={label.id}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                onClick={(e) =>
                  isApplied
                    ? handleRemoveLabel(e, label.id)
                    : handleAddLabel(e, label.id)
                }
              >
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color || "#ccc" }}
                  ></span>
                  {label.name}
                </div>
                {isApplied && <span className="text-xs text-gray-500">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
