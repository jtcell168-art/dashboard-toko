-- ============================================
-- 15. SALARIES (Gaji & Bonus)
-- ============================================
CREATE TABLE salaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period_month INT NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INT NOT NULL,
  base_salary BIGINT NOT NULL DEFAULT 0,
  bonus BIGINT DEFAULT 0,
  deductions BIGINT DEFAULT 0,
  total_paid BIGINT GENERATED ALWAYS AS (base_salary + bonus - deductions) STORED,
  paid_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, period_month, period_year)
);

-- RLS for Salaries
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- Owner & Manager can do everything
CREATE POLICY "Owner and Manager can manage salaries" 
  ON salaries 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- Staff can see their own salary (optional, but good for transparency)
CREATE POLICY "Users can see their own salaries" 
  ON salaries 
  FOR SELECT 
  USING (profile_id = auth.uid());
