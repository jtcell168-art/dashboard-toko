"use client";

import { useState, useEffect } from "react";
import { getServiceTickets, updateServiceStatus } from "@/app/actions/service";

export default function ServiceTracking({ branchId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    const data = await getServiceTickets(branchId);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [branchId]);

  const handleStatusChange = async (ticketId, newStatus) => {
    const confirmMsg = newStatus === "done" 
      ? "Tandai servis ini telah selesai dan sudah dibayar?" 
      : newStatus === "cancelled" 
      ? "Batalkan servis ini? Stok sparepart akan dikembalikan." 
      : "Ubah status servis?";
      
    if (!confirm(confirmMsg)) return;

    const res = await updateServiceStatus(ticketId, newStatus);
    if (res.success) {
      alert("Status berhasil diperbarui!");
      fetchTickets();
    } else {
      alert("Gagal memperbarui status: " + res.error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">PENDING</span>;
      case "process": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400">PROSES</span>;
      case "done": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">SELESAI</span>;
      case "cancelled": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">BATAL</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      t.ticket_no?.toLowerCase().includes(searchLower) ||
      t.customer_name?.toLowerCase().includes(searchLower) ||
      t.device_name?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="relative max-w-sm w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-500">search</span>
          <input 
            className="input-field pl-10" 
            placeholder="Cari no tiket, pelanggan, perangkat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {["all", "pending", "process", "done", "cancelled"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === status ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {status === "all" ? "Semua" : status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-x-auto shadow-lg shadow-black/20">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3">Tiket & Tanggal</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Perangkat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Biaya</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-sm">Memuat data tiket...</td></tr>
            ) : filteredTickets.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400 text-sm">Tidak ada tiket servis ditemukan.</td></tr>
            ) : (
              filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-indigo-300">{ticket.ticket_no || "SRV-LAMA"}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(ticket.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{ticket.customer_name}</div>
                    <div className="text-xs text-slate-400">{ticket.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{ticket.device_name || ticket.device_type}</div>
                    <div className="text-xs text-slate-400 w-48 truncate">{ticket.issue_description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-white tabular-nums">Rp {new Intl.NumberFormat("id-ID").format(ticket.total_cost)}</div>
                    {ticket.dp_amount > 0 && <div className="text-[10px] text-emerald-400">DP: Rp {new Intl.NumberFormat("id-ID").format(ticket.dp_amount)}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {ticket.status === "pending" && (
                        <button onClick={() => handleStatusChange(ticket.id, "process")} className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-bold transition-colors">
                          PROSES
                        </button>
                      )}
                      {(ticket.status === "pending" || ticket.status === "process") && (
                        <button onClick={() => handleStatusChange(ticket.id, "done")} className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-colors">
                          SELESAI
                        </button>
                      )}
                      {(ticket.status !== "done" && ticket.status !== "cancelled") && (
                        <button onClick={() => handleStatusChange(ticket.id, "cancelled")} className="px-3 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors">
                          BATAL
                        </button>
                      )}
                      {ticket.status === "done" && (
                        <span className="text-[10px] text-slate-500 italic px-2">Tidak dapat diubah</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
