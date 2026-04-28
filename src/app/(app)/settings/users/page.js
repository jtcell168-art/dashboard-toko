"use client";
import { useState } from "react";
import { USERS } from "@/data/mockData";

const roleColors = { owner: "#10B981", manager: "#8B5CF6", kasir: "#3B82F6", teknisi: "#F59E0B" };

export default function UsersSettingsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-2xl font-bold text-white">Manajemen User</h1><p className="text-sm text-white/40 mt-0.5">Kelola akun dan role karyawan</p></div><button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "person_add"}</span>{showForm ? "Batal" : "Tambah User"}</button></div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">User Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Nama *</label><input className="input-field" placeholder="Nama lengkap" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Email *</label><input className="input-field" type="email" placeholder="email@lumina.id" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Role *</label><select className="input-field"><option value="">Pilih role</option><option value="kasir">Kasir</option><option value="teknisi">Teknisi</option><option value="manager">Manager</option><option value="owner">Owner</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Cabang *</label><select className="input-field"><option value="">Pilih cabang</option><option value="Cabang A">Cabang A</option><option value="Cabang B">Cabang B</option><option value="Cabang C">Cabang C</option><option value="Semua">Semua Cabang</option></select></div>
          </div>
          <button onClick={() => { alert("User ditambahkan! (mock)"); setShowForm(false); }} className="btn-gradient py-3 text-sm">Simpan User</button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table"><thead><tr><th>Nama</th><th>Email</th><th style={{textAlign:"center"}}>Role</th><th>Cabang</th><th style={{textAlign:"center"}}>Status</th><th>Login Terakhir</th></tr></thead>
            <tbody>{USERS.map(u => (
              <tr key={u.id}><td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: roleColors[u.role] }}>{u.name[0]}</div><span className="text-sm font-semibold text-white">{u.name}</span></div></td><td className="text-xs text-white/40">{u.email}</td><td style={{textAlign:"center"}}><span className="text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full" style={{ background: roleColors[u.role] + "20", color: roleColors[u.role] }}>{u.role}</span></td><td className="text-xs text-white/50">{u.branch}</td><td style={{textAlign:"center"}}><span className={`w-2 h-2 rounded-full inline-block ${u.status === "active" ? "bg-emerald-400" : "bg-white/20"}`} /></td><td className="text-xs text-white/30">{u.lastLogin}</td></tr>
            ))}</tbody></table>
        </div>
        <div className="md:hidden divide-y divide-white/[0.04]">{USERS.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3.5"><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: roleColors[u.role] }}>{u.name[0]}</div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{u.name}</p><p className="text-[10px] text-white/30">{u.email} · {u.branch}</p></div><span className="text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full" style={{ background: roleColors[u.role] + "20", color: roleColors[u.role] }}>{u.role}</span></div>
        ))}</div>
      </div>
    </div>
  );
}
