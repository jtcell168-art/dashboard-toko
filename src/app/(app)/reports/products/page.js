"use client";
import { PRODUCT_PERFORMANCE, formatRupiah } from "@/data/mockData";

export default function ProductsReportPage() {
  const totalSold = PRODUCT_PERFORMANCE.reduce((s, p) => s + p.sold, 0);
  const totalRevenue = PRODUCT_PERFORMANCE.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = PRODUCT_PERFORMANCE.reduce((s, p) => s + p.profit, 0);
  const sorted = [...PRODUCT_PERFORMANCE].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Performa Produk</h1><p className="text-sm text-white/40 mt-0.5">Analisis penjualan per produk (bulan ini)</p></div>

      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Unit Terjual</p><p className="text-2xl font-bold text-white">{totalSold}</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Revenue</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalRevenue)}</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Profit</p><p className="text-xl font-bold text-emerald-400 tabular-nums">{formatRupiah(totalProfit)}</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>#</th><th>Produk</th><th>Kategori</th><th style={{textAlign:"right"}}>Terjual</th><th style={{textAlign:"right"}}>Revenue</th><th style={{textAlign:"right"}}>Profit</th><th style={{textAlign:"right"}}>Margin</th></tr></thead>
            <tbody>{sorted.map((p, i) => (<tr key={p.name}><td className="text-white/30">{i + 1}</td><td className="text-sm font-semibold text-white">{p.name}</td><td><span className="badge info">{p.category}</span></td><td style={{textAlign:"right"}} className="tabular-nums text-white/60">{p.sold}</td><td style={{textAlign:"right"}} className="tabular-nums font-semibold text-white">{formatRupiah(p.revenue)}</td><td style={{textAlign:"right"}} className="tabular-nums text-emerald-400">{formatRupiah(p.profit)}</td><td style={{textAlign:"right"}} className="tabular-nums text-white/40">{((p.profit / p.revenue) * 100).toFixed(1)}%</td></tr>))}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{sorted.map((p, i) => (
          <div key={p.name} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">#{i + 1} {p.name}</p><span className="badge info">{p.category}</span></div><div className="flex justify-between mt-2 text-xs"><span className="text-white/40">{p.sold} unit</span><span className="text-emerald-400 font-semibold tabular-nums">{formatRupiah(p.profit)}</span></div></div>
        ))}</div>
      </div>
    </div>
  );
}
