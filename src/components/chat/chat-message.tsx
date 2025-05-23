import { format } from "date-fns";
import { FiCheck } from "react-icons/fi";
import Image from "next/image";
import type { Message } from "@/types/chats";

type ChatMessageProps = {
  message: Message;
  isOwnMessage: boolean;
  isGroupChat: boolean;
};

export default function ChatMessage({
  message,
  isOwnMessage,
  isGroupChat,
}: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm");
  };

  const isRead = message.read_by.length > 1;

  return (
    <div
      className={`mb-2 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
          {message.sender?.image ? (
            <Image
              src={message.sender.image || "/placeholder.svg"}
              alt={message.sender.fullname}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
              {message.sender?.fullname
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] ${isOwnMessage ? "text-right" : "text-left"}`}
      >
        <div
          style={{
            borderRadius: "10px",
            ...(isOwnMessage
              ? { borderTopRightRadius: 0 }
              : { borderTopLeftRadius: 0 }),
          }}
          className={`relative px-3 py-2   text-sm whitespace-pre-wrap ${
            isOwnMessage
              ? "bg-[#dcf8c6] text-black  "
              : "bg-white text-black  border"
          }`}
        >
          {isGroupChat && !isOwnMessage && (
            <div className=" flex justify-between items-center gap-x-5">
              <div className="text-xs capitalize font-semibold text-green-600">
                <p>{message.sender?.fullname}</p>
              </div>
              <p className=" text-xs text-gray-400">+91 9858493394</p>
            </div>
          )}
          {message.message}

          <div className="text-[10px] text-gray-500 flex items-center justify-end mt-1 space-x-2">
            <span>{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <span
                className={`relative ${
                  isRead ? "text-blue-500" : "text-gray-400"
                } flex  items-stretch`}
              >
                <FiCheck size={12} />
                {isRead && <FiCheck size={12} className="-ml-1 absolute" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
