"use client";
import { useState } from "react";
import { INVENTORY_PRODUCTS, BRANCHES, TRANSFER_HISTORY, formatRupiah } from "@/data/mockData";

const statusStyle = { completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Selesai" }, in_transit: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Dalam Kirim" } };

export default function TransferStokPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: "", from: "", to: "", qty: 1 });

  const handleSubmit = () => { alert(`Transfer ${form.qty}x ${INVENTORY_PRODUCTS.find(p=>p.id===Number(form.product))?.name} dari ${form.from} ke ${form.to} berhasil! (mock)`); setShowForm(false); setForm({ product: "", from: "", to: "", qty: 1 }); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold text-white">Transfer Stok</h1><p className="text-sm text-white/40 mt-0.5">Pindahkan stok antar cabang</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "swap_horiz"}</span>{showForm ? "Batal" : "Transfer Baru"}</button>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-4 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-indigo-400">swap_horiz</span>Form Transfer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Produk</label><select className="input-field" value={form.product} onChange={e => setForm({...form, product: e.target.value})}><option value="">Pilih produk</option>{INVENTORY_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Jumlah</label><input className="input-field" type="number" min="1" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Dari Cabang</label><select className="input-field" value={form.from} onChange={e => setForm({...form, from: e.target.value})}><option value="">Pilih asal</option>{BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Ke Cabang</label><select className="input-field" value={form.to} onChange={e => setForm({...form, to: e.target.value})}><option value="">Pilih tujuan</option>{BRANCHES.filter(b => b.name !== form.from).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
          </div>
          <button onClick={handleSubmit} disabled={!form.product || !form.from || !form.to} className="btn-gradient py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">check</span>Proses Transfer</button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]"><h3 className="text-sm font-semibold text-white">Riwayat Transfer</h3></div>
        <div className="divide-y divide-white/[0.04]">
          {TRANSFER_HISTORY.map(t => {
            const s = statusStyle[t.status];
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}><span className="material-symbols-outlined text-[20px] text-indigo-400">swap_horiz</span></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.product} <span className="text-white/30">×{t.qty}</span></p>
                  <p className="text-[10px] text-white/30 mt-0.5">{t.from} → {t.to} · {t.date} · oleh {t.by}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
