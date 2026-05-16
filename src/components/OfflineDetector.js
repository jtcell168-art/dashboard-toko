"use client";

import { useState, useEffect } from "react";

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-rose-500 text-white text-xs font-bold text-center py-2 px-4 shadow-lg flex items-center justify-center gap-2 animate-slide-down">
      <span className="material-symbols-outlined text-[16px]">wifi_off</span>
      KONEKSI INTERNET TERPUTUS! Data tidak akan tersimpan. Mohon periksa WiFi Anda.
    </div>
  );
}
