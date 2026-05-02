"use client";

import { logout } from "@/app/actions/auth";

export default function TopBar({ sidebarWidth = 256, onMobileMenuToggle }) {
  return (
    <nav className="fixed top-0 w-full z-50 md:hidden flex items-center justify-between px-4 h-16 border-b border-white/10 backdrop-blur-md"
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
