-- Add costo_m2 (cost per square meter) to condominios
-- When set, monthly receipts are computed as area_m2 * costo_m2 instead of fixed cuotas

ALTER TABLE condominios ADD COLUMN IF NOT EXISTS costo_m2 DECIMAL(10,2) DEFAULT NULL;
