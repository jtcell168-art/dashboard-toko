"use client";
import { CICILAN_LIST, formatRupiah } from "@/data/mockData";

const statusStyle = { active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, overdue: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Telat Bayar" } };

export default function CicilanPage() {
  const totalRemaining = CICILAN_LIST.filter(c => c.status !== "completed").reduce((s, c) => s + c.remaining, 0);
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Cicilan</h1><p className="text-sm text-white/40 mt-0.5">Kelola cicilan pelanggan</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Piutang</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalRemaining)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Aktif</p><p className="text-xl font-bold text-white">{CICILAN_LIST.filter(c => c.status === "active").length}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Telat Bayar</p><p className="text-xl font-bold text-red-400">{CICILAN_LIST.filter(c => c.status === "overdue").length}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p><p className="text-xl font-bold text-emerald-400">{CICILAN_LIST.filter(c => c.status === "completed").length}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.04]">{CICILAN_LIST.map(c => { const s = statusStyle[c.status]; const progress = c.tenor > 0 ? (c.paidMonths / c.tenor) * 100 : 100; return (
          <div key={c.id} className="px-4 py-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start justify-between mb-2"><div><p className="text-sm font-semibold text-white">{c.customer}</p><p className="text-[10px] text-white/30 mt-0.5">{c.product} · {c.phone}</p></div><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: s.color }} /></div>
            <div className="flex justify-between text-xs text-white/40">
              <span>DP: {formatRupiah(c.dp)} · {c.paidMonths}/{c.tenor} bulan</span>
              <span className="font-semibold text-white tabular-nums">Sisa: {formatRupiah(c.remaining)}</span>
            </div>
          </div>
        ); })}</div>
      </div>
    </div>
  );
}
