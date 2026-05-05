"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceReportClient({ initialData, branches, user, currentParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const [date, setDate] = useState(currentParams.date);
  const [branchId, setBranchId] = useState(currentParams.branchId);

  const handleFilter = () => {
    const params = new URLSearchParams();
    params.set("date", date);
    params.set("branchId", branchId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present': return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs border border-emerald-500/20">Hadir</span>;
      case 'late': return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20">Terlambat</span>;
      case 'absent': return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded text-xs border border-gray-500/20">Alpa</span>;
      default: return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-400 mb-1">Tanggal</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none transition-colors"
          />
        </div>
        {user.role === 'owner' && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-400 mb-1">Cabang</label>
            <select 
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-indigo-500/50 outline-none transition-colors"
            >
              <option value="all" className="bg-[#1a1c23]">Semua Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#1a1c23]">{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <button 
          onClick={handleFilter}
          className="h-10 px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Tim</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Cabang</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Masuk</th>
              <th className="px-4 py-3 font-semibold">Istirahat</th>
              <th className="px-4 py-3 font-semibold">Kembali</th>
              <th className="px-4 py-3 font-semibold">Pulang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-gray-300">
            {initialData.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data absensi untuk kriteria ini.
                </td>
              </tr>
            ) : (
              initialData.map((row) => (
                <tr key={row.profile_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{row.full_name}</td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3 text-xs">{row.branches?.name || "-"}</td>
                  <td className="px-4 py-3">{getStatusBadge(row.status)}</td>
                  <td className="px-4 py-3">{formatTime(row.check_in)}</td>
                  <td className="px-4 py-3">{formatTime(row.break_start)}</td>
                  <td className="px-4 py-3">{formatTime(row.break_end)}</td>
                  <td className="px-4 py-3">{formatTime(row.check_out)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Total Hadir</span>
          <span className="text-2xl font-bold text-emerald-400">
            {initialData.filter(d => d.status === 'present' || d.status === 'late').length} Orang
          </span>
        </div>
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Terlambat</span>
          <span className="text-2xl font-bold text-red-400">
            {initialData.filter(d => d.status === 'late').length} Orang
          </span>
        </div>
        <div className="p-4 bg-gray-500/5 border border-gray-500/10 rounded-xl">
          <span className="text-xs text-gray-400 block mb-1">Tidak Hadir</span>
          <span className="text-2xl font-bold text-gray-400">
            {initialData.filter(d => d.status === 'absent').length} Orang
          </span>
        </div>
      </div>
    </div>
  );
}
