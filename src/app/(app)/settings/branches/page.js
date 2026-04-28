"use client";
import { useState } from "react";
import { BRANCHES } from "@/data/mockData";

const COLORS = ["#6366F1", "#8B5CF6", "#A78BFA"];

export default function BranchesSettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const startEdit = (branch) => {
    setEditingId(branch.id);
    setEditForm({ name: branch.name, city: branch.city, address: branch.address, phone: branch.phone });
    setShowForm(false);
  };
  const cancelEdit = () => { setEditingId(null); setEditForm(null); };
  const saveEdit = () => {
    alert(`Cabang "${editForm.name}" berhasil diupdate!\n\nKota: ${editForm.city}\nAlamat: ${editForm.address}\nTelepon: ${editForm.phone}\n\n(Perubahan akan tersimpan ke Supabase setelah integrasi backend)`);
    setEditingId(null); setEditForm(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold text-white">Cabang</h1><p className="text-sm text-white/40 mt-0.5">Kelola data cabang toko</p></div>
        <button onClick={() => { setShowForm(!showForm); cancelEdit(); }} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add_business"}</span>{showForm ? "Batal" : "Tambah Cabang"}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">Cabang Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Nama Cabang *</label><input className="input-field" placeholder="Cabang D — xxx" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Kota</label><input className="input-field" placeholder="Kota" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Alamat</label><input className="input-field" placeholder="Alamat lengkap" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Telepon</label><input className="input-field" placeholder="021-xxx" /></div>
          </div>
          <button onClick={() => { alert("Cabang ditambahkan! (mock)"); setShowForm(false); }} className="btn-gradient py-3 text-sm">Simpan Cabang</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{BRANCHES.map((b, i) => (
        <div key={b.id} className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full filter blur-[30px] pointer-events-none opacity-15" style={{ background: COLORS[i] }} />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: COLORS[i] }}>{b.name.split("—")[0].trim().slice(-1)}</div>
            <div><p className="text-sm font-bold text-white">{b.name}</p><p className="text-[10px] text-white/30">{b.city}</p></div>
          </div>

          {editingId === b.id && editForm ? (
            <div className="flex flex-col gap-2.5 animate-fade-slide-up">
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Nama</label><input className="input-field text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Kota</label><input className="input-field text-sm" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Alamat</label><input className="input-field text-sm" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Telepon</label><input className="input-field text-sm" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div className="flex gap-2 mt-1">
                <button onClick={cancelEdit} className="flex-1 text-xs py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors">Batal</button>
                <button onClick={saveEdit} className="flex-1 btn-gradient text-xs py-2 flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[14px]">save</span>Simpan</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 text-white/40"><span className="material-symbols-outlined text-[14px]">location_on</span>{b.address}</div>
                <div className="flex items-center gap-2 text-white/40"><span className="material-symbols-outlined text-[14px]">call</span>{b.phone}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => startEdit(b)} className="flex-1 text-xs text-center py-2 rounded-lg bg-white/5 text-white/40 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">edit</span>Edit
                </button>
                <button onClick={() => alert(`Detail Cabang:\n\n${b.name}\nKota: ${b.city}\nAlamat: ${b.address}\nTelepon: ${b.phone}`)} className="flex-1 text-xs text-center py-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>Detail
                </button>
              </div>
            </>
          )}
        </div>
      ))}</div>
    </div>
  );
}
