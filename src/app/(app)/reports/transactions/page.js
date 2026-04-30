"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV } from "@/lib/utils/export";

export default function TransactionReportPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("transactions")
        .select("*, profiles(full_name), branches(name)")
        .order("created_at", { ascending: false });
        
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate + "T23:59:59");

      const { data: trx } = await query;
      setData(trx || []);
      setIsLoading(false);
    }
    load();
  }, [startDate, endDate]);

  const totalRevenue = data.reduce((sum, d) => sum + Number(d.total || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Detail Transaksi POS</h1>
          <p className="text-sm text-white/40 mt-0.5">Semua riwayat penjualan retail, digital, dan servis</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const dataToExport = data.map(d => ({
                Tanggal: new Date(d.created_at).toLocaleDateString("id-ID"),
                "No. Invoice": d.invoice_no,
                Customer: d.customer_name || "-",
                "Metode Bayar": d.payment_method,
                Tipe: d.type,
                Subtotal: d.subtotal,
                Diskon: d.discount_amount,
                Total: d.total,
                Cabang: d.branches?.name,
                Kasir: d.profiles?.full_name
              }));
              exportToCSV(dataToExport, "Laporan_Transaksi_Detail");
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

      <div className="kpi-card indigo w-fit min-w-[240px]" style={{ padding: 16 }}>
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Pendapatan (Periode Ini)</p>
        <p className="text-2xl font-bold text-white tabular-nums">{formatRupiah(totalRevenue)}</p>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada transaksi di periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Cabang</th>
                  <th>Tipe</th>
                  <th style={{textAlign:"right"}}>Total</th>
                  <th>Kasir</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id}>
                    <td className="text-[11px] text-white/40">{new Date(d.created_at).toLocaleDateString("id-ID")}</td>
                    <td><code className="text-[11px] text-indigo-400 font-mono">{d.invoice_no}</code></td>
                    <td className="text-sm font-medium text-white">{d.customer_name || "-"}</td>
                    <td className="text-xs text-white/60">{d.branches?.name}</td>
                    <td><span className={`badge ${d.type === 'retail' ? 'indigo' : 'amber'}`}>{d.type}</span></td>
                    <td style={{textAlign:"right"}} className="text-sm font-bold text-white tabular-nums">{formatRupiah(d.total)}</td>
                    <td className="text-xs text-white/40">{d.profiles?.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
