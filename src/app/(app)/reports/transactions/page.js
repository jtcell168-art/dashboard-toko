"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/data/mockData";
import { exportToExcel } from "@/lib/utils/export";
import { deleteTransaction } from "@/app/actions/pos";
import { getCurrentUser } from "@/app/actions/auth";
import { useBranch } from "@/context/BranchContext";

export default function TransactionReportPage() {
  const { selectedBranch, isMounted: branchIsMounted } = useBranch();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Date Filter State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); 
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    if (!branchIsMounted) return;

    async function load() {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      const supabase = createClient();
      let query = supabase
        .from("transactions")
        .select("*, profiles(full_name), branches(name)")
        .order("created_at", { ascending: false });
        
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate + "T23:59:59");
      
      const targetBranch = user?.role === "owner" ? selectedBranch : (user?.branch_id || "all");
      if (targetBranch !== "all") query = query.eq("branch_id", targetBranch);
      
      const { data: trx } = await query;
      
      setCurrentUser(user);
      setData(trx || []);
      setIsLoading(false);
    }
    load();
  }, [startDate, endDate, selectedBranch, branchIsMounted]);

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus transaksi ini? Data akan terhapus permanen dari database.")) return;
    try {
      await deleteTransaction(id);
      alert("Transaksi dihapus!");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = () => {
    const exportData = data.map(t => ({
      Tanggal: new Date(t.created_at).toLocaleString("id-ID"),
      Invoice: t.invoice_no,
      Cabang: t.branches?.name,
      Tipe: t.type,
      Kasir: t.profiles?.full_name,
      Customer: t.customer_name,
      Total: t.total,
      Status: t.status
    }));
    exportToExcel(exportData, "Laporan_Transaksi");
  };

  if (!branchIsMounted) return null;

  return (
    <div className="flex flex-col gap-6 stagger-children">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Laporan Transaksi</h1>
          <p className="text-sm text-white/40 mt-1">Daftar riwayat penjualan dan servis — {selectedBranch === 'all' ? 'Semua Cabang' : data[0]?.branches?.name || '...'}</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
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
      </div>

      {/* Table Area */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Invoice</th>
                <th>Cabang</th>
                <th>Tipe</th>
                <th>Kasir</th>
                <th>Customer</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="py-20 text-center text-white/30 animate-pulse">Memuat data transaksi...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="9" className="py-20 text-center text-white/30">Tidak ada transaksi ditemukan</td></tr>
              ) : (
                data.map((trx) => (
                  <tr key={trx.id}>
                    <td className="whitespace-nowrap">
                      <p className="text-xs text-white font-medium">{new Date(trx.created_at).toLocaleDateString("id-ID")}</p>
                      <p className="text-[10px] text-white/30">{new Date(trx.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td>
                      <code className="text-[11px] text-white/60 font-mono">{trx.invoice_no}</code>
                    </td>
                    <td>
                      <span className="text-[11px] text-white/50">{trx.branches?.name || "-"}</span>
                    </td>
                    <td>
                      <span className={`badge ${trx.type === 'retail' ? 'indigo' : trx.type === 'service' ? 'warning' : 'blue'}`}>
                        {trx.type}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-white/70">{trx.profiles?.full_name || "-"}</span>
                    </td>
                    <td>
                      <span className="text-xs text-white/70">{trx.customer_name || "-"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="text-xs font-bold text-white tabular-nums">{formatRupiah(trx.total)}</span>
                    </td>
                    <td>
                      <span className={`badge ${trx.status === 'completed' ? 'emerald' : 'rose'}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors" title="Lihat Detail">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {currentUser?.role === 'owner' && (
                          <button onClick={() => handleDelete(trx.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Hapus">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
