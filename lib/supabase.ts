import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "ไม่พบ NEXT_PUBLIC_SUPABASE_URL ในไฟล์ .env.local",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "ไม่พบ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ในไฟล์ .env.local",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
);