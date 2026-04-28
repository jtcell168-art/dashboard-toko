"use client";
import { PURCHASE_ORDERS, formatRupiah } from "@/data/mockData";
import Link from "next/link";

const statusStyle = { draft: { bg: "rgba(148,163,184,0.12)", color: "#94A3B8", label: "Draft" }, sent: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Terkirim" }, partial: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Sebagian" }, received: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Diterima" } };

export default function PurchaseOrderListPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Purchase Order</h1><p className="text-sm text-white/40 mt-0.5">Daftar semua purchase order</p></div><Link href="/purchase-order/new" className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">add</span><span className="hidden sm:inline">Buat PO Baru</span></Link></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ label: "Total PO", val: PURCHASE_ORDERS.length, cls: "indigo" }, { label: "Draft", val: PURCHASE_ORDERS.filter(p=>p.status==="draft").length, cls: "blue" }, { label: "Dalam Proses", val: PURCHASE_ORDERS.filter(p=>["sent","partial"].includes(p.status)).length, cls: "amber" }, { label: "Selesai", val: PURCHASE_ORDERS.filter(p=>p.status==="received").length, cls: "emerald" }].map(k => (
          <div key={k.label} className={`kpi-card ${k.cls}`} style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{k.label}</p><p className="text-2xl font-bold text-white">{k.val}</p></div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>No. PO</th><th>Supplier</th><th style={{textAlign:"center"}}>Items</th><th style={{textAlign:"right"}}>Total</th><th>Cabang</th><th style={{textAlign:"center"}}>Status</th><th>Tanggal</th></tr></thead>
            <tbody>{PURCHASE_ORDERS.map(po => { const s = statusStyle[po.status]; return (
              <tr key={po.id}><td><code className="text-[11px] font-mono text-indigo-400">{po.id}</code></td><td className="text-sm font-semibold text-white">{po.supplier}</td><td style={{textAlign:"center"}} className="text-xs text-white/50">{po.items}</td><td style={{textAlign:"right"}} className="text-sm font-semibold text-white tabular-nums">{formatRupiah(po.totalAmount)}</td><td className="text-xs text-white/40">{po.branch}</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td><td className="text-xs text-white/30">{po.createdAt}</td></tr>
            ); })}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{PURCHASE_ORDERS.map(po => { const s = statusStyle[po.status]; return (
          <div key={po.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{po.supplier}</p><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div><p className="text-xs text-white/30 mt-1">{po.id} · {po.branch} · {po.createdAt}</p><p className="text-sm font-bold text-white mt-1 tabular-nums">{formatRupiah(po.totalAmount)}</p></div>
        ); })}</div>
      </div>
    </div>
  );
}
