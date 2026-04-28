"use client";

import { formatRupiah } from "@/data/mockData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import Link from "next/link";

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
function RecentTransactions({ transactions = [] }) {
  const typeIcons = { retail: "shopping_bag", service: "build", digital: "phone_iphone" };
  const typeColors = { retail: "#6366F1", service: "#F59E0B", digital: "#3B82F6" };

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Transaksi Terakhir</h3>
        <Link href="/reports/pnl" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Semua →</Link>
      </div>
      <div className="flex flex-col gap-1">
        {transactions.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4">Belum ada transaksi</p>
        ) : transactions.map((trx) => (
          <div key={trx.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${typeColors[trx.payment_method === 'cash' ? 'retail' : 'digital']}15` }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: typeColors[trx.payment_method === 'cash' ? 'retail' : 'digital'] }}>
                {typeIcons[trx.payment_method === 'cash' ? 'retail' : 'digital']}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{trx.profiles?.full_name || "Kasir"} — {trx.invoice_no}</p>
              <p className="text-[10px] text-white/30 capitalize">{trx.payment_method} · {trx.status}</p>
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const dbData = await getDashboardData();
      setData(dbData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-white/50 animate-pulse">Memuat data dari Supabase...</div>;
  }

  const totalServices = data.kpi.activeServices.pending + data.kpi.activeServices.process + data.kpi.activeServices.done;

  return (
    <div className="flex flex-col gap-6 stagger-children">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Overview bisnis hari ini — Realtime</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
