import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";

export default function TopBarDesktop({ sidebarWidth = 256, user }) {
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
            if (selectedBranch !== userBranch.id) changeBranch(userBranch.id);
          } else {
            setBranches([]);
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

    // Refresh notifications every 2 minutes
    const interval = setInterval(loadNotifications, 120000);
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

  const currentBranch = branches.find((b) => b.id === selectedBranch) || (branches.length > 0 ? branches[0] : { id: "all", label: "Semua Cabang" });

  return (
    <header
      className="topbar-desktop hidden md:flex"
      style={{ left: sidebarWidth }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-white/30">
          search
        </span>
        <input
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
          placeholder="Cari produk, transaksi, customer..."
          suppressHydrationWarning
        />
      </div>

      <div className="flex-1" />

      {/* Branch Selector */}
      <div className="relative">
        <button
          onClick={() => hasBranchAccess && setShowBranches(!showBranches)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-colors text-sm ${hasBranchAccess ? "hover:bg-white/[0.08]" : "cursor-default"}`}
        >
          <span className="material-symbols-outlined text-[18px] text-indigo-400">store</span>
          <span className="text-white/80">{currentBranch?.label}</span>
          {hasBranchAccess && <span className="material-symbols-outlined text-[16px] text-white/40">expand_more</span>}
        </button>

        {showBranches && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowBranches(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl shadow-black/30 z-20 py-1 animate-scale-in">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { changeBranch(b.id); setShowBranches(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedBranch === b.id ? "text-indigo-400 bg-indigo-500/10" : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px] text-white/60">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-[#0A0E1A]">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl shadow-black/30 z-20 overflow-hidden animate-scale-in">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold">Tandai semua dibaca</button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-white/30 text-xs">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b border-white/[0.03] transition-colors relative group ${!n.is_read ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${!n.is_read ? 'text-white' : 'text-white/60'}`}>{n.title}</p>
                          <span className="text-[9px] text-white/20">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-white/40 leading-relaxed">{n.message}</p>
                        {!n.is_read && (
                          <button 
                            onClick={() => handleMarkRead(n.id)}
                            className="mt-2 text-[9px] text-indigo-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tandai dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 pl-3 border-l border-white/[0.06]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold uppercase">
          {user?.full_name ? user.full_name[0] : "U"}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-white/90 leading-tight">{user?.full_name || "Guest"}</p>
          <p className="text-[10px] text-white/40 capitalize leading-tight mt-0.5">{user?.role || "kasir"} • {user?.branches?.name || "Semua Cabang"}</p>
        </div>
      </div>
    </header>
  );
}
