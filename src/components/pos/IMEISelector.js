"use client";

import { useState, useEffect } from "react";
import Scanner from "@/components/Scanner";
import { getAvailableImeis } from "@/app/actions/pos";

export default function IMEISelector({ productId, branchId, onSelect, onClose, selectedImeis = [] }) {
  const [availableImeis, setAvailableImeis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadImeis() {
      const data = await getAvailableImeis(productId, branchId);
      setAvailableImeis(data);
      setIsLoading(false);
    }
    loadImeis();
  }, [productId, branchId]);

  const handleManualAdd = () => {
    if (!manualInput) return;
    const found = availableImeis.find(i => i.imei === manualInput);
    if (found) {
      if (selectedImeis.find(s => s.id === found.id)) {
        setError("IMEI ini sudah dipilih");
      } else {
        onSelect(found);
        setManualInput("");
        setError("");
      }
    } else {
      setError("IMEI tidak ditemukan di stok cabang ini");
    }
  };

  const handleScan = (imei) => {
    const found = availableImeis.find(i => i.imei === imei);
    if (found) {
      if (selectedImeis.find(s => s.id === found.id)) {
        // Already selected
      } else {
        onSelect(found);
      }
    } else {
      alert("IMEI tidak ditemukan di stok cabang ini");
    }
    setShowScanner(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card p-0 overflow-hidden animate-fade-slide-up shadow-2xl border-white/10">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">qr_code_scanner</span>
            Pilih IMEI
          </h3>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Input Controls */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="input-field pl-10 pr-4 py-2.5 text-sm"
                  placeholder="Ketik IMEI manual..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/20 text-[18px]">
                  keyboard
                </span>
              </div>
              <button 
                onClick={() => setShowScanner(true)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                title="Scan Kamera"
              >
                <span className="material-symbols-outlined">videocam</span>
              </button>
            </div>
            {error && <p className="text-[10px] text-red-400 ml-1">{error}</p>}
          </div>

          {/* List of Available */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-white/30 uppercase font-bold tracking-wider ml-1">Tersedia di Stok</label>
            <div className="max-h-[200px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
              {isLoading ? (
                <div className="py-4 text-center text-white/20 text-xs animate-pulse">Memuat IMEI...</div>
              ) : availableImeis.length === 0 ? (
                <div className="py-4 text-center text-white/20 text-xs italic">Tidak ada IMEI tersedia</div>
              ) : (
                availableImeis.map((item) => {
                  const isSelected = selectedImeis.find(s => s.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isSelected && onSelect(item)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                        ? "bg-indigo-500/20 border-indigo-500/40 opacity-50 cursor-not-allowed" 
                        : "bg-white/[0.03] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className={`text-sm font-mono ${isSelected ? 'text-indigo-300' : 'text-white/80'}`}>{item.imei}</span>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-indigo-400 text-[18px]">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-white/10 text-[18px]">add_circle</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all">
            Selesai
          </button>
        </div>
      </div>

      {showScanner && (
        <Scanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title="Scan IMEI Perangkat"
        />
      )}
    </div>
  );
}
