-- ============================================
-- SQL RPC: ATOMIC STOCK UPDATE (CEGAH STOK MINUS & RACE CONDITION)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Fungsi untuk Mengurangi Stok (Decrement)
-- Mengembalikan TRUE jika berhasil, FALSE jika stok tidak cukup

DROP FUNCTION IF EXISTS decrement_stock(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_branch_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_quantity INTEGER;
BEGIN
  -- Kunci baris untuk mencegah race condition (SELECT ... FOR UPDATE)
  SELECT quantity INTO v_current_quantity
  FROM stock
  WHERE product_id = p_product_id AND branch_id = p_branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Jika belum ada stok sama sekali, anggap gagal (karena tidak bisa dikurangi)
    RETURN FALSE;
  END IF;

  IF v_current_quantity >= p_quantity THEN
    -- Lakukan update
    UPDATE stock
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id AND branch_id = p_branch_id;
    RETURN TRUE;
  ELSE
    -- Stok tidak cukup
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk Menambah/Mengembalikan Stok (Increment)
-- Berguna saat retur, hapus transaksi, atau pembatalan servis

DROP FUNCTION IF EXISTS increment_stock(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION increment_stock(
  p_product_id UUID,
  p_branch_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Upsert: jika belum ada baris stok, buat baru. Jika ada, tambahkan.
  INSERT INTO stock (product_id, branch_id, quantity, updated_at)
  VALUES (p_product_id, p_branch_id, p_quantity, NOW())
  ON CONFLICT (product_id, branch_id)
  DO UPDATE SET 
    quantity = stock.quantity + EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;
