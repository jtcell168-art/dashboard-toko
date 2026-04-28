"use client";
import { KASBON_LIST, formatRupiah } from "@/data/mockData";

export default function KasbonReportPage() {
  const totalIssued = KASBON_LIST.reduce((s, k) => s + k.amount, 0);
  const totalRemaining = KASBON_LIST.filter(k => k.status !== "paid").reduce((s, k) => s + k.remaining, 0);
  const paidCount = KASBON_LIST.filter(k => k.status === "paid").length;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Kasbon</h1><p className="text-sm text-white/40 mt-0.5">Summary kasbon per karyawan</p></div>

      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Dikeluarkan</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalIssued)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Belum Kembali</p><p className="text-xl font-bold text-red-400 tabular-nums">{formatRupiah(totalRemaining)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Collection Rate</p><p className="text-xl font-bold text-emerald-400">{((1 - totalRemaining / totalIssued) * 100).toFixed(0)}%</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table"><thead><tr><th>Karyawan</th><th>Role</th><th style={{textAlign:"right"}}>Total Kasbon</th><th style={{textAlign:"right"}}>Sisa</th><th style={{textAlign:"right"}}>Cicilan/Bln</th><th style={{textAlign:"center"}}>Status</th></tr></thead>
          <tbody>{KASBON_LIST.map(k => { const sc = { active: "#60A5FA", paid: "#34D399", pending_approval: "#FBBF24" }; return (
            <tr key={k.id}><td className="text-sm font-semibold text-white">{k.employee}</td><td className="text-xs text-white/40">{k.role}</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(k.amount)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold" style={{textAlign:"right", color: k.remaining > 0 ? "#F87171" : "#34D399"}}>{formatRupiah(k.remaining)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(k.installment)}</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold" style={{ color: sc[k.status] || "#94A3B8" }}>{k.status === "paid" ? "Lunas" : k.status === "active" ? "Aktif" : "Pending"}</span></td></tr>
          ); })}</tbody></table>
      </div>
    </div>
  );
}
