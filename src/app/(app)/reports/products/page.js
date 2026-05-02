"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { createClient } from "@/lib/supabase/client";

export default function ProductReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalQty: 0, totalRevenue: 0, bestCategory: "-", totalMargin: 0 });
  
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      
      // Fetch all transaction items with product details
      const { data: items, error } = await supabase
        .from("transaction_items")
        .select(`
          quantity,
          subtotal,
          products (
            name,
            purchase_price,
            categories (name)
          )
        `);
      
      if (error || !items) {
        setLoading(false);
        return;
      }

      const productMap = {};
      const categoryMap = {};
      let tQty = 0;
      let tRev = 0;
      let tMargin = 0;

      items.forEach(item => {
        const p = item.products;
        if (!p) return;

        const name = p.name;
        const cat = p.categories?.name || "Uncategorized";
        const margin = item.subtotal - (p.purchase_price * item.quantity);

        tQty += item.quantity;
        tRev += item.subtotal;
        tMargin += margin;

        productMap[name] = (productMap[name] || 0) + item.quantity;
        categoryMap[cat] = (categoryMap[cat] || 0) + item.subtotal;
      });

      const chartData = Object.entries(productMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      const bestCat = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

      setData(chartData);
      setStats({
        totalQty: tQty,
        totalRevenue: tRev,
        bestCategory: bestCat,
        totalMargin: tMargin
      });
      setLoading(false);
    }
    load();
  }, []);
  
  return (
    <div className="flex flex-col gap-5 stagger-children">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Laporan Produk</h1>
        <p className="text-sm text-white/40 mt-0.5">Analisis performa penjualan produk — Realtime dari database</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card indigo" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Terjual</p>
          <p className="text-xl font-bold text-white tabular-nums">{stats.totalQty}</p>
        </div>
        <div className="kpi-card emerald" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Pendapatan</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(stats.totalRevenue)}</p>
        </div>
        <div className="kpi-card blue" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Kategori Terlaris</p>
          <p className="text-xl font-bold text-white">{stats.bestCategory}</p>
        </div>
        <div className="kpi-card amber" style={{ padding: 16 }}>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Margin</p>
          <p className="text-xl font-bold text-white tabular-nums">{formatRupiah(stats.totalMargin)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-white mb-6">10 Produk Terlaris (Qty)</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-white/20 animate-pulse">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-white/20">Belum ada data penjualan</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} width={120} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="qty" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8B5CF6' : '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
