"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { useBranch } from "@/context/BranchContext";
import { createClient } from "@/lib/supabase/client";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";

export default function TopBar({ sidebarWidth = 256, onMobileMenuToggle, user }) {
  const { selectedBranch, changeBranch } = useBranch();
  const [showBranches, setShowBranches] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [branches, setBranches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const hasBranchAccess = user?.role === "owner" || user?.role === "manager";
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    async function loadBranches() {
      const supabase = createClient();
      const { data } = await supabase.from("branches").select("id, name").eq("is_active", true);
      if (data) {
        if (hasBranchAccess) {
          setBranches([
            { id: "all", label: "Semua Cabang" },
            ...data.map(b => ({ id: b.id, label: b.name }))
          ]);
        } else {
          const userBranch = data.find(b => b.id === user?.branch_id);
          if (userBranch) {
            setBranches([{ id: userBranch.id, label: userBranch.name }]);
          }
        }
      }
    }

    async function loadNotifications() {
      const data = await getNotifications();
      setNotifications(data);
    }

    loadBranches();
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [hasBranchAccess, user?.branch_id]);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const currentBranch = branches.find(b => b.id === selectedBranch) || (branches.length > 0 ? branches[0] : { id: "all", label: "Semua Cabang" });

  return (
    <nav className="fixed top-0 w-full z-40 md:hidden flex items-center justify-between px-4 h-16 border-b border-white/10 backdrop-blur-md"
      style={{ background: "rgba(10, 14, 26, 0.85)" }}
    >
      {/* Hamburger (mobile) */}
      <button
        onClick={onMobileMenuToggle}
        className="shrink-0 text-white/70 hover:bg-white/5 active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      {/* Brand */}
      <div className="flex-1 flex justify-center">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          JT CELL GROUP
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Branch Selector Mobile */}
        <div className="relative">
          <button 
            onClick={() => setShowBranches(!showBranches)}
            className="shrink-0 text-indigo-400 hover:bg-white/5 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[22px]">store</span>
          </button>
          
          {showBranches && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowBranches(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl shadow-black/30 z-20 py-1 animate-scale-in">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] uppercase font-bold text-white/30">Pilih Cabang</p>
                </div>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { changeBranch(b.id); setShowBranches(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedBranch === b.id ? "bg-indigo-500/20 text-indigo-400 font-semibold" : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications Mobile */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="shrink-0 text-white/60 hover:bg-white/5 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center relative"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-[#0A0E1A]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-[280px] bg-[#1E293B] border border-white/10 rounded-xl shadow-xl shadow-black/30 z-20 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[9px] text-indigo-400 font-bold">Tandai semua dibaca</button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-white/30 text-[10px]">Tidak ada notifikasi</div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 border-b border-white/[0.03] transition-colors relative ${!n.is_read ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <p className={`text-[11px] font-bold ${!n.is_read ? 'text-white' : 'text-white/60'}`}>{n.title}</p>
                            <span className="text-[8px] text-white/20">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-white/40 leading-relaxed line-clamp-3">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={() => logout()}
          className="shrink-0 text-rose-400/80 hover:bg-rose-500/10 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center"
          title="Logout"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </div>
    </nav>
  );
}
