/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isToday, isYesterday, isSameYear } from "date-fns";

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "";

  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (isSameYear(date, new Date())) {
    return format(date, "dd-MM");
  } else {
    return format(date, "dd-MM-yyyy");
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "HH:mm");
}

export function formatChatListDate(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  if (isToday(date)) {
    return format(date, "HH:mm");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "dd-LLL-yy");
  }
}

export function groupMessagesByDate(messages: any[]): { [key: string]: any[] } {
  const grouped: { [key: string]: any[] } = {};

  messages.forEach((message) => {
    const date = new Date(message.created_at);
    const dateKey = format(date, "dd-MM-yyyy");

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    grouped[dateKey].push(message);
  });

  return grouped;
}
