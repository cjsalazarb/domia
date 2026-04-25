-- ═══════════════════════════════════════════════════════════
-- MIGRATION 015: Multi-tenant SaaS Architecture
-- ═══════════════════════════════════════════════════════════

-- Step 1: Add tenant_admin role
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'tenant_admin';

-- Step 2: Create tenants table
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  telefono        TEXT,
  plan            TEXT NOT NULL DEFAULT 'basico'
    CHECK (plan IN ('basico', 'mediano', 'grande', 'corporativo')),
  estado          TEXT NOT NULL DEFAULT 'trial'
    CHECK (estado IN ('trial', 'activo', 'suspendido', 'cancelado')),
  trial_hasta     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  proximo_cobro   DATE,
  total_unidades  INT NOT NULL DEFAULT 0,
  monto_mensual   DECIMAL(10,2) NOT NULL DEFAULT 150.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 3: Add tenant_id to condominios and profiles
ALTER TABLE condominios ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_condominios_tenant ON condominios(tenant_id);
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);

-- Step 4: Create ALTRION tenant and backfill existing data
INSERT INTO tenants (id, nombre, email, estado, trial_hasta, monto_mensual)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALTRION', 'mcarmensalcedo@altrion.bo', 'activo', NULL, 0);

UPDATE condominios SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL;
UPDATE profiles SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE tenant_id IS NULL AND rol != 'super_admin';

-- Step 5: New helper functions
CREATE OR REPLACE FUNCTION get_mi_tenant() RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION es_tenant_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'tenant_admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION es_mi_condominio_tenant(p_condominio_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM condominios
    WHERE id = p_condominio_id
      AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- Step 6: RLS for tenants table
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "tenants_select" ON tenants FOR SELECT USING (
  es_super_admin() OR id = get_mi_tenant()
);
CREATE POLICY "tenants_insert" ON tenants FOR INSERT WITH CHECK (
  es_super_admin()
);
CREATE POLICY "tenants_update" ON tenants FOR UPDATE USING (
  es_super_admin() OR id = get_mi_tenant()
);

-- ═══════════════════════════════════════════════════════════
-- Step 7: Update ALL RLS policies to add tenant_admin access
-- Pattern: add OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
-- ═══════════════════════════════════════════════════════════

-- ─── profiles ───
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  es_super_admin() OR id = auth.uid() OR (es_tenant_admin() AND tenant_id = get_mi_tenant())
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  es_super_admin() OR id = auth.uid() OR (es_tenant_admin() AND tenant_id = get_mi_tenant())
);

-- ─── condominios ───
DROP POLICY IF EXISTS "condominios_select_activos" ON condominios;
DROP POLICY IF EXISTS "condominios_select_archivados" ON condominios;
DROP POLICY IF EXISTS "condominios_insert" ON condominios;
DROP POLICY IF EXISTS "condominios_update" ON condominios;

CREATE POLICY "condominios_select_activos" ON condominios FOR SELECT USING (
  estado IN ('activo', 'en_configuracion', 'inactivo')
  AND (
    es_super_admin()
    OR id = get_mi_condominio()
    OR (es_tenant_admin() AND tenant_id = get_mi_tenant())
    OR id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
  )
);
CREATE POLICY "condominios_select_archivados" ON condominios FOR SELECT USING (
  estado = 'archivado'
  AND (es_super_admin() OR (es_tenant_admin() AND tenant_id = get_mi_tenant()))
);
CREATE POLICY "condominios_insert" ON condominios FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin()
);
CREATE POLICY "condominios_update" ON condominios FOR UPDATE USING (
  es_super_admin() OR (es_tenant_admin() AND tenant_id = get_mi_tenant())
);

