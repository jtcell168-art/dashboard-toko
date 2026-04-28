"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

const statusStyle = { unpaid: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Belum Bayar" }, partial: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Sebagian" }, paid: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" } };

export default function PayablesPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: payables } = await supabase.from("payables").select("*, suppliers(name), purchase_orders(po_number)").order("due_date", { ascending: true });
      setData(payables || []);
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Hutang Dagang</h1><p className="text-sm text-white/40 mt-0.5">Tracking hutang ke supplier</p></div>

      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Total Hutang", val: data.reduce((s,p)=>s+(p.status==="paid"?0:p.amount),0), cls: "rose", type: "money" }, { label: "Sudah Lunas", val: data.filter(p=>p.status==="paid").length, cls: "emerald", type: "count" }].map(k => (
          <div key={k.label} className={`kpi-card ${k.cls}`} style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">{k.label}</p><p className="text-2xl font-bold text-white">{k.type === "money" ? formatRupiah(k.val) : k.val}</p></div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada Hutang.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data.map(p => { const s = statusStyle[p.status]; return (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{p.status === "paid" ? "check_circle" : "schedule"}</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{p.suppliers?.name}</p><p className="text-[10px] text-white/40 mt-0.5">Ref: {p.purchase_orders?.po_number} · Jatuh tempo: {new Date(p.due_date).toLocaleDateString("id-ID")}</p></div>
                <div className="text-right flex flex-col items-end gap-1"><p className="text-sm font-bold text-white tabular-nums">{formatRupiah(p.amount)}</p><span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span></div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
