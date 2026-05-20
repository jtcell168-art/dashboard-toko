import { getCurrentUser } from "@/app/actions/auth";
import { getAttendanceReport, getAttendanceRangeSummary } from "@/app/actions/attendance";
import { createClient } from "@/lib/supabase/server";
import AttendanceReportClient from "./AttendanceReportClient";

export const metadata = {
  title: "Laporan Absensi | JT Cell Group",
};

export default async function AttendanceReportPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'manager' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white/5 border border-white/10 rounded-2xl">
        <span className="material-symbols-outlined text-red-400 text-5xl mb-4">lock</span>
        <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas</h2>
        <p className="text-gray-400 max-w-sm">
          Hanya Owner, Manager, dan Admin yang dapat mengakses laporan absensi.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name").eq("is_active", true);

  // Next.js 15+: searchParams is a Promise — must be awaited
  const sp = await searchParams;

  // Use WITA (GMT+8) for server-side "today" default
  const witaToday = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];

  const mode      = sp.mode      || 'daily';
  const date      = sp.date      || witaToday;
  const startDate = sp.startDate || witaToday;
  const endDate   = sp.endDate   || witaToday;
  const branchId  = sp.branchId  || 'all';

  let dailyData  = [];
  let rangeData  = [];

  if (mode === 'range') {
    const { data, error } = await getAttendanceRangeSummary(startDate, endDate, branchId);
    if (error) {
      console.error("DEBUG RANGE ERROR:", error);
    }
    if (!error) rangeData = data || [];
  } else {
    const { data, error } = await getAttendanceReport(date, branchId);
    if (error) {
      console.error("DEBUG DAILY ERROR:", error);
    }
    if (!error) dailyData = data || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Laporan Absensi</h1>
        <p className="text-gray-400">Rekap kehadiran tim harian dan status keterlambatan.</p>
      </div>

      <AttendanceReportClient
        dailyData={dailyData}
        rangeData={rangeData}
        branches={branches || []}
        user={user}
        currentParams={{ mode, date, startDate, endDate, branchId }}
      />
    </div>
  );
}
