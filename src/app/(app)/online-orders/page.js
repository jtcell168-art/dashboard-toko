"use client";

import { useState, useEffect } from "react";
import { getOnlineOrders, updateOrderStatus } from "@/app/actions/onlineOrders";

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOnlineOrders();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      alert("Gagal mengupdate status: " + result.error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20">Pending</span>;
      case "diproses": return <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">Diproses</span>;
      case "dikirim": return <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20">Dikirim</span>;
      case "selesai": return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">Selesai</span>;
      case "batal": return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20">Batal</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-bold border border-gray-500/20">{status}</span>;
    }
  };

  const openWhatsApp = (phone, name, orderId, total) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
    const msg = `Halo Kak ${name},\n\nTerima kasih telah berbelanja di website JTCell. Kami ingin mengonfirmasi pesanan Anda dengan nomor ID: *${orderId.slice(0, 8)}*.\n\nTotal Tagihan: *Rp ${Number(total).toLocaleString('id-ID')}*\n\nMohon konfirmasinya ya Kak. Terima kasih!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 animate-fade-in flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-white">shopping_cart_checkout</span>
            </div>
            Manajemen Pesanan Online
          </h1>
          <p className="text-sm text-slate-400">
            Pantau dan proses pesanan yang masuk melalui website E-Commerce.
          </p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Data
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Tgl Pesanan</th>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Metode</th>
                <th className="px-6 py-4 font-semibold">Total Belanja</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Belum ada pesanan online yang masuk.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 opacity-50">#{order.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{order.customer_name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <span className="material-symbols-outlined text-[14px]">phone_iphone</span>
                          {order.customer_phone}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[200px]" title={order.customer_address}>
                          {order.customer_address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-indigo-300">{order.payment_method}</div>
                        <div className="text-xs text-slate-500 mt-1">{order.delivery_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">
                          Rp {Number(order.total_amount).toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {order.items?.length || 0} Item
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer"
                          style={{
                            color: order.status === 'Pending' ? '#FBBF24' : 
                                   order.status === 'Diproses' ? '#60A5FA' : 
                                   order.status === 'Dikirim' ? '#818CF8' : 
                                   order.status === 'Selesai' ? '#34D399' : '#F87171'
                          }}
                        >
                          <option value="Pending" className="text-slate-900">Pending</option>
                          <option value="Diproses" className="text-slate-900">Diproses</option>
                          <option value="Dikirim" className="text-slate-900">Dikirim</option>
                          <option value="Selesai" className="text-slate-900">Selesai</option>
                          <option value="Batal" className="text-slate-900">Batal</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button 
                          onClick={() => openWhatsApp(order.customer_phone, order.customer_name, order.id, order.total_amount)}
                          className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors border border-emerald-500/20"
                          title="Hubungi WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        </button>
                        <button 
                          onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700"
                          title="Lihat Detail Barang"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {expandedRow === order.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </td>
                    </tr>
                    
                    {/* EXPANDED ROW (ITEMS) */}
                    {expandedRow === order.id && (
                      <tr className="bg-slate-900/50 border-b border-slate-800">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="pl-4 border-l-2 border-indigo-500/30 py-2">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">Daftar Barang Dibeli:</h4>
                            <div className="space-y-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-white/30 text-[24px]">devices</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{item.product_name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Kategori: {item.category_name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
