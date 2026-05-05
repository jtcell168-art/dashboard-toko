"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getTodayAttendance() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  // We use local timezone for today's date
  const now = new Date();
  const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("profile_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (error) return { error: error.message };
  return { data };
}

export async function checkIn() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const now = new Date();
  const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  // Rule: absen pagi jam 09.00
  // If > 09:00, marked as late
  const hour = now.getHours();
  const minutes = now.getMinutes();
  
  let status = "present";
  // Late if hour > 9, or hour == 9 and minute > 0
  if (hour > 9 || (hour === 9 && minutes > 0)) {
    status = "late";
  }

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      profile_id: user.id,
      branch_id: user.branch_id,
      date: dateStr,
      check_in: now.toISOString(),
      status: status
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/hrd/attendance");
  return { success: true, data };
}

export async function startBreak() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const now = new Date();
  const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("attendance")
    .update({ break_start: now.toISOString() })
    .eq("profile_id", user.id)
    .eq("date", dateStr)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/hrd/attendance");
  return { success: true, data };
}

export async function endBreak() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const now = new Date();
  const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("attendance")
    .update({ break_end: now.toISOString() })
    .eq("profile_id", user.id)
    .eq("date", dateStr)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/hrd/attendance");
  return { success: true, data };
}

export async function checkOut() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const now = new Date();
  const dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("attendance")
    .update({ check_out: now.toISOString() })
    .eq("profile_id", user.id)
    .eq("date", dateStr)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/hrd/attendance");
  return { success: true, data };
}

export async function getAttendanceReport(date = null, branchId = null) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const now = new Date();
  const targetDate = date || new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  // 1. Get profiles
  let profileQuery = supabase.from("profiles").select("id, full_name, role, branch_id, branches(name)").eq("is_active", true);
  if (branchId && branchId !== 'all') {
    profileQuery = profileQuery.eq("branch_id", branchId);
  } else if (user.role === 'manager') {
    profileQuery = profileQuery.eq("branch_id", user.branch_id);
  }
  
  const { data: profiles, error: profileErr } = await profileQuery;
  if (profileErr) return { error: profileErr.message };

  // 2. Get attendance for the date
  let attendanceQuery = supabase
    .from("attendance")
    .select("*, branches(name)")
    .eq("date", targetDate);
    
  if (branchId && branchId !== 'all') {
    attendanceQuery = attendanceQuery.eq("branch_id", branchId);
  } else if (user.role === 'manager') {
    attendanceQuery = attendanceQuery.eq("branch_id", user.branch_id);
  }

  const { data: attendances, error: attErr } = await attendanceQuery;
  if (attErr) return { error: attErr.message };

  // 3. Map it
  const result = profiles.map(p => {
    const record = attendances.find(a => a.profile_id === p.id);
    if (record) {
      return { ...record, full_name: p.full_name, role: p.role, branches: p.branches };
    }
    return {
      profile_id: p.id,
      full_name: p.full_name,
      role: p.role,
      branch_id: p.branch_id,
      branches: p.branches,
      date: targetDate,
      status: "absent",
      check_in: null,
      break_start: null,
      break_end: null,
      check_out: null,
    };
  });

  return { data: result };
}
