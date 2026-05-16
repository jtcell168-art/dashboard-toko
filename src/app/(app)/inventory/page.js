"use client";

import { useState, useMemo, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getInventory, addProduct, updateProduct, deleteProduct, updateProductPrice, getPriceHistory, bulkImportProducts, addImeiRecord, updateImeiRecord, deleteImeiRecord, searchProductByImei } from "@/app/actions/inventory";
import * as XLSX from "xlsx";
import { fixNokiaStock, migrateImeiStatus } from "@/app/actions/pos";
import { getCurrentUser } from "@/app/actions/auth";
import { getBranches } from "@/app/actions/branches";
import { exportToExcel } from "@/lib/utils/export";
import { useBranch } from "@/context/BranchContext";
import { createClient } from "@/lib/supabase/client";
import IMEIScanner from "@/components/inventory/IMEIScanner";

import Scanner from "@/components/Scanner";



const CATEGORIES = ["Semua", "HP", "Aksesori", "Sparepart", "Kartu Perdana"];
const ADD_CATEGORIES = ["HP", "Aksesori", "Sparepart", "Kartu Perdana"];

export default function InventoryPage() {
  const { selectedBranch, isMounted: branchIsMounted } = useBranch();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("name");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stocks: {}, colors: "" });

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [manageImeiProduct, setManageImeiProduct] = useState(null); // { id, name, category }
  const [matchingImeiIds, setMatchingImeiIds] = useState([]);



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
          stockRiung: Number(row["Stok Riung"] || row["Stok_Riung"] || row.stockRiung || 0),
          // IMEI columns
          imeiRuteng: row["IMEI Ruteng"] || row.imeiRuteng || row.IMEI || "",
          imeiLarantuka: row["IMEI Larantuka"] || row.imeiLarantuka || "",
          imeiRiung: row["IMEI Riung"] || row.imeiRiung || ""
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
          originalStock: p.stock,
          imeiStrings: p.imeiStrings
        };
      });
      setDbProducts(mapped);
      setIsLoading(false);
    }

  // Load data
  useEffect(() => {
    setIsMounted(true);
    if (!branchIsMounted) return;
    loadData();
  }, [selectedBranch, branchIsMounted]);

  useEffect(() => {
    async function searchImei() {
      if (search.length >= 4) {
        const ids = await searchProductByImei(search);
        setMatchingImeiIds(ids);
      } else {
        setMatchingImeiIds([]);
      }
    }
    const timer = setTimeout(searchImei, 500);
    return () => clearTimeout(timer);
  }, [search]);

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
          matchingImeiIds.includes(p.id)
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
      const colors = addForm.colors ? addForm.colors.split(/[,]+/).map(c => c.trim()).filter(c => c !== "") : [""];
      const stockData = addForm.stocks;

      // Automatically include IMEIs from the textarea if user forgot to click "Tambah"
      let finalImeiList = [...imeiList];
      if (manualImei && selectedManualBranch) {
        const extraImeis = manualImei.split(/[\n, ]+/).filter(i => i.trim() !== "");
        extraImeis.forEach(imei => {
          if (!finalImeiList.find(fi => fi.imei === imei.trim())) {
            finalImeiList.push({ imei: imei.trim(), branchId: selectedManualBranch });
          }
        });
      }

      // Distribute IMEIs among colors
      const imeiPerColor = Math.floor(finalImeiList.length / colors.length);
      
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        // Only append color if it's not already in the name
        const finalName = color && !addForm.name.toLowerCase().includes(color.toLowerCase()) 
          ? `${addForm.name} ${color}` 
          : addForm.name;
        
        const finalSku = color && !addForm.sku.toLowerCase().includes(color.toLowerCase().replace(/\s+/g, '-'))
          ? `${addForm.sku}-${color.toUpperCase().replace(/\s+/g, '-')}` 
          : addForm.sku;
        
        // Take a slice of IMEIs for this color
        const startIdx = i * imeiPerColor;
        const endIdx = (i === colors.length - 1) ? finalImeiList.length : (i + 1) * imeiPerColor;
        const currentImeiList = colors.length > 1 ? finalImeiList.slice(startIdx, endIdx) : finalImeiList;

        const result = await addProduct(
          {
            name: finalName,
            sku: finalSku.toUpperCase(),
            category: addForm.category,
            purchasePrice: Number(addForm.buyPrice),
            retailPrice: Number(addForm.sellPrice),
          },
          stockData,
          currentImeiList
        );

        if (!result.success) {
          alert("Gagal tambah produk: " + result.error);
          return;
        }
      }

      alert(`Berhasil menambah ${colors.length} produk varian!`);
      setShowAddForm(false);
      setAddForm({ name: "", sku: "", category: "HP", buyPrice: "", sellPrice: "", stocks: {}, colors: "" });
      setImeiList([]);
      window.location.reload();
    } catch (err) {
      alert("Error sistem: " + err.message);
    }
  };


  const [editImeis, setEditImeis] = useState([]);
  const [isImeiLoading, setIsImeiLoading] = useState(false);

  const startEdit = async (p) => {
    setEditingId(p.id);
    setEditForm({
      ...p,
      stocks: p.stocks // This is already the object { branchId: quantity }
    });

    // Load IMEIs for this product immediately
    setIsImeiLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("imei_records")
        .select("*")
        .eq("product_id", p.id)
        .order("status", { ascending: true });
      setEditImeis(data || []);
    } catch (err) {
      console.error("Error loading edit IMEIs:", err);
    } finally {
      setIsImeiLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditImeis([]);
  };


  const handleSaveEdit = async () => {
    try {
      const stockData = editForm.stocks;

      const result = await updateProduct(editingId, 
        {
          name: editForm.name,
          sku: editForm.sku,
          category: editForm.category,
          purchasePrice: Number(editForm.buyPrice),
          retailPrice: Number(editForm.sellPrice),
        },
        stockData
      );

      if (result.success) {
        alert("Produk berhasil diupdate!");
        setEditingId(null);
        window.location.reload();
      } else {
        alert("Gagal update produk: " + result.error);
      }
    } catch (err) {
      alert("Error sistem: " + err.message);
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

  const handleDownloadJPG = () => {
    const element = document.getElementById("inventory-report-content");
    if (!element) {
      alert("Area laporan tidak ditemukan.");
      return;
    }

    setIsCapturing(true);

    if (typeof window.htmlToImage === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
      script.async = true;
      script.onload = () => captureInventory(element);
      script.onerror = () => {
        setIsCapturing(false);
        alert("Gagal memuat library pengolah gambar.");
      };
      document.head.appendChild(script);
    } else {
      captureInventory(element);
    }
  };

  const captureInventory = (element) => {
    // Optimization for large datasets (200+ items)
    const originalStyle = element.style.cssText;
    element.style.width = "max-content";
    element.style.height = "auto";
    element.style.overflow = "visible";

    const scrollContainer = element.querySelector('.overflow-x-auto');
    const originalScrollStyle = scrollContainer ? scrollContainer.style.cssText : "";
    if (scrollContainer) {
      scrollContainer.style.overflow = "visible";
      scrollContainer.style.width = "auto";
    }
    
    window.htmlToImage.toJpeg(element, { 
      quality: 0.85, 
      backgroundColor: "#0f172a",
      skipFonts: true,
      pixelRatio: 1,
      filter: (node) => node.tagName !== 'BUTTON' && node.tagName !== 'INPUT',
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `Stok_Inventaris_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.jpg`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Capture error:", err);
        alert("Gagal membuat gambar. Daftar stok Anda mungkin terlalu panjang untuk diproses sebagai gambar. Disarankan gunakan Export Excel untuk data besar.");
      })
      .finally(() => {
        element.style.cssText = originalStyle;
        if (scrollContainer) scrollContainer.style.cssText = originalScrollStyle;
        setIsCapturing(false);
      });
  };

  if (!isMounted || !branchIsMounted) return null;

  return (
    <>
    <div className="flex flex-col gap-6 stagger-children">
      {/* Processing Overlay */}
      {isCapturing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-scale-in text-center max-w-xs">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-indigo-400">image</span>
            </div>
            <div>
              <h3 className="text-white font-bold">Memproses Gambar...</h3>
              <p className="text-white/40 text-[10px] mt-1">Daftar stok yang panjang sedang dikonversi. Mohon tunggu sebentar.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div id="inventory-report-content" className="flex flex-col gap-5 p-4 bg-[#0f172a] rounded-3xl">
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
            onClick={() => exportToExcel([
              { Nama: "Contoh: Samsung Galaxy A54", SKU: "HP-SA54-BLK", Kategori: "HP", "Harga Beli": 3200000, "Harga Jual": 3800000, "Stok Ruteng": 2, "IMEI Ruteng": "123456789012345", "Stok Larantuka": 1, "IMEI Larantuka": "987654321098765", "Stok Riung": 0, "IMEI Riung": "" },
              { Nama: "Contoh: LCD Samsung A54 OEM", SKU: "SPC-LCD-SA54", Kategori: "Sparepart", "Harga Beli": 280000, "Harga Jual": 450000, "Stok Ruteng": 3, "IMEI Ruteng": "", "Stok Larantuka": 2, "IMEI Larantuka": "", "Stok Riung": 1, "IMEI Riung": "" },
              { Nama: "Contoh: Charger Type-C 25W", SKU: "AKS-CHG-TC25", Kategori: "Aksesori", "Harga Beli": 25000, "Harga Jual": 50000, "Stok Ruteng": 10, "IMEI Ruteng": "", "Stok Larantuka": 5, "IMEI Larantuka": "", "Stok Riung": 8, "IMEI Riung": "" },
              { Nama: "Contoh: Kartu Perdana Telkomsel 10K", SKU: "KP-TSEL-10K", Kategori: "Kartu Perdana", "Harga Beli": 7000, "Harga Jual": 12000, "Stok Ruteng": 50, "IMEI Ruteng": "", "Stok Larantuka": 30, "IMEI Larantuka": "", "Stok Riung": 40, "IMEI Riung": "" },
            ], "Template_Import_Stok_Baru")}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </button>

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
                "IMEI Ruteng": rutengId ? p.imeiStrings[rutengId] : "",
                "Stok Larantuka": laraId ? p.stocks[laraId] : 0,
                "IMEI Larantuka": laraId ? p.imeiStrings[laraId] : "",
                "Stok Riung": riungId ? p.stocks[riungId] : 0,
                "IMEI Riung": riungId ? p.imeiStrings[riungId] : "",
                "Total Stok": Object.values(p.stocks).reduce((a,b) => a+b, 0)
              };
            }), "Export_Data_Inventaris")}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span className="hidden sm:inline">Sinkronkan</span>
            <span className="sm:hidden">Sync</span>
          </button>
          
          <button 
            onClick={handleDownloadJPG}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">image</span>
            <span className="hidden sm:inline">Download JPG</span>
            <span className="sm:hidden">JPG</span>
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
              <label className="text-[10px] text-white/40 uppercase font-bold">Warna / Varian (Pisahkan dengan koma)</label>
              <input className="input-field" placeholder="e.g. Merah, Biru, Hitam" value={addForm.colors} onChange={e => setAddForm({...addForm, colors: e.target.value})} />
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

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Stok Awal per Cabang
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(b => (
                <div key={b.id} className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-white/30 uppercase">{b.name}</label>
                  <input 
                    type="number" 
                    className="input-field text-center" 
                    value={addForm.stocks[b.id] || 0} 
                    onChange={e => setAddForm({
                      ...addForm, 
                      stocks: { ...addForm.stocks, [b.id]: Number(e.target.value) }
                    })} 
                  />
                </div>
              ))}
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
                <div className="flex flex-col gap-2">
                  <textarea 
                    className="input-field w-full text-sm font-mono h-24 py-3" 
                    placeholder="Input banyak IMEI sekaligus (pisahkan dengan baris baru, spasi, atau koma)..." 
                    value={manualImei}
                    onChange={e => setManualImei(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/30 italic">* Anda bisa copy-paste daftar IMEI dari Excel atau Notepad</span>
                    <button 
                      onClick={() => {
                        if(!manualImei || !selectedManualBranch) return alert("Isi IMEI dan pilih cabang!");
                        // Split by newline, comma, or space
                        const imeis = manualImei.split(/[\n, ]+/).filter(i => i.trim() !== "");
                        if (imeis.length === 0) return;
                        
                        imeis.forEach(imei => handleAddImei(imei.trim(), selectedManualBranch));
                        setManualImei("");
                        alert(`${imeis.length} IMEI berhasil ditambahkan ke daftar.`);
                      }}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Tambah Semua IMEI
                    </button>
                  </div>
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
                          {["HP", "Kartu Perdana"].includes(product.category) && (
                            <button onClick={() => setManageImeiProduct(product)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-indigo-400" title="Kelola IMEI">
                              <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                            </button>
                          )}
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
      </div>
      </div>

      {/* MODALS - Moved to root level to avoid clipping and animation issues */}
      {/* Edit Modal (Fixed Overlay) */}
      {editingId && editForm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-md flex justify-center items-start p-2 sm:p-4">
          <div className="fixed inset-0" onClick={cancelEdit} />
          <div className="glass-card w-full max-w-4xl my-auto relative animate-scale-in p-4 sm:p-8 border-indigo-500/30 flex flex-col z-10">

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
                  <option value="Kartu Perdana">Kartu Perdana</option>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  Update Stok per Cabang
                </h4>
                {["HP", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"].includes(editForm.category?.toUpperCase()) ? (
                  <span className="text-[9px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 animate-pulse">
                    Otomatis dari Jumlah IMEI (Fallback Manual)
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    Input Manual
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map(b => (
                  <div key={b.id} className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/30 uppercase">{b.name}</label>
                    <input 
                      type="number" 
                      className={`input-field text-center font-bold`} 
                      min="0" 
                      value={editForm.stocks[b.id] || 0} 
                      onChange={e => setEditForm({
                        ...editForm, 
                        stocks: { ...editForm.stocks, [b.id]: Number(e.target.value) }
                      })} 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {["HP", "Kartu Perdana"].includes(editForm.category) && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                    Daftar IMEI Terdaftar
                  </h4>
                  <button 
                    onClick={() => setManageImeiProduct(editForm)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Kelola / Tambah IMEI
                  </button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {isImeiLoading ? (
                    <div className="py-8 text-center text-white/20 text-xs animate-pulse flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      Memuat data IMEI...
                    </div>
                  ) : editImeis.length === 0 ? (
                    <div className="py-8 text-center text-white/20 text-xs italic bg-white/[0.01] rounded-xl border border-dashed border-white/5">
                      Belum ada IMEI terdaftar untuk produk ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                      {editImeis.map(i => (
                        <div key={i.imei} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold text-white/90">{i.imei}</span>
                            <span className="text-[9px] text-white/30 uppercase tracking-tight">
                              {branches.find(b => b.id === i.branch_id)?.name.split(' ')[2] || "Lainnya"}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            i.status === 'stock' ? 'bg-emerald-500/10 text-emerald-400' : 
                            i.status === 'sold' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {i.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

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

      {/* Price History Modal */}
      {showPriceModal && priceHistoryProduct && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-md flex justify-center items-start p-2 sm:p-4">
          <div className="fixed inset-0" onClick={() => setShowPriceModal(false)} />
          <div className="glass-card w-full max-w-2xl my-auto overflow-hidden flex flex-col relative animate-scale-in z-10">
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
                          <tr key={h.id || i} className="hover:bg-white/[0.02] border-b border-white/[0.04] transition-colors">
                            <td className="px-4 py-3 text-white/40">{new Date(h.created_at).toLocaleDateString("id-ID")}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-white/80">{formatRupiah(h.old_buy_price)} → {formatRupiah(h.new_buy_price)}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-indigo-400">{formatRupiah(h.old_sell_price)} → {formatRupiah(h.new_sell_price)}</td>
                            <td className="px-4 py-3 text-white/60 italic">{h.reason || "-"}</td>
                            <td className="px-4 py-3 text-white/40 text-[10px]">{h.profiles?.full_name || "System"}</td>
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

      {/* IMEI Management Modal */}
      {manageImeiProduct && (
        <IMEIManagementModal 
          product={manageImeiProduct}
          branches={branches}
          onClose={() => setManageImeiProduct(null)}
          onRefresh={async () => {
            await loadData();
            // Also sync editImeis if modal was opened from Edit
            if (editingId) {
              try {
                const supabase = createClient();
                const { data } = await supabase
                  .from("imei_records")
                  .select("*")
                  .eq("product_id", manageImeiProduct.id)
                  .order("status", { ascending: true });
                setEditImeis(data || []);
              } catch (err) {
                console.error("Sync error:", err);
              }
            }
          }}
        />
      )}
    </>
  );
}

// ========== IMEI MANAGEMENT MODAL ==========
function IMEIManagementModal({ product, branches, onClose, onRefresh }) {
  const [imeis, setImeis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newImei, setNewImei] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  const loadImeis = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("imei_records")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImeis(data || []);
    } catch (err) {

      console.error("Error loading IMEIs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImeis();
  }, [product.id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newImei.trim()) return;

    // Split by newline, comma, or space for bulk
    const imeisToAdd = newImei.split(/[\n, ]+/).filter(i => i.trim() !== "");
    if (imeisToAdd.length === 0) return;

    setIsSaving(true);
    try {
      let successCount = 0;
      let errors = [];

      for (const imei of imeisToAdd) {
        const res = await addImeiRecord({
          imei: imei.trim(),
          product_id: product.id,
          branch_id: selectedBranch,
          status: "stock",
          last_action: "Input Manual via Inventaris"
        });
        if (res.success) successCount++;
        else errors.push(`${imei.trim()}: ${res.error}`);
      }

      if (successCount > 0) {
        setNewImei("");
        await loadImeis();
        if (onRefresh) onRefresh(); // Sync with parent
        if (errors.length > 0) {
          alert(`Berhasil menambah ${successCount} IMEI. Gagal: ${errors.length}.`);
        }
      } else {
        alert("Gagal menambah IMEI: " + errors.join(", "));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };


  const handleUpdateStatus = async (imei, status) => {
    try {
      const res = await updateImeiRecord(imei, { status });
      if (res.success) {
        await loadImeis();
        if (onRefresh) onRefresh(); // Sync with parent
      } else {
        alert("Gagal update status: " + res.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (imei) => {
    if (!confirm(`Yakin ingin menghapus IMEI ${imei}? Data akan dihapus permanen dari database.`)) return;
    
    try {
      // Optimistic update
      setImeis(prev => prev.filter(i => i.imei !== imei));
      
      const res = await deleteImeiRecord(imei);
      if (res.success) {
        // Just a small notification, no blocking alert if possible
        console.log("IMEI deleted successfully");
        if (onRefresh) onRefresh(); // Sync with parent
      } else {
        alert("Gagal menghapus dari database: " + res.error);
        await loadImeis(); // Rollback
      }
    } catch (err) {
      alert("Error saat menghapus: " + err.message);
      await loadImeis();
    }
  };


  const filtered = imeis.filter(i => i.imei.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-scale-up relative">

        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">barcode_scanner</span>
              Kelola IMEI
            </h3>
            <p className="text-xs text-white/40">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {/* Add New IMEI */}
          <form onSubmit={handleAdd} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <h4 className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Input IMEI Baru (Bisa banyak sekaligus)</h4>
            <div className="flex flex-col gap-3">
              <textarea 
                className="input-field w-full font-mono tracking-widest text-sm py-3 px-5 bg-white/5 border-white/10 focus:border-indigo-500/50 text-indigo-400 h-24" 
                placeholder="Tempelkan banyak IMEI di sini (pisahkan baris/koma)..." 
                value={newImei} 
                onChange={e => setNewImei(e.target.value)} 
                required
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <select className="input-field flex-1" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button disabled={isSaving} type="submit" className="btn-gradient px-10 h-[46px] whitespace-nowrap font-bold">
                  {isSaving ? "Menyimpan..." : "Tambah ke Stok"}
                </button>
              </div>
              <p className="text-[10px] text-white/20 italic">* Jika tadi Anda input lewat "Tambah Produk" tapi tidak muncul, silakan tempel ulang di sini.</p>
            </div>
          </form>



          {/* List IMEIs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Daftar IMEI ({imeis.length})</h4>
              <div className="relative">
                <input 
                  className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 w-48" 
                  placeholder="Cari..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-white/20">search</span>
              </div>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white/5 text-white/40 uppercase text-[9px] font-bold">
                  <tr>
                    <th className="px-4 py-3">IMEI</th>
                    <th className="px-4 py-3">Cabang</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-white/20 animate-pulse">Memuat data...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-white/20">Tidak ada data IMEI ditemukan.</td></tr>
                  ) : filtered.map(i => (
                    <tr key={i.imei} className="hover:bg-white/[0.02] transition-colors">

                      <td className="px-4 py-3 font-mono text-white/80">{i.imei}</td>
                      <td className="px-4 py-3 text-white/40 whitespace-nowrap">{branches.find(b => b.id === i.branch_id)?.name.split(' ')[2] || "Lainnya"}</td>
                      <td className="px-4 py-3">
                        <select 
                          className={`bg-transparent border-none text-[10px] font-bold uppercase p-0 cursor-pointer focus:ring-0 ${
                            i.status === 'stock' ? 'text-emerald-400' : i.status === 'sold' ? 'text-blue-400' : 'text-amber-400'
                          }`}
                          value={i.status}
                          onChange={(e) => handleUpdateStatus(i.imei, e.target.value)}
                        >
                          <option value="stock" className="bg-[#0f172a] text-emerald-400">STOCK</option>
                          <option value="sold" className="bg-[#0f172a] text-blue-400">SOLD</option>
                          <option value="service" className="bg-[#0f172a] text-amber-400">SERVICE</option>
                          <option value="transfer" className="bg-[#0f172a] text-purple-400">TRANSFER</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(i.imei)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <button onClick={() => { onRefresh(); onClose(); }} className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
            Selesai
          </button>
        </div>
      </div>
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

// ========== SIMPLE IMEI LIST FOR EDIT MODAL ==========
function IMEIListSimple({ productId, branches }) {
  const [imeis, setImeis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("imei_records")
          .select("*")
          .eq("product_id", productId)
          .order("status", { ascending: true });
        
        if (error) throw error;
        setImeis(data || []);
      } catch (err) {
        console.error("Error simple list:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (productId) load();
  }, [productId]);

  if (isLoading) return <div className="py-4 text-center text-white/20 text-xs animate-pulse flex items-center justify-center gap-2">
    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
    Memuat IMEI...
  </div>;

  if (imeis.length === 0) return <div className="py-4 text-center text-white/20 text-xs italic">Belum ada IMEI terdaftar.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {imeis.map(i => (
        <div key={i.imei} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/80">{i.imei}</span>
            <span className="text-[8px] text-white/30 uppercase">{branches.find(b => b.id === i.branch_id)?.name.split(' ')[2] || "Lainnya"}</span>
          </div>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
            i.status === 'stock' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {i.status.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

