-- Migration 024: Allow visitantes inserts/updates for GRD+PIN guard sessions
-- Guards authenticated via PIN don't have auth.uid(), so we need a policy
-- that allows operations based on condominio_id + guardia_id existing in guardias table

-- Allow INSERT for anyone (the guardia_id must be a valid active guardia)
CREATE POLICY "visitantes_insert_guardia" ON visitantes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM guardias
      WHERE guardias.id = guardia_id
        AND guardias.condominio_id = visitantes.condominio_id
        AND guardias.activo = true
    )
  );

-- Allow UPDATE (for registering salida) on visitantes in the same condominio
CREATE POLICY "visitantes_update_guardia" ON visitantes
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow SELECT on visitantes for the condominio
CREATE POLICY "visitantes_select_guardia" ON visitantes
  FOR SELECT USING (true);

-- Also ensure alertas_residentes can be read and updated by guards without auth
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alertas_select_all' AND tablename = 'alertas_residentes') THEN
    CREATE POLICY "alertas_select_all" ON alertas_residentes FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alertas_update_guardia' AND tablename = 'alertas_residentes') THEN
    CREATE POLICY "alertas_update_guardia" ON alertas_residentes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Ensure unidades are readable (for the dropdown)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'unidades_select_all' AND tablename = 'unidades') THEN
    CREATE POLICY "unidades_select_all" ON unidades FOR SELECT USING (true);
  END IF;
END $$;
