"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getPurchaseOrderData, createPurchaseOrder } from "@/app/actions/purchaseOrder";
import { useRouter } from "next/navigation";

export default function NewPOPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({ suppliers: [], branches: [], products: [] });
  
  const [form, setForm] = useState({ supplier_id: "", branch_id: "", notes: "" });
  const [items, setItems] = useState([{ product_id: "", quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPurchaseOrderData();
        setData(result);
      } catch (err) {
        console.error("Failed to load PO data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addItem = () => setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  
  const updateItem = (i, field, val) => { 
    const n = [...items]; 
    n[i] = { ...n[i], [field]: val }; 
    
    if (field === "product_id") { 
      const p = data.products.find(x => x.id === val); 
      if (p) n[i].unit_price = p.buy_price || p.purchase_price || 0; 
    } 
    setItems(n); 
  };

  const total = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  const handleSubmit = async () => {
    if (!form.supplier_id || !form.branch_id || !items[0].product_id) {
      return alert("Mohon lengkapi data PO!");
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier_id: form.supplier_id,
        branch_id: form.branch_id,
        total_amount: total,
        notes: form.notes
      }, items);
      
      alert(`PO berhasil dibuat!`);
      router.push("/purchase-order");
      router.refresh();
    } catch (err) {
      alert("Gagal membuat PO: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50 animate-pulse">Memuat data dari Supabase...</div>;
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Buat PO Baru</h1>
        <p className="text-sm text-white/40 mt-0.5">Buat purchase order ke supplier</p>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Info PO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40">Supplier *</label>
            <select 
              className="input-field" 
              value={form.supplier_id} 
              onChange={e => setForm({...form, supplier_id: e.target.value})}
            >
              <option value="">Pilih supplier</option>
              {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40">Cabang Tujuan *</label>
            <select 
              className="input-field" 
              value={form.branch_id} 
              onChange={e => setForm({...form, branch_id: e.target.value})}
            >
              <option value="">Pilih cabang</option>
              {data.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40">Catatan</label>
          <textarea 
            className="input-field resize-none" 
            rows={2} 
            value={form.notes} 
            onChange={e => setForm({...form, notes: e.target.value})} 
            placeholder="Catatan untuk supplier..." 
          />
        </div>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Item Pesanan</h3>
          <button onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tambah Item
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-end gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex-[3] w-full flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30">Produk</label>
                <select 
                  className="input-field text-sm" 
                  value={item.product_id} 
                  onChange={e => updateItem(i, "product_id", e.target.value)}
                >
                  <option value="">Pilih produk</option>
                  {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex-[1] w-full flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30">Qty</label>
                <input 
                  className="input-field text-sm text-center" 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={e => updateItem(i, "quantity", Number(e.target.value))} 
                />
              </div>
              <div className="flex-[2] w-full flex flex-col gap-1.5">
                <label className="text-[10px] text-white/30">Harga Beli</label>
                <input 
                  className="input-field text-sm text-right tabular-nums" 
                  type="number" 
                  value={item.unit_price} 
                  onChange={e => updateItem(i, "unit_price", Number(e.target.value))} 
                />
              </div>
              <div className="flex-[2] text-right shrink-0">
                <p className="text-sm font-semibold text-white tabular-nums">{formatRupiah(item.unit_price * item.quantity)}</p>
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 pb-2">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Total PO</span>
          <span className="text-xl font-bold text-white tabular-nums">{formatRupiah(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">Simpan Draft</button>
        <button 
          onClick={handleSubmit} 
          disabled={submitting || !form.supplier_id || !form.branch_id || !items[0].product_id} 
          className="flex-1 btn-gradient py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">send</span>
          )}
          {submitting ? "Mengirim..." : "Kirim ke Supplier"}
        </button>
      </div>
    </div>
  );
}

