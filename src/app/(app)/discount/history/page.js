"use client";
import { DISCOUNT_HISTORY, formatRupiah } from "@/data/mockData";

export default function DiscountHistoryPage() {
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Riwayat Diskon</h1><p className="text-sm text-white/40 mt-0.5">Semua diskon yang pernah diberikan</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Diskon</p><p className="text-xl font-bold text-white tabular-nums">{formatRupiah(DISCOUNT_HISTORY.reduce((s, d) => s + d.discountAmount, 0))}</p></div>
        <div className="kpi-card amber" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Jumlah Transaksi</p><p className="text-xl font-bold text-white">{DISCOUNT_HISTORY.length}</p></div>
        <div className="kpi-card emerald hidden lg:block" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Rata-rata Diskon</p><p className="text-xl font-bold text-white">{(DISCOUNT_HISTORY.reduce((s, d) => s + d.discountPercent, 0) / DISCOUNT_HISTORY.length).toFixed(1)}%</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>Tanggal</th><th>No. Trx</th><th>Produk</th><th style={{textAlign:"right"}}>Harga Asli</th><th style={{textAlign:"center"}}>Diskon</th><th style={{textAlign:"right"}}>Potongan</th><th style={{textAlign:"right"}}>Harga Final</th><th>Diberikan Oleh</th></tr></thead>
            <tbody>{DISCOUNT_HISTORY.map(d => (
              <tr key={d.id}><td className="text-xs text-white/40">{d.date}</td><td><code className="text-[11px] text-white/40 font-mono">{d.trxId}</code></td><td className="text-sm font-semibold text-white">{d.product}</td><td style={{textAlign:"right"}} className="text-xs text-white/50 tabular-nums">{formatRupiah(d.originalPrice)}</td><td style={{textAlign:"center"}}><span className="badge warning">{d.discountPercent}%</span></td><td style={{textAlign:"right"}} className="text-xs text-red-400 tabular-nums">-{formatRupiah(d.discountAmount)}</td><td style={{textAlign:"right"}} className="text-sm font-semibold text-white tabular-nums">{formatRupiah(d.finalPrice)}</td><td className="text-xs text-white/40">{d.givenBy}</td></tr>
            ))}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{DISCOUNT_HISTORY.map(d => (
          <div key={d.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{d.product}</p><span className="badge warning">{d.discountPercent}%</span></div><p className="text-xs text-white/40 mt-1">{d.givenBy} · {d.date}</p><div className="flex justify-between mt-1"><span className="text-xs text-white/30 line-through">{formatRupiah(d.originalPrice)}</span><span className="text-sm font-bold text-white tabular-nums">{formatRupiah(d.finalPrice)}</span></div></div>
        ))}</div>
      </div>
    </div>
  );
}