-- ─── edificios ───
DROP POLICY IF EXISTS "edificios_select" ON edificios;
DROP POLICY IF EXISTS "edificios_all" ON edificios;
CREATE POLICY "edificios_select" ON edificios FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "edificios_all" ON edificios FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── unidades ───
DROP POLICY IF EXISTS "unidades_select" ON unidades;
DROP POLICY IF EXISTS "unidades_all" ON unidades;
CREATE POLICY "unidades_select" ON unidades FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "unidades_all" ON unidades FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── residentes ───
DROP POLICY IF EXISTS "residentes_select" ON residentes;
DROP POLICY IF EXISTS "residentes_all" ON residentes;
CREATE POLICY "residentes_select" ON residentes FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR user_id = auth.uid()
);
CREATE POLICY "residentes_all" ON residentes FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── cuotas ───
DROP POLICY IF EXISTS "cuotas_select" ON cuotas;
DROP POLICY IF EXISTS "cuotas_all" ON cuotas;
CREATE POLICY "cuotas_select" ON cuotas FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "cuotas_all" ON cuotas FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── recibos ───
DROP POLICY IF EXISTS "recibos_select" ON recibos;
DROP POLICY IF EXISTS "recibos_insert" ON recibos;
DROP POLICY IF EXISTS "recibos_update" ON recibos;
CREATE POLICY "recibos_select" ON recibos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "recibos_insert" ON recibos FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "recibos_update" ON recibos FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── pagos ───
DROP POLICY IF EXISTS "pagos_select" ON pagos;
DROP POLICY IF EXISTS "pagos_insert" ON pagos;
DROP POLICY IF EXISTS "pagos_update" ON pagos;
CREATE POLICY "pagos_select" ON pagos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "pagos_insert" ON pagos FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR get_mi_rol() IN ('propietario','inquilino')
);
CREATE POLICY "pagos_update" ON pagos FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── gastos ───
DROP POLICY IF EXISTS "gastos_select" ON gastos;
DROP POLICY IF EXISTS "gastos_all" ON gastos;
CREATE POLICY "gastos_select" ON gastos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "gastos_all" ON gastos FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── mantenimientos ───
DROP POLICY IF EXISTS "mantenimientos_select" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_insert" ON mantenimientos;
DROP POLICY IF EXISTS "mantenimientos_update" ON mantenimientos;
CREATE POLICY "mantenimientos_select" ON mantenimientos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR unidad_id IN (SELECT unidad_id FROM residentes WHERE user_id = auth.uid())
);
CREATE POLICY "mantenimientos_insert" ON mantenimientos FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR get_mi_rol() IN ('propietario','inquilino')
);
CREATE POLICY "mantenimientos_update" ON mantenimientos FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── areas_comunes ───
DROP POLICY IF EXISTS "areas_comunes_select" ON areas_comunes;
DROP POLICY IF EXISTS "areas_comunes_all" ON areas_comunes;
CREATE POLICY "areas_comunes_select" ON areas_comunes FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "areas_comunes_all" ON areas_comunes FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── reservas ───
DROP POLICY IF EXISTS "reservas_select" ON reservas;
DROP POLICY IF EXISTS "reservas_insert" ON reservas;
DROP POLICY IF EXISTS "reservas_update" ON reservas;
CREATE POLICY "reservas_select" ON reservas FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "reservas_insert" ON reservas FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR get_mi_rol() IN ('propietario','inquilino')
);
CREATE POLICY "reservas_update" ON reservas FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);

