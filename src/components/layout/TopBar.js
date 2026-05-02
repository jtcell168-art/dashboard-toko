"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { useBranch } from "@/context/BranchContext";
import { createClient } from "@/lib/supabase/client";

export default function TopBar({ sidebarWidth = 256, onMobileMenuToggle, user }) {
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
          const userBranch = data.find(b => b.id === user?.branch_id);
          if (userBranch) {
            setBranches([{ id: userBranch.id, label: userBranch.name }]);
          }
        }
      }
    }
    loadBranches();
  }, [hasBranchAccess, user?.branch_id]);

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

        <button className="shrink-0 text-white/60 hover:bg-white/5 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center relative">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
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
