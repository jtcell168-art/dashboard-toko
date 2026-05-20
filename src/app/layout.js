import "./globals.css";
import ThemeLoader from "@/components/ThemeLoader";
import OfflineDetector from "@/components/OfflineDetector";
import { initPremiumAssets } from "@/lib/initAssets";

export const metadata = {
  title: "Lumina ERP — Smart POS & Service Management",
  description:
    "Multi-branch HP shop management system with POS, inventory, service tracking, and financial reporting.",
};

export default function RootLayout({ children }) {
  // Automatically initialize and copy high-resolution premium logo assets
  initPremiumAssets();
  
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Mobile Web App and PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json?v=8" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=8" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png?v=8" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png?v=8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JT CEll" />
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body>
        <OfflineDetector />
        <ThemeLoader />
        {children}
      </body>
    </html>
  );
}
