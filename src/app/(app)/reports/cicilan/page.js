"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

export default function CicilanReportPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: cicilan } = await supabase.from("cicilan").select("*").order("start_date", { ascending: false });
      setData(cicilan || []);
      setIsLoading(false);
    }
    load();
  }, []);

  const totalPiutang = data.filter(c => c.status !== "completed").reduce((s, c) => s + Number(c.remaining || 0), 0);
  const totalDP = data.reduce((s, c) => s + Number(c.dp_amount || 0), 0);
  const overdueCount = data.filter(c => c.status === "overdue").length;
  const lunasCount = data.filter(c => c.status === "completed").length;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Cicilan</h1><p className="text-sm text-white/40 mt-0.5">Aging analysis dan collection rate</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Piutang</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalPiutang)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total DP Diterima</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalDP)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Overdue</p><p className="text-2xl font-bold text-red-400">{overdueCount}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p><p className="text-2xl font-bold text-emerald-400">{lunasCount}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data laporan...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data Cicilan.</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table"><thead><tr><th>Customer</th><th>Produk</th><th style={{textAlign:"right"}}>Total</th><th style={{textAlign:"right"}}>DP</th><th style={{textAlign:"right"}}>Sisa</th><th style={{textAlign:"center"}}>Progress</th><th style={{textAlign:"center"}}>Status</th></tr></thead>
                <tbody>{data.map(c => { const sc = { active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, overdue: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Telat" } }; const s = sc[c.status] || sc.active; return (
                  <tr key={c.id}><td><p className="text-sm font-semibold text-white">{c.customer_name}</p><p className="text-[10px] text-white/30">{c.customer_phone}</p></td><td className="text-xs text-white/50">{c.product_name}</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(c.total_price)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(c.dp_amount)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold text-white">{formatRupiah(c.remaining)}</td><td style={{textAlign:"center"}} className="text-xs text-white/40">{c.paid_months}/{c.tenor} bln</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td></tr>
                ); })}</tbody></table>
            </div>
            <div className="md:hidden divide-y divide-white/[0.04]">{data.map(c => { const sc = { active: "#60A5FA", completed: "#34D399", overdue: "#F87171" }; return (
              <div key={c.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{c.customer_name}</p><span className="text-[11px] font-semibold" style={{ color: sc[c.status] || sc.active }}>{c.status}</span></div><p className="text-xs text-white/30 mt-0.5">{c.product_name}</p><div className="flex justify-between mt-1 text-xs"><span className="text-white/40">{c.paid_months}/{c.tenor} bulan</span><span className="font-semibold text-white tabular-nums">Sisa: {formatRupiah(c.remaining)}</span></div></div>
            ); })}</div>
          </>
        )}
      </div>
    </div>
  );
}
