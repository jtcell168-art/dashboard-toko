"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { logout } from "@/app/actions/auth";

const MENU = [
  {
    label: "Dashboard",
    icon: "dashboard",
    href: "/dashboard",
  },
  {
    label: "Inventaris",
    icon: "inventory_2",
    href: "/inventory",
    children: [
      { label: "Stok Semua Cabang", href: "/inventory" },
      { label: "Transfer Stok", href: "/inventory/transfer" },
      { label: "Tracking IMEI", href: "/inventory/imei" },
    ],
  },
  {
    label: "Point of Sale",
    icon: "point_of_sale",
    href: "/pos",
    children: [
      { label: "Penjualan (Retail)", href: "/pos/retail" },
      { label: "Servis HP", href: "/pos/service" },
      { label: "Produk Digital", href: "/pos/digital" },
    ],
  },
  {
    label: "Diskon",
    icon: "sell",
    href: "/discount",
    children: [
      { label: "Atur Batas Diskon", href: "/discount/settings" },
      { label: "Riwayat Diskon", href: "/discount/history" },
    ],
  },
  {
    label: "Purchase Order",
    icon: "local_shipping",
    href: "/purchase-order",
    children: [
      { label: "Buat PO Baru", href: "/purchase-order/new" },
      { label: "Daftar PO", href: "/purchase-order" },
      { label: "Supplier", href: "/purchase-order/suppliers" },
    ],
  },
  {
    label: "Keuangan",
    icon: "account_balance_wallet",
    href: "/finance",
    children: [
      { label: "Biaya Operasional", href: "/finance/expenses" },
      { label: "Hutang Dagang", href: "/finance/payables" },
      { label: "Kasbon Karyawan", href: "/finance/kasbon" },
      { label: "Cicilan", href: "/finance/cicilan" },
      { label: "Manajemen Aset", href: "/finance/assets" },
    ],
  },
  {
    label: "Laporan",
    icon: "assessment",
    href: "/reports",
    children: [
      { label: "Laba Rugi", href: "/reports/pnl" },
      { label: "Laporan Transaksi", href: "/reports/transactions" },
      { label: "Performa Produk", href: "/reports/products" },
      { label: "Produktivitas Servis", href: "/reports/servis" },
      { label: "Laporan Kasbon", href: "/reports/kasbon" },
      { label: "Laporan Cicilan", href: "/reports/cicilan" },
    ],
  },
  {
    label: "Pengaturan",
    icon: "settings",
    href: "/settings",
    children: [
      { label: "Manajemen User", href: "/settings/users" },
      { label: "Cabang", href: "/settings/branches" },
      { label: "Umum", href: "/settings/general" },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, user, isMobile = false }) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = user?.role || "kasir";

  const filteredMenu = useMemo(() => {
    // ... same as before
    return MENU.map(item => {
      if (role === "teknisi") {
        if (item.label === "Dashboard") return item;
        if (item.label === "Point of Sale") {
          return { ...item, children: item.children.filter(c => c.label === "Servis HP") };
        }
        return null;
      }

      if (role === "kasir") {
        if (item.label === "Pengaturan") return null;
        if (item.label === "Purchase Order") return null;
        if (item.label === "Keuangan") {
          return { ...item, children: item.children.filter(c => ["Kasbon Karyawan", "Cicilan"].includes(c.label)) };
        }
        if (item.label === "Laporan") {
          return { ...item, children: item.children.filter(c => ["Produktivitas Servis", "Laporan Kasbon", "Laporan Cicilan"].includes(c.label)) };
        }
      }
      return item;
    }).filter(Boolean);
  }, [role]);

  // ... same as before
  useEffect(() => {
    const initialExpanded = {};
    filteredMenu.forEach((item) => {
      if (item.children?.some((c) => pathname === c.href || pathname?.startsWith(c.href + "/"))) {
        initialExpanded[item.label] = true;
      }
    });
    setExpandedMenus((prev) => ({ ...prev, ...initialExpanded }));
  }, [pathname, filteredMenu]);

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href;
  };

  const isParentActive = (item) => {
    if (isActive(item.href)) return true;
    return item.children?.some((c) => pathname === c.href || pathname?.startsWith(c.href + "/"));
  };

  return (
    <div
      className={`fixed top-0 left-0 h-dvh z-40 ${isMobile ? 'flex w-[280px]' : 'hidden md:flex'} flex-col overflow-hidden shadow-2xl md:shadow-none`}
      style={{
        width: isMobile ? 280 : (collapsed ? 72 : 256),
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0 border-b border-white/[0.04]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <span className="text-white font-bold text-sm">JT</span>
          </div>
          {!collapsed && (
            <span
              className="text-base font-bold tracking-tight whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              JT CELL GROUP
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5">
        {!mounted ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredMenu.map((item) => {
          const active = isParentActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.label];

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="sidebar-item w-full"
                  style={active ? { background: "rgba(99,102,241,0.12)", color: "#818CF8" } : {}}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{item.label}</span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 16,
                          transition: "transform 0.2s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                          flexShrink: 0,
                        }}
                      >
                        expand_more
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="sidebar-item"
                  style={active ? { background: "rgba(99,102,241,0.12)", color: "#818CF8" } : {}}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                </Link>
              )}

              {/* Sub items */}
              {hasChildren && isExpanded && !collapsed && (
                <div className="mt-0.5 mb-1 flex flex-col" style={{ animation: "slideDown 0.2s ease-out" }}>
                  {item.children.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="sidebar-sub-item"
                        style={childActive ? { color: "#818CF8" } : {}}
                      >
                        <span
                          className="shrink-0 rounded-full"
                          style={{
                            width: 5,
                            height: 5,
                            background: childActive ? "#818CF8" : "rgba(255,255,255,0.2)",
                          }}
                        />
                        <span className="whitespace-nowrap overflow-hidden">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="shrink-0 p-3 border-t border-white/[0.04] flex flex-col gap-1">
        {mounted && (
          <>
            <button
              onClick={() => logout()}
              className="sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
              title={collapsed ? "Logout" : "Logout"}
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, flexShrink: 0 }}>
                logout
              </span>
              {!collapsed && <span className="whitespace-nowrap">Logout</span>}
            </button>

            <button
              onClick={onToggle}
              className="sidebar-item w-full"
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
              title={collapsed ? "Expand" : "Collapse"}
              suppressHydrationWarning
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 22,
                  flexShrink: 0,
                  transition: "transform 0.3s",
                  transform: collapsed ? "rotate(0)" : "rotate(180deg)",
                }}
              >
                chevron_right
              </span>
              {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { MENU };
