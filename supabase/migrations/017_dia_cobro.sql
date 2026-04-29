-- 017_dia_cobro.sql — Dia de cobro configurable por tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dia_cobro INTEGER DEFAULT 5
  CHECK (dia_cobro BETWEEN 1 AND 28);
