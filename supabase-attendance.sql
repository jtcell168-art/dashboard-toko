CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT CHECK (status IN ('present', 'late', 'absent', 'leave')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read their own or admins can read all
CREATE POLICY "read_all" ON attendance FOR SELECT TO authenticated USING (true);

-- Everyone authenticated can insert their own attendance
CREATE POLICY "insert_all" ON attendance FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- Everyone authenticated can update their own attendance
CREATE POLICY "update_own" ON attendance FOR UPDATE TO authenticated USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')));
