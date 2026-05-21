"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { calcDeduction } from "@/lib/attendanceUtils";

// Helper to get WITA (GMT+8) current date string
function getWitaDateStr() {
  const now = new Date();
  const witaTime = new Date(now.getTime() + (8 * 60 * 60000));
  return witaTime.toISOString().split('T')[0];
}

export async function getTodayAttendance() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  // We use local WITA (GMT+8) timezone for today's date
  const dateStr = getWitaDateStr();

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
  const dateStr = getWitaDateStr();
  
  // Rule: absen pagi jam 09.00 WITA (GMT+8)
  const wita = new Date(now.getTime() + (8 * 60 * 60000));
  const hour = wita.getUTCHours();
  const minutes = wita.getUTCMinutes();
  
  let status = "present";
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
  const dateStr = getWitaDateStr();

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
  const dateStr = getWitaDateStr();

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
  const dateStr = getWitaDateStr();

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
  if (!user || (user.role !== 'owner' && user.role !== 'manager' && user.role !== 'admin')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const targetDate = date || getWitaDateStr();
  
  // 1. Get profiles
  // Note: .neq("is_active", false) in PostgreSQL excludes NULL rows!
  // Use .or() to properly include profiles where is_active is null/unset.
  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, role, branch_id, branches(name)")
    .or("is_active.eq.true,is_active.is.null");

  // Branch filter: only apply when explicitly provided via URL param
  if (branchId && branchId !== 'all') {
    profileQuery = profileQuery.eq("branch_id", branchId);
  }
  // Manager: show kasir & teknisi across all branches (no branch filter)
  if (user.role === 'manager') {
    profileQuery = profileQuery.in("role", ['kasir', 'teknisi']);
  }

  const { data: profiles, error: profileErr } = await profileQuery;
  if (profileErr) return { error: profileErr.message };

  // 2. Get attendance for the date
  let attendanceQuery = supabase
    .from("attendance")
    .select("*, branches(name)")
    .eq("date", targetDate);

  // Branch filter: hanya berlaku jika ada branchId eksplisit (bukan manager default)
  if (branchId && branchId !== 'all') {
    attendanceQuery = attendanceQuery.eq("branch_id", branchId);
  }

  const { data: attendances, error: attErr } = await attendanceQuery;
  if (attErr) return { error: attErr.message };

  // 3. Map it
  const result = profiles.map(p => {
    const record = attendances.find(a => a.profile_id === p.id);
    let row = record 
      ? { ...record, full_name: p.full_name, role: p.role, branches: p.branches }
      : {
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

    const { deduction, deduction_notes } = calcDeduction(row, targetDate);
    return { ...row, deduction, deduction_notes };
  });

  return { data: result };
}

/**
 * Rekap rentang tanggal — agregasi per orang (untuk rekap mingguan/bulanan).
 */
export async function getAttendanceRangeSummary(startDate, endDate, branchId = null) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'manager' && user.role !== 'admin')) {
      return { error: "Unauthorized" };
    }

    const supabase = await createClient();

    // 1. Get profiles
    let profileQuery = supabase
      .from("profiles")
      .select("id, full_name, role, branch_id, branches(name)")
      .or("is_active.eq.true,is_active.is.null");

    if (branchId && branchId !== 'all') {
      profileQuery = profileQuery.eq("branch_id", branchId);
    }
    if (user.role === 'manager') {
      profileQuery = profileQuery.in("role", ['kasir', 'teknisi']);
    }

    const { data: profiles, error: profileErr } = await profileQuery;
    if (profileErr) {
      console.error("Error fetching profiles in getAttendanceRangeSummary:", profileErr);
      return { error: profileErr.message };
    }

    // 2. Get all attendance records in date range
    let attQuery = supabase
      .from("attendance")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (branchId && branchId !== 'all') {
      attQuery = attQuery.eq("branch_id", branchId);
    }

    const { data: attendances, error: attErr } = await attQuery;
    if (attErr) {
      console.error("Error fetching attendances in getAttendanceRangeSummary:", attErr);
      return { error: attErr.message };
    }

    // 3. Generate all calendar dates in range (timezone-safe using UTC)
    const dates = [];
    const startParts = startDate.split(/[-/]/).map(Number);
    const endParts = endDate.split(/[-/]/).map(Number);
    const cur = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
    const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
    
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // 4. Aggregate per person
    const now = new Date();
    const summary = (profiles || []).map(p => {
      let totalPresent = 0;
      let totalLate    = 0;
      let totalAbsent  = 0;
      let totalDeduction = 0;
      const dailyDetails = [];

      dates.forEach(d => {
        const rec = (attendances || []).find(a => a.profile_id === p.id && a.date === d);
        const row = rec
          ? { ...rec }
          : { check_in: null, break_start: null, break_end: null };

        const { deduction, deduction_notes } = calcDeduction(row, d);

        // Only count absent for dates that have passed 09:00 WITA
        // 09:00 WITA is exactly 01:00 UTC
        const limitParts = d.split('-').map(Number);
        const limit = new Date(Date.UTC(limitParts[0], limitParts[1] - 1, limitParts[2], 1, 0, 0, 0));
        
        // Timezone-safe WITA today check
        const witaToday = new Date(now.getTime() + (8 * 60 * 60000)).toISOString().split('T')[0];
        const isToday = d === witaToday;
        const isPast = d < witaToday;

        if (rec) {
          if (rec.status === 'late') totalLate++;
          else totalPresent++;
          totalDeduction += deduction;
          dailyDetails.push({ date: d, status: rec.status, deduction, deduction_notes });
        } else if (isPast || (isToday && now > limit)) {
          totalAbsent++;
          totalDeduction += deduction;
          dailyDetails.push({ date: d, status: 'absent', deduction, deduction_notes });
        }
      });

      return {
        profile_id: p.id,
        full_name:  p.full_name,
        role:       p.role,
        branches:   p.branches,
        totalPresent,
        totalLate,
        totalAbsent,
        totalDeduction,
        dailyDetails,
      };
    });

    return { data: summary };
  } catch (err) {
    console.error("Critical error in getAttendanceRangeSummary:", err);
    return { error: err.message };
  }
}
