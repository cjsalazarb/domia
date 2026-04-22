-- 014: Permitir guardias en residentes_auth para flujo de cambio de contraseña
ALTER TABLE residentes_auth ALTER COLUMN residente_id DROP NOT NULL;
ALTER TABLE residentes_auth ADD COLUMN IF NOT EXISTS guardia_id UUID REFERENCES guardias(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_residentes_auth_guardia ON residentes_auth(guardia_id);
