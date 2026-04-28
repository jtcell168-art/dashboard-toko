"use client";
import { useState, useEffect } from "react";
import { applyTheme } from "@/components/ThemeLoader";

const SETTINGS = [
  { key: "storeName", label: "Nama Toko", value: "Lumina ERP", type: "text" },
  { key: "storePhone", label: "Telepon Toko", value: "021-1234567", type: "text" },
  { key: "currency", label: "Mata Uang", value: "IDR", type: "select", options: ["IDR", "USD"] },
  { key: "taxRate", label: "PPN (%)", value: "11", type: "number" },
  { key: "receiptFooter", label: "Footer Struk", value: "Terima kasih telah berbelanja di JT Cell!", type: "text" },
  { key: "warrantyDefault", label: "Garansi Default Servis (hari)", value: "30", type: "number" },
  { key: "lowStockThreshold", label: "Batas Stok Rendah", value: "5", type: "number" },
];

const THEMES = [
  {
    id: "dark",
    label: "Dark (Default)",
    preview: { bg: "#0A0E1A", card: "#111827", accent: "#6366F1" },
    vars: { "--color-bg-primary": "#0A0E1A", "--color-bg-secondary": "#111827", "--color-bg-tertiary": "#1E293B", "--color-bg-glass": "rgba(17, 24, 39, 0.7)" },
  },
  {
    id: "midnight",
    label: "Midnight Blue",
    preview: { bg: "#0F172A", card: "#1E293B", accent: "#818CF8" },
    vars: { "--color-bg-primary": "#0F172A", "--color-bg-secondary": "#1E293B", "--color-bg-tertiary": "#334155", "--color-bg-glass": "rgba(30, 41, 59, 0.7)" },
  },
  {
    id: "charcoal",
    label: "Charcoal",
    preview: { bg: "#1A1A2E", card: "#16213E", accent: "#A78BFA" },
    vars: { "--color-bg-primary": "#1A1A2E", "--color-bg-secondary": "#16213E", "--color-bg-tertiary": "#0F3460", "--color-bg-glass": "rgba(22, 33, 62, 0.7)" },
  },
  {
    id: "amoled",
    label: "AMOLED Black",
    preview: { bg: "#000000", card: "#0A0A0A", accent: "#6366F1" },
    vars: { "--color-bg-primary": "#000000", "--color-bg-secondary": "#0A0A0A", "--color-bg-tertiary": "#141414", "--color-bg-glass": "rgba(10, 10, 10, 0.7)" },
  },
  {
    id: "ocean",
    label: "Ocean Deep",
    preview: { bg: "#0B1120", card: "#0D1B2A", accent: "#38BDF8" },
    vars: { "--color-bg-primary": "#0B1120", "--color-bg-secondary": "#0D1B2A", "--color-bg-tertiary": "#1B2838", "--color-bg-glass": "rgba(13, 27, 42, 0.7)" },
  },
  {
    id: "forest",
    label: "Forest Night",
    preview: { bg: "#0A1210", card: "#0F1A17", accent: "#34D399" },
    vars: { "--color-bg-primary": "#0A1210", "--color-bg-secondary": "#0F1A17", "--color-bg-tertiary": "#1A2E28", "--color-bg-glass": "rgba(15, 26, 23, 0.7)" },
  },
];

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState(SETTINGS.map(s => ({ ...s })));
  const [activeTheme, setActiveTheme] = useState("dark");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("lumina-theme");
    if (saved) {
      setActiveTheme(saved);
    }
  }, []);

  const selectTheme = (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("lumina-theme", themeId);
  };

  const update = (key, val) => setSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s));
  const handleSave = () => alert("Pengaturan disimpan! (mock)");

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div><h1 className="text-xl md:text-2xl font-bold text-white">Pengaturan Umum</h1><p className="text-sm text-white/40 mt-0.5">Konfigurasi umum aplikasi</p></div>

      <div className="glass-card p-5 flex flex-col gap-4">
        {settings.map(s => (
          <div key={s.key} className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 font-medium">{s.label}</label>
            {s.type === "select" ? (
              <select className="input-field" value={s.value} onChange={e => update(s.key, e.target.value)}>{s.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
            ) : (
              <input className="input-field" type={s.type} value={s.value} onChange={e => update(s.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-indigo-400">palette</span>
          Tema Aplikasi
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map(theme => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className="group relative p-4 rounded-xl border text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: theme.preview.bg,
                  borderColor: isActive ? theme.preview.accent : "rgba(255,255,255,0.06)",
                  boxShadow: isActive ? `0 0 20px ${theme.preview.accent}20, inset 0 1px 0 ${theme.preview.accent}15` : "none",
                }}
              >
                {/* Mini preview */}
                <div className="w-full aspect-[4/3] rounded-lg mb-3 overflow-hidden relative" style={{ background: theme.preview.bg, border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Sidebar preview */}
                  <div className="absolute left-0 top-0 bottom-0 w-[25%] rounded-l-lg" style={{ background: theme.preview.card }} />
                  {/* Header preview */}
                  <div className="absolute left-[28%] top-[8%] right-[5%] h-[15%] rounded" style={{ background: theme.preview.card }} />
                  {/* KPI cards preview */}
                  <div className="absolute left-[28%] top-[30%] right-[5%] flex gap-[4%]">
                    <div className="flex-1 h-[20px] rounded" style={{ background: theme.preview.accent + "30" }} />
                    <div className="flex-1 h-[20px] rounded" style={{ background: theme.preview.card }} />
                    <div className="flex-1 h-[20px] rounded" style={{ background: theme.preview.card }} />
                  </div>
                  {/* Content preview */}
                  <div className="absolute left-[28%] top-[55%] right-[5%] bottom-[8%] rounded" style={{ background: theme.preview.card }} />
                </div>

                <p className="text-[11px] font-semibold mb-1" style={{ color: isActive ? theme.preview.accent : "rgba(255,255,255,0.5)" }}>{theme.label}</p>

                {isActive ? (
                  <span className="material-symbols-outlined text-[18px]" style={{ color: theme.preview.accent, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-white/10 group-hover:text-white/20 transition-colors">radio_button_unchecked</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
          <span className="material-symbols-outlined text-indigo-400 text-[16px] mt-0.5">info</span>
          <p className="text-xs text-white/40">Tema langsung diterapkan saat diklik dan disimpan di browser. Semua halaman akan menggunakan tema yang dipilih.</p>
        </div>
      </div>

      <button onClick={handleSave} className="btn-gradient py-3 text-sm flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">save</span>Simpan Pengaturan</button>
    </div>
  );
}
