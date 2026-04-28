-- ============================================
-- RPC: Reset Semua Data Transaksi (Khusus Owner)
-- Jalankan ini di Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION reset_all_transactions()
RETURNS void AS $$
BEGIN
  -- Verifikasi role owner
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'Hanya owner yang dapat menghapus data transaksi';
  END IF;

  -- Hapus semua data transaksional
  DELETE FROM transaction_items;
  DELETE FROM transactions;
  DELETE FROM service_tickets;
  DELETE FROM stock_transfers;
  DELETE FROM expenses;
  DELETE FROM payables;
  DELETE FROM kasbon;
  DELETE FROM cicilan;
  DELETE FROM purchase_order_items;
  DELETE FROM purchase_orders;
  
  -- Kembalikan status IMEI ke stock
  UPDATE imei_records SET status = 'stock', customer_name = NULL, last_action = 'Reset Data Transaksi';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
