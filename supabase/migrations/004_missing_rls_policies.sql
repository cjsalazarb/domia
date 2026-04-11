-- Missing RLS policies for areas_comunes, proveedores, documentos_condominio, libro_novedades
-- These tables had RLS enabled but no policies, blocking all operations

-- areas_comunes: admins and super_admin can manage, residents can read
CREATE POLICY "areas_comunes_select" ON areas_comunes FOR SELECT USING (
  es_super_admin()
  OR condominio_id = get_mi_condominio()
  OR condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "areas_comunes_all" ON areas_comunes FOR ALL USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- proveedores
CREATE POLICY "proveedores_select" ON proveedores FOR SELECT USING (
  es_super_admin()
  OR condominio_id = get_mi_condominio()
);
CREATE POLICY "proveedores_all" ON proveedores FOR ALL USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- documentos_condominio
CREATE POLICY "documentos_condominio_select" ON documentos_condominio FOR SELECT USING (
  es_super_admin()
  OR condominio_id = get_mi_condominio()
);
CREATE POLICY "documentos_condominio_all" ON documentos_condominio FOR ALL USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- libro_novedades
CREATE POLICY "libro_novedades_select" ON libro_novedades FOR SELECT USING (
  es_super_admin()
  OR condominio_id = get_mi_condominio()
);
CREATE POLICY "libro_novedades_insert" ON libro_novedades FOR INSERT WITH CHECK (
  es_super_admin()
  OR get_mi_rol() = 'guardia'
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- profiles INSERT (for trigger crear_profile_nuevo_usuario)
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- notificaciones UPDATE (for marking as read)
CREATE POLICY "notificaciones_update" ON notificaciones FOR UPDATE USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  OR destinatario_id = auth.uid()
  OR (destinatario_id IS NULL AND condominio_id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1))
);
