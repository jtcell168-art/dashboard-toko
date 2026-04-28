"use server";
import { createClient } from "@/lib/supabase/server";

export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("*").eq("is_active", true);
  if (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
  return data;
}
