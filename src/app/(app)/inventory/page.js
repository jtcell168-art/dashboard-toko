"use client";

import { useState, useMemo } from "react";
import { INVENTORY_PRODUCTS, BRANCHES, formatRupiah } from "@/data/mockData";

const CATEGORIES = ["Semua", "HP", "Aksesori", "Sparepart"];
const ADD_CATEGORIES = ["HP", "Aksesori", "Sparepart"];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("name");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stockA: "0", stockB: "0", stockC: "0" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filtered = useMemo(() => {
    let items = [...INVENTORY_PRODUCTS];

    if (category !== "Semua") {
      items = items.filter((p) => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (sortBy === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "stock-low") items.sort((a, b) => (a.stockA + a.stockB + a.stockC) - (b.stockA + b.stockB + b.stockC));
    if (sortBy === "stock-high") items.sort((a, b) => (b.stockA + b.stockB + b.stockC) - (a.stockA + a.stockB + a.stockC));

    return items;
  }, [search, category, sortBy]);

  const totalItems = INVENTORY_PRODUCTS.reduce((sum, p) => sum + p.stockA + p.stockB + p.stockC, 0);
  const lowStockItems = INVENTORY_PRODUCTS.filter((p) => (p.stockA + p.stockB + p.stockC) < 5);

  const handleAddProduct = () => {
    if (!addForm.name || !addForm.sku) return alert("Nama dan SKU wajib diisi!");
    alert(`Produk "${addForm.name}" (${addForm.sku}) berhasil ditambahkan!\n\nKategori: ${addForm.category}\nHarga Beli: ${formatRupiah(Number(addForm.buyPrice) || 0)}\nHarga Jual: ${formatRupiah(Number(addForm.sellPrice) || 0)}\nStok: A=${addForm.stockA} B=${addForm.stockB} C=${addForm.stockC}\n\n(Data akan tersimpan ke Supabase setelah integrasi backend)`);
    setShowAddForm(false);
    setAddForm({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stockA: "0", stockB: "0", stockC: "0" });
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, sku: product.sku, category: product.category, buyPrice: String(product.buyPrice), sellPrice: String(product.sellPrice), stockA: String(product.stockA), stockB: String(product.stockB), stockC: String(product.stockC) });
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.sku) return alert("Nama dan SKU wajib diisi!");
    alert(`Produk "${editForm.name}" berhasil diupdate!\n\n(Perubahan akan tersimpan ke Supabase setelah integrasi backend)`);
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  return (
    <div className="flex flex-col gap-5 stagger-children">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Inventaris</h1>
          <p className="text-sm text-white/40 mt-0.5">Stok semua cabang — {INVENTORY_PRODUCTS.length} produk</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">{showAddForm ? "close" : "add"}</span>
          <span className="hidden sm:inline">{showAddForm ? "Batal" : "Tambah Produk"}</span>
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="glass-card p-5 flex flex-col gap-4 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-indigo-400">inventory_2</span>
            <h3 className="text-sm font-semibold text-white">Tambah Produk Baru</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Nama Produk *</label>
              <input className="input-field" placeholder="e.g. iPhone 16 128GB" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">SKU *</label>
              <input className="input-field uppercase font-mono" placeholder="e.g. APL-IP16-128" value={addForm.sku} onChange={e => setAddForm({...addForm, sku: e.target.value.toUpperCase()})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Kategori</label>
              <select className="input-field" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                {ADD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Harga Beli</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/20">Rp</span><input className="input-field pl-10 text-right tabular-nums" type="number" placeholder="0" value={addForm.buyPrice} onChange={e => setAddForm({...addForm, buyPrice: e.target.value})} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Harga Jual</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/20">Rp</span><input className="input-field pl-10 text-right tabular-nums" type="number" placeholder="0" value={addForm.sellPrice} onChange={e => setAddForm({...addForm, sellPrice: e.target.value})} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Stok Awal per Cabang</label>
              <div className="flex gap-2">
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="A" value={addForm.stockA} onChange={e => setAddForm({...addForm, stockA: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Cab A</p></div>
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="B" value={addForm.stockB} onChange={e => setAddForm({...addForm, stockB: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Cab B</p></div>
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="C" value={addForm.stockC} onChange={e => setAddForm({...addForm, stockC: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Cab C</p></div>
              </div>
            </div>
          </div>
          {addForm.buyPrice && addForm.sellPrice && Number(addForm.sellPrice) > Number(addForm.buyPrice) && (
            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
              <span className="material-symbols-outlined text-emerald-400 text-[16px]">trending_up</span>
              <p className="text-xs text-emerald-300/80 font-medium">Margin: {formatRupiah(Number(addForm.sellPrice) - Number(addForm.buyPrice))} ({((Number(addForm.sellPrice) - Number(addForm.buyPrice)) / Number(addForm.buyPrice) * 100).toFixed(1)}%)</p>
            </div>
          )}
          <button onClick={handleAddProduct} disabled={!addForm.name || !addForm.sku} className="btn-gradient py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Simpan Produk
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">
            search
          </span>
          <input
            className="input-field pl-10"
            placeholder="Cari produk, SKU, IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto min-w-[140px] appearance-none"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Urutkan: Nama</option>
          <option value="stock-low">Stok: Terendah</option>
          <option value="stock-high">Stok: Tertinggi</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200"
            style={
              category === cat
                ? { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Unit</p>
          <p className="text-2xl font-bold text-white tabular-nums">{totalItems.toLocaleString("id-ID")}</p>
        </div>
        <div className="kpi-card rose" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Stok Menipis</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-red-400 tabular-nums">{lowStockItems.length}</p>
            <span className="badge danger">Perlu restock</span>
          </div>
        </div>
        <div className="kpi-card emerald hidden lg:block" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Kategori HP</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {INVENTORY_PRODUCTS.filter((p) => p.category === "HP").length}
          </p>
        </div>
        <div className="kpi-card blue hidden lg:block" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Aksesori & Part</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {INVENTORY_PRODUCTS.filter((p) => p.category !== "HP").length}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>SKU</th>
                <th style={{ textAlign: "center" }}>Cab. A</th>
                <th style={{ textAlign: "center" }}>Cab. B</th>
                <th style={{ textAlign: "center" }}>Cab. C</th>
                <th style={{ textAlign: "center" }}>Total</th>
                <th style={{ textAlign: "right" }}>Harga Beli</th>
                <th style={{ textAlign: "right" }}>Harga Jual</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const total = product.stockA + product.stockB + product.stockC;
                const isLow = total < 5;
                return (
                  <tr key={product.id}>
                    <td>
                      <p className="text-sm font-semibold text-white">{product.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{product.category}</p>
                    </td>
                    <td>
                      <code className="text-[11px] text-white/40 font-mono">{product.sku}</code>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StockBadge count={product.stockA} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StockBadge count={product.stockB} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StockBadge count={product.stockC} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`text-sm font-bold tabular-nums ${isLow ? "text-red-400" : "text-white"}`}>
                        {total}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="text-xs text-white/60 tabular-nums">{formatRupiah(product.buyPrice)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {product.sellPrice > 0 ? (
                        <span className="text-xs text-white font-semibold tabular-nums">{formatRupiah(product.sellPrice)}</span>
                      ) : (
                        <span className="text-[10px] text-white/20">Internal</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-indigo-400" title="Transfer Stok">
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                        </button>
                        <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edit Modal (inline) */}
        {editingId && editForm && (
          <div className="p-5 border-t border-indigo-500/20 bg-indigo-500/[0.03] animate-fade-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-indigo-400">edit</span><h3 className="text-sm font-semibold text-white">Edit Produk — {editForm.name}</h3></div>
              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="flex flex-col gap-1 lg:col-span-2"><label className="text-[10px] text-white/30">Nama</label><input className="input-field text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">SKU</label><input className="input-field text-sm font-mono uppercase" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value.toUpperCase()})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Kategori</label><select className="input-field text-sm" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}><option value="HP">HP</option><option value="Aksesori">Aksesori</option><option value="Sparepart">Sparepart</option></select></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Harga Beli</label><input className="input-field text-sm text-right tabular-nums" type="number" value={editForm.buyPrice} onChange={e => setEditForm({...editForm, buyPrice: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Harga Jual</label><input className="input-field text-sm text-right tabular-nums" type="number" value={editForm.sellPrice} onChange={e => setEditForm({...editForm, sellPrice: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 max-w-xs">
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Cab A</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockA} onChange={e => setEditForm({...editForm, stockA: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Cab B</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockB} onChange={e => setEditForm({...editForm, stockB: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Cab C</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockC} onChange={e => setEditForm({...editForm, stockC: e.target.value})} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors">Batal</button>
              <button onClick={handleSaveEdit} className="btn-gradient px-6 py-2 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">save</span>Simpan Perubahan</button>
            </div>
          </div>
        )}

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {filtered.map((product) => {
            const total = product.stockA + product.stockB + product.stockC;
            const isLow = total < 5;
            return (
              <div key={product.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">{product.sku} · {product.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <StockBadge count={product.stockA} label="A" />
                    <StockBadge count={product.stockB} label="B" />
                    <StockBadge count={product.stockC} label="C" />
                  </div>
                  {product.sellPrice > 0 && (
                    <p className="text-[11px] text-white/50 mt-1 tabular-nums">{formatRupiah(product.sellPrice)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.04] flex justify-between items-center">
          <p className="text-[11px] text-white/30">
            Menampilkan {filtered.length} dari {INVENTORY_PRODUCTS.length} produk
          </p>
        </div>
      </div>
    </div>
  );
}

function StockBadge({ count, label }) {
  let bg, text;
  if (count === 0) {
    bg = "rgba(239,68,68,0.12)";
    text = "#F87171";
  } else if (count < 3) {
    bg = "rgba(239,68,68,0.08)";
    text = "#F87171";
  } else if (count < 10) {
    bg = "rgba(245,158,11,0.08)";
    text = "#FBBF24";
  } else {
    bg = "rgba(16,185,129,0.08)";
    text = "#34D399";
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums"
      style={{ background: bg, color: text }}
    >
      {label && <span className="text-[8px] opacity-60">{label}</span>}
      {count}
    </span>
  );
}
