"use client";
import { useState } from "react";
import { SUPPLIERS, INVENTORY_PRODUCTS, BRANCHES, formatRupiah } from "@/data/mockData";

export default function NewPOPage() {
  const [form, setForm] = useState({ supplier: "", branch: "", notes: "" });
  const [items, setItems] = useState([{ productId: "", qty: 1, price: 0 }]);

  const addItem = () => setItems([...items, { productId: "", qty: 1, price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => { const n = [...items]; n[i] = { ...n[i], [field]: val }; if (field === "productId") { const p = INVENTORY_PRODUCTS.find(x => x.id === Number(val)); if (p) n[i].price = p.buyPrice; } setItems(n); };
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const handleSubmit = () => { alert(`PO baru ke ${form.supplier} sebesar ${formatRupiah(total)} berhasil dibuat! (mock)`); };

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Buat PO Baru</h1><p className="text-sm text-white/40 mt-0.5">Buat purchase order ke supplier</p></div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Info PO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Supplier *</label><select className="input-field" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}><option value="">Pilih supplier</option>{SUPPLIERS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Cabang Tujuan *</label><select className="input-field" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}><option value="">Pilih cabang</option>{BRANCHES.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
        </div>
        <div className="flex flex-col gap-1.5"><label className="text-xs text-white/40">Catatan</label><textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan untuk supplier..." /></div>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Item Pesanan</h3><button onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">add</span>Tambah Item</button></div>
        <div className="flex flex-col gap-3">{items.map((item, i) => (
          <div key={i} className="flex items-end gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex-[3] flex flex-col gap-1.5"><label className="text-[10px] text-white/30">Produk</label><select className="input-field text-sm" value={item.productId} onChange={e => updateItem(i, "productId", e.target.value)}><option value="">Pilih produk</option>{INVENTORY_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="flex-[1] flex flex-col gap-1.5"><label className="text-[10px] text-white/30">Qty</label><input className="input-field text-sm text-center" type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", Number(e.target.value))} /></div>
            <div className="flex-[2] flex flex-col gap-1.5"><label className="text-[10px] text-white/30">Harga Beli</label><input className="input-field text-sm text-right tabular-nums" type="number" value={item.price} onChange={e => updateItem(i, "price", Number(e.target.value))} /></div>
            <div className="flex-[2] text-right"><p className="text-sm font-semibold text-white tabular-nums">{formatRupiah(item.price * item.qty)}</p></div>
            {items.length > 1 && <button onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 pb-2"><span className="material-symbols-outlined text-[18px]">delete</span></button>}
          </div>
        ))}</div>
        <div className="h-px bg-white/[0.06]" />
        <div className="flex justify-between"><span className="text-sm font-semibold text-white">Total PO</span><span className="text-xl font-bold text-white tabular-nums">{formatRupiah(total)}</span></div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">Simpan Draft</button>
        <button onClick={handleSubmit} disabled={!form.supplier || !form.branch || !items[0].productId} className="flex-1 btn-gradient py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"><span className="material-symbols-outlined text-[18px]">send</span>Kirim ke Supplier</button>
      </div>
    </div>
  );
}
