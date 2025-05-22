export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          fullname: string;
          username: string;
          password: string;
          gender: string;
          image: string | null;
          phone: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          fullname: string;
          username: string;
          password: string;
          gender: string;
          image?: string | null;
          phone?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          fullname?: string;
          username?: string;
          password?: string;
          gender?: string;
          image?: string | null;
          phone?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          is_group: boolean;
          participants: string[];
          last_message: string | null;
          last_message_at: string | null;
          creator_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          is_group: boolean;
          participants: string[];
          last_message?: string | null;
          last_message_at?: string | null;
          creator_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          is_group?: boolean;
          participants?: string[];
          last_message?: string | null;
          last_message_at?: string | null;
          creator_id?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          sender_id: string;
          conversation_id: string;
          message: string;
          read_by: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          sender_id: string;
          conversation_id: string;
          message: string;
          read_by?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          sender_id?: string;
          conversation_id?: string;
          message?: string;
          read_by?: string[];
        };
      };
      labels: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      conversation_labels: {
        Row: {
          id: string;
          conversation_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          label_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          label_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
