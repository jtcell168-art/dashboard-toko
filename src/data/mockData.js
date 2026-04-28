// ========== CORE ==========
export const BRANCHES = [
  { id: "a", name: "Cabang A — Pusat", city: "Jakarta", address: "Jl. Raya Utama No. 123", phone: "021-1234567" },
  { id: "b", name: "Cabang B — Mall", city: "Jakarta", address: "Mall Central Lt. 2 No. 15", phone: "021-7654321" },
  { id: "c", name: "Cabang C — Ruko", city: "Bandung", address: "Ruko Jl. Asia Afrika No. 45", phone: "022-9876543" },
];

export const USERS = [
  { id: 1, name: "Andi Wijaya", role: "owner", email: "andi@lumina.id", branch: "Semua", status: "active", lastLogin: "2026-04-28 08:30" },
  { id: 2, name: "Budi Santoso", role: "manager", email: "budi@lumina.id", branch: "Cabang A", status: "active", lastLogin: "2026-04-28 07:45" },
  { id: 3, name: "Citra Dewi", role: "kasir", email: "citra@lumina.id", branch: "Cabang A", status: "active", lastLogin: "2026-04-28 08:00" },
  { id: 4, name: "Doni Prasetyo", role: "teknisi", email: "doni@lumina.id", branch: "Cabang B", status: "active", lastLogin: "2026-04-27 17:00" },
  { id: 5, name: "Eka Putri", role: "kasir", email: "eka@lumina.id", branch: "Cabang B", status: "active", lastLogin: "2026-04-28 08:10" },
  { id: 6, name: "Fajar Nugroho", role: "teknisi", email: "fajar@lumina.id", branch: "Cabang C", status: "inactive", lastLogin: "2026-04-20 15:00" },
];

export const formatRupiah = (num) => "Rp " + new Intl.NumberFormat("id-ID").format(num);
export const calcChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
};

// ========== DASHBOARD ==========
export const KPI_DATA = {
  totalSalestoday: 12_450_000, totalSalesYesterday: 10_890_000,
  activeServices: { pending: 5, process: 12, done: 8 },
  lowStockAlerts: 7, netProfitMonth: 28_500_000, netProfitLastMonth: 24_200_000,
};
export const SALES_7DAYS = [
  { day: "Sen", cabA: 4200000, cabB: 3100000, cabC: 2800000 },
  { day: "Sel", cabA: 3800000, cabB: 3600000, cabC: 2400000 },
  { day: "Rab", cabA: 5100000, cabB: 2900000, cabC: 3200000 },
  { day: "Kam", cabA: 4600000, cabB: 4100000, cabC: 2700000 },
  { day: "Jum", cabA: 6200000, cabB: 3800000, cabC: 3500000 },
  { day: "Sab", cabA: 7800000, cabB: 5200000, cabC: 4100000 },
  { day: "Min", cabA: 5400000, cabB: 4600000, cabC: 3600000 },
];
export const REVENUE_BY_BRANCH = [
  { branch: "Cabang A", revenue: 37_100_000, color: "#6366F1" },
  { branch: "Cabang B", revenue: 27_300_000, color: "#8B5CF6" },
  { branch: "Cabang C", revenue: 22_300_000, color: "#A78BFA" },
];
export const RECENT_TRANSACTIONS = [
  { id: "TRX-001", type: "retail", customer: "Ahmad Rizki", amount: 4_500_000, branch: "A", time: "14:32", product: "iPhone 13 128GB" },
  { id: "TRX-002", type: "service", customer: "Siti Nurhaliza", amount: 350_000, branch: "B", time: "14:15", product: "Ganti LCD Samsung A54" },
  { id: "TRX-003", type: "digital", customer: "Budi Santoso", amount: 100_000, branch: "A", time: "13:48", product: "Pulsa Telkomsel 100K" },
  { id: "TRX-004", type: "retail", customer: "Dewi Lestari", amount: 2_800_000, branch: "C", time: "13:22", product: "Samsung Galaxy A15" },
  { id: "TRX-005", type: "service", customer: "Rudi Hermawan", amount: 150_000, branch: "A", time: "12:55", product: "Ganti Baterai iPhone 12" },
  { id: "TRX-006", type: "retail", customer: "Fajar Nugroho", amount: 450_000, branch: "B", time: "12:30", product: "Casing iPhone 15 Pro" },
  { id: "TRX-007", type: "digital", customer: "Lisa Andini", amount: 50_000, branch: "C", time: "12:10", product: "Paket Data XL 15GB" },
  { id: "TRX-008", type: "service", customer: "Hendra Wijaya", amount: 500_000, branch: "A", time: "11:45", product: "Ganti Konektor Cas" },
];
export const SERVICE_ALERTS = [
  { id: "SRV-101", customer: "Pak Joko", device: "iPhone 14 Pro", issue: "LCD Retak", status: "overdue", days: 3, technician: "Andi" },
  { id: "SRV-098", customer: "Bu Ratna", device: "Samsung S23", issue: "Baterai Kembung", status: "overdue", days: 2, technician: "Budi" },
  { id: "SRV-105", customer: "Mas Deni", device: "Xiaomi 13T", issue: "Tidak Bisa Cas", status: "pending", days: 0, technician: null },
  { id: "SRV-106", customer: "Mbak Rina", device: "Oppo A78", issue: "Software Hang", status: "pending", days: 0, technician: null },
];

