-- Migration 024: RLS policies for GRD+PIN guard sessions (no auth.uid())
-- Guards authenticated via PIN don't have auth.uid(), so we need permissive
-- policies that validate guardia_id exists in guardias table.

-- ═══ VISITANTES ═══
-- Add ci column (used by frontend)
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS ci TEXT;

-- Permissive policies for PIN-auth guards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'visitantes_insert_guardia_pin' AND tablename = 'visitantes') THEN
    CREATE POLICY "visitantes_insert_guardia_pin" ON visitantes
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM guardias WHERE guardias.id = guardia_id AND guardias.activo = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'visitantes_update_guardia_pin' AND tablename = 'visitantes') THEN
    CREATE POLICY "visitantes_update_guardia_pin" ON visitantes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'visitantes_select_guardia_pin' AND tablename = 'visitantes') THEN
    CREATE POLICY "visitantes_select_guardia_pin" ON visitantes FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ ACCESO_VEHICULOS ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehiculos_insert_guardia_pin' AND tablename = 'acceso_vehiculos') THEN
    CREATE POLICY "vehiculos_insert_guardia_pin" ON acceso_vehiculos
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM guardias WHERE guardias.id = guardia_id AND guardias.activo = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehiculos_update_guardia_pin' AND tablename = 'acceso_vehiculos') THEN
    CREATE POLICY "vehiculos_update_guardia_pin" ON acceso_vehiculos FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehiculos_select_guardia_pin' AND tablename = 'acceso_vehiculos') THEN
    CREATE POLICY "vehiculos_select_guardia_pin" ON acceso_vehiculos FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ ALERTAS_RESIDENTES ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alertas_select_guardia_pin' AND tablename = 'alertas_residentes') THEN
    CREATE POLICY "alertas_select_guardia_pin" ON alertas_residentes FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'alertas_update_guardia_pin' AND tablename = 'alertas_residentes') THEN
    CREATE POLICY "alertas_update_guardia_pin" ON alertas_residentes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ═══ UNIDADES (dropdown) ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'unidades_select_guardia_pin' AND tablename = 'unidades') THEN
    CREATE POLICY "unidades_select_guardia_pin" ON unidades FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ GUARDIAS (login + session validation) ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guardias_select_guardia_pin' AND tablename = 'guardias') THEN
    CREATE POLICY "guardias_select_guardia_pin" ON guardias FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ TURNOS (guard needs to read their shifts) ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'turnos_select_guardia_pin' AND tablename = 'turnos') THEN
    CREATE POLICY "turnos_select_guardia_pin" ON turnos FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'turnos_update_guardia_pin' AND tablename = 'turnos') THEN
    CREATE POLICY "turnos_update_guardia_pin" ON turnos FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ═══ MARCACIONES (check-in/out) ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'marcaciones_insert_guardia_pin' AND tablename = 'marcaciones_guardia') THEN
    CREATE POLICY "marcaciones_insert_guardia_pin" ON marcaciones_guardia
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM guardias WHERE guardias.id = guardia_id AND guardias.activo = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'marcaciones_select_guardia_pin' AND tablename = 'marcaciones_guardia') THEN
    CREATE POLICY "marcaciones_select_guardia_pin" ON marcaciones_guardia FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ INCIDENTES ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incidentes_insert_guardia_pin' AND tablename = 'incidentes') THEN
    CREATE POLICY "incidentes_insert_guardia_pin" ON incidentes
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incidentes_select_guardia_pin' AND tablename = 'incidentes') THEN
    CREATE POLICY "incidentes_select_guardia_pin" ON incidentes FOR SELECT USING (true);
  END IF;
END $$;

-- ═══ LIBRO_NOVEDADES ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'novedades_insert_guardia_pin' AND tablename = 'libro_novedades') THEN
    CREATE POLICY "novedades_insert_guardia_pin" ON libro_novedades FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'novedades_select_guardia_pin' AND tablename = 'libro_novedades') THEN
    CREATE POLICY "novedades_select_guardia_pin" ON libro_novedades FOR SELECT USING (true);
  END IF;
END $$;
