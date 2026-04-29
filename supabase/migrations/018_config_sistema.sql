-- 018_config_sistema.sql
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pagos_suscripcion ADD COLUMN IF NOT EXISTS rechazado_motivo TEXT;

ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_super_admin ON configuracion_sistema
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'super_admin'));

CREATE POLICY config_select_all ON configuracion_sistema
  FOR SELECT USING (true);
