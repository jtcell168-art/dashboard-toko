"use client";
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * IMEI Scanner component using the back camera.
 * Optimized for scanning slim barcodes like IMEIs.
 */
export default function IMEIScanner({ onScan, onClose }) {
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Start scanner after a short delay to ensure DOM is ready
    const startScanner = async () => {
      try {
        html5QrCodeRef.current = new Html5Qrcode("scanner-view");
        const config = { 
          fps: 15, 
          qrbox: { width: 300, height: 120 }, // Rectangle shape for barcodes
          aspectRatio: 1.0
        };

        await html5QrCodeRef.current.start(
          { facingMode: "environment" }, // Camera Belakang
          config,
          (decodedText) => {
            // Success
            onScan(decodedText);
            stopAndClose();
          },
          (errorMessage) => {
            // Silently ignore scan errors (common during seeking)
          }
        );
      } catch (err) {
        console.error("Scanner error:", err);
        alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
        onClose();
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(e => console.log("Cleanup error:", e));
      }
    };
  }, []);

  const stopAndClose = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (e) {
      console.log("Stop error:", e);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">qr_code_scanner</span>
          <h3 className="text-white font-bold text-sm">Scan IMEI 1</h3>
        </div>
        <button onClick={stopAndClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        <div id="scanner-view" className="w-full h-full object-cover" />
        
        {/* Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-[320px] h-[140px] border-2 border-emerald-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] relative">
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
            
            {/* Scanning Line Animation */}
            <div className="w-full h-[2px] bg-emerald-400/50 absolute top-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          
          <div className="mt-8 px-6 py-3 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 text-center max-w-[80%]">
            <p className="text-white text-xs font-medium">Pusatkan barcode IMEI 1 di dalam kotak</p>
            <p className="text-white/40 text-[10px] mt-1">Gunakan kamera belakang dengan cahaya yang cukup</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-zinc-900 border-t border-white/10 text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span className="text-xs font-bold uppercase tracking-wider">Lumina Smart Scan</span>
        </div>
        <p className="text-[10px] text-white/30 italic">Pastikan barcode bersih dan tidak terpotong</p>
      </div>
    </div>
  );
}
