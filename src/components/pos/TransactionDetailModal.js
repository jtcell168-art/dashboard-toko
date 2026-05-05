"use client";

import { useState, useEffect, useRef } from "react";
import { getTransactionDetail } from "@/app/actions/pos";
import { formatRupiah } from "@/data/mockData";

export default function TransactionDetailModal({ transactionId, onClose }) {
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef(null);

  useEffect(() => {
    if (transactionId) {
      loadDetail();
    }
  }, [transactionId]);

  async function loadDetail() {
    setIsLoading(true);
    const data = await getTransactionDetail(transactionId);
    setTransaction(data);
    setIsLoading(false);
  }

  const handleDownloadJPG = () => {
    if (!receiptRef.current) {
      alert("Area nota tidak ditemukan.");
      return;
    }

    const element = receiptRef.current;
    
    if (typeof window.htmlToImage === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
      script.async = true;
      script.onload = () => {
        captureAndDownload(element);
      };
      script.onerror = () => alert("Gagal memuat library pengolah gambar.");
      document.head.appendChild(script);
    } else {
      captureAndDownload(element);
    }
  };

  const captureAndDownload = (element) => {
    window.htmlToImage.toJpeg(element, {
      quality: 0.9,
      backgroundColor: "#0f172a",
      skipFonts: true,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `Nota_${transaction?.invoice_no || "Transaction"}.jpg`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Capture error:", err);
        alert("Gagal membuat gambar nota. Silakan segarkan halaman.");
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!transactionId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">receipt_long</span>
            Detail Nota Transaksi
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-white/30">Memuat detail transaksi...</p>
            </div>
          ) : !transaction ? (
            <div className="py-20 text-center text-white/30">
              Data transaksi tidak ditemukan
            </div>
          ) : (
            <>
              {/* Receipt Visual */}
              <div ref={receiptRef} className="p-6 rounded-2xl bg-slate-900 border border-white/10 flex flex-col gap-4 shadow-2xl">
                <div className="text-center border-b border-white/10 pb-4">
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">
                    {transaction.branches?.name || "JT CELL GROUP"}
                  </h4>
                  <p className="text-[10px] text-white/40 mt-1 max-w-[250px] mx-auto">
                    {transaction.branches?.address || "Jl. Raya Utama No. 123"}, {transaction.branches?.city || "Indonesia"}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/20 font-mono">
                    <span>{new Date(transaction.created_at).toLocaleDateString("id-ID")}</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span>{new Date(transaction.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-[10px] text-indigo-400 font-bold mt-1 tracking-widest">{transaction.invoice_no}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Customer</span>
                    <span className="text-white font-medium">{transaction.customer_name || "-"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Kasir</span>
                    <span className="text-white font-medium">{transaction.profiles?.full_name || "-"}</span>
                  </div>
                </div>

                <div className="h-px border-t border-dashed border-white/10 my-1" />

                {/* Items Table */}
                <div className="flex flex-col gap-2.5">
                  {transaction.transaction_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{item.product_name}</p>
                        <p className="text-[10px] text-white/30">{item.quantity} × {formatRupiah(item.unit_price)}</p>
                      </div>
                      <span className="text-xs font-bold text-white tabular-nums">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px border-t border-dashed border-white/10 my-1" />

                {/* Totals */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white tabular-nums">{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount_amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Diskon ({transaction.discount_percent}%)</span>
                      <span className="text-emerald-400 tabular-nums">- {formatRupiah(transaction.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
                    <span className="text-lg font-black text-white tabular-nums">{formatRupiah(transaction.total)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-2 p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/30 uppercase font-bold">Metode Bayar</span>
                    <span className="text-indigo-300 font-bold uppercase">{transaction.payment_method}</span>
                  </div>
                  {transaction.notes && (
                    <p className="text-[10px] text-white/40 italic mt-0.5 border-t border-white/5 pt-1">
                      {transaction.notes}
                    </p>
                  )}
                </div>

                <div className="text-center mt-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">Terima Kasih Atas Kunjungan Anda</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDownloadJPG}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">image</span>
                  Download JPG
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  Cetak Nota
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
