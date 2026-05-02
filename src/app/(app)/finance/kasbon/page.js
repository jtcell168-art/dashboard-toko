"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { getKasbon, addKasbon, approveKasbon, payKasbon } from "@/app/actions/finance";
import { getEmployees } from "@/app/actions/salaries";
import { getCurrentUser } from "@/app/actions/auth";

const statusStyle = { 
  pending_approval: { bg: "rgba(245,158,11,0.12)", color: "#FBBF24", label: "Menunggu Approval" }, 
  active: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: "Aktif" }, 
  paid: { bg: "rgba(16,185,129,0.12)", color: "#34D399", label: "Lunas" }, 
  rejected: { bg: "rgba(239,68,68,0.12)", color: "#F87171", label: "Ditolak" } 
};

export default function KasbonPage() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null); // kasbon object
  
  const [newKasbon, setNewKasbon] = useState({ profile_id: "", amount: "", installment_amount: "", reason: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [kasbons, emps, user] = await Promise.all([
        getKasbon(),
        getEmployees(),
        getCurrentUser()
      ]);
      setData(kasbons);
      setEmployees(emps);
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const finalProfileId = isOwnerOrManager ? newKasbon.profile_id : currentUser.id;
    if (!finalProfileId || !newKasbon.amount) return alert("Lengkapi data!");
    
    setIsSubmitting(true);
    try {
      await addKasbon({ ...newKasbon, profile_id: finalProfileId });
      alert("Pengajuan kasbon berhasil dikirim!");
      setShowAddModal(false);
      setNewKasbon({ profile_id: "", amount: "", installment_amount: "", reason: "" });
      loadData();
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm("Approve kasbon ini?")) return;
    try {
      await approveKasbon(id);
      loadData();
    } catch (err) {
      alert("Gagal approve: " + err.message);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount) return;
    setIsSubmitting(true);
    try {
      await payKasbon(showPayModal.id, paymentAmount);
      alert("Pembayaran berhasil dicatat!");
      setShowPayModal(null);
      setPaymentAmount("");
      loadData();
    } catch (err) {
      alert("Gagal bayar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwnerOrManager = currentUser?.role === "owner" || currentUser?.role === "manager";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Kasbon Karyawan</h1>
          <p className="text-sm text-white/40 mt-0.5">Pengajuan, approval, dan pelunasan</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-gradient px-4 py-2.5 text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Kasbon Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="kpi-card rose" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Saldo Kasbon Aktif</p>
          <p className="text-2xl font-bold text-white">
            {formatRupiah(data.reduce((s, k) => s + (k.status === "active" ? Number(k.remaining) : 0), 0))}
          </p>
        </div>
        <div className="kpi-card amber" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Menunggu Approval</p>
          <p className="text-2xl font-bold text-white">
            {data.filter(k => k.status === "pending_approval").length}
          </p>
        </div>
        <div className="kpi-card emerald" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Lunas</p>
          <p className="text-2xl font-bold text-white">
            {data.filter(k => k.status === "paid").length}
          </p>
        </div>
      </div>

      {/* Main List */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50 animate-pulse">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-white/50">Belum ada data Kasbon.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data.map(k => { 
              const s = statusStyle[k.status]; 
              return (
                <div key={k.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>request_quote</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {k.profiles?.full_name} 
                      <span className="text-[10px] text-white/40 font-normal ml-2">({k.profiles?.role})</span>
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {k.reason} · {new Date(k.created_at).toLocaleDateString("id-ID")} · Cicilan {formatRupiah(k.installment_amount)}/bln
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-white tabular-nums">
                      {formatRupiah(k.remaining)}
                      <span className="text-[10px] text-white/30 font-normal ml-1">/ {formatRupiah(k.amount)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {k.status === "pending_approval" && isOwnerOrManager && (
                        <button 
                          onClick={() => handleApprove(k.id)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-semibold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {k.status === "active" && (
                        <button 
                          onClick={() => setShowPayModal(k)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-semibold border border-emerald-500/20 transition-colors"
                        >
                          Bayar
                        </button>
                      )}
                      <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                </div>
              ); 
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-white mb-4">Pengajuan Kasbon Baru</h2>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Pilih Karyawan</label>
                {isOwnerOrManager ? (
                  <select 
                    className="input-field"
                    value={newKasbon.profile_id}
                    onChange={e => setNewKasbon({...newKasbon, profile_id: e.target.value})}
                    required
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                    ))}
                  </select>
                ) : (
                  <div className="input-field bg-white/5 opacity-70 flex items-center">
                    {currentUser?.full_name}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Nominal Kasbon (Rp)</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={newKasbon.amount}
                  onChange={e => setNewKasbon({...newKasbon, amount: e.target.value})}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Potongan per Bulan (Rp)</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={newKasbon.installment_amount}
                  onChange={e => setNewKasbon({...newKasbon, installment_amount: e.target.value})}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Alasan / Keperluan</label>
                <textarea 
                  className="input-field min-h-[80px]"
                  placeholder="Contoh: Keperluan mendesak keluarga"
                  value={newKasbon.reason}
                  onChange={e => setNewKasbon({...newKasbon, reason: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-gradient py-2.5 text-sm font-semibold"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-white mb-2">Bayar Kasbon</h2>
            <p className="text-xs text-white/40 mb-4">Pembayaran untuk {showPayModal.profiles?.full_name}</p>
            
            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              <div className="bg-white/5 p-3 rounded-lg flex flex-col gap-1">
                <span className="text-[10px] text-white/30 uppercase font-bold">Sisa Pinjaman</span>
                <span className="text-lg font-bold text-white">{formatRupiah(showPayModal.remaining)}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Nominal Bayar (Rp)</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder={showPayModal.installment_amount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  autoFocus
                  required
                />
                <p className="text-[9px] text-white/20">Saran cicilan: {formatRupiah(showPayModal.installment_amount)}</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-gradient py-2.5 text-sm font-semibold"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
