import { createClient } from "@supabase/supabase-js";
import type { Database } from "./schema";
import { v4 as uuidv4 } from "uuid";

export async function seedDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  console.log("Seeding database...");

  // Clear existing data (optional for development)
  try {
    await supabase.from("messages").delete().neq("id", "placeholder");
    await supabase.from("conversations").delete().neq("id", "placeholder");
    await supabase.from("users").delete().neq("id", "placeholder");
  } catch (error) {
    console.warn("Clearing data (might be empty on first run):", error);
  }

  // Create users
  console.log("Inserting users...");
  const userIds = [uuidv4(), uuidv4(), uuidv4()];
  const users = [
    {
      id: userIds[0],
      fullname: "Alice Johnson",
      username: "alice",
      password: "password123", // never do this in production
      gender: "female",
      image: null,
    },
    {
      id: userIds[1],
      fullname: "Bob Smith",
      username: "bob",
      password: "password123",
      gender: "male",
      image: null,
    },
    {
      id: userIds[2],
      fullname: "Charlie Brown",
      username: "charlie",
      password: "password123",
      gender: "male",
      image: null,
    },
  ];

  for (const user of users) {
    const { error } = await supabase.from("users").insert(user);
    if (error) console.error("Error inserting user:", error);
  }

  // Create conversations
  console.log("Inserting conversations...");
  const conversationIds = [uuidv4(), uuidv4()];
  const conversations = [
    {
      id: conversationIds[0],
      participants: [userIds[0], userIds[1]],
      last_message: "Hey Bob!",
      updated_at: new Date().toISOString(),
    },
    {
      id: conversationIds[1],
      participants: [userIds[1], userIds[2]],
      last_message: "Hi Charlie!",
      updated_at: new Date().toISOString(),
    },
  ];

  for (const convo of conversations) {
    const { error } = await supabase.from("conversations").insert(convo);
    if (error) console.error("Error inserting conversation:", error);
  }

  // Create messages
  console.log("Inserting messages...");
  const messages = [
    {
      id: uuidv4(),
      sender_id: userIds[0],
      conversation_id: conversationIds[0],
      message: "Hey Bob!",
      read: true,
    },
    {
      id: uuidv4(),
      sender_id: userIds[1],
      conversation_id: conversationIds[0],
      message: "Hey Alice!",
      read: true,
    },
    {
      id: uuidv4(),
      sender_id: userIds[1],
      conversation_id: conversationIds[1],
      message: "Hi Charlie!",
      read: false,
    },
    {
      id: uuidv4(),
      sender_id: userIds[2],
      conversation_id: conversationIds[1],
      message: "Hello Bob!",
      read: false,
    },
  ];

  for (const msg of messages) {
    const { error } = await supabase.from("messages").insert(msg);
    if (error) console.error("Error inserting message:", error);
  }

  console.log("✅ Seeding completed successfully.");
  return { success: true };
}
