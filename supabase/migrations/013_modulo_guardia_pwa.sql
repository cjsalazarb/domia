-- 013: Módulo guardia PWA — nuevas tablas + fix RLS

-- ═══ ENUMS ═══
DO $$ BEGIN CREATE TYPE motivo_visita AS ENUM ('visita', 'delivery', 'servicio', 'otro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE estado_visitante AS ENUM ('pendiente', 'autorizado', 'rechazado', 'salido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_alerta_residente AS ENUM ('ayuda', 'paquete', 'ruido', 'emergencia'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_vehiculo AS ENUM ('residente', 'visitante', 'proveedor', 'delivery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_marcacion AS ENUM ('entrada', 'salida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE urgencia_incidente AS ENUM ('normal', 'urgente', 'emergencia'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══ MARCACIONES GUARDIA (selfie + GPS) ═══
CREATE TABLE IF NOT EXISTS marcaciones_guardia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
  tipo tipo_marcacion NOT NULL,
  foto_url TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marcaciones_guardia ON marcaciones_guardia(guardia_id, timestamp DESC);

-- ═══ VISITANTES ═══
CREATE TABLE IF NOT EXISTS visitantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  unidad_destino_id UUID REFERENCES unidades(id),
  motivo motivo_visita NOT NULL DEFAULT 'visita',
  foto_visitante_url TEXT,
  foto_doc_url TEXT,
  placa_vehiculo TEXT,
  ingreso_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salida_at TIMESTAMPTZ,
  autorizado_por UUID REFERENCES residentes(id),
  estado estado_visitante NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitantes_condominio ON visitantes(condominio_id, ingreso_at DESC);
CREATE INDEX idx_visitantes_estado ON visitantes(condominio_id, estado);

-- ═══ ALERTAS RESIDENTES ═══
CREATE TABLE IF NOT EXISTS alertas_residentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  residente_id UUID NOT NULL REFERENCES residentes(id) ON DELETE CASCADE,
  unidad_id UUID REFERENCES unidades(id),
  tipo tipo_alerta_residente NOT NULL,
  mensaje TEXT,
  atendida BOOLEAN NOT NULL DEFAULT FALSE,
  atendida_por UUID REFERENCES guardias(id),
  atendida_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_condominio ON alertas_residentes(condominio_id, created_at DESC);
CREATE INDEX idx_alertas_pendientes ON alertas_residentes(condominio_id, atendida) WHERE NOT atendida;

-- ═══ ACCESO VEHÍCULOS ═══
CREATE TABLE IF NOT EXISTS acceso_vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  tipo_vehiculo tipo_vehiculo NOT NULL DEFAULT 'visitante',
  unidad_id UUID REFERENCES unidades(id),
  foto_url TEXT,
  entrada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salida_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehiculos_condominio ON acceso_vehiculos(condominio_id, entrada_at DESC);
CREATE INDEX idx_vehiculos_placa ON acceso_vehiculos(placa);

-- ═══ AGREGAR COLUMNA URGENCIA A INCIDENTES ═══
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS urgencia urgencia_incidente DEFAULT 'normal';
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS fotos_urls TEXT[];
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'reportado';
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS atendido_por UUID REFERENCES profiles(id);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS resuelto_at TIMESTAMPTZ;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS notas_resolucion TEXT;

-- ═══ RLS ═══

-- marcaciones_guardia
ALTER TABLE marcaciones_guardia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marcaciones_select" ON marcaciones_guardia FOR SELECT
  USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
    OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "marcaciones_insert" ON marcaciones_guardia FOR INSERT
  WITH CHECK (es_super_admin() OR get_mi_rol() = 'guardia');

-- visitantes
ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitantes_select" ON visitantes FOR SELECT
  USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
    OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "visitantes_insert" ON visitantes FOR INSERT
  WITH CHECK (es_super_admin() OR get_mi_rol() = 'guardia');
CREATE POLICY "visitantes_update" ON visitantes FOR UPDATE
  USING (es_super_admin() OR get_mi_rol() = 'guardia');

-- alertas_residentes
ALTER TABLE alertas_residentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertas_select" ON alertas_residentes FOR SELECT
  USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
    OR get_mi_rol() = 'guardia'
    OR residente_id = (SELECT id FROM residentes WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "alertas_insert" ON alertas_residentes FOR INSERT
  WITH CHECK (es_super_admin() OR get_mi_rol() IN ('propietario', 'inquilino'));
CREATE POLICY "alertas_update" ON alertas_residentes FOR UPDATE
  USING (es_super_admin() OR get_mi_rol() = 'guardia');

-- acceso_vehiculos
ALTER TABLE acceso_vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculos_select" ON acceso_vehiculos FOR SELECT
  USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
    OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "vehiculos_insert" ON acceso_vehiculos FOR INSERT
  WITH CHECK (es_super_admin() OR get_mi_rol() = 'guardia');
CREATE POLICY "vehiculos_update" ON acceso_vehiculos FOR UPDATE
  USING (es_super_admin() OR get_mi_rol() = 'guardia');

-- Fix: libro_novedades (RLS habilitado sin policies)
CREATE POLICY "novedades_select" ON libro_novedades FOR SELECT
  USING (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
    OR guardia_id = (SELECT id FROM guardias WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "novedades_insert" ON libro_novedades FOR INSERT
  WITH CHECK (es_super_admin() OR get_mi_rol() = 'guardia');

-- Habilitar realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE alertas_residentes;
