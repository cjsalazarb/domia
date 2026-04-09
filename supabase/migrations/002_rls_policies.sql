ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE residentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas_comunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardias ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_novedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_condominio ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION es_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'super_admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_mi_rol() RETURNS rol_usuario AS $$
  SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_mi_condominio() RETURNS UUID AS $$
  SELECT condominio_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (es_super_admin() OR id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (es_super_admin() OR id = auth.uid());
CREATE POLICY "condominios_select" ON condominios FOR SELECT USING (es_super_admin() OR id = get_mi_condominio() OR id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "condominios_insert" ON condominios FOR INSERT WITH CHECK (es_super_admin());
CREATE POLICY "condominios_update" ON condominios FOR UPDATE USING (es_super_admin());
CREATE POLICY "edificios_select" ON edificios FOR SELECT USING (es_super_admin() OR condominio_id = get_mi_condominio() OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "edificios_all" ON edificios FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "unidades_select" ON unidades FOR SELECT USING (es_super_admin() OR condominio_id = get_mi_condominio() OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "unidades_all" ON unidades FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "residentes_select" ON residentes FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR user_id = auth.uid());
CREATE POLICY "residentes_all" ON residentes FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "cuotas_select" ON cuotas FOR SELECT USING (es_super_admin() OR condominio_id = get_mi_condominio() OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "cuotas_all" ON cuotas FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "recibos_select" ON recibos FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "recibos_insert" ON recibos FOR INSERT WITH CHECK (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "recibos_update" ON recibos FOR UPDATE USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "pagos_select" ON pagos FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "pagos_insert" ON pagos FOR INSERT WITH CHECK (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR get_mi_rol() IN ('propietario','inquilino'));
CREATE POLICY "pagos_update" ON pagos FOR UPDATE USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "gastos_select" ON gastos FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "gastos_all" ON gastos FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "mantenimientos_select" ON mantenimientos FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR unidad_id IN (SELECT unidad_id FROM residentes WHERE user_id = auth.uid()));
CREATE POLICY "mantenimientos_insert" ON mantenimientos FOR INSERT WITH CHECK (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR get_mi_rol() IN ('propietario','inquilino'));
CREATE POLICY "mantenimientos_update" ON mantenimientos FOR UPDATE USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "reservas_select" ON reservas FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "reservas_insert" ON reservas FOR INSERT WITH CHECK (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR get_mi_rol() IN ('propietario','inquilino'));
CREATE POLICY "reservas_update" ON reservas FOR UPDATE USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "guardias_select" ON guardias FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR (get_mi_rol() = 'guardia' AND user_id = auth.uid()));
CREATE POLICY "guardias_all" ON guardias FOR ALL USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "turnos_select" ON turnos FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "turnos_update" ON turnos FOR UPDATE USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "incidentes_select" ON incidentes FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "incidentes_insert" ON incidentes FOR INSERT WITH CHECK (es_super_admin() OR get_mi_rol() = 'guardia');
CREATE POLICY "notificaciones_select" ON notificaciones FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()) OR destinatario_id = auth.uid() OR (destinatario_id IS NULL AND condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)));
CREATE POLICY "notificaciones_insert" ON notificaciones FOR INSERT WITH CHECK (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio()));
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND usuario_id = auth.uid()));
CREATE POLICY "audit_logs_insert_deny" ON audit_logs FOR INSERT WITH CHECK (FALSE);
