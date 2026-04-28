"use client";
import { TECHNICIAN_PERFORMANCE, formatRupiah, SERVICE_LIST } from "@/data/mockData";

export default function ServiceReportPage() {
  const totalCompleted = TECHNICIAN_PERFORMANCE.reduce((s, t) => s + t.completed, 0);
  const avgDays = (TECHNICIAN_PERFORMANCE.reduce((s, t) => s + t.avgDays, 0) / TECHNICIAN_PERFORMANCE.length).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Produktivitas Servis</h1><p className="text-sm text-white/40 mt-0.5">Performa teknisi dan waktu pengerjaan</p></div>

      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Selesai</p><p className="text-2xl font-bold text-white">{totalCompleted}</p></div>
        <div className="kpi-card amber" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Rata-rata Waktu</p><p className="text-2xl font-bold text-white">{avgDays} <span className="text-sm text-white/30">hari</span></p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Pendapatan Servis</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(TECHNICIAN_PERFORMANCE.reduce((s, t) => s + t.revenue, 0))}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{TECHNICIAN_PERFORMANCE.map((t, i) => (
        <div key={t.name} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: ["#6366F1", "#8B5CF6", "#A78BFA"][i] }}>{t.name[0]}</div><div><p className="text-sm font-bold text-white">{t.name}</p><p className="text-[10px] text-white/30">Teknisi</p></div></div>
          <div className="flex flex-col gap-2"><div className="flex justify-between text-xs"><span className="text-white/40">Servis selesai</span><span className="text-white font-semibold">{t.completed}</span></div><div className="flex justify-between text-xs"><span className="text-white/40">Rata-rata waktu</span><span className="text-white font-semibold">{t.avgDays} hari</span></div><div className="flex justify-between text-xs"><span className="text-white/40">Rating</span><span className="text-amber-400 font-semibold">⭐ {t.rating}</span></div><div className="flex justify-between text-xs"><span className="text-white/40">Revenue</span><span className="text-emerald-400 font-semibold tabular-nums">{formatRupiah(t.revenue)}</span></div></div>
        </div>
      ))}</div>

      <div className="glass-card overflow-hidden"><div className="px-4 py-3 border-b border-white/[0.04]"><h3 className="text-sm font-semibold text-white">Tiket Servis Terakhir</h3></div>
        <div className="divide-y divide-white/[0.04]">{SERVICE_LIST.map(srv => { const sc = { process: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA" }, pending: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24" }, done: { bg: "rgba(16,185,129,0.12)", color: "#34D399" }, picked_up: { bg: "rgba(148,163,184,0.12)", color: "#94A3B8" } }; const s = sc[srv.status] || sc.pending; return (
          <div key={srv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{srv.customer} — {srv.device}</p><p className="text-[10px] text-white/30">{srv.issue} · {srv.technician || "Belum assign"}</p></div><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{srv.status}</span></div>
        ); })}</div>
      </div>
    </div>
  );
}
