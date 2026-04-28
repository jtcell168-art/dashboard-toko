"use client";
import { useState } from "react";
import { SUPPLIERS, formatRupiah } from "@/data/mockData";

export default function SuppliersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", category: "" });
  const handleAdd = () => { alert(`Supplier "${form.name}" berhasil ditambahkan! (mock)`); setShowForm(false); setForm({ name: "", contact: "", phone: "", email: "", category: "" }); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Supplier</h1><p className="text-sm text-white/40 mt-0.5">Kelola data supplier</p></div><button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>{showForm ? "Batal" : "Tambah Supplier"}</button></div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-4 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">Supplier Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Nama Supplier *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="PT Contoh" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Kontak Person</label><input className="input-field" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="Nama kontak" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Telepon</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="021-xxx" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Email</label><input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@supplier.com" /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><label className="text-xs text-white/40">Kategori</label><input className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Contoh: Apple Authorized" /></div>
          </div>
          <button onClick={handleAdd} disabled={!form.name} className="btn-gradient py-3 text-sm disabled:opacity-40">Simpan Supplier</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{SUPPLIERS.map(s => (
        <div key={s.id} className="glass-card p-5">
          <div className="flex items-start justify-between mb-3"><div><p className="text-sm font-bold text-white">{s.name}</p><p className="text-[10px] text-white/30 mt-0.5">{s.category}</p></div>{s.balance < 0 && <span className="badge danger">{formatRupiah(Math.abs(s.balance))}</span>}{s.balance === 0 && <span className="badge success">Lunas</span>}</div>
          <div className="flex flex-col gap-1.5 text-xs"><div className="flex items-center gap-2 text-white/40"><span className="material-symbols-outlined text-[14px]">person</span>{s.contact}</div><div className="flex items-center gap-2 text-white/40"><span className="material-symbols-outlined text-[14px]">call</span>{s.phone}</div><div className="flex items-center gap-2 text-white/40"><span className="material-symbols-outlined text-[14px]">mail</span>{s.email}</div></div>
        </div>
      ))}</div>
    </div>
  );
}
