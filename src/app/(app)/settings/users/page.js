"use client";
import { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser } from "@/app/actions/users";
import { getBranches } from "@/app/actions/branches";

const roleColors = { owner: "#10B981", manager: "#8B5CF6", kasir: "#3B82F6", teknisi: "#F59E0B" };

export default function UsersSettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "", branch_id: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [uData, bData] = await Promise.all([getUsers(), getBranches()]);
      setUsers(uData);
      setBranches(bData);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id || "",
      is_active: user.is_active
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.full_name || !editForm.role) return alert("Nama dan Role wajib diisi!");
    setIsSubmitting(true);
    try {
      await updateUser(editingUser.id, editForm);
      alert("User berhasil diperbarui!");
      setEditingUser(null);
      // Refresh list
      setUsers(await getUsers());
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus profile user ini?")) {
      try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Manajemen User</h1>
          <p className="text-sm text-white/40 mt-0.5">Kelola akun dan role karyawan</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "person_add"}</span>
          {showForm ? "Batal" : "Tambah User"}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up bg-indigo-500/5 border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <span className="material-symbols-outlined text-sm">info</span>
            <p className="text-[11px] font-medium">Untuk menambahkan user baru, silakan lakukan registrasi akun baru melalui halaman Login/Register, lalu ubah Role-nya di sini.</p>
          </div>
          <button onClick={() => setShowForm(false)} className="btn-gradient py-3 text-sm">Tutup</button>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="glass-card w-full max-w-lg p-6 relative animate-scale-in">
            <h3 className="text-lg font-bold text-white mb-4">Edit User: {editingUser.email}</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/40 uppercase font-bold">Nama Lengkap</label>
                <input 
                  className="input-field" 
                  value={editForm.full_name} 
                  onChange={e => setEditForm({...editForm, full_name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/40 uppercase font-bold">Role</label>
                  <select 
                    className="input-field" 
                    value={editForm.role} 
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                  >
                    <option value="kasir">Kasir</option>
                    <option value="teknisi">Teknisi</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/40 uppercase font-bold">Cabang</label>
                  <select 
                    className="input-field" 
                    value={editForm.branch_id} 
                    onChange={e => setEditForm({...editForm, branch_id: e.target.value})}
                  >
                    <option value="">Semua Cabang</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  checked={editForm.is_active} 
                  onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                />
                <label htmlFor="is_active" className="text-sm text-white/70">Akun Aktif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 transition-colors">Batal</button>
                <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 btn-gradient py-2.5 text-sm">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-white/40 animate-pulse">Memuat data user dari database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th style={{textAlign:"center"}}>Role</th>
                  <th>Cabang</th>
                  <th style={{textAlign:"center"}}>Status</th>
                  <th style={{textAlign:"right"}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg" style={{ background: roleColors[u.role] }}>
                          {u.full_name ? u.full_name[0].toUpperCase() : "?"}
                        </div>
                        <span className="text-sm font-semibold text-white">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="text-xs text-white/40">{u.email}</td>
                    <td style={{textAlign:"center"}}>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider" style={{ background: roleColors[u.role] + "20", color: roleColors[u.role] }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs text-white/50">{u.branches?.name || "Semua Cabang"}</td>
                    <td style={{textAlign:"center"}}>
                      <span className={`w-2 h-2 rounded-full inline-block ${u.is_active ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
                    </td>
                    <td style={{textAlign:"right"}}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
