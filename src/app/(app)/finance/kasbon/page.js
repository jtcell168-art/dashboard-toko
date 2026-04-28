"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

const statusStyle = { pending_approval: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Menunggu Approval" }, active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, paid: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, rejected: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Ditolak" } };

export default function KasbonPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: kasbon } = await supabase.from("kasbon").select("*, profiles(full_name, role)").order("created_at", { ascending: false });
      setData(kasbon || []);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Kasbon Karyawan</h1><p className="text-sm text-white/40 mt-0.5">Pengajuan, approval, dan pelunasan</p></div><button className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">add</span>Kasbon Baru</button></div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[{ label: "Saldo Kasbon Aktif", val: data.reduce((s,k)=>s+(k.status==="active"?k.remaining:0),0), cls: "rose", type: "money" }, { label: "Menunggu Approval", val: data.filter(k=>k.status==="pending_approval").length, cls: "amber", type: "count" }, { label: "Lunas", val: data.filter(k=>k.status==="paid").length, cls: "emerald", type: "count" }].map(k => (
          <div key={k.label} className={`kpi-card ${k.cls}`} style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{k.label}</p><p className="text-2xl font-bold text-white">{k.type === "money" ? formatRupiah(k.val) : k.val}</p></div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data Kasbon.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data.map(k => { const s = statusStyle[k.status]; return (
              <div key={k.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>request_quote</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{k.profiles?.full_name} <span className="text-[10px] text-white/40 font-normal">({k.profiles?.role})</span></p><p className="text-[10px] text-white/30 mt-0.5">{k.reason} · {new Date(k.created_at).toLocaleDateString("id-ID")} · Cicilan {formatRupiah(k.installment_amount)}/bln</p></div>
                <div className="text-right flex flex-col items-end gap-1"><p className="text-sm font-bold text-white tabular-nums">{k.status==="active"?formatRupiah(k.remaining):formatRupiah(k.amount)}<span className="text-[10px] text-white/30 font-normal">/{formatRupiah(k.amount)}</span></p>
                  {k.status === "pending_approval" ? (
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-semibold transition-colors mt-1">Approve</button>
                  ) : (
                    <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                  )}
                </div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
