-- ============================================
-- SQL: TABEL PIUTANG PELANGGAN (CUSTOMER DEBTS)
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS customer_debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  branch_id UUID REFERENCES branches(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE customer_debts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read customer_debts" ON customer_debts;
  DROP POLICY IF EXISTS "Authenticated can insert customer_debts" ON customer_debts;
  DROP POLICY IF EXISTS "Authenticated can update customer_debts" ON customer_debts;
END $$;

CREATE POLICY "Anyone can read customer_debts"
  ON customer_debts FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert customer_debts"
  ON customer_debts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update customer_debts"
  ON customer_debts FOR UPDATE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cd_status ON customer_debts(status);
CREATE INDEX IF NOT EXISTS idx_cd_branch ON customer_debts(branch_id);
