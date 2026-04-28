import MainLayout from "@/components/layout/MainLayout";

export default function MorePage() {
  return (
    <MainLayout>
      <MorePageContent />
    </MainLayout>
  );
}

function MorePageContent() {
  const sections = [
    {
      title: "Keuangan",
      icon: "account_balance_wallet",
      items: [
        { label: "Biaya Operasional", href: "/finance/expenses", icon: "receipt_long" },
        { label: "Hutang Dagang", href: "/finance/payables", icon: "account_balance" },
        { label: "Kasbon Karyawan", href: "/finance/kasbon", icon: "request_quote" },
        { label: "Cicilan", href: "/finance/cicilan", icon: "credit_score" },
      ],
    },
    {
      title: "Diskon",
      icon: "sell",
      items: [
        { label: "Atur Batas Diskon", href: "/discount/settings", icon: "tune" },
        { label: "Riwayat Diskon", href: "/discount/history", icon: "history" },
      ],
    },
    {
      title: "Purchase Order",
      icon: "local_shipping",
      items: [
        { label: "Daftar PO", href: "/purchase-order", icon: "list_alt" },
        { label: "Supplier", href: "/purchase-order/suppliers", icon: "group" },
      ],
    },
    {
      title: "Laporan",
      icon: "assessment",
      items: [
        { label: "Laba Rugi", href: "/reports/pnl", icon: "analytics" },
        { label: "Performa Produk", href: "/reports/products", icon: "bar_chart" },
        { label: "Produktivitas Servis", href: "/reports/service", icon: "engineering" },
        { label: "Laporan Kasbon", href: "/reports/kasbon", icon: "summarize" },
        { label: "Laporan Cicilan", href: "/reports/cicilan", icon: "trending_up" },
      ],
    },
    {
      title: "Pengaturan",
      icon: "settings",
      items: [
        { label: "Manajemen User", href: "/settings/users", icon: "manage_accounts" },
        { label: "Cabang", href: "/settings/branches", icon: "store" },
        { label: "Umum", href: "/settings/general", icon: "tune" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Menu Lainnya</h1>
        <p className="text-sm text-white/40 mt-0.5">Akses semua fitur</p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">{section.icon}</span>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{section.title}</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {section.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-white/30">{item.icon}</span>
                <span className="text-sm text-white/70 flex-1">{item.label}</span>
                <span className="material-symbols-outlined text-[16px] text-white/15">chevron_right</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
