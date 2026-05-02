"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, branches(*)")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    return profile;
  } catch (err) {
    console.error("Critical error in getCurrentUser:", err);
    return null;
  }
}
