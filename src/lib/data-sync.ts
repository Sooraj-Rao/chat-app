import { createSupabaseClient } from "./supabase/client";
import { dbManager } from "./indexdb";
import type { Conversation, Message } from "@/types/chats";

export class DataSyncService {
  private supabase = createSupabaseClient();
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  async syncUserData() {
    if (!this.userId) return;

    try {
      await this.syncUsers();
      await this.syncConversations();
      await this.syncLabels();
      await this.syncConversationLabels();
      await this.syncMessages();
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  }

  private async syncUsers() {
    try {
      const { data, error } = await this.supabase.from("users").select("*");

      if (error) {
        throw error;
      }

      if (data) {
        await dbManager.bulkPut("users", data);
      }
    } catch (error) {
      console.error("Error syncing users:", error);
    }
  }

  private async syncConversations() {
    if (!this.userId) return;

    try {
      const { data, error } = await this.supabase
        .from("conversations")
        .select("*")
        .contains("participants", [this.userId]);

      if (error) {
        throw error;
      }

      if (data) {
        await dbManager.bulkPut("conversations", data);
      }
    } catch (error) {
      console.error("Error syncing conversations:", error);
    }
  }

  private async syncLabels() {
    try {
      const { data, error } = await this.supabase.from("labels").select("*");

      if (error) {
        throw error;
      }

      if (data) {
        await dbManager.bulkPut("users", data);
      }
    } catch (error) {
      console.error("Error syncing labels:", error);
    }
  }

  private async syncConversationLabels() {
    if (!this.userId) return;

    try {
      const { data: conversations } = await this.supabase
        .from("conversations")
        .select("id")
        .contains("participants", [this.userId]);

      if (!conversations || conversations.length === 0) return;

      const conversationIds = conversations.map((c) => c.id);

      const { data, error } = await this.supabase
        .from("conversation_labels")
        .select("*")
        .in("conversation_id", conversationIds);

      if (error) {
        throw error;
      }

      if (data) {
        await dbManager.bulkPut("conversations", data);
      }
    } catch (error) {
      console.error("Error syncing conversation labels:", error);
    }
  }

  private async syncMessages() {
    if (!this.userId) return;

    try {
      const { data: conversations } = await this.supabase
        .from("conversations")
        .select("id")
        .contains("participants", [this.userId]);

      if (!conversations || conversations.length === 0) return;

      const conversationIds = conversations.map((c) => c.id);

      const { data, error } = await this.supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        await dbManager.bulkPut("messages", data);
      }
    } catch (error) {
      console.error("Error syncing messages:", error);
    }
  }

  async getLocalConversations(): Promise<Conversation[]> {
    try {
      const conversations = await dbManager.getAll<"conversations">(
        "conversations"
      );
      return conversations;
    } catch (error) {
      console.error("Error getting local conversations:", error);
      return [];
    }
  }

  async getLocalMessages(conversationId: string): Promise<Message[]> {
    try {
      const messages = await dbManager.getByIndex<"messages">(
        "messages",
        "by-conversation",
        conversationId
      );
      return messages;
    } catch (error) {
      console.error("Error getting local messages:", error);
      return [];
    }
  }

  async saveMessageLocally(message: Message): Promise<void> {
    try {
      if (message.created_at) {
        const date = new Date(message.created_at);
        if (isNaN(date.getTime())) {
          message.created_at = new Date().toISOString();
        }
      } else {
        message.created_at = new Date().toISOString();
      }

      const existingMessage = await dbManager.getById<"messages">(
        "messages",
        message.id
      );

      if (existingMessage) {
        console.log(
          "Message already exists in IndexedDB, skipping:",
          message.id
        );
        return;
      }

      await dbManager.put("messages", message);

      const conversation = await dbManager.getById<"conversations">(
        "conversations",
        message.conversation_id
      );

      if (conversation) {
        conversation.last_message = message.message;
        conversation.last_message_at = message.created_at;
        await dbManager.put("conversations", conversation);
      }
    } catch (error) {
      console.error("Error saving message locally:", error);
    }
  }

  async saveConversationLocally(conversation: Conversation): Promise<void> {
    try {
      await dbManager.put("conversations", conversation);
    } catch (error) {
      console.error("Error saving conversation locally:", error);
    }
  }
}

export const dataSyncService = new DataSyncService();
