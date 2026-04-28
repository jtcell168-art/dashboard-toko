-- ============================================
-- RESET: Drop semua tabel yang ada
-- Jalankan ini DULU sebelum schema utama
-- ============================================

DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS service_tickets CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;
DROP TABLE IF EXISTS imei_records CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payables CASCADE;
DROP TABLE IF EXISTS kasbon CASCADE;
DROP TABLE IF EXISTS cicilan CASCADE;
DROP TABLE IF EXISTS discount_config CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- Drop trigger jika ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
