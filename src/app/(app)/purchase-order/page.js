"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const statusStyle = { draft: { bg: "rgba(148,163,184,0.12)", color: "#94A3B8", label: "Draft" }, sent: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Terkirim" }, partial: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Sebagian" }, received: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Diterima" }, cancelled: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Dibatalkan" } };

export default function PurchaseOrderListPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: po } = await supabase.from("purchase_orders").select("*, suppliers(name), branches(name)");
      setData(po || []);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Purchase Order</h1><p className="text-sm text-white/40 mt-0.5">Daftar semua purchase order</p></div><Link href="/purchase-order/new" className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">add</span><span className="hidden sm:inline">Buat PO Baru</span></Link></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ label: "Total PO", val: data.length, cls: "indigo" }, { label: "Draft", val: data.filter(p=>p.status==="draft").length, cls: "blue" }, { label: "Dalam Proses", val: data.filter(p=>["sent","partial"].includes(p.status)).length, cls: "amber" }, { label: "Selesai", val: data.filter(p=>p.status==="received").length, cls: "emerald" }].map(k => (
          <div key={k.label} className={`kpi-card ${k.cls}`} style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{k.label}</p><p className="text-2xl font-bold text-white">{k.val}</p></div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada Purchase Order.</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table"><thead><tr><th>No. PO</th><th>Supplier</th><th style={{textAlign:"right"}}>Total</th><th>Cabang</th><th style={{textAlign:"center"}}>Status</th><th>Tanggal</th></tr></thead>
                <tbody>{data.map(po => { const s = statusStyle[po.status] || statusStyle.draft; return (
                  <tr key={po.id}><td><code className="text-[11px] font-mono text-indigo-400">{po.po_number}</code></td><td className="text-sm font-semibold text-white">{po.suppliers?.name}</td><td style={{textAlign:"right"}} className="text-sm font-semibold text-white tabular-nums">{formatRupiah(po.total_amount)}</td><td className="text-xs text-white/40">{po.branches?.name}</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></td><td className="text-xs text-white/30">{new Date(po.created_at).toLocaleDateString("id-ID")}</td></tr>
                ); })}</tbody></table>
            </div>
            <div className="md:hidden divide-y divide-white/[0.04]">{data.map(po => { const s = statusStyle[po.status] || statusStyle.draft; return (
              <div key={po.id} className="px-4 py-3.5"><div className="flex justify-between"><p className="text-sm font-semibold text-white">{po.suppliers?.name}</p><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div><p className="text-xs text-white/30 mt-1">{po.po_number} · {po.branches?.name} · {new Date(po.created_at).toLocaleDateString("id-ID")}</p><p className="text-sm font-bold text-white mt-1 tabular-nums">{formatRupiah(po.total_amount)}</p></div>
            ); })}</div>
          </>
        )}
      </div>
    </div>
  );
}
