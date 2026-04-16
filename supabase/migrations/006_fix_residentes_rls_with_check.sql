-- Fix: add explicit WITH CHECK to residentes_all policy for INSERT/UPDATE
-- Previously only had USING, which PostgreSQL uses as WITH CHECK implicitly,
-- but making it explicit ensures super_admin can INSERT into any condominio.

DROP POLICY IF EXISTS "residentes_all" ON residentes;

CREATE POLICY "residentes_all" ON residentes
  FOR ALL
  USING (
    es_super_admin()
    OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  )
  WITH CHECK (
    es_super_admin()
    OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
  );
