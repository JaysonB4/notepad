import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_ variables are inlined at build time, so they must be written out in full like this.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the Supabase URL and public key were provided at build time. */
export const accountsConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** The shared Supabase client, or null when accounts are not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}
