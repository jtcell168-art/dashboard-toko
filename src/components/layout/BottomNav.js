"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/inventory", icon: "inventory_2", label: "Inventory" },
  { href: "/pos/service", icon: "build", label: "Service" },
  { href: "/pos/retail", icon: "receipt_long", label: "Sales" },
  { href: "/more", icon: "menu", label: "More" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 w-full z-50 rounded-t-xl border-t border-white/5 flex justify-around items-center px-2 py-2.5 backdrop-blur-md md:hidden"
      style={{
        background: "rgba(17, 24, 39, 0.92)",
        boxShadow: "0 -4px 24px rgba(99, 102, 241, 0.08)",
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center active:scale-95 transition-all duration-200 min-w-[56px] gap-0.5 rounded-xl px-2 py-1 ${
              isActive
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-slate-500 hover:text-indigo-300"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
