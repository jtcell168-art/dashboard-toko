"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TopBarDesktop from "./TopBarDesktop";
import BottomNav from "./BottomNav";

export default function MainLayout({ children, user }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? 72 : 256;

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/60 z-[45] animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-dvh w-[280px] z-[50] animate-slide-in-right">
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile TopBar */}
      <TopBar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} user={user} />

      {/* Desktop TopBar */}
      <TopBarDesktop sidebarWidth={sidebarWidth} user={user} />

      {/* Main Content */}
      <div
        className="min-h-screen pt-16 pb-20 md:pb-6 px-4 md:px-6"
        style={{
          marginLeft: 0,
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .main-content-area {
              margin-left: ${sidebarWidth}px !important;
            }
          }
        `}</style>
        <div className="main-content-area pt-2 md:pt-4 max-w-[1400px]">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
