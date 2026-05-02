"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";
import { exportToExcel } from "@/lib/utils/export";

export default function DiscountHistoryPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const supabase = createClient();
      // Transaksi yang punya diskon
      let query = supabase
        .from("transactions")
        .select("*, profiles(full_name)")
        .gt("discount_amount", 0)
        .order("created_at", { ascending: false });
        
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate + "T23:59:59");

      const { data: trx } = await query;
        
      setData(trx || []);
      setIsLoading(false);
    }
    load();
  }, [startDate, endDate]);

  const totalDiscount = data.reduce((sum, d) => sum + Number(d.discount_amount || 0), 0);
  const avgDiscount = data.length > 0 ? data.reduce((sum, d) => sum + Number(d.discount_percent || 0), 0) / data.length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-xl md:text-2xl font-bold text-white">Riwayat Diskon</h1><p className="text-sm text-white/40 mt-0.5">Semua diskon yang pernah diberikan</p></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const dataToExport = data.map(d => ({
                Tanggal: new Date(d.created_at).toLocaleDateString("id-ID"),
                "No. Invoice": d.invoice_no,
                Customer: d.customer_name || "-",
                "Subtotal (Sebelum Diskon)": d.subtotal,
                "Diskon (%)": d.discount_percent,
                "Potongan (Rp)": d.discount_amount,
                "Total (Sesudah Diskon)": d.total,
                Kasir: d.profiles?.full_name
              }));
              exportToExcel(dataToExport, "Laporan_Diskon");
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
        <div className="flex flex-col px-2 py-1">
          <label className="text-[9px] uppercase font-bold text-white/30">Dari</label>
          <input 
            type="date" 
            className="bg-transparent text-xs text-white focus:outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex flex-col px-2 py-1">
          <label className="text-[9px] uppercase font-bold text-white/30">Sampai</label>
          <input 
            type="date" 
            className="bg-transparent text-xs text-white focus:outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Diskon</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalDiscount)}</p></div>
        <div className="kpi-card amber" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Jumlah Transaksi</p><p className="text-xl font-bold text-white">{data.length}</p></div>
        <div className="kpi-card emerald hidden lg:block" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Rata-rata Diskon</p><p className="text-xl font-bold text-white">{avgDiscount.toFixed(1)}%</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada riwayat diskon.</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table"><thead><tr><th>Tanggal</th><th>No. Trx</th><th>Customer</th><th style={{textAlign:"right"}}>Harga Asli</th><th style={{textAlign:"center"}}>Diskon</th><th style={{textAlign:"right"}}>Potongan</th><th style={{textAlign:"right"}}>Harga Final</th><th>Kasir</th></tr></thead>
                <tbody>{data.map(d => (
                  <tr key={d.id}><td className="text-xs text-white/40">{new Date(d.created_at).toLocaleDateString("id-ID")}</td><td><code className="text-[11px] text-white/40 font-mono">{d.invoice_no}</code></td><td className="text-sm font-semibold text-white">{d.customer_name || "-"}</td><td style={{textAlign:"right"}} className="text-xs text-white/50 tabular-nums">{formatRupiah(d.subtotal)}</td><td style={{textAlign:"center"}}><span className="badge warning">{d.discount_percent}%</span></td><td style={{textAlign:"right"}} className="text-xs text-red-400 tabular-nums">-{formatRupiah(d.discount_amount)}</td><td style={{textAlign:"right"}} className="text-sm font-semibold text-white tabular-nums">{formatRupiah(d.total)}</td><td className="text-xs text-white/40">{d.profiles?.full_name}</td></tr>
                ))}</tbody></table>
            </div>
            <div className="md:hidden divide-y divide-white/[0.04]">{data.map(d => (
              <div key={d.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{d.invoice_no}</p><span className="badge warning">{d.discount_percent}%</span></div><p className="text-xs text-white/40 mt-1">{d.profiles?.full_name} · {new Date(d.created_at).toLocaleDateString("id-ID")}</p><div className="flex justify-between mt-1"><span className="text-xs text-white/30 line-through">{formatRupiah(d.subtotal)}</span><span className="text-sm font-bold text-white tabular-nums">{formatRupiah(d.total)}</span></div></div>
            ))}</div>
          </>
        )}
      </div>
    </div>
  );
}
