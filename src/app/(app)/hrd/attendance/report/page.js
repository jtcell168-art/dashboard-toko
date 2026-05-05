import { getCurrentUser } from "@/app/actions/auth";
import { getAttendanceReport } from "@/app/actions/attendance";
import { createClient } from "@/lib/supabase/server";
import AttendanceReportClient from "./AttendanceReportClient";

export const metadata = {
  title: "Laporan Absensi | JT Cell Group",
};

export default async function AttendanceReportPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white/5 border border-white/10 rounded-2xl">
        <span className="material-symbols-outlined text-red-400 text-5xl mb-4">lock</span>
        <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas</h2>
        <p className="text-gray-400 max-w-sm">
          Hanya Owner dan Manager yang dapat mengakses laporan absensi.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name").eq("is_active", true);

  const date = searchParams.date || new Date().toISOString().split('T')[0];
  const branchId = searchParams.branchId || (user.role === 'manager' ? user.branch_id : 'all');

  const { data: reportData, error } = await getAttendanceReport(date, branchId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Laporan Absensi</h1>
          <p className="text-gray-400">Rekap kehadiran tim harian dan status keterlambatan.</p>
        </div>
      </div>

      <AttendanceReportClient 
        initialData={reportData || []} 
        branches={branches || []} 
        user={user}
        currentParams={{ date, branchId }}
      />
    </div>
  );
}
