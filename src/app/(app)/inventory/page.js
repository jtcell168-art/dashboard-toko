"use client";

import { useState, useMemo, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getInventory, addProduct, updateProduct, deleteProduct, updateProductPrice, getPriceHistory, bulkImportProducts } from "@/app/actions/inventory";
import * as XLSX from "xlsx";
import { fixNokiaStock, migrateImeiStatus } from "@/app/actions/pos";
import { getCurrentUser } from "@/app/actions/auth";
import { getBranches } from "@/app/actions/branches";
import { exportToExcel } from "@/lib/utils/export";
import { useBranch } from "@/context/BranchContext";
import IMEIScanner from "@/components/inventory/IMEIScanner";

const CATEGORIES = ["Semua", "HP", "Aksesori", "Sparepart", "Kartu Perdana"];
const ADD_CATEGORIES = ["HP", "Aksesori", "Sparepart", "Kartu Perdana"];

export default function InventoryPage() {
  const { selectedBranch, isMounted: branchIsMounted } = useBranch();
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
  const [scanningBranch, setScanningBranch] = useState(null); 
  const [showScanner, setShowScanner] = useState(false);
  const [manualImei, setManualImei] = useState("");
  const [selectedManualBranch, setSelectedManualBranch] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map data to expected format
        const formatted = data.map(row => ({
          name: row.Nama || row.name || row.Name,
          sku: String(row.SKU || row.sku || "").toUpperCase(),
          category: row.Kategori || row.category || row.Category || "Aksesori",
          buyPrice: Number(row["Harga Beli"] || row["Harga_Beli"] || row.buyPrice || 0),
          sellPrice: Number(row["Harga Jual"] || row["Harga_Jual"] || row.sellPrice || 0),
          stockRuteng: Number(row["Stok Ruteng"] || row["Stok_Ruteng"] || row.stockRuteng || 0),
          stockLarantuka: Number(row["Stok Larantuka"] || row["Stok_Larantuka"] || row.stockLarantuka || 0),
          stockRiung: Number(row["Stok Riung"] || row["Stok_Riung"] || row.stockRiung || 0)
        })).filter(p => p.name && p.sku);

        if (formatted.length === 0) {
          alert("Format file tidak sesuai atau data kosong. Pastikan kolom Nama dan SKU terisi.");
          return;
        }

        const res = await bulkImportProducts(formatted);
        if (res.success) {
          alert(`Berhasil mengimpor ${res.successCount} produk! ${res.errorCount > 0 ? `(Gagal: ${res.errorCount})` : ""}`);
          window.location.reload();
        } else {
          alert("Gagal impor: " + res.error);
        }
      } catch (err) {
        alert("Error membaca file: " + err.message);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Load data
  useEffect(() => {
    setIsMounted(true);
    if (!branchIsMounted) return;

    async function loadData() {
      setIsLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      const [data, branchList] = await Promise.all([
        getInventory(selectedBranch),
        getBranches()
      ]);
      setBranches(branchList);

      const mapped = data.map(p => {
        const stocks = {};
        branchList.forEach(b => {
          const s = p.stock.find(st => st.branch_id === b.id);
          stocks[b.id] = s ? s.quantity : 0;
        });

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          buyPrice: p.purchase_price,
          sellPrice: p.retail_price,
          stocks,
          originalStock: p.stock
        };
      });
      setDbProducts(mapped);
      setIsLoading(false);
    }
    loadData();
  }, [selectedBranch, branchIsMounted]);

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
          p.sku.toLowerCase().includes(q) ||
          (p.originalStock && p.originalStock.some(s => s.imei_records && s.imei_records.some(i => i.imei.toLowerCase().includes(q))))
      );
    }

    if (sortBy === "stock-low") {
      items.sort((a, b) => {
        const totalA = Object.values(a.stocks).reduce((sum, s) => sum + s, 0);
        const totalB = Object.values(b.stocks).reduce((sum, s) => sum + s, 0);
        return totalA - totalB;
      });
    } else if (sortBy === "stock-high") {
      items.sort((a, b) => {
        const totalA = Object.values(a.stocks).reduce((sum, s) => sum + s, 0);
        const totalB = Object.values(b.stocks).reduce((sum, s) => sum + s, 0);
        return totalB - totalA;
      });
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [dbProducts, category, search, sortBy]);

  const lowStockItems = dbProducts.filter((p) => {
    const total = selectedBranch === "all" 
      ? Object.values(p.stocks).reduce((sum, s) => sum + s, 0)
      : p.stocks[selectedBranch] || 0;
    return total < 5;
  });

  const handleAddProduct = async () => {
    try {
      const stockData = {};
      branches.forEach(b => {
        if (b.name.toLowerCase().includes("ruteng")) stockData[b.id] = Number(addForm.stockA);
        else if (b.name.toLowerCase().includes("larantuka")) stockData[b.id] = Number(addForm.stockB);
        else if (b.name.toLowerCase().includes("riung")) stockData[b.id] = Number(addForm.stockC);
        else stockData[b.id] = 0;
      });

      await addProduct(
        {
          name: addForm.name,
          sku: addForm.sku,
          category: addForm.category,
          purchasePrice: Number(addForm.buyPrice),
          retailPrice: Number(addForm.sellPrice),
        },
        stockData,
        imeiList
      );
      alert("Produk berhasil ditambah!");
      setShowAddForm(false);
      setAddForm({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stockA: "0", stockB: "0", stockC: "0" });
      setImeiList([]);
      // Refresh
      window.location.reload();
    } catch (err) {
      alert("Gagal tambah produk: " + err.message);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    const rutengId = branches.find(b => b.name.toLowerCase().includes("ruteng"))?.id;
    const laraId = branches.find(b => b.name.toLowerCase().includes("larantuka"))?.id;
    const riungId = branches.find(b => b.name.toLowerCase().includes("riung"))?.id;

    setEditForm({
      ...p,
      stockA: rutengId ? p.stocks[rutengId] : 0,
      stockB: laraId ? p.stocks[laraId] : 0,
      stockC: riungId ? p.stocks[riungId] : 0
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    try {
      const stockData = {};
      branches.forEach(b => {
        if (b.name.toLowerCase().includes("ruteng")) stockData[b.id] = Number(editForm.stockA);
        else if (b.name.toLowerCase().includes("larantuka")) stockData[b.id] = Number(editForm.stockB);
        else if (b.name.toLowerCase().includes("riung")) stockData[b.id] = Number(editForm.stockC);
      });

      await updateProduct(editingId, 
        {
          name: editForm.name,
          sku: editForm.sku,
          category: editForm.category,
          purchasePrice: Number(editForm.buyPrice),
          retailPrice: Number(editForm.sellPrice),
        },
        stockData
      );
      alert("Produk berhasil diupdate!");
      setEditingId(null);
      // Refresh
      window.location.reload();
    } catch (err) {
      alert("Gagal update produk: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin hapus produk ini?")) return;
    try {
      await deleteProduct(id);
      alert("Produk dihapus!");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenPriceModal = async (p) => {
    setPriceHistoryProduct(p);
    setPriceForm({ buyPrice: p.buyPrice, sellPrice: p.sellPrice, reason: "" });
    setShowPriceModal(true);
    const history = await getPriceHistory(p.id);
    setPriceHistory(history);
  };

  const handleUpdatePrice = async () => {
    if (!priceForm.reason) return alert("Alasan perubahan harga wajib diisi!");
    setIsUpdatingPrice(true);
    try {
      await updateProductPrice(
        priceHistoryProduct.id, 
        Number(priceForm.buyPrice), 
        Number(priceForm.sellPrice), 
        priceForm.reason
      );
      alert("Harga berhasil diupdate!");
      setShowPriceModal(false);
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleAddImei = (imei, branchId) => {
    if (imeiList.find(i => i.imei === imei)) return alert("IMEI sudah ada di list!");
    setImeiList([...imeiList, { imei, branchId }]);
    setShowScanner(false);
  };

  const removeImei = (imei) => {
    setImeiList(imeiList.filter(i => i.imei !== imei));
  };

  if (!isMounted || !branchIsMounted) return null;

  return (
    <div className="flex flex-col gap-6 stagger-children">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Inventaris</h1>
          <p className="text-xs md:text-sm text-white/40">
            {selectedBranch === 'all' ? 'Semua Cabang' : branches.find(b => b.id === selectedBranch)?.name} — {dbProducts.length} Produk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            id="excel-import" 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleImportExcel}
          />
          <label 
            htmlFor="excel-import"
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span className="hidden sm:inline">{isImporting ? "Mengimpor..." : "Import Excel"}</span>
            <span className="sm:hidden">Import</span>
          </label>

          <button 
            onClick={() => exportToExcel(filtered.map(p => {
              const rutengId = branches.find(b => b.name.toLowerCase().includes("ruteng"))?.id;
              const laraId = branches.find(b => b.name.toLowerCase().includes("larantuka"))?.id;
              const riungId = branches.find(b => b.name.toLowerCase().includes("riung"))?.id;

              return {
                Nama: p.name,
                SKU: p.sku,
                Kategori: p.category,
                "Harga Beli": p.buyPrice,
                "Harga Jual": p.sellPrice,
                "Stok Ruteng": rutengId ? p.stocks[rutengId] : 0,
                "Stok Larantuka": laraId ? p.stocks[laraId] : 0,
                "Stok Riung": riungId ? p.stocks[riungId] : 0,
                "Total Stok": Object.values(p.stocks).reduce((a,b) => a+b, 0)
              };
            }), "Template_Migrasi_Stok")}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span className="hidden sm:inline">Sinkronkan</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {hasAccess && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none btn-gradient px-4 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-indigo-500/30 animate-fade-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">add_box</span>
              <h3 className="text-base font-bold text-white">Tambah Produk Baru</h3>
            </div>
            <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white"><span className="material-symbols-outlined">close</span></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase font-bold">Nama Produk</label>
              <input className="input-field" placeholder="e.g. Nokia 105 Dual SIM" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase font-bold">SKU / Kode</label>
              <input className="input-field font-mono uppercase" placeholder="NOK-105-DS" value={addForm.sku} onChange={e => setAddForm({...addForm, sku: e.target.value.toUpperCase()})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase font-bold">Kategori</label>
              <select className="input-field" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                {ADD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase font-bold">Harga Beli (Rp)</label>
              <input type="number" className="input-field" placeholder="0" value={addForm.buyPrice} onChange={e => setAddForm({...addForm, buyPrice: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase font-bold">Harga Jual (Rp)</label>
              <input type="number" className="input-field font-bold text-indigo-400" placeholder="0" value={addForm.sellPrice} onChange={e => setAddForm({...addForm, sellPrice: e.target.value})} />
            </div>
          </div>

          {/* Initial Stock */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Stok Awal per Cabang
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30 uppercase">Ruteng (Pusat)</label>
                <input type="number" className="input-field text-center" value={addForm.stockA} onChange={e => setAddForm({...addForm, stockA: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30 uppercase">Larantuka</label>
                <input type="number" className="input-field text-center" value={addForm.stockB} onChange={e => setAddForm({...addForm, stockB: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30 uppercase">Riung</label>
                <input type="number" className="input-field text-center" value={addForm.stockC} onChange={e => setAddForm({...addForm, stockC: e.target.value})} />
              </div>
            </div>
          </div>

          {/* IMEI Management (for HP) */}
          {addForm.category === "HP" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                  Input IMEI (Wajib untuk HP)
                </h4>
                <div className="flex items-center gap-2">
                   <select 
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white"
                    value={selectedManualBranch}
                    onChange={e => setSelectedManualBranch(e.target.value)}
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button 
                    onClick={() => {
                      if(!selectedManualBranch) return alert("Pilih cabang dulu!");
                      setScanningBranch(selectedManualBranch);
                      setShowScanner(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 hover:bg-indigo-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Scan
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    className="input-field flex-1 text-sm font-mono" 
                    placeholder="Ketik IMEI manual..." 
                    value={manualImei}
                    onChange={e => setManualImei(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if(!manualImei || !selectedManualBranch) return alert("Isi IMEI dan pilih cabang!");
                      handleAddImei(manualImei, selectedManualBranch);
                      setManualImei("");
                    }}
                    className="px-4 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold"
                  >
                    Tambah
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {imeiList.map((item) => (
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative">
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
        
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card indigo" style={{ padding: 12 }}>
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Unit</p>
          <p className="text-xl font-bold text-white tabular-nums">
            <DynamicValue isMounted={isMounted}>
              {filtered.reduce((sum, p) => {
                const stock = selectedBranch === "all" 
                  ? Object.values(p.stocks).reduce((a,b)=>a+b,0)
                  : p.stocks[selectedBranch] || 0;
                return sum + stock;
              }, 0)}
            </DynamicValue>
          </p>
        </div>
        <div className="kpi-card rose" style={{ padding: 12 }}>
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Stok Menipis</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold text-red-400 tabular-nums">
              <DynamicValue isMounted={isMounted}>
                {lowStockItems.length}
              </DynamicValue>
            </p>
            <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">Alert</span>
          </div>
        </div>
        <div className="kpi-card emerald" style={{ padding: 12 }}>
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Kategori HP</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {dbProducts.filter((p) => p.category === "HP").length}
          </p>
        </div>
        <div className="kpi-card blue" style={{ padding: 12 }}>
          <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Lainnya</p>
          <p className="text-xl font-bold text-white tabular-nums">
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
                  selectedBranch === "all" ? (
                    branches.map(b => (
                      <th key={b.id} style={{ textAlign: "center" }}>{b.name.split(' ')[2] || b.name}</th>
                    ))
                  ) : (
                    <th style={{ textAlign: "center" }}>Stok</th>
                  )
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
                const total = selectedBranch === "all"
                  ? Object.values(product.stocks || {}).reduce((a, b) => a + b, 0)
                  : product.stocks?.[selectedBranch] || 0;
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
                      selectedBranch === "all" ? (
                        branches.map(b => (
                          <td key={b.id} style={{ textAlign: "center" }}>
                            <StockBadge count={product.stocks?.[b.id] || 0} />
                          </td>
                        ))
                      ) : (
                        <td style={{ textAlign: "center" }}>
                          <StockBadge count={product.stocks?.[selectedBranch] || 0} />
                        </td>
                      )
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

      {/* Edit Modal (Fixed Overlay) */}
      {editingId && editForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={cancelEdit} />
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-scale-in p-4 sm:p-6 border-indigo-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-400">edit_square</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Produk</h3>
                  <p className="text-xs text-white/40">{editForm.name} — {editForm.sku}</p>
                </div>
              </div>
              <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Nama Produk</label>
                <input className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">SKU / Kode</label>
                <input className="input-field font-mono uppercase" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value.toUpperCase()})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Kategori</label>
                <select className="input-field" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                  <option value="HP">HP</option>
                  <option value="Aksesori">Aksesori</option>
                  <option value="Sparepart">Sparepart</option>
                </select>
              </div>
              {canSeeBuyPrice && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Harga Beli</label>
                  <input className="input-field tabular-nums" type="number" value={editForm.buyPrice} onChange={e => setEditForm({...editForm, buyPrice: e.target.value})} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Harga Jual</label>
                <input className="input-field tabular-nums font-bold text-indigo-400" type="number" value={editForm.sellPrice} onChange={e => setEditForm({...editForm, sellPrice: e.target.value})} />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Update Stok per Cabang
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/30 uppercase">Ruteng</label>
                  <input type="number" className="input-field text-center font-bold" min="0" value={editForm.stockA} onChange={e => setEditForm({...editForm, stockA: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/30 uppercase">Larantuka</label>
                  <input type="number" className="input-field text-center font-bold" min="0" value={editForm.stockB} onChange={e => setEditForm({...editForm, stockB: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/30 uppercase">Riung</label>
                  <input type="number" className="input-field text-center font-bold" min="0" value={editForm.stockC} onChange={e => setEditForm({...editForm, stockC: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button onClick={cancelEdit} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all">
                Batal
              </button>
              <button onClick={handleSaveEdit} className="btn-gradient px-8 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

        <div className="md:hidden flex flex-col gap-3 p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-white/10 mb-2">inventory_2</span>
              <p className="text-sm text-white/30">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            filtered.map((product) => {
              const total = selectedBranch === "all"
                ? Object.values(product.stocks || {}).reduce((a, b) => a + b, 0)
                : product.stocks?.[selectedBranch] || 0;
              const isLow = total < 5;
              
              return (
                <div key={product.id} className="glass-card p-4 flex flex-col gap-4 border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <p className="text-sm font-bold text-white leading-tight">{product.name}</p>
                      </div>
                      <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{product.sku} · {product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-400">{product.sellPrice > 0 ? formatRupiah(product.sellPrice) : "Internal"}</p>
                      {canSeeBuyPrice && product.buyPrice > 0 && (
                        <p className="text-[9px] text-white/20 mt-0.5">Beli: {formatRupiah(product.buyPrice)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/[0.02] rounded-xl p-3 border border-white/5">
                    <div className="flex flex-wrap gap-1.5">
                      {hasAccess ? (
                        branches.map(b => (
                          <StockBadge key={b.id} count={product.stocks?.[b.id] || 0} label={b.name.split(' ')[2]?.substring(0, 1) || b.name.substring(0, 1)} />
                        ))
                      ) : (
                        <StockBadge count={product.stocks?.[currentUser?.branch_id] || 0} label="Stok" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/30 uppercase font-bold">{selectedBranch === "all" ? "Total" : "Stok"}</p>
                      <p className={`text-sm font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>{total}</p>
                    </div>
                  </div>

                  {hasAccess && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(product)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleOpenPriceModal(product)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-emerald-400 hover:bg-white/10 transition-all">
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                        </button>
                        <button className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-indigo-400 hover:bg-white/10 transition-all">
                          <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                        </button>
                      </div>
                      <button onClick={() => handleDelete(product.id)} className="px-3 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-[10px] font-bold gap-1.5 active:bg-red-500/20">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
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
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              {/* Form Ubah Harga */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-white/60 uppercase mb-4 tracking-wider">Update Harga Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/30 uppercase">Harga Beli Baru</label>
                    <input type="number" className="input-field text-sm" value={priceForm.buyPrice} onChange={e => setPriceForm({...priceForm, buyPrice: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/30 uppercase">Harga Jual Baru</label>
                    <input type="number" className="input-field text-sm font-bold text-indigo-400" value={priceForm.sellPrice} onChange={e => setPriceForm({...priceForm, sellPrice: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/30 uppercase">Alasan Perubahan</label>
                    <input type="text" className="input-field text-sm" placeholder="e.g. Harga distributor naik" value={priceForm.reason} onChange={e => setPriceForm({...priceForm, reason: e.target.value})} />
                  </div>
                </div>
                <button 
                  onClick={handleUpdatePrice} 
                  disabled={isUpdatingPrice}
                  className="w-full mt-4 btn-gradient py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {isUpdatingPrice ? "Menyimpan..." : "Update Harga & Simpan Riwayat"}
                </button>
              </div>

              {/* Tabel Riwayat */}
              <div>
                <h4 className="text-xs font-bold text-white/60 uppercase mb-3 tracking-wider">Riwayat Perubahan Harga</h4>
                <div className="border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white/5 text-white/40 uppercase text-[9px] font-bold">
                      <tr>
                        <th className="px-4 py-2 border-b border-white/5">Tanggal</th>
                        <th className="px-4 py-2 border-b border-white/5 text-right">Harga Beli</th>
                        <th className="px-4 py-2 border-b border-white/5 text-right">Harga Jual</th>
                        <th className="px-4 py-2 border-b border-white/5">Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {priceHistory.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-white/20">Belum ada riwayat perubahan.</td></tr>
                      ) : (
                        priceHistory.map((h, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-white/40">{new Date(h.created_at).toLocaleDateString("id-ID")}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(h.old_purchase_price)} → {formatRupiah(h.new_purchase_price)}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-white">{formatRupiah(h.new_retail_price)}</td>
                            <td className="px-4 py-3 text-white/60 italic">{h.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
