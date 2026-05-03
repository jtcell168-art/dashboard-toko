"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";

export default function ServiceReportPage() {
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Laporan Servis</h1><p className="text-sm text-white/40 mt-0.5">Analisis performa layanan servis</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Servis</p><p className="text-xl font-bold text-white tabular-nums">0</p></div>
        <div className="kpi-card emerald" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Pendapatan Servis</p><p className="text-xl font-bold text-white tabular-nums">Rp 0</p></div>
        <div className="kpi-card blue" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Servis Selesai</p><p className="text-xl font-bold text-white">0</p></div>
        <div className="kpi-card amber" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Tingkat Kesuksesan</p><p className="text-xl font-bold text-white tabular-nums">0%</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-8 text-center text-white/50 text-sm">Belum ada data untuk laporan servis.</div>
      </div>
    </div>
  );
}
