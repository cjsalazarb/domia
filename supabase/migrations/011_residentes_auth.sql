-- 011: Tabla residentes_auth — control de primer acceso y cambio de contraseña
-- Vincula cada residente con su usuario de auth para gestionar el onboarding

CREATE TABLE IF NOT EXISTS residentes_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residente_id uuid NOT NULL REFERENCES residentes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debe_cambiar_password boolean NOT NULL DEFAULT true,
  password_enviada_at timestamptz DEFAULT now(),
  ultimo_acceso timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(residente_id),
  UNIQUE(user_id)
);

CREATE INDEX idx_residentes_auth_user ON residentes_auth(user_id);
CREATE INDEX idx_residentes_auth_residente ON residentes_auth(residente_id);

-- RLS
ALTER TABLE residentes_auth ENABLE ROW LEVEL SECURITY;

-- El propio residente puede ver su registro
CREATE POLICY "residente_ve_su_auth"
  ON residentes_auth FOR SELECT
  USING (user_id = auth.uid());

-- El propio residente puede actualizar debe_cambiar_password
CREATE POLICY "residente_actualiza_su_password"
  ON residentes_auth FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- super_admin y admin_condominio pueden ver todos
CREATE POLICY "admin_ve_residentes_auth"
  ON residentes_auth FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol IN ('super_admin', 'admin_condominio')
    )
  );

-- Inserción solo via service_role (edge function), no necesita policy de INSERT para usuarios normales