// ========== INVENTORY ==========
export const INVENTORY_PRODUCTS = [
  { id: 1, name: "iPhone 15 128GB", sku: "APL-IP15-128", category: "HP", stockA: 3, stockB: 5, stockC: 2, buyPrice: 12_500_000, sellPrice: 14_999_000 },
  { id: 2, name: "iPhone 15 Pro 256GB", sku: "APL-IP15P-256", category: "HP", stockA: 1, stockB: 2, stockC: 0, buyPrice: 17_000_000, sellPrice: 19_999_000 },
  { id: 3, name: "Samsung Galaxy A15", sku: "SAM-GA15-128", category: "HP", stockA: 12, stockB: 8, stockC: 15, buyPrice: 1_800_000, sellPrice: 2_499_000 },
  { id: 4, name: "Samsung Galaxy S24", sku: "SAM-GS24-256", category: "HP", stockA: 2, stockB: 3, stockC: 1, buyPrice: 10_500_000, sellPrice: 12_999_000 },
  { id: 5, name: "Xiaomi Redmi Note 13", sku: "XIA-RN13-128", category: "HP", stockA: 18, stockB: 10, stockC: 14, buyPrice: 2_200_000, sellPrice: 2_799_000 },
  { id: 6, name: "Oppo A78 5G", sku: "OPP-A78-128", category: "HP", stockA: 6, stockB: 4, stockC: 7, buyPrice: 2_800_000, sellPrice: 3_499_000 },
  { id: 7, name: "Casing iPhone 15 Pro MagSafe", sku: "ACC-CAS-IP15P", category: "Aksesori", stockA: 25, stockB: 18, stockC: 20, buyPrice: 45_000, sellPrice: 150_000 },
  { id: 8, name: "Tempered Glass Universal", sku: "ACC-TG-UNI", category: "Aksesori", stockA: 50, stockB: 30, stockC: 45, buyPrice: 5_000, sellPrice: 25_000 },
  { id: 9, name: "Charger 65W USB-C", sku: "ACC-CHG-65W", category: "Aksesori", stockA: 15, stockB: 8, stockC: 10, buyPrice: 85_000, sellPrice: 175_000 },
  { id: 10, name: "LCD iPhone 12 (OEM)", sku: "SPC-LCD-IP12", category: "Sparepart", stockA: 4, stockB: 2, stockC: 1, buyPrice: 280_000, sellPrice: 0 },
  { id: 11, name: "Baterai Samsung A54", sku: "SPC-BAT-SA54", category: "Sparepart", stockA: 6, stockB: 3, stockC: 2, buyPrice: 120_000, sellPrice: 0 },
  { id: 12, name: "Konektor Cas Type-C Universal", sku: "SPC-CAS-TC", category: "Sparepart", stockA: 20, stockB: 12, stockC: 8, buyPrice: 15_000, sellPrice: 0 },
];

export const TRANSFER_HISTORY = [
  { id: "TRF-001", product: "iPhone 15 128GB", from: "Cabang A", to: "Cabang C", qty: 2, date: "2026-04-26", status: "completed", by: "Budi" },
  { id: "TRF-002", product: "Samsung Galaxy A15", from: "Cabang C", to: "Cabang B", qty: 5, date: "2026-04-25", status: "completed", by: "Citra" },
  { id: "TRF-003", product: "Charger 65W USB-C", from: "Cabang A", to: "Cabang B", qty: 3, date: "2026-04-27", status: "in_transit", by: "Budi" },
  { id: "TRF-004", product: "Tempered Glass Universal", from: "Cabang B", to: "Cabang C", qty: 10, date: "2026-04-27", status: "in_transit", by: "Eka" },
];

