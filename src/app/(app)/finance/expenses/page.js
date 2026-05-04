"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getExpenses, addExpense, updateExpense, deleteExpense } from "@/app/actions/finance";
import { getBranches } from "@/app/actions/branches";
import { getEmployees } from "@/app/actions/salaries";
import { getCurrentUser } from "@/app/actions/auth";
import { exportToExcel } from "@/lib/utils/export";
import ImageUpload from "@/components/ImageUpload"; // Tambahkan ini

const CATEGORIES = [
  "Sewa Toko", 
  "Listrik", 
  "Internet", 
  "Transportasi", 
  "Maintenance", 
  "Kirim HP (Antar Gudang)", 
  "Kirim HP (Supplier)", 
  "Pembelian Aset Tetap", 
  "Renovasi Gedung", 
  "Kirim Etalase", 
  "Cetak Promosi", 
  "Service Kendaraan",
  "Sumbangan / Duka",
  "Kirim Meja Demo",
  "Transfer Laba", 
  "Lainnya"
];

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "", branchId: "", note: "", imageUrl: "" });
  
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const u = await getCurrentUser();
      setCurrentUser(u);
      
      const [expData, branchData, empData] = await Promise.all([
        getExpenses(startDate, endDate),
        getBranches(),
        getEmployees()
      ]);
      setExpenses(expData);
      setBranches(branchData);
      setEmployees((empData || []).filter(e => e.role !== 'owner'));
      
      if (u?.branch_id && branchData.find(b => b.id === u.branch_id)) {
        setForm(f => ({ ...f, branchId: u.branch_id }));
      } else if (branchData.length > 0) {
        setForm(f => ({ ...f, branchId: branchData[0].id }));
      }
      setIsLoading(false);
    }
    load();
  }, [startDate, endDate]);

  const hasAccess = currentUser?.role === "owner" || currentUser?.role === "manager";
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = async () => {
    if (!form.category || !form.amount || !form.branchId) return alert("Lengkapi data!");
    try {
      await addExpense(form);
      alert(`Biaya berhasil ditambahkan!`);
      setShowForm(false);
      setForm({ ...form, category: "", amount: "", note: "", imageUrl: "" });
      setExpenses(await getExpenses()); // reload
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin hapus pengeluaran ini?")) {
      try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      category: expense.category,
      amount: expense.amount,
      note: expense.note
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.category || !editForm.amount) return alert("Lengkapi data!");
    try {
      await updateExpense(editingId, editForm);
      setEditingId(null);
      setEditForm(null);
      setExpenses(await getExpenses());
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Biaya Operasional</h1>
          <p className="text-sm text-white/40 mt-0.5">Kelola pengeluaran operasional toko</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const dataToExport = expenses.map(e => ({
                Tanggal: new Date(e.date).toLocaleDateString("id-ID"),
                Kategori: e.category,
                Jumlah: e.amount,
                Cabang: e.branches?.name,
                Catatan: e.note || "-"
              }));
              exportToExcel(dataToExport, "Laporan_Biaya_Operasional");
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          
          {hasAccess && (
            <button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>
              {showForm ? "Batal" : "Tambah Biaya"}
            </button>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
        <div className="flex flex-col px-2 py-1">
          <label className="text-[9px] uppercase font-bold text-white/30">Dari</label>
          <input 
            type="date" 
            className="bg-transparent text-xs text-white focus:outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex flex-col px-2 py-1">
          <label className="text-[9px] uppercase font-bold text-white/30">Sampai</label>
          <input 
            type="date" 
            className="bg-transparent text-xs text-white focus:outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="kpi-card rose" style={{ padding: 16 }}>
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Biaya Bulan Ini</p>
        <p className="text-2xl font-bold text-white tabular-nums">{formatRupiah(total)}</p>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-3 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white">Tambah Biaya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Kategori *</label>
              <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Pilih</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Jumlah *</label>
              <input className="input-field text-right tabular-nums" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Cabang *</label>
              <select className="input-field" value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} disabled={!["owner", "manager"].includes(currentUser?.role)}>
                <option value="">Pilih Cabang</option>
                {branches
                  .filter(b => ["owner", "manager"].includes(currentUser?.role) || b.id === currentUser?.branch_id)
                  .map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                }
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Catatan</label>
              <input 
                className="input-field" 
                value={form.note} 
                onChange={e => setForm({...form, note: e.target.value})} 
                placeholder={form.category === "Transfer Laba" ? "Laba periode x - y, Rekening: BRI 123..." : "Keterangan"} 
              />
            </div>
            {/* Input Upload */}
            <ImageUpload onUploadComplete={(url) => setForm({ ...form, imageUrl: url })} />
          </div>
          <button onClick={handleAdd} disabled={!form.category || !form.amount || !form.branchId} className="btn-gradient py-3 text-sm disabled:opacity-40 mt-2">Simpan</button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data pengeluaran.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {expenses.map(e => (
              <div key={e.id} className="flex flex-col gap-2 p-4 hover:bg-white/[0.02] transition-colors">
                
                {editingId === e.id ? (
                  <div className="bg-white/5 p-4 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Edit Pengeluaran</span></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select className="input-field" value={editForm.category} onChange={evt => setEditForm({...editForm, category: evt.target.value})}>
                        <option value="">Pilih</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input className="input-field tabular-nums" type="number" value={editForm.amount} onChange={evt => setEditForm({...editForm, amount: evt.target.value})} placeholder="Jumlah" />
                      <input className="input-field" value={editForm.note} onChange={evt => setEditForm({...editForm, note: evt.target.value})} placeholder="Catatan" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => {setEditingId(null); setEditForm(null);}} className="px-4 py-2 text-xs text-white/50 hover:bg-white/10 rounded-lg">Batal</button>
                      <button onClick={handleSaveEdit} className="btn-gradient px-4 py-2 text-xs">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10">
                      <span className="material-symbols-outlined text-[20px] text-red-400">receipt_long</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{e.category}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{e.note || "-"} · {e.branches?.name} · {new Date(e.date).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {e.image_url && (
                        <a href={e.image_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                          <span className="material-symbols-outlined text-[18px] text-white/50">image</span>
                        </a>
                      )}
                      <p className="text-sm font-bold text-white tabular-nums">{formatRupiah(e.amount)}</p>
                    </div>
                    {hasAccess && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleEdit(e)} className="p-1.5 text-white/30 hover:text-white transition-colors" title="Edit"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors" title="Hapus"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
