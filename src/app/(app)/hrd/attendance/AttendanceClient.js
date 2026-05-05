"use client";

import { useState, useEffect } from "react";
import { checkIn, startBreak, endBreak, checkOut } from "@/app/actions/attendance";

function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceClient({ user, initialAttendance }) {
  const [attendance, setAttendance] = useState(initialAttendance);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (actionFn) => {
    setLoading(true);
    try {
      const res = await actionFn();
      if (res.success) {
        setAttendance(res.data);
      } else {
        alert("Gagal memproses absensi: " + res.error);
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/20">Tepat Waktu</span>;
      case 'late': return <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">Terlambat</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-6 text-4xl font-light text-white/20">
        {currentTime || "00:00:00"}
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <span className="material-symbols-outlined text-3xl text-indigo-400">badge</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
          <p className="text-gray-400 capitalize">{user.role} • {user.branches?.name || "Semua Cabang"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Check In */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-3xl">login</span>
          <span className="text-sm text-gray-400">Absen Masuk</span>
          <span className="text-xl font-bold text-white">{formatTime(attendance?.check_in)}</span>
          {!attendance?.check_in ? (
            <button
              onClick={() => handleAction(checkIn)}
              disabled={loading}
              className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Check In
            </button>
          ) : (
            <div className="mt-2 h-9 flex items-center justify-center">
              {getStatusBadge(attendance.status)}
            </div>
          )}
        </div>

        {/* Start Break */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-3xl">restaurant</span>
          <span className="text-sm text-gray-400">Mulai Istirahat</span>
          <span className="text-xl font-bold text-white">{formatTime(attendance?.break_start)}</span>
          {attendance?.check_in && !attendance?.break_start ? (
            <button
              onClick={() => handleAction(startBreak)}
              disabled={loading}
              className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Istirahat
            </button>
          ) : (
            <div className="mt-2 h-9" />
          )}
        </div>

        {/* End Break */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
          <span className="material-symbols-outlined text-blue-400 text-3xl">work_history</span>
          <span className="text-sm text-gray-400">Selesai Istirahat</span>
          <span className="text-xl font-bold text-white">{formatTime(attendance?.break_end)}</span>
          {attendance?.break_start && !attendance?.break_end ? (
            <button
              onClick={() => handleAction(endBreak)}
              disabled={loading}
              className="mt-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Selesai Istirahat
            </button>
          ) : (
            <div className="mt-2 h-9" />
          )}
        </div>

        {/* Check Out */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
          <span className="material-symbols-outlined text-rose-400 text-3xl">logout</span>
          <span className="text-sm text-gray-400">Absen Pulang</span>
          <span className="text-xl font-bold text-white">{formatTime(attendance?.check_out)}</span>
          {attendance?.check_in && !attendance?.check_out ? (
            <button
              onClick={() => handleAction(checkOut)}
              disabled={loading}
              className="mt-2 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Check Out
            </button>
          ) : (
            <div className="mt-2 h-9" />
          )}
        </div>
      </div>
    </div>
  );
}
