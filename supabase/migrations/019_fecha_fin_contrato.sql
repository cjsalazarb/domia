-- 019_fecha_fin_contrato.sql — Fecha fin de contrato para tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fecha_fin_contrato TIMESTAMPTZ;
