"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getPnlData } from "@/app/actions/finance";
import { getCurrentUser } from "@/app/actions/auth";
import { useBranch } from "@/context/BranchContext";

const CustomTooltip = ({ active, payload, label }) => { if (!active || !payload) return null; return (<div className="bg-[#1E293B] border border-white/10 rounded-lg p-3 shadow-xl text-xs"><p className="font-semibold text-white mb-1">{label}</p>{payload.map((p, i) => (<p key={i} style={{ color: p.color }} className="tabular-nums">{p.name}: {formatRupiah(p.value)}</p>))}</div>); };

export default function PnLReportPage() {
  const { selectedBranch, isMounted: branchIsMounted } = useBranch();
  const [data, setData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!branchIsMounted) return;

    async function load() {
      setIsLoading(true);
      const [user, res] = await Promise.all([
        getCurrentUser(),
        getPnlData(selectedBranch, startDate, endDate)
      ]);
      setCurrentUser(user);
      setData(res);
      setIsLoading(false);
    }
    load();
  }, [selectedBranch, branchIsMounted, startDate, endDate]);

  const latest = data[data.length - 1] || { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
  const prev = data[data.length - 2];
  const profitGrowth = prev && prev.profit > 0 ? (((latest.profit - prev.profit) / prev.profit) * 100).toFixed(1) : 0;

  if (!branchIsMounted) return null;

  if (currentUser && !["owner", "manager"].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-white/10 mb-4">lock</span>
        <h2 className="text-xl font-bold text-white">Akses Dibatasi</h2>
        <p className="text-white/40 mt-2">Anda tidak memiliki izin untuk melihat laporan laba rugi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Laporan Laba Rugi</h1>
          <p className="text-sm text-white/40 mt-0.5">Analisis pendapatan dan pengeluaran — {selectedBranch === 'all' ? 'Semua Cabang' : 'Cabang Terpilih'}</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10">
          <div className="flex flex-col px-2">
            <label className="text-[9px] text-white/30 uppercase font-bold">Mulai Dari</label>
            <input 
              type="date" 
              className="bg-transparent text-white text-xs focus:outline-none"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col px-2">
            <label className="text-[9px] text-white/30 uppercase font-bold">Sampai</label>
            <input 
              type="date" 
              className="bg-transparent text-white text-xs focus:outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Pendapatan</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.revenue)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">HPP</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.cogs)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Biaya Operasional</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.expenses)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Laba Bersih</p><p className="text-xl font-bold text-emerald-400 tabular-nums">{formatRupiah(latest.profit)}</p><p className="text-[10px] text-emerald-400/60 mt-0.5">↑ {profitGrowth}% dari periode sebelumnya</p></div>
      </div>

      <div className="chart-card"><h3 className="text-sm font-semibold text-white mb-4">Trend {(startDate || endDate) ? 'Harian' : 'Bulanan'}</h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px] text-white/30 text-sm animate-pulse">Memproses data...</div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="revenue" name="Pendapatan" fill="#6366F1" radius={[4,4,0,0]} /><Bar dataKey="cogs" name="HPP" fill="#8B5CF6" radius={[4,4,0,0]} /><Bar dataKey="profit" name="Laba" fill="#10B981" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-white/30 text-sm">Belum ada data transaksi</div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-white/30 animate-pulse">Memuat tabel laba rugi...</div>
        ) : data.length > 0 ? (
          <table className="data-table"><thead><tr><th>{(startDate || endDate) ? 'Tanggal' : 'Bulan'}</th><th style={{textAlign:"right"}}>Pendapatan</th><th style={{textAlign:"right"}}>HPP</th><th style={{textAlign:"right"}}>Biaya</th><th style={{textAlign:"right"}}>Laba Bersih</th><th style={{textAlign:"right"}}>Margin</th></tr></thead>
            <tbody>{data.map(m => (<tr key={m.label}><td className="font-semibold text-white">{m.label}</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(m.revenue)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(m.cogs)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(m.expenses)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold text-emerald-400">{formatRupiah(m.profit)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/50">{m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : 0}%</td></tr>))}</tbody></table>
        ) : (
          <div className="p-8 text-center text-white/50 text-sm">Tidak ada data untuk ditampilkan.</div>
        )}
      </div>
    </div>
  );
}
