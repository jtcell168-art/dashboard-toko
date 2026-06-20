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
    notes: payload.notes,
    image_url: payload.image_url,
    custom_name: payload.custom_name // Tambahkan ini
  });

  if (error) throw error;
  return { success: true };
}

export async function getTotalSalaries(startDate, endDate, branchId = null) {
  const supabase = await createClient();
  // Join with profiles to get the branch_id of the employee
  let query = supabase.from("salaries").select("base_salary, bonus, deductions, created_at, profiles!inner(branch_id)");
  
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate + "T23:59:59");
  if (branchId) query = query.eq("profiles.branch_id", branchId);
  
  const { data, error } = await query;
  if (error) {
    console.error("getTotalSalaries error:", error);
    return 0;
  }
  
  return data?.reduce((sum, s) => {
    const base = Number(s.base_salary || 0);
    const bonus = Number(s.bonus || 0);
    const deductions = Number(s.deductions || 0);
    return sum + (base + bonus - deductions);
  }, 0) || 0;
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
