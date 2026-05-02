"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/data/mockData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { getDashboardData } from "@/app/actions/dashboard";
import { getEmployees } from "@/app/actions/salaries";
import { sendNotification } from "@/app/actions/notifications";
import { useBranch } from "@/context/BranchContext";

/* ============================
   KPI CARDS
   ============================ */
function KPICard({ icon, iconColor, title, value, subValue, trend, accentClass, href }) {
  const isPositive = trend > 0;
  
  const CardContent = (
    <div className={`kpi-card ${accentClass} ${href ? 'hover:scale-[1.02] cursor-pointer transition-transform' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${iconColor}15` }}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ color: iconColor }}>
            {icon}
          </span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            <span className="material-symbols-outlined text-[14px]">
              {isPositive ? "trending_up" : "trending_down"}
            </span>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[22px] font-bold text-white tabular-nums animate-count-up">{value}</p>
      <p className="text-xs text-white/40 mt-1">{title}</p>
      {subValue && <p className="text-[10px] text-white/25 mt-0.5">{subValue}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{CardContent}</Link>;
  }
  return CardContent;
}

/* ============================
   SALES CHART
   ============================ */
function SalesChart({ sales7Days = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-[#1E293B] border border-white/10 rounded-lg p-3 shadow-xl text-xs">
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="tabular-nums">
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="chart-card">
      <h3 className="text-sm font-semibold text-white mb-4">Penjualan 7 Hari Terakhir</h3>
      {sales7Days.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">Belum ada data penjualan</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={sales7Days}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" name="Total" stroke="#6366F1" fill="url(#gradA)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ============================
   REVENUE BAR CHART
   ============================ */
function RevenueChart({ revenueByBranch = [] }) {
  return (
    <div className="chart-card">
      <h3 className="text-sm font-semibold text-white mb-4">Revenue per Cabang (Bulan Ini)</h3>
      {revenueByBranch.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">Belum ada data revenue</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByBranch} layout="vertical" barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <YAxis type="category" dataKey="branch" width={80} />
            <Tooltip formatter={(v) => formatRupiah(v)} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
              {revenueByBranch.map((entry, i) => (
                <Cell key={i} fill={entry.color || "#6366F1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ============================
   RECENT TRANSACTIONS
   ============================ */
const getBranchName = (trx) => {
  if (trx.branches?.name) return trx.branches.name;
  if (trx.branch_id === "a") return "JT CELL RUTENG";
  if (trx.branch_id === "b") return "JT CELL LARANTUKA";
  if (trx.branch_id === "c") return "JT CELL RIUNG";
  return "Tanpa Cabang";
};

function RecentTransactions({ transactions = [] }) {
  const typeIcons = { retail: "shopping_bag", service: "build", digital: "phone_iphone" };
  const typeColors = { retail: "#6366F1", service: "#F59E0B", digital: "#3B82F6" };

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Transaksi Terakhir</h3>
        <Link href="/reports/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Semua →</Link>
      </div>
      <div className="flex flex-col gap-1">
        {transactions.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">Belum ada transaksi</p>
        ) : transactions.map((trx) => (
          <div key={trx.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${typeColors[trx.type] || '#6366F1'}15` }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: typeColors[trx.type] || '#6366F1' }}>
                {typeIcons[trx.type] || 'shopping_bag'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{trx.profiles?.full_name || "Kasir"} — {trx.invoice_no}</p>
              <p className="text-[10px] text-white/30 capitalize">{trx.type} · {getBranchName(trx)} · {trx.status}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-white">{formatRupiah(trx.total)}</p>
              <p className="text-[10px] text-white/25">{new Date(trx.created_at).toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================
   SERVICE ALERTS
   ============================ */
function ServiceAlerts({ serviceAlerts = [] }) {
  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Servis Perlu Perhatian</h3>
        <span className="badge danger">{serviceAlerts.filter((s) => s.status === "overdue").length} overdue</span>
      </div>
      <div className="flex flex-col gap-1">
        {serviceAlerts.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">Belum ada servis pending</p>
        ) : serviceAlerts.map((srv) => (
          <div key={srv.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${srv.status === "overdue" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
              <span className={`material-symbols-outlined text-[18px] ${srv.status === "overdue" ? "text-red-400" : "text-amber-400"}`}>
                {srv.status === "overdue" ? "warning" : "schedule"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{srv.customer} — {srv.device}</p>
              <p className="text-[10px] text-white/30">{srv.issue} {srv.technician ? `· ${srv.technician}` : "· Belum assign"}</p>
            </div>
            <span className={`badge ${srv.status === "overdue" ? "danger" : "warning"}`}>
              {srv.status === "overdue" ? `${srv.days}d late` : "New"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================
   DASHBOARD PAGE
   ============================ */
export default function DashboardPage() {
  const { selectedBranch, isMounted: branchIsMounted } = useBranch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ profile_id: "", base_salary: "", bonus: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messaging state
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgData, setMsgData] = useState({ userId: "", title: "", message: "", type: "info" });
  const [isSending, setIsSending] = useState(false);

  // Date Filter State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  useEffect(() => {
    if (!branchIsMounted) return;
    
    async function loadData() {
      setLoading(true);
      const dbData = await getDashboardData(startDate, endDate, selectedBranch);
      setData(dbData);
      
      if (dbData.userRole === "owner" || dbData.userRole === "manager") {
        const empList = await getEmployees();
        setEmployees(empList);
      }
      
      setLoading(false);
    }
    loadData();
  }, [startDate, endDate, selectedBranch, branchIsMounted]);

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryForm.profile_id || !salaryForm.base_salary) return alert("Pilih pegawai dan isi gaji pokok!");
    
    setIsSubmitting(true);
    try {
      await upsertSalary({
        ...salaryForm,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        base_salary: Number(salaryForm.base_salary),
        bonus: Number(salaryForm.bonus || 0)
      });
      alert("Gaji berhasil disimpan!");
      setShowSalaryForm(false);
      setSalaryForm({ profile_id: "", base_salary: "", bonus: "", notes: "" });
      // Refresh dashboard data
      const dbData = await getDashboardData(startDate, endDate, selectedBranch);
      setData(dbData);
    } catch (err) {
      alert("Gagal simpan gaji: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgData.userId || !msgData.message) return alert("Pilih penerima dan isi pesan!");
    setIsSending(true);
    try {
      await sendNotification(msgData);
      alert("Pesan berhasil terkirim!");
      setShowMsgModal(false);
      setMsgData({ userId: "", title: "", message: "", type: "info" });
    } catch (err) {
      alert("Gagal mengirim pesan: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !data || !branchIsMounted || !mounted) {
    return <div className="p-8 text-center text-white/50 animate-pulse">Memuat data dashboard...</div>;
  }

  const totalServices = (data.kpi.activeServices?.pending || 0) + (data.kpi.activeServices?.process || 0) + (data.kpi.activeServices?.done || 0);

  return (
    <div className="flex flex-col gap-6 relative z-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Overview bisnis — Realtime</p>
        </div>

        {/* Personal Kasbon Card */}
        {data.kpi?.myKasbon > 0 && (
          <div className="kpi-card rose relative overflow-hidden group max-w-xs ml-auto">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10 gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Sisa Kasbon Saya</p>
                <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(data.kpi.myKasbon)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-rose-400">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {(data?.userRole === "owner" || data?.userRole === "manager") && (
            <button 
              onClick={() => setShowMsgModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold flex items-center gap-2 hover:bg-indigo-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Kirim Pesan
            </button>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <div className="flex flex-col px-2 py-1">
              <label className="text-[9px] uppercase font-bold text-white/30">Dari</label>
              <input 
                type="date" 
                className="bg-transparent text-xs text-white focus:outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col px-2 py-1">
              <label className="text-[9px] uppercase font-bold text-white/30">Sampai</label>
              <input 
                type="date" 
                className="bg-transparent text-xs text-white focus:outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div 
        className={`grid grid-cols-2 md:grid-cols-3 ${data.userRole === 'owner' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}
        suppressHydrationWarning
      >
        <KPICard
          icon="payments"
          iconColor="#6366F1"
          title="Total Pendapatan"
          value={formatRupiah(data.kpi.revenue)}
          subValue="Dari semua transaksi sukses"
          accentClass="indigo"
          href="/reports/pnl"
        />
        <KPICard
          icon="shopping_cart"
          iconColor="#F59E0B"
          title="Total Produk"
          value={data.kpi.products}
          subValue="Di database"
          accentClass="amber"
          href="/inventory"
        />
        {data.userRole === "owner" && (
          <KPICard
            icon="inventory_2"
            iconColor="#8B5CF6"
            title="Nilai Inventaris"
            value={formatRupiah(data.kpi.inventoryValue)}
            subValue="Total aset stok (harga beli)"
            accentClass="violet"
            href="/inventory"
          />
        )}
        <KPICard
          icon="group"
          iconColor="#10B981"
          title="Total Pegawai"
          value={data.kpi.users}
          subValue="User terdaftar"
          accentClass="emerald"
          href="/settings/users"
        />
        <KPICard
          icon="build"
          iconColor="#EF4444"
          title="Servis Aktif"
          value={totalServices}
          subValue={`${data.kpi.activeServices.pending} pending · ${data.kpi.activeServices.process} proses`}
          accentClass="rose"
          href="/pos/service"
        />
      </div>

      {/* Salary Management Area (Owner & Manager) */}
      {(data.userRole === "owner" || data.userRole === "manager") && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">payments</span>
              <h3 className="text-sm font-semibold text-white">Input Gaji & Bonus Pegawai</h3>
            </div>
            <button 
              onClick={() => setShowSalaryForm(!showSalaryForm)}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
            >
              {showSalaryForm ? "Tutup Form" : "Buka Form Input"}
            </button>
          </div>

          {showSalaryForm && (
            <form onSubmit={handleSalarySubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Pilih Pegawai</label>
                <select 
                  className="input-field text-sm"
                  value={salaryForm.profile_id}
                  onChange={e => setSalaryForm({...salaryForm, profile_id: e.target.value})}
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Gaji Pokok (Rp)</label>
                <input 
                  type="number" 
                  className="input-field text-sm"
                  placeholder="0"
                  value={salaryForm.base_salary}
                  onChange={e => setSalaryForm({...salaryForm, base_salary: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Bonus (Kondisional)</label>
                <input 
                  type="number" 
                  className="input-field text-sm"
                  placeholder="0"
                  value={salaryForm.bonus}
                  onChange={e => setSalaryForm({...salaryForm, bonus: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Keterangan Periode</label>
                <input 
                  type="text" 
                  className="input-field text-sm"
                  placeholder="e.g. Gaji April 2026"
                  value={salaryForm.notes}
                  onChange={e => setSalaryForm({...salaryForm, notes: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-gradient w-full py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {isSubmitting ? "Menyimpan..." : "Simpan Gaji"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesChart sales7Days={data.sales7Days} />
        <RevenueChart revenueByBranch={data.revenueByBranch} />
      </div>

      {/* Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions transactions={data.recentTransactions} />
        <ServiceAlerts serviceAlerts={data.serviceAlerts} />
      </div>

      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-white mb-4">Kirim Pesan Internal</h2>
            <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Pilih Penerima</label>
                <select 
                  className="input-field"
                  value={msgData.userId}
                  onChange={e => setMsgData({...msgData, userId: e.target.value})}
                  required
                >
                  <option value="">-- Pilih Admin/Teknisi --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Judul Pesan</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Pengumuman Rapat"
                  value={msgData.title}
                  onChange={e => setMsgData({...msgData, title: e.target.value})}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase font-bold">Isi Pesan</label>
                <textarea 
                  className="input-field min-h-[100px]"
                  placeholder="Tulis pesan Anda di sini..."
                  value={msgData.message}
                  onChange={e => setMsgData({...msgData, message: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSending}
                  className="flex-1 btn-gradient py-2.5 text-sm font-semibold"
                >
                  {isSending ? "Mengirim..." : "Kirim Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

