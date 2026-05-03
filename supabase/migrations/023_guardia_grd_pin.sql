-- Migration 023: Guard GRD + PIN authentication
-- Adds codigo_guardia (unique code like GRD-001) and pin_acceso (SHA-256 hashed PIN)

ALTER TABLE guardias
  ADD COLUMN IF NOT EXISTS codigo_guardia TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pin_acceso TEXT;

-- Auto-generate codes for existing guardias
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM guardias
  WHERE codigo_guardia IS NULL
)
UPDATE guardias
SET codigo_guardia = 'GRD-' || LPAD(numbered.rn::TEXT, 3, '0')
FROM numbered
WHERE guardias.id = numbered.id;

-- Function to generate next GRD code (callable via supabase.rpc)
CREATE OR REPLACE FUNCTION generate_grd_code()
RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_guardia FROM 5) AS INT)), 0) + 1
  INTO next_num FROM guardias WHERE codigo_guardia LIKE 'GRD-%';
  RETURN 'GRD-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: allow anon to read guardias for PIN login verification
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guardias_pin_login' AND tablename = 'guardias') THEN
    CREATE POLICY "guardias_pin_login" ON guardias FOR SELECT USING (true);
  END IF;
END $$;
