"use client";

import { useState, useEffect, useMemo } from "react";
import { getAssets, addAsset, deleteAsset, getAssetStats } from "@/app/actions/assets";
import { getBranches } from "@/app/actions/branches";
import { useBranch } from "@/context/BranchContext";
import { formatRupiah } from "@/data/mockData";

const CATEGORIES = ["Elektronik", "Furniture", "Bangunan", "Kendaraan", "Lainnya"];

export default function AssetsPage() {
  const { selectedBranch, isMounted } = useBranch();
  const [assets, setAssets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({ totalInvestment: 0, assetCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Elektronik",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    note: "",
    branchId: "all"
  });

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, selectedBranch]);

  async function loadData() {
    setLoading(true);
    const [assetsData, statsData, branchesData] = await Promise.all([
      getAssets(selectedBranch),
      getAssetStats(selectedBranch),
      getBranches()
    ]);
    setAssets(assetsData);
    setStats(statsData);
    setBranches(branchesData);
    setLoading(false);
  }

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addAsset({
      ...formData,
      branchId: selectedBranch === "all" ? formData.branchId : selectedBranch
    });
    
    if (res.success) {
      setShowAddModal(false);
      setFormData({ name: "", category: "Elektronik", purchasePrice: "", purchaseDate: new Date().toISOString().split('T')[0], note: "", branchId: "all" });
      loadData();
    } else {
      alert("Gagal menambah aset: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus aset ini?")) {
      const res = await deleteAsset(id);
      if (res.success) loadData();
      else alert(res.error);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-6 stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Manajemen Aset</h1>
          <p className="text-sm text-white/40 mt-0.5">Pantau aset tetap dan investasi peralatan toko Anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-gradient flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Tambah Aset
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-400">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium">Total Investasi Aset</p>
            <h3 className="text-xl font-bold text-white">{formatRupiah(stats.totalInvestment)}</h3>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400">inventory_2</span>
          </div>
          <div>
            <p className="text-xs text-white/40 font-medium">Jumlah Aset Terdaftar</p>
            <h3 className="text-xl font-bold text-white">{stats.assetCount} Item</h3>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="glass-card overflow-hidden border border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider">Nama Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider">Cabang</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider text-right">Harga Beli</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider text-center">Tanggal Beli</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-white/20">Memuat data aset...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-white/20">Belum ada aset terdaftar.</td></tr>
              ) : assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{asset.name}</span>
                      <span className="text-[10px] text-white/30">{asset.note || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge info text-[10px]">{asset.category}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60">
                    {asset.branches?.name || "Semua Cabang"}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-right text-white">
                    {formatRupiah(asset.purchase_price)}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40 text-center">
                    {new Date(asset.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg p-6 shadow-2xl border-white/10 animate-fade-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">add_box</span>
                Tambah Aset Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/20 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 ml-1">Nama Aset</label>
                <input 
                  required
                  className="input-field" 
                  placeholder="Contoh: Komputer Kasir, Etalase Depan" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/40 ml-1">Kategori</label>
                  <select 
                    className="input-field"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/40 ml-1">Tanggal Beli</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/40 ml-1">Cabang</label>
                  <select 
                    className="input-field"
                    value={selectedBranch !== "all" ? selectedBranch : formData.branchId}
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                    disabled={selectedBranch !== "all"}
                  >
                    <option value="all">Semua Cabang</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/40 ml-1">Harga Beli (Rp)</label>
                  <input 
                    required
                    type="number"
                    className="input-field font-mono"
                    placeholder="Masukkan nominal..."
                    value={formData.purchasePrice}
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 ml-1">Catatan Tambahan</label>
                <textarea 
                  className="input-field h-20 resize-none py-3"
                  placeholder="Misal: Beli di Toko Jaya, Garansi 1 tahun..."
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  disabled={isSubmitting}
                  className="btn-gradient w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Simpan Aset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
