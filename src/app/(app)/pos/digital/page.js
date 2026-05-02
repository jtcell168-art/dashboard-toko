"use client";
import { useState, useMemo } from "react";
import { DIGITAL_PRODUCTS, formatRupiah } from "@/data/mockData";
import { processDigitalTransaction } from "@/app/actions/pos";
import { useBranch } from "@/context/BranchContext";

const TABS = ["pulsa", "data", "ewallet", "listrik"];
const TAB_LABELS = { pulsa: "Pulsa", data: "Paket Data", ewallet: "E-Wallet", listrik: "Pulsa Listrik" };
const TAB_ICONS = { pulsa: "sim_card", data: "signal_cellular_alt", ewallet: "account_balance_wallet", listrik: "bolt" };

const PROVIDERS = {
  pulsa: ["Telkomsel", "XL", "Indosat", "Tri", "Smartfren"],
  data: ["Telkomsel", "XL", "Indosat", "Tri", "Smartfren"],
  ewallet: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"],
  listrik: ["PLN Prabayar"]
};

export default function DigitalProductsPage() {
  const { selectedBranch } = useBranch();
  const [tab, setTab] = useState("pulsa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [note, setNote] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuy = async () => { 
    if (!phoneNumber || !provider || !note || !sellingPrice) {
      alert("Harap lengkapi semua data!");
      return;
    }
    
    setIsProcessing(true);
    try {
      await processDigitalTransaction({
        phoneNumber,
        provider,
        note,
        costPrice,
        sellingPrice,
        branchId: selectedBranch,
        tab
      });
      
      alert(`Transaksi ${provider} ${note} berhasil disimpan!`); 
      setPhoneNumber(""); 
      setProvider(PROVIDERS[tab][0] || "");
      setNote("");
      setCostPrice("");
      setSellingPrice("");
    } catch (err) {
      console.error(err);
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Produk Digital</h1><p className="text-sm text-white/40 mt-0.5">Pulsa, paket data, e-wallet, dan listrik</p></div>

      <div className="flex gap-2 mb-2">{TABS.map(t => (<button key={t} onClick={() => { setTab(t); setProvider(PROVIDERS[t][0] || ""); setNote(""); setCostPrice(""); setSellingPrice(""); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all" style={tab === t ? { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}><span className="material-symbols-outlined text-[18px]">{TAB_ICONS[t]}</span>{TAB_LABELS[t]}</button>))}</div>

      <div className="glass-card p-6 flex flex-col gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 ml-1">{tab === 'listrik' ? 'Nomor Meter / ID Pelanggan' : 'Nomor HP Customer'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">{tab === 'listrik' ? 'electric_bolt' : 'call'}</span>
                <input className="input-field pl-10" placeholder={tab === 'listrik' ? "Masukkan ID Pelanggan..." : "Masukkan nomor HP..."} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 ml-1">Provider / Layanan</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">category</span>
                <select 
                  className="input-field pl-10 appearance-none bg-[#0F172A]" 
                  value={provider} 
                  onChange={e => setProvider(e.target.value)}
                >
                  <option value="">Pilih Provider</option>
                  {PROVIDERS[tab].map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Lainnya">Lainnya...</option>
                </select>
                {provider === "Lainnya" && (
                  <input 
                    className="input-field mt-2" 
                    placeholder="Masukkan nama provider manual..." 
                    onChange={e => setProvider(e.target.value)} 
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 ml-1">Keterangan Produk</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">description</span>
              <input className="input-field pl-10" placeholder="Contoh: 12GB, Pulsa 50rb, atau Token 100rb" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 ml-1">Harga Modal (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">shopping_cart</span>
                <input type="number" className="input-field pl-10 font-mono" placeholder="Masukkan harga modal..." value={costPrice} onChange={e => setCostPrice(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 ml-1">Harga Jual (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">sell</span>
                <input type="number" className="input-field pl-10 font-mono" placeholder="Masukkan harga jual..." value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] my-2" />

        <div className="flex flex-col gap-3">
          {phoneNumber && provider && note && sellingPrice && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-fade-in">
              <div className="flex justify-between text-sm mb-2"><span className="text-white/40">Ringkasan</span><span className="text-indigo-400 font-semibold">{TAB_LABELS[tab]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Produk</span><span className="text-white font-semibold">{provider} — {note}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-white/40">Tujuan</span><span className="text-white font-mono">{phoneNumber}</span></div>
              <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.06]"><span className="text-sm font-semibold text-white">Total Bayar</span><span className="text-lg font-bold text-white tabular-nums">{formatRupiah(sellingPrice)}</span></div>
            </div>
          )}

          <button 
            disabled={!phoneNumber || !provider || !note || !sellingPrice || isProcessing}
            onClick={handleBuy} 
            className="btn-gradient py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Proses Transaksi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
