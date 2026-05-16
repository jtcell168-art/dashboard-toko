-- ============================================
-- SERVICE TICKET & SPAREPART MIGRATION
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom baru di service_tickets (jika belum ada)
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

-- 2. Tabel service_ticket_parts (relasi part yg dipakai per tiket)
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

-- 3. Index untuk performa query dashboard
CREATE INDEX IF NOT EXISTS idx_stp_ticket_id ON service_ticket_parts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_st_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_st_branch ON service_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_st_created ON service_tickets(created_at);

-- 4. RLS policies untuk service_ticket_parts
ALTER TABLE service_ticket_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service_ticket_parts"
  ON service_ticket_parts FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert service_ticket_parts"
  ON service_ticket_parts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update service_ticket_parts"
  ON service_ticket_parts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete service_ticket_parts"
  ON service_ticket_parts FOR DELETE
  USING (auth.role() = 'authenticated');

-- 5. DONE! Verifikasi
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'service_tickets' ORDER BY ordinal_position;
