-- ============================================================
-- 016_billing.sql — Pagos de suscripcion SaaS
-- ============================================================

-- Tabla de pagos de suscripcion
CREATE TABLE pagos_suscripcion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  monto           DECIMAL(10,2) NOT NULL,
  periodo         TEXT NOT NULL,
  metodo          TEXT DEFAULT 'qr'
    CHECK (metodo IN ('qr', 'transferencia', 'efectivo')),
  referencia      TEXT,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'verificado', 'rechazado')),
  qr_generado_en  TIMESTAMPTZ DEFAULT NOW(),
  pagado_en       TIMESTAMPTZ,
  verificado_por  UUID REFERENCES profiles(id),
  comprobante_url TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_suscripcion_tenant ON pagos_suscripcion(tenant_id);
CREATE INDEX idx_pagos_suscripcion_estado ON pagos_suscripcion(estado);
CREATE INDEX idx_pagos_suscripcion_periodo ON pagos_suscripcion(tenant_id, periodo);

-- Funcion helper: calcular plan segun cantidad de unidades
CREATE OR REPLACE FUNCTION calcular_plan_suscripcion(p_total_unidades INT)
RETURNS TABLE(plan TEXT, monto_mensual DECIMAL) AS $$
BEGIN
  IF p_total_unidades <= 20 THEN
    RETURN QUERY SELECT 'basico'::TEXT, 150.00::DECIMAL;
  ELSIF p_total_unidades <= 50 THEN
    RETURN QUERY SELECT 'mediano'::TEXT, 250.00::DECIMAL;
  ELSIF p_total_unidades <= 100 THEN
    RETURN QUERY SELECT 'grande'::TEXT, 400.00::DECIMAL;
  ELSE
    RETURN QUERY SELECT 'corporativo'::TEXT, 600.00::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS
ALTER TABLE pagos_suscripcion ENABLE ROW LEVEL SECURITY;

-- Helper: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_mi_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Super admin: acceso total
CREATE POLICY "super_admin_pagos_full" ON pagos_suscripcion
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'super_admin')
  );

-- Tenant admin: puede ver sus propios pagos
CREATE POLICY "tenant_admin_pagos_select" ON pagos_suscripcion
  FOR SELECT
  USING (tenant_id = get_mi_tenant_id());

-- Tenant admin: puede crear pagos para su tenant
CREATE POLICY "tenant_admin_pagos_insert" ON pagos_suscripcion
  FOR INSERT
  WITH CHECK (tenant_id = get_mi_tenant_id());
