-- CRM: persist calculator state so edit pre-loads correctly
ALTER TABLE propuestas_crm
  ADD COLUMN IF NOT EXISTS administradora_enabled  BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS administradora_sueldo   DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beneficios_json         JSONB         NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS utilidad_pct            DECIMAL(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS utilidad_adicional      DECIMAL(10,2) NOT NULL DEFAULT 0;
