import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client menggunakan SERVICE_ROLE_KEY.
 * Bypass RLS — HANYA digunakan untuk operasi server-side privileged
 * seperti cascade delete, migrasi data, dsb.
 * JANGAN pernah expose ke client-side / browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables. " +
      "Tambahkan ke .env.local dari Supabase Dashboard > Settings > API."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
