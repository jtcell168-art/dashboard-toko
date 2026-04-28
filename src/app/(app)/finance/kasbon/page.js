"use client";
import { useState } from "react";
import { KASBON_LIST, formatRupiah } from "@/data/mockData";

const statusStyle = { active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, pending_approval: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Menunggu Approval" }, paid: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" } };

export default function KasbonPage() {
  const [showForm, setShowForm] = useState(false);
  const totalActive = KASBON_LIST.filter(k => k.status === "active").reduce((s, k) => s + k.remaining, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Kasbon Karyawan</h1><p className="text-sm text-white/40 mt-0.5">Pengajuan, approval, dan pelunasan</p></div><button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>{showForm ? "Batal" : "Kasbon Baru"}</button></div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Saldo Kasbon Aktif</p><p className="text-2xl font-bold text-red-400 tabular-nums">{formatRupiah(totalActive)}</p></div>
        <div className="kpi-card amber" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Menunggu Approval</p><p className="text-2xl font-bold text-amber-400">{KASBON_LIST.filter(k => k.status === "pending_approval").length}</p></div>
        <div className="kpi-card emerald hidden lg:block" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p><p className="text-2xl font-bold text-emerald-400">{KASBON_LIST.filter(k => k.status === "paid").length}</p></div>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">Pengajuan Kasbon Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Karyawan *</label><input className="input-field" placeholder="Nama karyawan" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Jumlah *</label><input className="input-field text-right tabular-nums" type="number" placeholder="0" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Cicilan/Bulan</label><input className="input-field text-right tabular-nums" type="number" placeholder="0" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Alasan</label><input className="input-field" placeholder="Keperluan" /></div>
          </div>
          <button onClick={() => { alert("Kasbon diajukan! (mock)"); setShowForm(false); }} className="btn-gradient py-3 text-sm">Ajukan Kasbon</button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.04]">{KASBON_LIST.map(k => { const s = statusStyle[k.status]; return (
          <div key={k.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}><span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>request_quote</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{k.employee} <span className="text-white/30 text-xs">({k.role})</span></p><p className="text-[10px] text-white/30 mt-0.5">{k.reason} · {k.date} · Cicilan {formatRupiah(k.installment)}/bln</p></div>
            <div className="text-right"><p className="text-sm font-bold text-white tabular-nums">{formatRupiah(k.remaining)}<span className="text-white/20 text-xs">/{formatRupiah(k.amount)}</span></p><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
            {k.status === "pending_approval" && <button onClick={() => alert("Approved! (mock)")} className="btn-gradient px-3 py-1.5 text-xs">Approve</button>}
          </div>
        ); })}</div>
      </div>
    </div>
  );
}
