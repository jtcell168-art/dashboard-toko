"use client";
import { useState, useMemo } from "react";
import { DIGITAL_PRODUCTS, formatRupiah } from "@/data/mockData";

const TABS = ["pulsa", "data", "ewallet"];
const TAB_LABELS = { pulsa: "Pulsa", data: "Paket Data", ewallet: "E-Wallet" };
const TAB_ICONS = { pulsa: "sim_card", data: "signal_cellular_alt", ewallet: "account_balance_wallet" };

export default function DigitalProductsPage() {
  const [tab, setTab] = useState("pulsa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selected, setSelected] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const products = useMemo(() => DIGITAL_PRODUCTS.filter(p => p.type === tab), [tab]);

  const handleBuy = () => { alert(`Pembelian ${selected.provider} ${selected.nominal} untuk ${phoneNumber} berhasil! (mock)`); setSelected(null); setPhoneNumber(""); setShowConfirm(false); };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Produk Digital</h1><p className="text-sm text-white/40 mt-0.5">Pulsa, paket data, dan e-wallet</p></div>

      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">call</span><input className="input-field pl-10" placeholder="Masukkan nomor HP customer..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>

      <div className="flex gap-2">{TABS.map(t => (<button key={t} onClick={() => { setTab(t); setSelected(null); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all" style={tab === t ? { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}><span className="material-symbols-outlined text-[18px]">{TAB_ICONS[t]}</span>{TAB_LABELS[t]}</button>))}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{products.map(p => (<button key={p.id} onClick={() => setSelected(p)} className="glass-card p-4 text-left transition-all hover:border-indigo-500/30 active:scale-[0.97]" style={selected?.id === p.id ? { borderColor: "rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.08)" } : {}}>
        <p className="text-xs text-white/40 font-semibold">{p.provider}</p>
        <p className="text-lg font-bold text-white mt-1">{typeof p.nominal === "number" ? formatRupiah(p.nominal) : p.nominal}</p>
        <p className="text-sm text-indigo-400 font-semibold mt-1 tabular-nums">{formatRupiah(p.price)}</p>
        {selected?.id === p.id && <div className="absolute top-2 right-2"><span className="material-symbols-outlined text-[18px] text-indigo-400">check_circle</span></div>}
      </button>))}</div>

      {selected && phoneNumber && (
        <div className="glass-card p-4 flex flex-col gap-3 animate-fade-slide-up">
          <div className="flex justify-between text-sm"><span className="text-white/40">Produk</span><span className="text-white font-semibold">{selected.provider} — {typeof selected.nominal === "number" ? formatRupiah(selected.nominal) : selected.nominal}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/40">No. HP</span><span className="text-white font-mono">{phoneNumber}</span></div>
          <div className="h-px bg-white/[0.06]" />
          <div className="flex justify-between"><span className="text-sm font-semibold text-white">Total</span><span className="text-lg font-bold text-white tabular-nums">{formatRupiah(selected.price)}</span></div>
          <button onClick={handleBuy} className="btn-gradient py-3 text-sm flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">send</span>Proses Pembelian</button>
        </div>
      )}
    </div>
  );
}
