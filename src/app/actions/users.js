"use server";
import { createClient } from "@/lib/supabase/server";

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, branches(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

export async function updateUser(userId, userData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: userData.full_name,
      role: userData.role,
      branch_id: userData.branch_id,
      is_active: userData.is_active
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  return true;
}

export async function deleteUser(userId) {
  // Note: This only deletes the profile, not the Auth user.
  // In a real app, you'd use a Supabase Edge Function or Admin API to delete both.
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw new Error(error.message);
  return true;
}
