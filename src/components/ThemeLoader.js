"use client";
import { useEffect } from "react";

const THEME_MAP = {
  dark: { "--color-bg-primary": "#0A0E1A", "--color-bg-secondary": "#111827", "--color-bg-tertiary": "#1E293B", "--color-bg-glass": "rgba(17, 24, 39, 0.7)" },
  midnight: { "--color-bg-primary": "#0F172A", "--color-bg-secondary": "#1E293B", "--color-bg-tertiary": "#334155", "--color-bg-glass": "rgba(30, 41, 59, 0.7)" },
  charcoal: { "--color-bg-primary": "#1A1A2E", "--color-bg-secondary": "#16213E", "--color-bg-tertiary": "#0F3460", "--color-bg-glass": "rgba(22, 33, 62, 0.7)" },
  amoled: { "--color-bg-primary": "#000000", "--color-bg-secondary": "#0A0A0A", "--color-bg-tertiary": "#141414", "--color-bg-glass": "rgba(10, 10, 10, 0.7)" },
  ocean: { "--color-bg-primary": "#0B1120", "--color-bg-secondary": "#0D1B2A", "--color-bg-tertiary": "#1B2838", "--color-bg-glass": "rgba(13, 27, 42, 0.7)" },
  forest: { "--color-bg-primary": "#0A1210", "--color-bg-secondary": "#0F1A17", "--color-bg-tertiary": "#1A2E28", "--color-bg-glass": "rgba(15, 26, 23, 0.7)" },
};

export function applyTheme(themeId) {
  const vars = THEME_MAP[themeId];
  if (!vars) return;
  const root = document.documentElement;
  Object.entries(vars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  document.body.style.background = vars["--color-bg-primary"];
}

export default function ThemeLoader() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lumina-theme");
      if (saved && THEME_MAP[saved]) {
        applyTheme(saved);
      }
    } catch (e) {}
  }, []);

  return null;
}
