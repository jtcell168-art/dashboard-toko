"use client";
import { useState } from "react";
import { EXPENSES, BRANCHES, formatRupiah } from "@/data/mockData";

const CATEGORIES = ["Sewa Toko", "Listrik", "Internet", "Gaji", "Transportasi", "Maintenance", "Lainnya"];

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "", branch: "", note: "" });
  const total = EXPENSES.reduce((s, e) => s + e.amount, 0);
  const handleAdd = () => { alert(`Biaya "${form.category}" ${formatRupiah(Number(form.amount))} ditambahkan! (mock)`); setShowForm(false); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Biaya Operasional</h1><p className="text-sm text-white/40 mt-0.5">Kelola pengeluaran operasional toko</p></div><button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>{showForm ? "Batal" : "Tambah Biaya"}</button></div>

      <div className="kpi-card rose" style={{ padding: 16 }}><p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Biaya Bulan Ini</p><p className="text-2xl font-bold text-white tabular-nums">{formatRupiah(total)}</p></div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">Tambah Biaya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Kategori *</label><select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="">Pilih</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Jumlah *</label><input className="input-field text-right tabular-nums" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Cabang</label><select className="input-field" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}><option value="Semua">Semua Cabang</option>{BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Catatan</label><input className="input-field" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Keterangan" /></div>
          </div>
          <button onClick={handleAdd} disabled={!form.category || !form.amount} className="btn-gradient py-3 text-sm disabled:opacity-40">Simpan</button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/[0.04]">{EXPENSES.map(e => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10"><span className="material-symbols-outlined text-[20px] text-red-400">receipt_long</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{e.category}</p><p className="text-[10px] text-white/30 mt-0.5">{e.note} · {e.branch} · {e.date}</p></div>
            <div className="text-right"><p className="text-sm font-bold text-white tabular-nums">{formatRupiah(e.amount)}</p>{e.recurring && <p className="text-[9px] text-white/20">Rutin</p>}</div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
