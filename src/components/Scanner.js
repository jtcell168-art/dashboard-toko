"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onScan, onClose, title = "Scan Barcode / IMEI" }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if browser supports camera and if it's HTTPS (required for camera)
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setError("Kamera hanya dapat diakses melalui koneksi aman (HTTPS). Pastikan website menggunakan https://");
      return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScan(decodedText);
      html5QrCode.stop().then(() => {
        onClose();
      }).catch(err => {
        console.error("Failed to stop scanner", err);
        onClose();
      });
    };

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0
    };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          qrCodeSuccessCallback
        );
      } catch (err) {
        console.error("Scanner start error:", err);
        if (err.includes("Permission denied")) {
          setError("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser Anda.");
        } else if (err.includes("NotFoundException")) {
          setError("Kamera belakang tidak ditemukan.");
        } else {
          setError("Gagal mengakses kamera. Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera.");
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Cleanup stop failed", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">barcode_scanner</span>
            <h3 className="text-white font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="relative aspect-square sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
          <div id="reader" className="w-full h-full"></div>
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <span className="material-symbols-outlined text-red-400 text-4xl mb-2">videocam_off</span>
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs transition-colors">
                Tutup
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/20 text-center">
          <p className="text-[11px] text-white/40">Arahkan kamera ke Barcode atau IMEI pada box perangkat</p>
        </div>
      </div>
    </div>
  );
}
