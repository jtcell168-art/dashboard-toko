"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBranch } from "@/context/BranchContext";

export default function TopBarDesktop({ sidebarWidth = 256, user }) {
  const { selectedBranch, changeBranch } = useBranch();
  const [showBranches, setShowBranches] = useState(false);
  const [branches, setBranches] = useState([]);

  const hasBranchAccess = user?.role === "owner" || user?.role === "manager";

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
          // If not owner, only show their assigned branch
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
    loadBranches();
  }, [hasBranchAccess, user?.branch_id]);

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
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.06]">
          ⌘K
        </kbd>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Branch Selector */}
      <div className="relative">
        <button
          onClick={() => hasBranchAccess && setShowBranches(!showBranches)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-colors text-sm ${hasBranchAccess ? "hover:bg-white/[0.08]" : "cursor-default"}`}
          suppressHydrationWarning
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
      <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[22px] text-white/60">notifications</span>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0A0E1A]" />
      </button>

      {/* User */}
      <div className="flex items-center gap-3 pl-3 border-l border-white/[0.06]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold uppercase">
          {user?.full_name ? user.full_name[0] : "U"}
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-white/90">{user?.full_name || "Guest"}</p>
          <p className="text-[10px] text-white/40 capitalize">{user?.role || "kasir"} • {user?.branches?.name || "Semua Cabang"}</p>
        </div>
      </div>
    </header>
  );
}