export const IMEI_RECORDS = [
  { imei: "352456789012345", product: "iPhone 14 Pro", status: "service", branch: "Cabang B", customer: "Pak Joko", lastAction: "Masuk servis — LCD Retak", date: "2026-04-24" },
  { imei: "356789012345678", product: "Samsung S23", status: "service", branch: "Cabang A", customer: "Bu Ratna", lastAction: "Masuk servis — Baterai Kembung", date: "2026-04-25" },
  { imei: "359012345678901", product: "iPhone 15 128GB", status: "sold", branch: "Cabang A", customer: "Ahmad Rizki", lastAction: "Terjual — Retail", date: "2026-04-27" },
  { imei: "351234567890124", product: "Samsung Galaxy S24", status: "stock", branch: "Cabang B", customer: null, lastAction: "Masuk stok dari PO-003", date: "2026-04-20" },
  { imei: "354567890123456", product: "Xiaomi Redmi Note 13", status: "stock", branch: "Cabang C", customer: null, lastAction: "Transfer dari Cabang A", date: "2026-04-22" },
];

// ========== SERVICE ==========
export const SERVICE_LIST = [
  { id: "SRV-101", customer: "Pak Joko", phone: "081234567890", device: "iPhone 14 Pro", imei: "352456789012345", issue: "LCD Retak", status: "process", technician: "Andi", estimatedCost: 1_200_000, dp: 500_000, createdAt: "2026-04-24", estimatedDone: "2026-04-26" },
  { id: "SRV-098", customer: "Bu Ratna", phone: "085612345678", device: "Samsung S23", imei: "356789012345678", issue: "Baterai Kembung", status: "process", technician: "Budi", estimatedCost: 350_000, dp: 0, createdAt: "2026-04-25", estimatedDone: "2026-04-27" },
  { id: "SRV-105", customer: "Mas Deni", phone: "087612345678", device: "Xiaomi 13T", imei: "358901234567890", issue: "Tidak Bisa Cas", status: "pending", technician: null, estimatedCost: 250_000, dp: 100_000, createdAt: "2026-04-27", estimatedDone: null },
  { id: "SRV-106", customer: "Mbak Rina", phone: "089612345678", device: "Oppo A78", imei: "351234567890123", issue: "Software Hang", status: "pending", technician: null, estimatedCost: 100_000, dp: 0, createdAt: "2026-04-27", estimatedDone: null },
  { id: "SRV-095", customer: "Dian Permata", phone: "081312345678", device: "iPhone 13", imei: "354567890123456", issue: "Speaker Rusak", status: "done", technician: "Andi", estimatedCost: 400_000, dp: 200_000, createdAt: "2026-04-22", estimatedDone: "2026-04-25" },
  { id: "SRV-090", customer: "Agus Salim", phone: "085712345678", device: "Samsung A54", imei: "357890123456789", issue: "Kamera Error", status: "picked_up", technician: "Budi", estimatedCost: 500_000, dp: 250_000, createdAt: "2026-04-20", estimatedDone: "2026-04-23" },
];

// ========== DIGITAL PRODUCTS ==========
export const DIGITAL_PRODUCTS = [
  { id: 1, type: "pulsa", provider: "Telkomsel", nominal: 25_000, price: 26_000 },
  { id: 2, type: "pulsa", provider: "Telkomsel", nominal: 50_000, price: 51_500 },
  { id: 3, type: "pulsa", provider: "Telkomsel", nominal: 100_000, price: 101_000 },
  { id: 4, type: "pulsa", provider: "XL", nominal: 25_000, price: 26_500 },
  { id: 5, type: "pulsa", provider: "XL", nominal: 50_000, price: 51_000 },
  { id: 6, type: "pulsa", provider: "Indosat", nominal: 25_000, price: 26_000 },
  { id: 7, type: "pulsa", provider: "Indosat", nominal: 50_000, price: 51_000 },
  { id: 8, type: "data", provider: "Telkomsel", nominal: "15GB/30hr", price: 65_000 },
  { id: 9, type: "data", provider: "Telkomsel", nominal: "30GB/30hr", price: 100_000 },
  { id: 10, type: "data", provider: "XL", nominal: "20GB/30hr", price: 70_000 },
  { id: 11, type: "ewallet", provider: "GoPay", nominal: 50_000, price: 51_000 },
  { id: 12, type: "ewallet", provider: "OVO", nominal: 100_000, price: 101_500 },
  { id: 13, type: "ewallet", provider: "DANA", nominal: 50_000, price: 51_000 },
];

