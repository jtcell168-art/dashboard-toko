"use client";
import { useState } from "react";
import { DISCOUNT_LIMITS } from "@/data/mockData";

export default function DiscountSettingsPage() {
  const [limits, setLimits] = useState(DISCOUNT_LIMITS.map(l => ({ ...l })));
  const [editing, setEditing] = useState(null);

  const updateLimit = (role, val) => { setLimits(prev => prev.map(l => l.role === role ? { ...l, maxPercent: Math.min(5, Math.max(0, parseFloat(val) || 0)) } : l)); };
  const handleSave = () => { alert("Batas diskon berhasil disimpan! (mock)"); setEditing(null); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Atur Batas Diskon</h1><p className="text-sm text-white/40 mt-0.5">Konfigurasi batas diskon per role</p></div></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{limits.map(item => (
        <div key={item.role} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white capitalize">{item.role}</h3>
            <div className="flex items-center gap-2">
              <span className="badge info">{item.maxPercent}%</span>
              <button onClick={() => setEditing(editing === item.role ? null : item.role)} className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white transition-colors"><span className="material-symbols-outlined text-[16px]">{editing === item.role ? "close" : "edit"}</span></button>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.maxPercent / 5) * 100}%`, background: item.color }} /></div>
          {editing === item.role ? (
            <div className="flex items-center gap-2 mt-3 animate-fade-slide-up">
              <input className="input-field text-sm flex-1" type="number" step="0.1" min="0" max="5" value={item.maxPercent} onChange={e => updateLimit(item.role, e.target.value)} />
              <span className="text-xs text-white/30">%</span>
              <button onClick={handleSave} className="btn-gradient px-3 py-2 text-xs">Simpan</button>
            </div>
          ) : (
            <p className="text-[10px] text-white/30">Maks diskon: {item.maxPercent}%</p>
          )}
        </div>
      ))}</div>

      <div className="glass-card p-4"><div className="flex items-start gap-2"><span className="material-symbols-outlined text-indigo-400 text-[16px] mt-0.5">info</span><p className="text-xs text-white/40">Batas diskon berlaku untuk semua transaksi. Kasir/Teknisi hanya bisa memberikan diskon sesuai batas role mereka. Manager dan Owner memiliki batas lebih tinggi.</p></div></div>
    </div>
  );
}
