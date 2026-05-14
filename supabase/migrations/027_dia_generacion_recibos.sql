-- Configurable receipt-generation day per condominio (1–28)
-- DEFAULT 1 preserves existing behaviour for all condominios already in the system.

ALTER TABLE condominios
  ADD COLUMN IF NOT EXISTS dia_generacion_recibos INTEGER DEFAULT 1
  CHECK (dia_generacion_recibos >= 1 AND dia_generacion_recibos <= 28);
