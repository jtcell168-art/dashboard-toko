"use client";
import { PAYABLES, formatRupiah } from "@/data/mockData";

const statusStyle = { paid: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, unpaid: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Belum Bayar" } };

export default function PayablesPage() {
  const totalUnpaid = PAYABLES.filter(p => p.status === "unpaid").reduce((s, p) => s + p.amount, 0);
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Hutang Dagang</h1><p className="text-sm text-white/40 mt-0.5">Tracking hutang ke supplier</p></div>

      <div className="grid grid-cols-2 gap-3">
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Hutang</p><p className="text-2xl font-bold text-red-400 tabular-nums">{formatRupiah(totalUnpaid)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Sudah Lunas</p><p className="text-2xl font-bold text-emerald-400">{PAYABLES.filter(p => p.status === "paid").length}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.04]">{PAYABLES.map(p => { const s = statusStyle[p.status]; return (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}><span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{p.status === "paid" ? "check_circle" : "schedule"}</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{p.supplier}</p><p className="text-[10px] text-white/30 mt-0.5">Ref: {p.poRef} · Jatuh tempo: {p.dueDate}</p></div>
            <div className="text-right"><p className="text-sm font-bold text-white tabular-nums">{formatRupiah(p.amount)}</p><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
          </div>
        ); })}</div>
      </div>
    </div>
  );
}
