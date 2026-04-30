-- ============================================
-- LUMINA ERP / JT CELL - DATABASE SCHEMA
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)
-- ============================================

-- ============================================
-- 1. BRANCHES (Cabang)
-- ============================================
CREATE TABLE branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO branches (name, city, address, phone) VALUES
  ('JT CELL Ruteng - Pusat', 'Ruteng', 'Jl. Raya Ruteng No. 123', '0812-3456-7890'),
  ('JT CELL Larantuka', 'Larantuka', 'Jl. Larantuka Utama No. 45', '0812-9876-5432'),
  ('JT CELL Riung', 'Riung', 'Jl. Riung Indah No. 88', '0813-1111-2222');

-- ============================================
-- 2. PROFILES (Users + Role)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner','manager','kasir','teknisi')) NOT NULL DEFAULT 'kasir',
  branch_id UUID REFERENCES branches(id),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('HP','Aksesori','Sparepart')) NOT NULL
);

INSERT INTO categories (name, type) VALUES
  ('HP', 'HP'), ('Aksesori', 'Aksesori'), ('Sparepart', 'Sparepart');

-- ============================================
-- 4. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  purchase_price BIGINT NOT NULL DEFAULT 0,
  retail_price BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4.1 PRICE HISTORY (Historis Harga)
-- ============================================
CREATE TABLE price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  old_buy_price BIGINT,
  new_buy_price BIGINT,
  old_sell_price BIGINT,
  new_sell_price BIGINT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. STOCK per BRANCH
-- ============================================
CREATE TABLE stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  min_stock INT DEFAULT 5,
  UNIQUE(product_id, branch_id)
);

-- ============================================
-- 6. IMEI TRACKING
-- ============================================
CREATE TABLE imei_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imei TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  branch_id UUID REFERENCES branches(id),
  status TEXT CHECK (status IN ('stock','sold','service','transfer')) DEFAULT 'stock',
  customer_name TEXT,
  last_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. STOCK TRANSFERS
-- ============================================
CREATE TABLE stock_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  quantity INT NOT NULL,
  status TEXT CHECK (status IN ('in_transit','completed','cancelled')) DEFAULT 'in_transit',
  transferred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 8. TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('retail','digital','service')) NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  branch_id UUID REFERENCES branches(id),
  cashier_id UUID REFERENCES profiles(id),
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount BIGINT DEFAULT 0,
  tax_amount BIGINT DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash','transfer','qris','card')) DEFAULT 'cash',
  status TEXT CHECK (status IN ('completed','refunded','pending')) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. TRANSACTION ITEMS
-- ============================================
CREATE TABLE transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  subtotal BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. SERVICE TICKETS
-- ============================================
CREATE TABLE service_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  device_name TEXT NOT NULL,
  device_imei TEXT,
  issue_description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending','process','done','picked_up','cancelled')) DEFAULT 'pending',
  technician_id UUID REFERENCES profiles(id),
  branch_id UUID REFERENCES branches(id),
  estimated_cost BIGINT DEFAULT 0,
  final_cost BIGINT DEFAULT 0,
  dp_amount BIGINT DEFAULT 0,
  estimated_done DATE,
  completed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 11. SUPPLIERS
-- ============================================
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  balance BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 12. PURCHASE ORDERS
-- ============================================
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  branch_id UUID REFERENCES branches(id),
  total_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('draft','sent','partial','received','cancelled')) DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  received_at TIMESTAMPTZ
);

CREATE TABLE purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price BIGINT NOT NULL,
  received_qty INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 13. EXPENSES
-- ============================================
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  amount BIGINT NOT NULL,
  branch_id UUID REFERENCES branches(id),
  note TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 14. PAYABLES
-- ============================================
CREATE TABLE payables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  po_id UUID REFERENCES purchase_orders(id),
  amount BIGINT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('unpaid','paid','partial')) DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 15. KASBON
-- ============================================
CREATE TABLE kasbon (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES profiles(id),
  amount BIGINT NOT NULL,
  remaining BIGINT NOT NULL,
  installment_amount BIGINT DEFAULT 0,
  reason TEXT,
  status TEXT CHECK (status IN ('pending_approval','active','paid','rejected')) DEFAULT 'pending_approval',
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 16. CICILAN
-- ============================================
CREATE TABLE cicilan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  transaction_id UUID REFERENCES transactions(id),
  product_name TEXT NOT NULL,
  total_price BIGINT NOT NULL,
  dp_amount BIGINT DEFAULT 0,
  remaining BIGINT NOT NULL,
  installment_amount BIGINT NOT NULL,
  tenor INT NOT NULL,
  paid_months INT DEFAULT 0,
  status TEXT CHECK (status IN ('active','completed','overdue','cancelled')) DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 17. DISCOUNT CONFIG
-- ============================================
CREATE TABLE discount_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT CHECK (role IN ('kasir','teknisi','manager','owner')) UNIQUE NOT NULL,
  max_percent NUMERIC(5,2) NOT NULL DEFAULT 0.5
);

INSERT INTO discount_config (role, max_percent) VALUES
  ('kasir', 0.5), ('teknisi', 0.5), ('manager', 1.0), ('owner', 1.5);

-- ============================================
-- 18. APP SETTINGS
-- ============================================
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('store_name', 'JT Cell Group'),
  ('store_phone', '021-1234567'),
  ('currency', 'IDR'),
  ('tax_rate', '11'),
  ('receipt_footer', 'Terima kasih telah berbelanja di JT Cell!'),
  ('warranty_default_days', '30'),
  ('low_stock_threshold', '5');

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE imei_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;
ALTER TABLE cicilan ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated users can read all)
CREATE POLICY "read_all" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON imei_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON stock_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON service_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON payables FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON kasbon FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON cicilan FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON discount_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON app_settings FOR SELECT TO authenticated USING (true);

-- Write policies (owner & manager can write)
CREATE POLICY "write_admin" ON branches FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));
CREATE POLICY "write_admin" ON products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));
CREATE POLICY "write_admin" ON stock FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));
CREATE POLICY "write_admin" ON suppliers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));
CREATE POLICY "write_admin" ON purchase_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));
CREATE POLICY "write_admin" ON discount_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','kasir')));
CREATE POLICY "write_admin" ON app_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));

-- Everyone authenticated can insert transactions, service tickets, expenses
CREATE POLICY "insert_all" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_all" ON transaction_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_all" ON service_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_all" ON service_tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_all" ON stock_transfers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_transfers" ON stock_transfers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON imei_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_imei" ON imei_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON kasbon FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_kasbon" ON kasbon FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON cicilan FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_cicilan" ON cicilan FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON payables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_payables" ON payables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "insert_all" ON purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "insert_price_history" ON price_history FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager')));

-- Profile: users can update their own profile
CREATE POLICY "update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "insert_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
