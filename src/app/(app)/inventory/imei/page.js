"use client";
import { useState } from "react";
import { IMEI_RECORDS } from "@/data/mockData";

const statusMap = { service: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Servis" }, sold: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Terjual" }, stock: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Stok" } };

export default function IMEITrackingPage() {
  const [search, setSearch] = useState("");
  const filtered = search.length >= 3 ? IMEI_RECORDS.filter(r => r.imei.includes(search) || r.product.toLowerCase().includes(search.toLowerCase()) || (r.customer && r.customer.toLowerCase().includes(search.toLowerCase()))) : IMEI_RECORDS;

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Tracking IMEI</h1><p className="text-sm text-white/40 mt-0.5">Lacak riwayat perangkat berdasarkan IMEI</p></div>

      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">qr_code_scanner</span><input className="input-field pl-10 pr-12" placeholder="Cari IMEI, produk, atau customer..." value={search} onChange={e => setSearch(e.target.value)} /><button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors"><span className="material-symbols-outlined text-[20px]">barcode_scanner</span></button></div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>IMEI</th><th>Produk</th><th>Status</th><th>Cabang</th><th>Customer</th><th>Aksi Terakhir</th><th>Tanggal</th></tr></thead>
            <tbody>{filtered.map(r => { const s = statusMap[r.status]; return (
              <tr key={r.imei}><td><code className="text-[11px] font-mono text-white/50">{r.imei}</code></td><td className="text-sm font-semibold text-white">{r.product}</td><td><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td><td className="text-xs text-white/50">{r.branch}</td><td className="text-xs text-white/60">{r.customer || "—"}</td><td className="text-xs text-white/40">{r.lastAction}</td><td className="text-xs text-white/30">{r.date}</td></tr>
            ); })}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{filtered.map(r => { const s = statusMap[r.status]; return (
          <div key={r.imei} className="px-4 py-3.5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{r.product}</p><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div><p className="text-[10px] font-mono text-white/30 mt-1">{r.imei}</p><p className="text-[10px] text-white/40 mt-0.5">{r.lastAction} · {r.date}</p></div>
        ); })}</div>
        <div className="px-4 py-3 border-t border-white/[0.04]"><p className="text-[11px] text-white/30">{filtered.length} perangkat ditemukan</p></div>
      </div>
    </div>
  );
}
