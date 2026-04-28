"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSalaries(month, year) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salaries")
    .select("*, profiles(full_name, role)")
    .eq("period_month", month)
    .eq("period_year", year);
  
  if (error) throw error;
  return data;
}

export async function upsertSalary(payload) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authUser?.id).single();

  if (!["owner", "manager"].includes(profile?.role)) {
    throw new Error("Unauthorized: Only owner or manager can manage salaries");
  }

  const { error } = await supabase.from("salaries").upsert({
    profile_id: payload.profile_id,
    period_month: payload.month,
    period_year: payload.year,
    base_salary: payload.base_salary,
    bonus: payload.bonus || 0,
    deductions: payload.deductions || 0,
    notes: payload.notes
  });

  if (error) throw error;
  return { success: true };
}

export async function getTotalSalaries(startDate, endDate) {
  const supabase = await createClient();
  let query = supabase.from("salaries").select("total_paid");
  
  if (startDate) query = query.gte("paid_at", startDate);
  if (endDate) query = query.lte("paid_at", endDate);
  
  const { data } = await query;
  return data?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0;
}

export async function getEmployees() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("is_active", true)
    .neq("role", "owner"); // Exclude owners
  return data || [];
}
