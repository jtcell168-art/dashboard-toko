"use client";

import { useState, useMemo, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getPosProducts, processTransaction } from "@/app/actions/pos";
import { getCurrentUser } from "@/app/actions/auth";
import Scanner from "@/components/Scanner";
import IMEISelector from "@/components/pos/IMEISelector";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "payments" },
  { id: "transfer", label: "Transfer", icon: "account_balance" },
  { id: "qris", label: "QRIS", icon: "qr_code_2" },
  { id: "card", label: "Credit", icon: "credit_card" },
];

const CREDIT_PROVIDERS = ["Vast Finance", "Kredivo Reguler", "Yess Kredit", "Spektra", "Bank"];

export default function RetailPOSPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountPercent, setDiscountPercent] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [creditProvider, setCreditProvider] = useState(CREDIT_PROVIDERS[0]);

  const [dbProducts, setDbProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectingImeiItem, setSelectingImeiItem] = useState(null); // { productId, cartIdx }

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const data = await getPosProducts(user?.branch_id || "all");
      setDbProducts(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Only sellable products (with sellPrice > 0)
  const products = useMemo(() => {
    let items = dbProducts.filter((p) => p.sellPrice > 0 && !p.is_service);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id);
      if (existingIdx !== -1) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1, selectedImeis: [] }];
    });
  };

  const selectImei = (productId, itemIdx, imei) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === itemIdx) {
        const currentImeis = item.selectedImeis || [];
        if (currentImeis.length < item.qty) {
          return { ...item, selectedImeis: [...currentImeis, imei] };
        }
      }
      return item;
    }));
  };

  const removeImei = (itemIdx, imeiId) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === itemIdx) {
        return { ...item, selectedImeis: (item.selectedImeis || []).filter(i => i.id !== imeiId) };
      }
      return item;
    }));
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const discountAmount = discountPercent ? Math.round(subtotal * (parseFloat(discountPercent) / 100)) : 0;
  const total = subtotal - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Validation: HP products must have correct number of IMEIs
    const hpMissingImei = cart.find(item => item.category === "HP" && (item.selectedImeis?.length || 0) < item.qty);
    if (hpMissingImei) {
      alert(`Produk ${hpMissingImei.name} memerlukan ${hpMissingImei.qty} IMEI. Silakan pilih IMEI terlebih dahulu.`);
      return;
    }

    setIsProcessing(true);
    try {
      await processTransaction(
        cart,
        discountAmount,
        paymentMethod,
        customerName,
        currentUser?.branch_id || "all",
        currentUser?.id,
        customerPhone,
        creditProvider,
        parseFloat(discountPercent) || 0
      );
      setShowReceipt(true);
      
      // Reload products to get fresh stock
      const freshData = await getPosProducts(currentUser?.branch_id || "all");
      setDbProducts(freshData);
    } catch (err) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setCart([]);
    setDiscountPercent("");
    setCustomerName("");
    setCustomerPhone("");
    setCreditProvider(CREDIT_PROVIDERS[0]);
    setShowReceipt(false);
  };

  if (showReceipt) {
    return (
      <ReceiptView
        cart={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        paymentMethod={paymentMethod}
        customerName={customerName}
        onNewTransaction={handleNewTransaction}
        branchInfo={currentUser?.branches}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* LEFT — Product Grid */}
      <div className="flex-1 lg:flex-[3] flex flex-col gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Point of Sale</h1>
          <p className="text-sm text-white/40 mt-0.5">Penjualan Retail — Pilih produk untuk ditambahkan ke keranjang</p>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">
            search
          </span>
          <input
            className="input-field pl-10 pr-12"
            placeholder="Cari produk atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
          </button>
        </div>

        {showScanner && (
          <Scanner 
            onScan={(val) => {
              setSearch(val);
              setShowScanner(false);
              // Auto-add logic could go here if we find the product
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-children">
          {isLoading ? (
            <div className="col-span-full py-10 text-center text-white/50 animate-pulse">
              Memuat data produk...
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full py-10 text-center text-white/50">
              Tidak ada produk ditemukan.
            </div>
          ) : products.map((product) => {
            const totalStock = product.totalStock;
            const inCart = cart.find((c) => c.id === product.id);
            const isDigital = product.is_digital;
            const isOutOfStock = !isDigital && totalStock === 0;

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-card p-3 text-left transition-all duration-200 hover:border-indigo-500/30 active:scale-[0.97] group"
                style={{ cursor: isOutOfStock ? "not-allowed" : "pointer", opacity: isOutOfStock ? 0.4 : 1 }}
                disabled={isOutOfStock}
              >
                {/* Product icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: "rgba(99,102,241,0.1)" }}
                >
                  <span className="material-symbols-outlined text-[22px] text-indigo-400">
                    {product.category === "HP" ? "smartphone" : product.category === "Aksesori" ? "cable" : "memory"}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {product.name}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5 font-mono">{product.sku}</p>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-white tabular-nums">{formatRupiah(product.sellPrice)}</span>
                  {!isDigital && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${totalStock < 5 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {totalStock}
                    </span>
                  )}
                </div>

                {inCart && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {inCart.qty}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — Cart Panel */}
      <div className="lg:flex-[2] lg:max-w-[400px]">
        <div className="glass-card p-4 lg:sticky lg:top-20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-indigo-400">shopping_cart</span>
              Keranjang
            </h3>
            <span className="badge info">{cart.length} item</span>
          </div>

          {cart.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-white/20">
              <span className="material-symbols-outlined text-[40px]">shopping_cart</span>
              <p className="text-xs">Keranjang kosong</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex flex-col gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-white/30 tabular-nums">{formatRupiah(item.sellPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span className="text-xs font-bold text-white w-5 text-center tabular-nums">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>
                      <p className="text-xs font-bold text-white tabular-nums w-20 text-right">
                        {formatRupiah(item.sellPrice * item.qty)}
                      </p>
                      <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    {/* IMEI Section for HP */}
                    {item.category === "HP" && (
                      <div className="pl-1 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">IMEI ({item.selectedImeis?.length || 0}/{item.qty})</span>
                          {(item.selectedImeis?.length || 0) < item.qty && (
                            <button 
                              onClick={() => setSelectingImeiItem({ productId: item.id, cartIdx: idx })}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                              Pilih IMEI
                            </button>
                          )}
                        </div>
                        {item.selectedImeis && item.selectedImeis.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.selectedImeis.map(imei => (
                              <div key={imei.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-300 font-mono">
                                {imei.imei}
                                <button onClick={() => removeImei(idx, imei.id)} className="hover:text-red-400">
                                  <span className="material-symbols-outlined text-[10px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field text-xs"
                  placeholder="Nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  className="input-field text-xs"
                  placeholder="No. HP"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Discount */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Diskon</span>
                <div className="relative flex-1">
                  <input
                    className="input-field text-xs text-right pr-6"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, "");
                      // Allow up to 10% discount for anyone for now, or use role-based limits
                      const maxLimit = (currentUser?.role === 'owner') ? 1.5 : (currentUser?.role === 'manager' ? 1.0 : 0.5);
                      if (parseFloat(val) <= maxLimit || !val) setDiscountPercent(val);
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">%</span>
                </div>
              </div>
              <p className="text-[10px] text-white/20 -mt-1 ml-1">Maks diskon: 1.5% (Owner)</p>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-[11px] font-medium transition-all"
                    style={
                      paymentMethod === pm.id
                        ? { background: "rgba(99,102,241,0.12)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.3)" }
                        : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">{pm.icon}</span>
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Credit Provider Dropdown */}
              {paymentMethod === "credit" && (
                <div className="flex flex-col gap-1.5 animate-fade-slide-up">
                  <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Finance / Bank</label>
                  <select 
                    className="input-field text-xs py-2"
                    value={creditProvider}
                    onChange={(e) => setCreditProvider(e.target.value)}
                  >
                    {CREDIT_PROVIDERS.map(cp => (
                      <option key={cp} value={cp}>{cp}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Totals */}
              <div className="flex flex-col gap-1.5 py-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Diskon ({discountPercent}%)</span>
                    <span className="text-emerald-400 tabular-nums">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="h-px bg-white/[0.06]" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-white tabular-nums">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className={`w-full py-3.5 flex items-center justify-center gap-2 text-sm ${isProcessing ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'btn-gradient'}`}
              >
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                {isProcessing ? "Memproses..." : "Proses Pembayaran"}
              </button>
            </>
          )}
        </div>
      </div>

      {selectingImeiItem && (
        <IMEISelector 
          productId={selectingImeiItem.productId}
          branchId={currentUser?.branch_id}
          selectedImeis={cart[selectingImeiItem.cartIdx]?.selectedImeis || []}
          onSelect={(imei) => selectImei(selectingImeiItem.productId, selectingImeiItem.cartIdx, imei)}
          onClose={() => setSelectingImeiItem(null)}
        />
      )}
    </div>
  );
}

/* ============================
   RECEIPT VIEW
   ============================ */
function ReceiptView({ cart, subtotal, discountAmount, total, paymentMethod, customerName, onNewTransaction, branchInfo }) {
  const pmLabels = { cash: "Cash", transfer: "Transfer Bank", qris: "QRIS", card: "Credit / Debit" };
  const trxId = `TRX-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const now = new Date();

  const handlePrint = () => {
    // Basic window.print() is the most reliable way for POS receipts in browser
    // It allows "Save as PDF" or direct thermal printer output
    window.print();
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5 animate-fade-slide-up">
      {/* Success Icon */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.12)" }}
        >
          <span className="material-symbols-outlined text-[36px] text-emerald-400">check_circle</span>
        </div>
        <h2 className="text-xl font-bold text-white">Transaksi Berhasil!</h2>
        <p className="text-sm text-white/40">Nota telah dibuat</p>
      </div>

      {/* Receipt Card */}
      <div id="receipt-content" className="glass-card p-5 flex flex-col gap-3 print:bg-white print:text-black print:shadow-none print:border-none print:w-[80mm] print:mx-auto">
        <div className="text-center border-b border-white/[0.06] print:border-black/10 pb-3">
          <h3 className="text-sm font-bold text-white print:text-black uppercase">
            {branchInfo?.name || "JT CELL GROUP"}
          </h3>
          <p className="text-[10px] text-white/30 print:text-black/60 mt-0.5">
            {branchInfo?.address || "Jl. Raya Utama No. 123"}, {branchInfo?.city || "Indonesia"}
          </p>
          <p className="text-[10px] text-white/20 print:text-black/40 mt-0.5">{now.toLocaleDateString("id-ID")} — {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-[10px] text-white/20 print:text-black/40 font-mono mt-1">{trxId}</p>
        </div>

        {customerName && (
          <p className="text-xs text-white/40 print:text-black/60">Customer: <span className="text-white print:text-black">{customerName}</span></p>
        )}

        {/* Items */}
        <div className="flex flex-col gap-1">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-white/60 print:text-black/80">{item.name} × {item.qty}</span>
              <span className="text-white print:text-black tabular-nums">{formatRupiah(item.sellPrice * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/[0.06] print:bg-black/10" />

        <div className="flex justify-between text-xs">
          <span className="text-white/40 print:text-black/60">Subtotal</span>
          <span className="text-white print:text-black tabular-nums">{formatRupiah(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-white/40 print:text-black/60">Diskon</span>
            <span className="text-emerald-400 print:text-black tabular-nums">- {formatRupiah(discountAmount)}</span>
          </div>
        )}
        <div className="h-px bg-white/[0.06] print:bg-black/10" />
        <div className="flex justify-between">
          <span className="text-sm font-bold text-white print:text-black">TOTAL</span>
          <span className="text-lg font-bold text-white print:text-black tabular-nums">{formatRupiah(total)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40 print:text-black/60">Metode Bayar</span>
          <span className="text-white print:text-black">{pmLabels[paymentMethod]}</span>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-[0.97]"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Cetak Nota
        </button>
        <button
          onClick={onNewTransaction}
          className="flex-1 btn-gradient py-3 text-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Transaksi Baru
        </button>
      </div>
    </div>
  );
}