-- ─── proveedores ───
DROP POLICY IF EXISTS "proveedores_select" ON proveedores;
DROP POLICY IF EXISTS "proveedores_all" ON proveedores;
CREATE POLICY "proveedores_select" ON proveedores FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "proveedores_all" ON proveedores FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── documentos_condominio ───
DROP POLICY IF EXISTS "documentos_condominio_select" ON documentos_condominio;
DROP POLICY IF EXISTS "documentos_condominio_all" ON documentos_condominio;
CREATE POLICY "documentos_condominio_select" ON documentos_condominio FOR SELECT USING (
  es_super_admin() OR condominio_id = get_mi_condominio()
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "documentos_condominio_all" ON documentos_condominio FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── notificaciones ───
DROP POLICY IF EXISTS "notificaciones_select" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_insert" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_update" ON notificaciones;
CREATE POLICY "notificaciones_select" ON notificaciones FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR destinatario_id = auth.uid()
  OR (destinatario_id IS NULL AND condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1))
);
CREATE POLICY "notificaciones_insert" ON notificaciones FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "notificaciones_update" ON notificaciones FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── guardias ───
DROP POLICY IF EXISTS "guardias_select" ON guardias;
DROP POLICY IF EXISTS "guardias_all" ON guardias;
CREATE POLICY "guardias_select" ON guardias FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR (get_mi_rol() = 'guardia' AND user_id = auth.uid())
);
CREATE POLICY "guardias_all" ON guardias FOR ALL USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── turnos ───
DROP POLICY IF EXISTS "turnos_select" ON turnos;
DROP POLICY IF EXISTS "turnos_update" ON turnos;
DROP POLICY IF EXISTS "turnos_insert" ON turnos;
DROP POLICY IF EXISTS "turnos_delete" ON turnos;
CREATE POLICY "turnos_select" ON turnos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "turnos_update" ON turnos FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "turnos_insert" ON turnos FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "turnos_delete" ON turnos FOR DELETE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── incidentes ───
DROP POLICY IF EXISTS "incidentes_select" ON incidentes;
DROP POLICY IF EXISTS "incidentes_insert" ON incidentes;
CREATE POLICY "incidentes_select" ON incidentes FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "incidentes_insert" ON incidentes FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── libro_novedades ───
DROP POLICY IF EXISTS "libro_novedades_select" ON libro_novedades;
DROP POLICY IF EXISTS "libro_novedades_insert" ON libro_novedades;
DROP POLICY IF EXISTS "novedades_select" ON libro_novedades;
DROP POLICY IF EXISTS "novedades_insert" ON libro_novedades;
CREATE POLICY "libro_novedades_select" ON libro_novedades FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "libro_novedades_insert" ON libro_novedades FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── plan_cuentas ───
DROP POLICY IF EXISTS "plan_cuentas_select" ON plan_cuentas;
DROP POLICY IF EXISTS "plan_cuentas_insert" ON plan_cuentas;
DROP POLICY IF EXISTS "plan_cuentas_update" ON plan_cuentas;
CREATE POLICY "plan_cuentas_select" ON plan_cuentas FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "plan_cuentas_insert" ON plan_cuentas FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "plan_cuentas_update" ON plan_cuentas FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── asientos_contables ───
DROP POLICY IF EXISTS "asientos_select" ON asientos_contables;
DROP POLICY IF EXISTS "asientos_insert" ON asientos_contables;
DROP POLICY IF EXISTS "asientos_update" ON asientos_contables;
CREATE POLICY "asientos_select" ON asientos_contables FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "asientos_insert" ON asientos_contables FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "asientos_update" ON asientos_contables FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── asiento_detalles (inherits via parent asiento) ───
DROP POLICY IF EXISTS "asiento_detalles_select" ON asiento_detalles;
DROP POLICY IF EXISTS "asiento_detalles_insert" ON asiento_detalles;
DROP POLICY IF EXISTS "asiento_detalles_update" ON asiento_detalles;
CREATE POLICY "asiento_detalles_select" ON asiento_detalles FOR SELECT USING (
  EXISTS (SELECT 1 FROM asientos_contables a WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio())
    OR (es_tenant_admin() AND es_mi_condominio_tenant(a.condominio_id))))
);
CREATE POLICY "asiento_detalles_insert" ON asiento_detalles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM asientos_contables a WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio())
    OR (es_tenant_admin() AND es_mi_condominio_tenant(a.condominio_id))))
);
CREATE POLICY "asiento_detalles_update" ON asiento_detalles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM asientos_contables a WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio())
    OR (es_tenant_admin() AND es_mi_condominio_tenant(a.condominio_id))))
);

-- ─── arqueos_caja ───
DROP POLICY IF EXISTS "arqueos_select" ON arqueos_caja;
DROP POLICY IF EXISTS "arqueos_insert" ON arqueos_caja;
DROP POLICY IF EXISTS "arqueos_update" ON arqueos_caja;
CREATE POLICY "arqueos_select" ON arqueos_caja FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "arqueos_insert" ON arqueos_caja FOR INSERT WITH CHECK (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);
CREATE POLICY "arqueos_update" ON arqueos_caja FOR UPDATE USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
);

