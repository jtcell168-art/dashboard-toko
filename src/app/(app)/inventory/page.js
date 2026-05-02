"use client";

import { useState, useMemo, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getInventory, addProduct, updateProduct, deleteProduct, updateProductPrice, getPriceHistory } from "@/app/actions/inventory";
import { fixNokiaStock, migrateImeiStatus } from "@/app/actions/pos";
import { getCurrentUser } from "@/app/actions/auth";
import { getBranches } from "@/app/actions/branches";
import { exportToExcel } from "@/lib/utils/export";
import IMEIScanner from "@/components/inventory/IMEIScanner";

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

  const [dbProducts, setDbProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ buyPrice: "", sellPrice: "", reason: "" });
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [branches, setBranches] = useState([]);
  const [imeiList, setImeiList] = useState([]); // [{ imei, branchId }]
  const [scanningBranch, setScanningBranch] = useState(null); // ID cabang yang sedang discan
  const [showScanner, setShowScanner] = useState(false);
  const [manualImei, setManualImei] = useState("");
  const [selectedManualBranch, setSelectedManualBranch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Load data
  useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      setIsLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      const [data, branchList] = await Promise.all([
        getInventory(user?.branch_id || "all"),
        getBranches()
      ]);
      setBranches(branchList);

      const mapped = data.map(p => {
        // Map stock based on branch names/IDs dynamically
        const stocks = {};
        branchList.forEach(b => {
          const s = p.stock.find(st => st.branch_id === b.id);
          stocks[b.id] = s ? s.quantity : 0;
        });

        // Helper for summary and sorting (A=Ruteng, B=Larantuka, C=Riung for legacy compatibility if needed)
        const rutengId = branchList.find(b => b.name.toLowerCase().includes("ruteng"))?.id;
        const laraId = branchList.find(b => b.name.toLowerCase().includes("larantuka"))?.id;
        const riungId = branchList.find(b => b.name.toLowerCase().includes("riung"))?.id;

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          buyPrice: p.purchase_price,
          sellPrice: p.retail_price,
          stockA: rutengId ? stocks[rutengId] : 0,
          stockB: laraId ? stocks[laraId] : 0,
          stockC: riungId ? stocks[riungId] : 0,
          stocks, // Full map for dynamic rendering
          originalStock: p.stock
        };
      });
      setDbProducts(mapped);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const hasAccess = currentUser?.role === "owner" || currentUser?.role === "manager";
  const canSeeBuyPrice = currentUser?.role === "owner" || currentUser?.role === "manager";

  const filtered = useMemo(() => {
    let items = [...dbProducts];

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
  }, [search, category, sortBy, dbProducts]);

  const totalItems = dbProducts.reduce((sum, p) => sum + p.stockA + p.stockB + p.stockC, 0);
  const lowStockItems = dbProducts.filter((p) => (p.stockA + p.stockB + p.stockC) < 5);

  const handleAddProduct = async () => {
    if (!addForm.name || !addForm.sku) return alert("Nama dan SKU wajib diisi!");
    
    // Validate IMEIs if category is HP
    if (addForm.category === "HP") {
      const totalStock = Number(addForm.stockA) + Number(addForm.stockB) + Number(addForm.stockC);
      if (imeiList.length < totalStock) {
        return alert(`Mohon lengkapi IMEI. Total stok adalah ${totalStock} unit, baru ${imeiList.length} IMEI yang diinput.`);
      }
    }

    try {
      const stockMap = {};
      const ruteng = branches.find(b => b.name.includes("Ruteng"));
      const lara = branches.find(b => b.name.includes("Larantuka"));
      const riung = branches.find(b => b.name.includes("Riung"));
      
      if (ruteng) stockMap[ruteng.id] = Number(addForm.stockA);
      if (lara) stockMap[lara.id] = Number(addForm.stockB);
      if (riung) stockMap[riung.id] = Number(addForm.stockC);

      const res = await addProduct({
        name: addForm.name, sku: addForm.sku, category: addForm.category,
        retailPrice: Number(addForm.sellPrice), purchasePrice: Number(addForm.buyPrice),
        isService: false, isDigital: false
      }, stockMap, imeiList);

      if (res.error) {
        return alert(res.error);
      }

      alert(`Produk berhasil ditambahkan!`);
      setShowAddForm(false);
      setAddForm({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stockA: "0", stockB: "0", stockC: "0" });
      setImeiList([]);
      window.location.reload(); 
    } catch (err) { alert("Terjadi kesalahan sistem: " + err.message); }
  };

  const handleAddImei = (imeiString, branchId) => {
    if (!imeiString || !branchId) return;
    
    // Split by newline, comma, or space and clean up
    const newImeis = imeiString
      .split(/[\n, ]+/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (newImeis.length === 0) return;

    const currentImeis = [...imeiList];
    let addedCount = 0;
    let skippedCount = 0;

    newImeis.forEach(imei => {
      if (currentImeis.some(i => i.imei === imei)) {
        skippedCount++;
      } else {
        currentImeis.push({ imei, branchId });
        addedCount++;
      }
    });

    setImeiList(currentImeis);

    // Auto-update stock count in addForm for that branch
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      const branchName = branch.name.toLowerCase();
      const countInBranch = currentImeis.filter(i => i.branchId === branchId).length;
      
      if (branchName.includes("ruteng")) setAddForm(prev => ({ ...prev, stockA: String(countInBranch) }));
      else if (branchName.includes("larantuka")) setAddForm(prev => ({ ...prev, stockB: String(countInBranch) }));
      else if (branchName.includes("riung")) setAddForm(prev => ({ ...prev, stockC: String(countInBranch) }));
    }

    if (skippedCount > 0) {
      alert(`${addedCount} IMEI berhasil ditambahkan, ${skippedCount} IMEI dilewati karena sudah ada.`);
    }
  };

  const removeImei = (imei) => {
    const updated = imeiList.filter(i => i.imei !== imei);
    setImeiList(updated);
    
    // Update stock counts after removal
    const stocks = { stockA: 0, stockB: 0, stockC: 0 };
    updated.forEach(item => {
      const b = branches.find(br => br.id === item.branchId);
      if (b?.name.toLowerCase().includes("ruteng")) stocks.stockA++;
      else if (b?.name.toLowerCase().includes("larantuka")) stocks.stockB++;
      else if (b?.name.toLowerCase().includes("riung")) stocks.stockC++;
    });

    setAddForm(prev => ({ 
      ...prev, 
      stockA: String(stocks.stockA), 
      stockB: String(stocks.stockB), 
      stockC: String(stocks.stockC) 
    }));
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, sku: product.sku, category: product.category, buyPrice: String(product.buyPrice), sellPrice: String(product.sellPrice), stockA: String(product.stockA), stockB: String(product.stockB), stockC: String(product.stockC) });
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.sku) return alert("Nama dan SKU wajib diisi!");
    try {
      const res = await updateProduct(editingId, {
        name: editForm.name, sku: editForm.sku, category: editForm.category,
        retailPrice: Number(editForm.sellPrice), purchasePrice: Number(editForm.buyPrice)
      });
      if (res.error) {
        return alert(res.error);
      }
      alert(`Produk berhasil diupdate!`);
      setEditingId(null);
      setEditForm(null);
      window.location.reload();
    } catch (err) { alert("Terjadi kesalahan sistem: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      try {
        await deleteProduct(id);
        setDbProducts(dbProducts.filter(p => p.id !== id));
      } catch (err) { alert(err.message); }
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const handleOpenPriceModal = (product) => {
    setPriceHistoryProduct(product);
    setPriceForm({ buyPrice: String(product.buyPrice), sellPrice: String(product.sellPrice), reason: "" });
    setShowPriceModal(true);
    // Load history
    loadPriceHistory(product.id);
  };

  const loadPriceHistory = async (id) => {
    const history = await getPriceHistory(id);
    setPriceHistory(history);
  };

  const handleUpdatePrice = async () => {
    if (!priceForm.buyPrice || !priceForm.sellPrice) return alert("Harga beli dan jual wajib diisi!");
    setIsUpdatingPrice(true);
    try {
      await updateProductPrice(priceHistoryProduct.id, Number(priceForm.buyPrice), Number(priceForm.sellPrice), priceForm.reason);
      alert("Harga berhasil diperbarui!");
      setShowPriceModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 stagger-children">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Inventaris</h1>
          <p className="text-sm text-white/40 mt-0.5">Stok semua cabang — {dbProducts.length} produk</p>
        </div>
        {hasAccess && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const dataToExport = filtered.map(p => ({
                  Nama: p.name,
                  SKU: p.sku,
                  Kategori: p.category,
                  "Harga Beli": p.buyPrice,
                  "Harga Jual": p.sellPrice,
                  "Stok Ruteng": p.stockA,
                  "Stok Larantuka": p.stockB,
                  "Stok Riung": p.stockC,
                  "Total Stok": p.stockA + p.stockB + p.stockC
                }));
                exportToExcel(dataToExport, "Inventaris_JT_Cell");
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button 
              onClick={async () => {
                await migrateImeiStatus();
                const res = await fixNokiaStock(currentUser?.branch_id || "all");
                alert(res);
                window.location.reload();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold flex items-center gap-2 hover:bg-amber-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span className="hidden sm:inline">Sinkronkan Stok</span>
            </button>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{showAddForm ? "close" : "add"}</span>
              <span className="hidden sm:inline">{showAddForm ? "Batal" : "Tambah Produk"}</span>
            </button>
          </div>
        )}
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
            {canSeeBuyPrice && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/40">Harga Beli</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/20">Rp</span><input className="input-field pl-10 text-right tabular-nums" type="number" placeholder="0" value={addForm.buyPrice} onChange={e => setAddForm({...addForm, buyPrice: e.target.value})} /></div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Harga Jual</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/20">Rp</span><input className="input-field pl-10 text-right tabular-nums" type="number" placeholder="0" value={addForm.sellPrice} onChange={e => setAddForm({...addForm, sellPrice: e.target.value})} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">Stok Awal per Cabang</label>
              <div className="flex gap-2">
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="A" value={addForm.stockA} onChange={e => setAddForm({...addForm, stockA: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Ruteng</p></div>
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="B" value={addForm.stockB} onChange={e => setAddForm({...addForm, stockB: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Larantuka</p></div>
                <div className="flex-1"><input className="input-field text-center text-sm" type="number" min="0" placeholder="C" value={addForm.stockC} onChange={e => setAddForm({...addForm, stockC: e.target.value})} /><p className="text-[9px] text-white/20 text-center mt-0.5">Riung</p></div>
              </div>
            </div>
          </div>
          {canSeeBuyPrice && addForm.buyPrice && addForm.sellPrice && Number(addForm.sellPrice) > Number(addForm.buyPrice) && (
            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
              <span className="material-symbols-outlined text-emerald-400 text-[16px]">trending_up</span>
              <p className="text-xs text-emerald-300/80 font-medium">Margin: {formatRupiah(Number(addForm.sellPrice) - Number(addForm.buyPrice))} ({((Number(addForm.sellPrice) - Number(addForm.buyPrice)) / Number(addForm.buyPrice) * 100).toFixed(1)}%)</p>
            </div>
          )}
          {/* IMEI Section for HP */}
          {addForm.category === "HP" && (
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  Input IMEI 1
                </h4>
                <div className="text-[10px] text-white/40">
                  Total: <span className="text-white font-bold">{imeiList.length}</span> / {Number(addForm.stockA) + Number(addForm.stockB) + Number(addForm.stockC)} unit
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Branch Select for Scan */}
                <div className="flex flex-wrap gap-2">
                  {branches.map(branch => (
                    <button 
                      key={branch.id}
                      onClick={() => { setScanningBranch(branch.id); setShowScanner(true); }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      Scan untuk {branch.name.split(' ')[2] || branch.name}
                    </button>
                  ))}
                </div>

                {/* Manual Input Opsi */}
                <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] text-white/40 uppercase font-bold">Input Manual / Paste IMEI (Bisa Banyak)</label>
                    <textarea 
                      className="input-field py-2 text-sm min-h-[80px] font-mono" 
                      placeholder="Masukkan IMEI... &#10;Bisa banyak sekaligus (Pisahkan dengan Enter atau Koma)" 
                      value={manualImei} 
                      onChange={e => setManualImei(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="w-full sm:w-60 flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold">Pilih Cabang untuk IMEI ini</label>
                      <select 
                        className="input-field py-2 text-xs" 
                        value={selectedManualBranch} 
                        onChange={e => setSelectedManualBranch(e.target.value)}
                      >
                        <option value="">Pilih Cabang</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name.split(' ')[2] || b.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        if (!manualImei || !selectedManualBranch) return alert("Pilih cabang dan isi IMEI!");
                        handleAddImei(manualImei, selectedManualBranch);
                        setManualImei("");
                      }}
                      className="btn-gradient px-6 py-2 text-sm h-[38px] w-full sm:w-auto mt-auto"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add_task</span>
                        Tambah Massal
                      </span>
                    </button>
                  </div>
                </div>

                {/* IMEI List Display */}
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {imeiList.map(item => (
                    <div key={item.imei} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 group">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-white">{item.imei}</span>
                        <span className="text-[8px] text-white/30 uppercase">{branches.find(b => b.id === item.branchId)?.name.split(' ')[2]}</span>
                      </div>
                      <button onClick={() => removeImei(item.imei)} className="text-white/20 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  {imeiList.length === 0 && (
                    <div className="w-full py-4 text-center border border-dashed border-white/10 rounded-xl text-[10px] text-white/20">
                      Belum ada IMEI yang diinput. Klik tombol scan di atas.
                    </div>
                  )}
                </div>
              </div>
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
            suppressHydrationWarning
          />
        </div>
        <select
          className="input-field w-auto min-w-[140px] appearance-none"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          suppressHydrationWarning
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              category === cat 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Unit</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            <DynamicValue isMounted={isMounted}>
              {totalItems.toLocaleString("id-ID")}
            </DynamicValue>
          </p>
        </div>
        <div className="kpi-card rose" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Stok Menipis</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-red-400 tabular-nums">
              <DynamicValue isMounted={isMounted}>
                {lowStockItems.length}
              </DynamicValue>
            </p>
            <span className="badge danger">Perlu restock</span>
          </div>
        </div>
        <div className="kpi-card emerald hidden lg:block" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Kategori HP</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {dbProducts.filter((p) => p.category === "HP").length}
          </p>
        </div>
        <div className="kpi-card blue hidden lg:block" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Aksesori & Part</p>
          <p className="text-2xl font-bold text-white tabular-nums">
            {dbProducts.filter((p) => p.category !== "HP").length}
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
                {hasAccess ? (
                  branches.map(b => (
                    <th key={b.id} style={{ textAlign: "center" }}>{b.name.split(' ')[2] || b.name}</th>
                  ))
                ) : (
                  <th style={{ textAlign: "center" }}>Stok</th>
                )}
                <th style={{ textAlign: "center" }}>Total</th>
                {canSeeBuyPrice && <th style={{ textAlign: "right" }}>Harga Beli</th>}
                <th style={{ textAlign: "right" }}>Harga Jual</th>
                {hasAccess && <th style={{ textAlign: "center" }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const total = Object.values(product.stocks || {}).reduce((a, b) => a + b, 0);
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
                    {hasAccess ? (
                      branches.map(b => (
                        <td key={b.id} style={{ textAlign: "center" }}>
                          <StockBadge count={product.stocks?.[b.id] || 0} />
                        </td>
                      ))
                    ) : (
                      <td style={{ textAlign: "center" }}>
                        <StockBadge count={product.stocks?.[currentUser?.branch_id] || 0} />
                      </td>
                    )}
                    <td style={{ textAlign: "center" }}>
                      <span className={`text-sm font-bold tabular-nums ${isLow ? "text-red-400" : "text-white"}`}>
                        <DynamicValue isMounted={isMounted}>
                          {total}
                        </DynamicValue>
                      </span>
                    </td>
                    {canSeeBuyPrice && (
                      <td style={{ textAlign: "right" }}>
                        <span className="text-xs text-white/60 tabular-nums">{formatRupiah(product.buyPrice)}</span>
                      </td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      {product.sellPrice > 0 ? (
                        <span className="text-xs text-white font-semibold tabular-nums">{formatRupiah(product.sellPrice)}</span>
                      ) : (
                        <span className="text-[10px] text-white/20">Internal</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasAccess && (
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-indigo-400" title="Transfer Stok">
                            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                          </button>
                          <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white" title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => handleOpenPriceModal(product)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-emerald-400" title="Ubah Harga & History">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-white/40 hover:text-red-400" title="Hapus">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
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
              {canSeeBuyPrice && (
                <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Harga Beli</label><input className="input-field text-sm text-right tabular-nums" type="number" value={editForm.buyPrice} onChange={e => setEditForm({...editForm, buyPrice: e.target.value})} /></div>
              )}
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Harga Jual</label><input className="input-field text-sm text-right tabular-nums" type="number" value={editForm.sellPrice} onChange={e => setEditForm({...editForm, sellPrice: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 max-w-xs">
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Ruteng</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockA} onChange={e => setEditForm({...editForm, stockA: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Larantuka</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockB} onChange={e => setEditForm({...editForm, stockB: e.target.value})} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] text-white/30">Riung</label><input className="input-field text-sm text-center" type="number" min="0" value={editForm.stockC} onChange={e => setEditForm({...editForm, stockC: e.target.value})} /></div>
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
            const total = Object.values(product.stocks || {}).reduce((a, b) => a + b, 0);
            return (
              <div key={product.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">{product.sku} · {product.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    {hasAccess ? (
                      branches.map(b => (
                        <StockBadge key={b.id} count={product.stocks?.[b.id] || 0} label={b.name.substring(0, 1)} />
                      ))
                    ) : (
                      <StockBadge count={product.stocks?.[currentUser?.branch_id] || 0} label="Stok" />
                    )}
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
            Menampilkan {filtered.length} dari {dbProducts.length} produk
          </p>
        </div>
      </div>

      {/* Price History Modal */}
      {showPriceModal && priceHistoryProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPriceModal(false)} />
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-scale-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-base font-bold text-white">{priceHistoryProduct.name}</h3>
                <p className="text-xs text-white/40">Ubah Harga & Riwayat Perubahan</p>
              </div>
              <button onClick={() => setShowPriceModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Update */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Update Harga</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-white/40">Harga Beli Baru (Rp)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={priceForm.buyPrice} 
                        onChange={e => setPriceForm({...priceForm, buyPrice: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-white/40">Harga Jual Baru (Rp)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={priceForm.sellPrice} 
                        onChange={e => setPriceForm({...priceForm, sellPrice: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-white/40">Alasan Perubahan</label>
                      <textarea 
                        className="input-field min-h-[80px] py-2 resize-none" 
                        placeholder="e.g. Penurunan harga pusat / Promo Lebaran"
                        value={priceForm.reason}
                        onChange={e => setPriceForm({...priceForm, reason: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleUpdatePrice} 
                      disabled={isUpdatingPrice}
                      className="btn-gradient w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      {isUpdatingPrice ? "Memperbarui..." : "Update Harga Sekarang"}
                    </button>
                  </div>
                </div>

                {/* History List */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Riwayat Perubahan</h4>
                  <div className="space-y-3">
                    {priceHistory.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                        <span className="material-symbols-outlined text-white/10 text-[32px] mb-2">history</span>
                        <p className="text-xs text-white/20">Belum ada riwayat harga</p>
                      </div>
                    ) : (
                      priceHistory.map((h) => (
                        <div key={h.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/60 font-semibold">{h.profiles?.full_name}</span>
                            <span className="text-white/20">{new Date(h.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-white/20 uppercase font-bold">Harga Beli</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-white/40 line-through">{formatRupiah(h.old_buy_price)}</span>
                                <span className="material-symbols-outlined text-[10px] text-white/20">arrow_forward</span>
                                <span className="text-[10px] text-white font-bold">{formatRupiah(h.new_buy_price)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-white/20 uppercase font-bold">Harga Jual</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-white/40 line-through">{formatRupiah(h.old_sell_price)}</span>
                                <span className="material-symbols-outlined text-[10px] text-white/20">arrow_forward</span>
                                <span className="text-[10px] text-emerald-400 font-bold">{formatRupiah(h.new_sell_price)}</span>
                              </div>
                            </div>
                          </div>
                          {h.reason && (
                            <p className="text-[10px] text-white/50 italic bg-white/[0.05] p-1.5 rounded-md border-l-2 border-indigo-500/50">
                              "{h.reason}"
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <IMEIScanner 
          onScan={(val) => handleAddImei(val, scanningBranch)}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

// Wrap with isMounted check for dynamic data
function DynamicValue({ children, isMounted }) {
  if (!isMounted) return <span className="opacity-0">...</span>;
  return children;
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