// ========== DISCOUNT ==========
export const DISCOUNT_LIMITS = [
  { role: "kasir", maxPercent: 0.5, color: "#3B82F6" },
  { role: "teknisi", maxPercent: 0.5, color: "#F59E0B" },
  { role: "manager", maxPercent: 1.0, color: "#8B5CF6" },
  { role: "owner", maxPercent: 1.5, color: "#10B981" },
];
export const DISCOUNT_HISTORY = [
  { id: 1, trxId: "TRX-001", product: "iPhone 13 128GB", originalPrice: 4_600_000, discountPercent: 1.0, discountAmount: 46_000, finalPrice: 4_554_000, givenBy: "Budi (Manager)", date: "2026-04-27 14:32" },
  { id: 2, trxId: "TRX-004", product: "Samsung Galaxy A15", originalPrice: 2_499_000, discountPercent: 0.5, discountAmount: 12_495, finalPrice: 2_486_505, givenBy: "Citra (Kasir)", date: "2026-04-27 13:22" },
  { id: 3, trxId: "TRX-010", product: "Oppo A78 5G", originalPrice: 3_499_000, discountPercent: 1.5, discountAmount: 52_485, finalPrice: 3_446_515, givenBy: "Andi (Owner)", date: "2026-04-26 16:40" },
  { id: 4, trxId: "TRX-012", product: "Xiaomi Redmi Note 13", originalPrice: 2_799_000, discountPercent: 0.5, discountAmount: 13_995, finalPrice: 2_785_005, givenBy: "Eka (Kasir)", date: "2026-04-25 11:15" },
];

// ========== PURCHASE ORDER ==========
export const SUPPLIERS = [
  { id: 1, name: "PT Trikomsel (TAM)", contact: "Pak Hendra", phone: "021-55512345", email: "order@tam.co.id", category: "Apple Authorized", balance: 0 },
  { id: 2, name: "Samsung Electronics ID", contact: "Bu Mega", phone: "021-55567890", email: "po@samsung.id", category: "Samsung Official", balance: -15_000_000 },
  { id: 3, name: "Xiaomi Indonesia", contact: "Mas Rio", phone: "021-55598765", email: "supply@xiaomi.id", category: "Xiaomi Official", balance: 0 },
  { id: 4, name: "Toko Aksesori Jaya", contact: "Ko Alung", phone: "081234567890", email: "aksesorijaya@gmail.com", category: "Aksesori & Part", balance: -2_500_000 },
];
export const PURCHASE_ORDERS = [
  { id: "PO-001", supplier: "PT Trikomsel (TAM)", items: 3, totalAmount: 52_500_000, status: "received", createdAt: "2026-04-15", receivedAt: "2026-04-18", branch: "Cabang A" },
  { id: "PO-002", supplier: "Samsung Electronics ID", items: 5, totalAmount: 38_000_000, status: "partial", createdAt: "2026-04-20", receivedAt: null, branch: "Cabang B" },
  { id: "PO-003", supplier: "Toko Aksesori Jaya", items: 8, totalAmount: 4_500_000, status: "sent", createdAt: "2026-04-25", receivedAt: null, branch: "Cabang A" },
  { id: "PO-004", supplier: "Xiaomi Indonesia", items: 4, totalAmount: 22_000_000, status: "draft", createdAt: "2026-04-27", receivedAt: null, branch: "Cabang C" },
];