-- ─── arqueo_denominaciones (inherits via parent arqueo) ───
DROP POLICY IF EXISTS "arqueo_denom_select" ON arqueo_denominaciones;
DROP POLICY IF EXISTS "arqueo_denom_insert" ON arqueo_denominaciones;
CREATE POLICY "arqueo_denom_select" ON arqueo_denominaciones FOR SELECT USING (
  EXISTS (SELECT 1 FROM arqueos_caja a WHERE a.id = arqueo_denominaciones.arqueo_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio())
    OR (es_tenant_admin() AND es_mi_condominio_tenant(a.condominio_id))))
);
CREATE POLICY "arqueo_denom_insert" ON arqueo_denominaciones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM arqueos_caja a WHERE a.id = arqueo_denominaciones.arqueo_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio())
    OR (es_tenant_admin() AND es_mi_condominio_tenant(a.condominio_id))))
);

-- ─── marcaciones_guardia ───
DROP POLICY IF EXISTS "marcaciones_select" ON marcaciones_guardia;
DROP POLICY IF EXISTS "marcaciones_insert" ON marcaciones_guardia;
CREATE POLICY "marcaciones_select" ON marcaciones_guardia FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "marcaciones_insert" ON marcaciones_guardia FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── visitantes ───
DROP POLICY IF EXISTS "visitantes_select" ON visitantes;
DROP POLICY IF EXISTS "visitantes_insert" ON visitantes;
DROP POLICY IF EXISTS "visitantes_update" ON visitantes;
CREATE POLICY "visitantes_select" ON visitantes FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "visitantes_insert" ON visitantes FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);
CREATE POLICY "visitantes_update" ON visitantes FOR UPDATE USING (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── alertas_residentes ───
DROP POLICY IF EXISTS "alertas_select" ON alertas_residentes;
DROP POLICY IF EXISTS "alertas_insert" ON alertas_residentes;
DROP POLICY IF EXISTS "alertas_update" ON alertas_residentes;
CREATE POLICY "alertas_select" ON alertas_residentes FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR get_mi_rol() = 'guardia'
  OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "alertas_insert" ON alertas_residentes FOR INSERT WITH CHECK (
  es_super_admin() OR get_mi_rol() IN ('propietario', 'inquilino')
);
CREATE POLICY "alertas_update" ON alertas_residentes FOR UPDATE USING (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── acceso_vehiculos ───
DROP POLICY IF EXISTS "vehiculos_select" ON acceso_vehiculos;
DROP POLICY IF EXISTS "vehiculos_insert" ON acceso_vehiculos;
DROP POLICY IF EXISTS "vehiculos_update" ON acceso_vehiculos;
CREATE POLICY "vehiculos_select" ON acceso_vehiculos FOR SELECT USING (
  es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR (es_tenant_admin() AND es_mi_condominio_tenant(condominio_id))
  OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "vehiculos_insert" ON acceso_vehiculos FOR INSERT WITH CHECK (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);
CREATE POLICY "vehiculos_update" ON acceso_vehiculos FOR UPDATE USING (
  es_super_admin() OR es_tenant_admin() OR get_mi_rol() = 'guardia'
);

-- ─── residentes_auth ───
DROP POLICY IF EXISTS "admin_ve_residentes_auth" ON residentes_auth;
CREATE POLICY "admin_ve_residentes_auth" ON residentes_auth FOR SELECT USING (
  es_super_admin() OR es_tenant_admin()
  OR (get_mi_rol() = 'admin_condominio')
  OR user_id = auth.uid()
);

-- ─── audit_logs (keep super_admin only for SELECT, no changes needed for INSERT) ───
-- audit_logs stays as-is: super_admin or own user_id

-- ─── propuestas_crm (super_admin only, no changes) ───
-- propuestas_crm stays as-is: es_super_admin() only
