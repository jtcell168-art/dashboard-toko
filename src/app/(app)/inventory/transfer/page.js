"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { receiveTransfer, submitTransfer } from "@/app/actions/inventory";
import { getPosProducts } from "@/app/actions/pos";
import IMEISelector from "@/components/pos/IMEISelector";

const statusStyle = { completed: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Selesai" }, in_transit: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Dalam Kirim" } };

export default function TransferStokPage() {
  const [showForm, setShowForm] = useState(false);
  
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedImeis, setSelectedImeis] = useState([]);
  
  const [showImeiSelector, setShowImeiSelector] = useState(false);

  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchProducts, setBranchProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [transfersRes, branchesRes] = await Promise.all([
        supabase.from('stock_transfers').select('*, products(name), profiles(full_name), from_branch:branches!from_branch_id(name), to_branch:branches!to_branch_id(name)').order('created_at', { ascending: false }),
        supabase.from('branches').select('id, name').eq('is_active', true)
      ]);
      setTransfers(transfersRes.data || []);
      setBranches(branchesRes.data || []);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (fromBranch) {
      setIsLoadingProducts(true);
      getPosProducts(fromBranch).then(data => {
        setBranchProducts(data.filter(p => p.totalStock > 0));
        setIsLoadingProducts(false);
      });
      setSelectedProduct(null);
      setSearchQuery("");
      setSelectedImeis([]);
      setQty(1);
    } else {
      setBranchProducts([]);
      setSelectedProduct(null);
      setSearchQuery("");
      setSelectedImeis([]);
      setQty(1);
    }
  }, [fromBranch]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return branchProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      (p.imeis && p.imeis.some(i => i.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [searchQuery, branchProducts]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchQuery("");
    setSelectedImeis([]);
    
    const isImeiTracked = ["HP", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"].includes(product.category?.toUpperCase());
    if (isImeiTracked) {
      setQty(0);
      setShowImeiSelector(true);
    } else {
      setQty(1);
    }
  };

  const handleSelectImei = (imeiObj) => {
    if (!selectedImeis.find(i => i.id === imeiObj.id)) {
      const newImeis = [...selectedImeis, imeiObj];
      setSelectedImeis(newImeis);
      setQty(newImeis.length);
    }
  };

  const handleSubmit = async () => { 
    if (!selectedProduct || !fromBranch || !toBranch) return;
    
    const isImeiTracked = ["HP", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"].includes(selectedProduct.category?.toUpperCase());
    if (isImeiTracked && selectedImeis.length === 0) {
      alert("Pilih IMEI terlebih dahulu untuk produk ini.");
      return;
    }
    
    const finalQty = isImeiTracked ? selectedImeis.length : Number(qty);
    if (finalQty <= 0) {
      alert("Jumlah transfer minimal 1.");
      return;
    }

    try {
      const res = await submitTransfer({
        productId: selectedProduct.id,
        fromBranchId: fromBranch,
        toBranchId: toBranch,
        quantity: finalQty,
        imeis: selectedImeis
      });
      
      if (!res.success) throw new Error(res.error);

      alert(`Transfer berhasil diajukan!`); 
      setShowForm(false); 
      setFromBranch("");
      setToBranch("");
      setSelectedProduct(null);
      setSearchQuery("");
      setSelectedImeis([]);
      setQty(1);
      window.location.reload();
    } catch (e) {
      alert("Gagal melakukan transfer: " + e.message);
    }
  };

  const handleReceive = async (transferId) => {
    if (!confirm("Apakah Anda yakin telah menerima barang ini?")) return;
    try {
      const res = await receiveTransfer(transferId);
      if (res.success) {
        alert("Transfer berhasil diselesaikan!");
        window.location.reload();
      } else {
        alert("Gagal: " + res.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold text-white">Transfer Stok</h1><p className="text-sm text-white/40 mt-0.5">Pindahkan stok antar cabang</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "swap_horiz"}</span>{showForm ? "Batal" : "Transfer Baru"}</button>
      </div>

      {showForm && (
        <div className="glass-card p-5 flex flex-col gap-4 animate-fade-slide-up">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-indigo-400">swap_horiz</span>Form Transfer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5 z-[100]">
              <label className="text-xs text-white/40">Dari Cabang</label>
              <select className="input-field" value={fromBranch} onChange={e => setFromBranch(e.target.value)}>
                <option value="">Pilih asal</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 z-[100]">
              <label className="text-xs text-white/40">Ke Cabang</label>
              <select className="input-field" value={toBranch} onChange={e => setToBranch(e.target.value)}>
                <option value="">Pilih tujuan</option>
                {branches.filter(b => b.id !== fromBranch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 relative z-50">
              <label className="text-xs text-white/40">Produk</label>
              {!selectedProduct ? (
                <div className="relative">
                  <input 
                    className="input-field w-full" 
                    placeholder={!fromBranch ? "Pilih cabang asal dulu" : (isLoadingProducts ? "Memuat produk..." : "Ketik nama, SKU, atau IMEI...")} 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    disabled={!fromBranch || isLoadingProducts}
                  />
                  {searchQuery && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
                      {filteredProducts.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => handleSelectProduct(p)}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                        >
                          <div className="text-sm text-white font-medium">{p.name}</div>
                          <div className="text-xs text-white/40">SKU: {p.sku} • Stok Tersedia: {p.totalStock}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery && filteredProducts.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl p-4 text-center text-sm text-white/40 z-[100]">
                      Produk tidak ditemukan.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between input-field bg-white/5 w-full">
                  <div>
                    <div className="text-sm text-white">{selectedProduct.name}</div>
                    <div className="text-xs text-white/40">SKU: {selectedProduct.sku} • Stok: {selectedProduct.totalStock}</div>
                  </div>
                  <button onClick={() => { setSelectedProduct(null); setSelectedImeis([]); setQty(1); }} className="text-white/40 hover:text-white">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 z-40">
              <label className="text-xs text-white/40">Jumlah</label>
              {["HP", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"].includes(selectedProduct?.category?.toUpperCase()) ? (
                <div className="flex items-center gap-2">
                  <input className="input-field flex-1 opacity-60" readOnly value={selectedImeis.length} />
                  <button onClick={() => setShowImeiSelector(true)} className="btn-gradient px-3 py-2 text-xs rounded-xl flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span> Pilih IMEI
                  </button>
                </div>
              ) : (
                <input 
                  className="input-field w-full" 
                  type="number" 
                  min="1" 
                  max={selectedProduct?.totalStock || 1} 
                  value={qty} 
                  onChange={e => setQty(e.target.value)} 
                  disabled={!selectedProduct}
                />
              )}
            </div>
            
            {/* Selected IMEIs List */}
            {["HP", "KARTU PERDANA", "PERDANA", "KARTU", "STARTER PACK"].includes(selectedProduct?.category?.toUpperCase()) && selectedImeis.length > 0 && (
              <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-2 mt-1">
                {selectedImeis.map(imei => (
                  <div key={imei.id} className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-500/30">
                    <span className="font-mono">{imei.imei}</span>
                    <button onClick={() => {
                      const newImeis = selectedImeis.filter(i => i.id !== imei.id);
                      setSelectedImeis(newImeis);
                      setQty(newImeis.length);
                    }} className="hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
          </div>
          <button onClick={handleSubmit} disabled={!selectedProduct || !fromBranch || !toBranch || (selectedProduct?.category === 'HP' ? selectedImeis.length === 0 : qty < 1)} className="btn-gradient py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 mt-2"><span className="material-symbols-outlined text-[18px]">check</span>Proses Transfer</button>
        </div>
      )}

      {showImeiSelector && selectedProduct && (
        <IMEISelector
          productId={selectedProduct.id}
          branchId={fromBranch}
          selectedImeis={selectedImeis}
          onSelect={handleSelectImei}
          onClose={() => setShowImeiSelector(false)}
        />
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]"><h3 className="text-sm font-semibold text-white">Riwayat Transfer</h3></div>
        <div className="divide-y divide-white/[0.04]">
          {isLoading ? (
            <div className="p-8 text-center text-white/50 animate-pulse">Memuat data transfer...</div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-white/50">Belum ada riwayat transfer.</div>
          ) : transfers.map(t => {
            const s = statusStyle[t.status] || statusStyle.in_transit;
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}><span className="material-symbols-outlined text-[20px] text-indigo-400">swap_horiz</span></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.products?.name || "Produk dihapus"} <span className="text-white/30">×{t.quantity}</span></p>
                  <p className="text-[10px] text-white/30 mt-0.5">{t.from_branch?.name || "-"} → {t.to_branch?.name || "-"} · {new Date(t.created_at).toLocaleDateString('id-ID')} · oleh {t.profiles?.full_name || "Unknown"}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  {t.status === 'in_transit' && (
                    <button 
                      onClick={() => handleReceive(t.id)}
                      className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 transition-colors"
                    >
                      Terima Barang
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
