"use client";
import { CICILAN_LIST, formatRupiah } from "@/data/mockData";

export default function CicilanReportPage() {
  const totalPiutang = CICILAN_LIST.filter(c => c.status !== "completed").reduce((s, c) => s + c.remaining, 0);
  const totalDP = CICILAN_LIST.reduce((s, c) => s + c.dp, 0);
  const overdueCount = CICILAN_LIST.filter(c => c.status === "overdue").length;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Cicilan</h1><p className="text-sm text-white/40 mt-0.5">Aging analysis dan collection rate</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Piutang</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalPiutang)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total DP Diterima</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalDP)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Overdue</p><p className="text-2xl font-bold text-red-400">{overdueCount}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p><p className="text-2xl font-bold text-emerald-400">{CICILAN_LIST.filter(c => c.status === "completed").length}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>Customer</th><th>Produk</th><th style={{textAlign:"right"}}>Total</th><th style={{textAlign:"right"}}>DP</th><th style={{textAlign:"right"}}>Sisa</th><th style={{textAlign:"center"}}>Progress</th><th style={{textAlign:"center"}}>Status</th></tr></thead>
            <tbody>{CICILAN_LIST.map(c => { const sc = { active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, overdue: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Telat" } }; const s = sc[c.status]; return (
              <tr key={c.id}><td><p className="text-sm font-semibold text-white">{c.customer}</p><p className="text-[10px] text-white/30">{c.phone}</p></td><td className="text-xs text-white/50">{c.product}</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(c.totalPrice)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(c.dp)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold text-white">{formatRupiah(c.remaining)}</td><td style={{textAlign:"center"}} className="text-xs text-white/40">{c.paidMonths}/{c.tenor} bln</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td></tr>
            ); })}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{CICILAN_LIST.map(c => { const sc = { active: "#60A5FA", completed: "#34D399", overdue: "#F87171" }; return (
          <div key={c.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{c.customer}</p><span className="text-[11px] font-semibold" style={{ color: sc[c.status] }}>{c.status}</span></div><p className="text-xs text-white/30 mt-0.5">{c.product}</p><div className="flex justify-between mt-1 text-xs"><span className="text-white/40">{c.paidMonths}/{c.tenor} bulan</span><span className="font-semibold text-white tabular-nums">Sisa: {formatRupiah(c.remaining)}</span></div></div>
        ); })}</div>
      </div>
    </div>
  );
}
