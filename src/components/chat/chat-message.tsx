import { format } from "date-fns";
import { FiCheck, FiCheckCircle } from "react-icons/fi";
import Image from "next/image";

type Message = {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  read_by: string[];
  sender: {
    fullname: string;
    image: string | null;
  };
};

export default function ChatMessage({
  message,
  isOwnMessage,
  isGroupChat,
}: {
  message: Message;
  isOwnMessage: boolean;
  isGroupChat: boolean;
}) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "HH:mm");
  };

  const isRead = message.read_by.length > 1;

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } mb-2 px-2`}
    >
      {!isOwnMessage && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
          {message.sender.image ? (
            <Image
              src={message.sender.image || "/placeholder.svg"}
              alt={message.sender.fullname}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white text-xs">
              {message.sender.fullname
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] relative`}>
        {!isOwnMessage && isGroupChat && (
          <div className="mb-1 text-sm font-medium text-gray-700">
            {message.sender.fullname}
          </div>
        )}

        <div
          className={`px-3 py-2 rounded-2xl break-words whitespace-pre-line shadow-sm ${
            isOwnMessage
              ? "bg-green-100 text-gray-900 rounded-br-none"
              : "bg-white text-gray-900 rounded-bl-none"
          }`}
        >
          <p className="text-sm">{message.message}</p>
          <div className="flex items-center justify-end space-x-1 mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
            {isOwnMessage && (
              <span className={isRead ? "text-blue-500" : "text-gray-400"}>
                {isRead ? <FiCheckCircle size={14} /> : <FiCheck size={14} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
