"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

export default function KasbonReportPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: kasbon } = await supabase.from("kasbon").select("*, profiles(full_name, role)").order("created_at", { ascending: false });
      setData(kasbon || []);
      setIsLoading(false);
    }
    load();
  }, []);

  const totalIssued = data.reduce((s, k) => s + Number(k.amount || 0), 0);
  const totalRemaining = data.filter(k => k.status !== "paid").reduce((s, k) => s + Number(k.remaining || 0), 0);
  const paidCount = data.filter(k => k.status === "paid").length;
  const collectionRate = totalIssued > 0 ? ((1 - totalRemaining / totalIssued) * 100).toFixed(0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Kasbon</h1><p className="text-sm text-white/40 mt-0.5">Summary kasbon per karyawan</p></div>

      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Dikeluarkan</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalIssued)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Belum Kembali</p><p className="text-xl font-bold text-red-400 tabular-nums">{formatRupiah(totalRemaining)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Collection Rate</p><p className="text-xl font-bold text-emerald-400">{collectionRate}%</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data laporan...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data Kasbon.</div>
        ) : (
          <table className="data-table"><thead><tr><th>Karyawan</th><th>Role</th><th style={{textAlign:"right"}}>Total Kasbon</th><th style={{textAlign:"right"}}>Sisa</th><th style={{textAlign:"right"}}>Cicilan/Bln</th><th style={{textAlign:"center"}}>Status</th></tr></thead>
            <tbody>{data.map(k => { const sc = { active: "#60A5FA", paid: "#34D399", pending_approval: "#FBBF24" }; return (
              <tr key={k.id}><td className="text-sm font-semibold text-white">{k.profiles?.full_name || "Unknown"}</td><td className="text-xs text-white/40">{k.profiles?.role || "-"}</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(k.amount)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold" style={{textAlign:"right", color: k.remaining > 0 ? "#F87171" : "#34D399"}}>{formatRupiah(k.remaining)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(k.installment_amount)}</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold" style={{ color: sc[k.status] || "#94A3B8" }}>{k.status === "paid" ? "Lunas" : k.status === "active" ? "Aktif" : "Pending"}</span></td></tr>
            ); })}</tbody></table>
        )}
      </div>
    </div>
  );
}
