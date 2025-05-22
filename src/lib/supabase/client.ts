import { createClient } from "@supabase/supabase-js";
import type { Database } from "./schema";

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  });
};
