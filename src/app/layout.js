import "./globals.css";
import ThemeLoader from "@/components/ThemeLoader";

export const metadata = {
  title: "Lumina ERP — Smart POS & Service Management",
  description:
    "Multi-branch HP shop management system with POS, inventory, service tracking, and financial reporting.",
};

export default function RootLayout({ children }) {
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
      </head>
      <body>
        <ThemeLoader />
        {children}
      </body>
    </html>
  );
}
