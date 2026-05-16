-- ============================================
-- DATABASE MIGRATION: DELETION LOGS + SERVICE PARTS
-- Berlaku untuk SEMUA transaksi (Retail, Digital, Service)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel deletion_logs (historis penghapusan SEMUA transaksi)
CREATE TABLE IF NOT EXISTS deletion_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  deleted_data JSONB,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_by_name TEXT,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS untuk deletion_logs
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Owner and manager can read deletion_logs" ON deletion_logs;
  DROP POLICY IF EXISTS "Authenticated can insert deletion_logs" ON deletion_logs;
END $$;

CREATE POLICY "Owner and manager can read deletion_logs"
  ON deletion_logs FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert deletion_logs"
  ON deletion_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Index
CREATE INDEX IF NOT EXISTS idx_dl_table ON deletion_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_dl_created ON deletion_logs(created_at);

-- ============================================
-- 2. Kolom tambahan di service_tickets (jika belum ada)
-- ============================================
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS imei_serial TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT 0;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS parts_cost NUMERIC DEFAULT 0;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS estimated_days INTEGER DEFAULT 1;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS dp_amount NUMERIC DEFAULT 0;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS warranty_days INTEGER DEFAULT 30;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS technician_notes TEXT DEFAULT '';
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS service_fee NUMERIC DEFAULT 0;

-- ============================================
-- 3. Tabel service_ticket_parts
-- ============================================
CREATE TABLE IF NOT EXISTS service_ticket_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES service_tickets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_ticket_parts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read service_ticket_parts" ON service_ticket_parts;
  DROP POLICY IF EXISTS "Authenticated can insert service_ticket_parts" ON service_ticket_parts;
  DROP POLICY IF EXISTS "Authenticated can update service_ticket_parts" ON service_ticket_parts;
  DROP POLICY IF EXISTS "Authenticated can delete service_ticket_parts" ON service_ticket_parts;
END $$;

CREATE POLICY "Anyone can read service_ticket_parts"
  ON service_ticket_parts FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert service_ticket_parts"
  ON service_ticket_parts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update service_ticket_parts"
  ON service_ticket_parts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete service_ticket_parts"
  ON service_ticket_parts FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 4. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stp_ticket_id ON service_ticket_parts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_st_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_st_branch ON service_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_st_created ON service_tickets(created_at);

-- ============================================
-- 5. VERIFIKASI
-- ============================================
SELECT 'deletion_logs' as tabel, count(*) as jumlah FROM deletion_logs
UNION ALL
SELECT 'service_ticket_parts', count(*) FROM service_ticket_parts;
