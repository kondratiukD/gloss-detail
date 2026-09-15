import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const raw =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
  if (!raw) return "";
  // Users sometimes paste the REST path; createClient needs the project origin only.
  return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

/** Prefer new publishable key; fall back to legacy anon key. */
function getSupabaseKey(): string {
  return (
    (
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
    )?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).",
    );
  }

  client = createClient(url, key);
  return client;
}
