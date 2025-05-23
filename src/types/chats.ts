export type User = {
  id: string;
  fullname: string;
  username: string;
  gender: string;
  image: string | null;
  phone: string | null;
  password?: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
  created_at?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read_by: string[];
  sender?: {
    fullname: string;
    image: string | null;
  };
};

export type Conversation = {
  id: string;
  title: string;
  is_group: boolean;
  participants: string[];
  last_message: string | null;
  last_message_at: string | null;
  creator_id: string | null;
  created_at?: string;
  labels?: Label[];
  unread_count?: number;
  participants_info?: {
    id: string;
    fullname: string;
    username: string;
    image: string | null;
    phone: string | null;
  }[];
};

export type ConversationLabel = {
  id: string;
  conversation_id: string;
  label_id: string;
  created_at?: string;
};
