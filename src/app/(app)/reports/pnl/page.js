"use client";
import { MONTHLY_PNL, formatRupiah } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CustomTooltip = ({ active, payload, label }) => { if (!active || !payload) return null; return (<div className="bg-[#1E293B] border border-white/10 rounded-lg p-3 shadow-xl text-xs"><p className="font-semibold text-white mb-1">{label}</p>{payload.map((p, i) => (<p key={i} style={{ color: p.color }} className="tabular-nums">{p.name}: {formatRupiah(p.value)}</p>))}</div>); };

export default function PnLReportPage() {
  const latest = MONTHLY_PNL[MONTHLY_PNL.length - 1];
  const prev = MONTHLY_PNL[MONTHLY_PNL.length - 2];
  const profitGrowth = prev ? (((latest.profit - prev.profit) / prev.profit) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Laba Rugi</h1><p className="text-sm text-white/40 mt-0.5">Analisis pendapatan dan pengeluaran</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Pendapatan</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.revenue)}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">HPP</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.cogs)}</p></div>
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Biaya Operasional</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(latest.expenses)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Laba Bersih</p><p className="text-xl font-bold text-emerald-400 tabular-nums">{formatRupiah(latest.profit)}</p><p className="text-[10px] text-emerald-400/60 mt-0.5">↑ {profitGrowth}% dari bulan lalu</p></div>
      </div>

      <div className="chart-card"><h3 className="text-sm font-semibold text-white mb-4">Trend Bulanan</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={MONTHLY_PNL}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}M`} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="revenue" name="Pendapatan" fill="#6366F1" radius={[4,4,0,0]} /><Bar dataKey="cogs" name="HPP" fill="#8B5CF6" radius={[4,4,0,0]} /><Bar dataKey="profit" name="Laba" fill="#10B981" radius={[4,4,0,0]} /></BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table"><thead><tr><th>Bulan</th><th style={{textAlign:"right"}}>Pendapatan</th><th style={{textAlign:"right"}}>HPP</th><th style={{textAlign:"right"}}>Biaya</th><th style={{textAlign:"right"}}>Laba Bersih</th><th style={{textAlign:"right"}}>Margin</th></tr></thead>
          <tbody>{MONTHLY_PNL.map(m => (<tr key={m.month}><td className="font-semibold text-white">{m.month} 2026</td><td style={{textAlign:"right"}} className="tabular-nums">{formatRupiah(m.revenue)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(m.cogs)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{formatRupiah(m.expenses)}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold text-emerald-400">{formatRupiah(m.profit)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/50">{((m.profit / m.revenue) * 100).toFixed(1)}%</td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
