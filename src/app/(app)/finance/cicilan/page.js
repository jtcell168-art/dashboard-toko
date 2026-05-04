"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

const statusStyle = { active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, overdue: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Telat Bayar" }, cancelled: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Dibatalkan" } };

export default function CicilanPage() {
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

  const totalRemaining = data.filter(c => c.status !== "completed").reduce((s, c) => s + Number(c.remaining || 0), 0);
  
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Cicilan</h1><p className="text-sm text-white/40 mt-0.5">Kelola cicilan pelanggan</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Piutang</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalRemaining)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Aktif</p><p className="text-xl font-bold text-white">{data.filter(c => c.status === "active").length}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Telat Bayar</p><p className="text-xl font-bold text-red-400">{data.filter(c => c.status === "overdue").length}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p><p className="text-xl font-bold text-emerald-400">{data.filter(c => c.status === "completed").length}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data Cicilan.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">{data.map(c => { 
            const s = statusStyle[c.status] || statusStyle.active; 
            const tenor = Number(c.tenor) || 0;
            const paidMonths = Number(c.paid_months) || 0;
            const progress = tenor > 0 ? (paidMonths / tenor) * 100 : 0; 
            return (
            <div key={c.id} className="px-4 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-2"><div><p className="text-sm font-semibold text-white">{c.customer_name || 'Pelanggan'}</p><p className="text-[10px] text-white/30 mt-0.5">{c.product_name || 'Produk'} · {c.customer_phone || '-'}</p></div><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: s.color }} /></div>
              <div className="flex justify-between text-xs text-white/40">
                <span>DP: {formatRupiah(c.dp_amount)} · {c.paid_months}/{c.tenor} bulan</span>
                <span className="font-semibold text-white tabular-nums">Sisa: {formatRupiah(c.remaining)}</span>
              </div>
            </div>
          ); })}</div>
        )}
      </div>
    </div>
  );
}