// ========== FINANCE ==========
export const EXPENSES = [
  { id: 1, category: "Sewa Toko", amount: 8_000_000, branch: "Cabang A", date: "2026-04-01", note: "Sewa bulan April", recurring: true },
  { id: 2, category: "Listrik", amount: 1_200_000, branch: "Cabang A", date: "2026-04-05", note: "Tagihan PLN", recurring: true },
  { id: 3, category: "Gaji", amount: 15_000_000, branch: "Semua", date: "2026-04-01", note: "Gaji 6 karyawan", recurring: true },
  { id: 4, category: "Internet", amount: 500_000, branch: "Cabang B", date: "2026-04-03", note: "IndiHome", recurring: true },
  { id: 5, category: "Maintenance", amount: 350_000, branch: "Cabang C", date: "2026-04-12", note: "Service AC", recurring: false },
  { id: 6, category: "Transportasi", amount: 200_000, branch: "Cabang A", date: "2026-04-15", note: "Antar barang ke Cab C", recurring: false },
];
export const PAYABLES = [
  { id: 1, supplier: "Samsung Electronics ID", amount: 15_000_000, dueDate: "2026-05-05", status: "unpaid", poRef: "PO-002" },
  { id: 2, supplier: "Toko Aksesori Jaya", amount: 2_500_000, dueDate: "2026-05-10", status: "unpaid", poRef: "PO-003" },
  { id: 3, supplier: "PT Trikomsel (TAM)", amount: 10_000_000, dueDate: "2026-04-20", status: "paid", poRef: "PO-001", paidAt: "2026-04-19" },
];
export const KASBON_LIST = [
  { id: 1, employee: "Citra Dewi", role: "Kasir", amount: 1_000_000, remaining: 600_000, installment: 200_000, status: "active", date: "2026-04-01", reason: "Keperluan mendesak" },
  { id: 2, employee: "Doni Prasetyo", role: "Teknisi", amount: 500_000, remaining: 500_000, installment: 250_000, status: "pending_approval", date: "2026-04-25", reason: "Biaya pengobatan" },
  { id: 3, employee: "Eka Putri", role: "Kasir", amount: 750_000, remaining: 0, installment: 250_000, status: "paid", date: "2026-03-15", reason: "Uang muka kos" },
];
export const CICILAN_LIST = [
  { id: 1, customer: "Ahmad Rizki", phone: "081234567890", product: "iPhone 15 Pro 256GB", totalPrice: 19_999_000, dp: 5_000_000, remaining: 10_000_000, installment: 2_500_000, tenor: 6, paidMonths: 2, status: "active", startDate: "2026-03-01" },
  { id: 2, customer: "Dewi Lestari", phone: "085612345678", product: "Samsung Galaxy S24", totalPrice: 12_999_000, dp: 3_000_000, remaining: 5_000_000, installment: 2_000_000, tenor: 5, paidMonths: 2, status: "active", startDate: "2026-03-15" },
  { id: 3, customer: "Hendra Wijaya", phone: "087612345678", product: "iPhone 14 Pro", totalPrice: 16_500_000, dp: 6_500_000, remaining: 0, installment: 2_000_000, tenor: 5, paidMonths: 5, status: "completed", startDate: "2025-12-01" },
  { id: 4, customer: "Lisa Andini", phone: "089612345678", product: "Samsung Galaxy A15", totalPrice: 2_499_000, dp: 500_000, remaining: 1_999_000, installment: 500_000, tenor: 4, paidMonths: 0, status: "overdue", startDate: "2026-04-01" },
];

// ========== REPORTS ==========
export const MONTHLY_PNL = [
  { month: "Jan", revenue: 68_000_000, cogs: 52_000_000, expenses: 8_000_000, profit: 8_000_000 },
  { month: "Feb", revenue: 72_000_000, cogs: 54_000_000, expenses: 8_500_000, profit: 9_500_000 },
  { month: "Mar", revenue: 85_000_000, cogs: 62_000_000, expenses: 9_000_000, profit: 14_000_000 },
  { month: "Apr", revenue: 86_700_000, cogs: 63_200_000, expenses: 9_500_000, profit: 14_000_000 },
];
export const PRODUCT_PERFORMANCE = [
  { name: "iPhone 15 128GB", sold: 12, revenue: 179_988_000, profit: 29_988_000, category: "HP" },
  { name: "Samsung Galaxy A15", sold: 45, revenue: 112_455_000, profit: 31_455_000, category: "HP" },
  { name: "Xiaomi Redmi Note 13", sold: 38, revenue: 106_362_000, profit: 22_762_000, category: "HP" },
  { name: "Tempered Glass Universal", sold: 320, revenue: 8_000_000, profit: 6_400_000, category: "Aksesori" },
  { name: "Casing iPhone 15 Pro", sold: 85, revenue: 12_750_000, profit: 8_925_000, category: "Aksesori" },
  { name: "Charger 65W USB-C", sold: 67, revenue: 11_725_000, profit: 6_030_000, category: "Aksesori" },
];
export const TECHNICIAN_PERFORMANCE = [
  { name: "Andi", completed: 28, avgDays: 2.1, rating: 4.8, revenue: 12_500_000 },
  { name: "Budi", completed: 22, avgDays: 2.8, rating: 4.5, revenue: 9_800_000 },
  { name: "Doni", completed: 15, avgDays: 3.2, rating: 4.2, revenue: 6_200_000 },
];
