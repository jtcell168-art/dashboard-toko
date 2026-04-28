-- ============================================
-- SET ROLES & BRANCHES untuk semua user
-- Jalankan SETELAH semua user dibuat di Authentication
-- ============================================

-- Update Owner
UPDATE profiles SET 
  full_name = 'Owner JT Cell',
  role = 'owner',
  branch_id = NULL
WHERE email = 'owner@jtcell.id';

-- Update Manager
UPDATE profiles SET 
  full_name = 'Manager JT Cell',
  role = 'manager',
  branch_id = NULL
WHERE email = 'manager@jtcell.id';

-- Update Admin Ruteng (kasir role, branch: JT CELL Ruteng)
UPDATE profiles SET 
  full_name = 'Admin JT Cell Ruteng',
  role = 'kasir',
  branch_id = (SELECT id FROM branches WHERE name LIKE '%Ruteng%' LIMIT 1)
WHERE email = 'admin.ruteng@jtcell.id';

-- Update Admin Larantuka (kasir role, branch: JT Cell Larantuka)
UPDATE profiles SET 
  full_name = 'Admin JT Cell Larantuka',
  role = 'kasir',
  branch_id = (SELECT id FROM branches WHERE name LIKE '%Larantuka%' LIMIT 1)
WHERE email = 'admin.larantuka@jtcell.id';

-- Update Admin Riung (kasir role, branch: JT CELL Riung)
UPDATE profiles SET 
  full_name = 'Admin JT Cell Riung',
  role = 'kasir',
  branch_id = (SELECT id FROM branches WHERE name LIKE '%Riung%' LIMIT 1)
WHERE email = 'admin.riung@jtcell.id';

-- Update Teknisi
UPDATE profiles SET 
  full_name = 'Teknisi JT Cell',
  role = 'teknisi',
  branch_id = (SELECT id FROM branches WHERE name LIKE '%Ruteng%' LIMIT 1)
WHERE email = 'teknisi@jtcell.id';

-- Verifikasi
SELECT p.full_name, p.email, p.role, b.name as branch 
FROM profiles p 
LEFT JOIN branches b ON p.branch_id = b.id 
ORDER BY p.role;
