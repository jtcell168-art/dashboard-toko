"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/data/mockData";
import { useBranch } from "@/context/BranchContext";

export default function PiutangPelangganPage() {
  const { selectedBranch, isMounted } = useBranch();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  useEffect(() => {
    if (!isMounted) return;
    loadDebts();
  }, [selectedBranch, isMounted]);

  const loadDebts = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("customer_debts")
      .select("*, transactions(invoice_no, created_at)")
      .order("created_at", { ascending: false });

    if (selectedBranch !== "all") {
      query = query.eq("branch_id", selectedBranch);
    }

    const { data } = await query;
    setDebts(data || []);
    setLoading(false);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;
    
    const amountNum = Number(paymentAmount);
    if (amountNum <= 0) return alert("Nominal bayar harus lebih dari 0");

    const newPaidAmount = selectedDebt.paid_amount + amountNum;
    const isPaid = newPaidAmount >= selectedDebt.total_amount;
    const newStatus = isPaid ? "paid" : "partial";

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("customer_debts")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          notes: selectedDebt.notes + `\nDibayar: ${formatRupiah(amountNum)} - ${paymentNote || 'Tanpa keterangan'}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedDebt.id);

      if (error) throw error;

      alert("Pembayaran piutang berhasil dicatat!");
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount("");
      setPaymentNote("");
      loadDebts();
    } catch (err) {
      alert("Gagal mencatat pembayaran: " + err.message);
    }
  };

  const totalPiutang = debts.reduce((sum, d) => sum + d.total_amount, 0);
  const totalTerbayar = debts.reduce((sum, d) => sum + d.paid_amount, 0);
  const sisaPiutang = totalPiutang - totalTerbayar;

  if (!isMounted) return null;

  return (
    <div className="flex flex-col gap-6 stagger-children">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Piutang Pelanggan</h1>
        <p className="text-sm text-white/40 mt-0.5">Kelola daftar bon / hutang pelanggan dari transaksi kasir.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card indigo p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Piutang</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalPiutang)}</p>
        </div>
        <div className="kpi-card emerald p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Sudah Dibayar</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(totalTerbayar)}</p>
        </div>
        <div className="kpi-card rose p-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Sisa Belum Lunas</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(sisaPiutang)}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Invoice POS</th>
                <th>Pelanggan</th>
                <th>No. HP</th>
                <th style={{ textAlign: "right" }}>Total Bon</th>
                <th style={{ textAlign: "right" }}>Terbayar</th>
                <th style={{ textAlign: "right" }}>Sisa</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="py-8 text-center text-white/30 animate-pulse">Memuat data piutang...</td></tr>
              ) : debts.length === 0 ? (
                <tr><td colSpan="9" className="py-8 text-center text-white/30">Belum ada data piutang pelanggan.</td></tr>
              ) : (
                debts.map((d) => {
                  const sisa = d.total_amount - d.paid_amount;
                  return (
                    <tr key={d.id}>
                      <td className="text-xs text-white/70">{new Date(d.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="text-xs font-mono text-indigo-300">{d.transactions?.invoice_no || "-"}</td>
                      <td className="text-xs font-semibold text-white">{d.customer_name}</td>
                      <td className="text-xs text-white/50">{d.customer_phone || "-"}</td>
                      <td className="text-xs text-white tabular-nums text-right">{formatRupiah(d.total_amount)}</td>
                      <td className="text-xs text-emerald-400 tabular-nums text-right">{formatRupiah(d.paid_amount)}</td>
                      <td className="text-xs font-bold text-rose-400 tabular-nums text-right">{formatRupiah(sisa)}</td>
                      <td className="text-center">
                        <span className={`badge ${d.status === 'paid' ? 'emerald' : d.status === 'partial' ? 'warning' : 'rose'}`}>
                          {d.status === 'paid' ? 'Lunas' : d.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="text-center">
                        {d.status !== 'paid' && (
                          <button 
                            onClick={() => { setSelectedDebt(d); setShowPaymentModal(true); }}
                            className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-wider"
                          >
                            Bayar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 flex flex-col gap-5 border border-indigo-500/20 shadow-2xl" style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">payments</span>
                Pembayaran Piutang
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm">
              <p className="text-white/60">Pelanggan: <span className="text-white font-semibold">{selectedDebt.customer_name}</span></p>
              <p className="text-white/60">Total Bon: <span className="text-white font-semibold">{formatRupiah(selectedDebt.total_amount)}</span></p>
              <p className="text-white/60">Sisa Tagihan: <span className="text-rose-400 font-bold">{formatRupiah(selectedDebt.total_amount - selectedDebt.paid_amount)}</span></p>
            </div>
            <form onSubmit={handlePayment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-medium">Nominal Pembayaran (Rp)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Masukkan jumlah bayar..." 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedDebt.total_amount - selectedDebt.paid_amount}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-medium">Keterangan / Catatan (Opsional)</label>
                <input 
                  className="input-field" 
                  placeholder="Contoh: Dititipkan ke Mas Andi" 
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-gradient py-3 flex items-center justify-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Simpan Pembayaran
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
