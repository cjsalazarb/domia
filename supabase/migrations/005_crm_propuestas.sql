-- CRM Pre-venta: tabla de propuestas comerciales
CREATE TABLE propuestas_crm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Prospecto
  nombre_prospecto TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  nombre_condominio TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  -- Parametros de calculo
  num_pisos INTEGER NOT NULL DEFAULT 5,
  num_departamentos INTEGER NOT NULL DEFAULT 20,
  visitas_semanales INTEGER NOT NULL DEFAULT 2,
  -- Precio
  precio_calculado DECIMAL(10,2) NOT NULL,
  precio_final DECIMAL(10,2) NOT NULL,
  -- Estado
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','enviada','en_negociacion','aprobada','rechazada','en_pausa','vencida')),
  -- Relaciones
  notas TEXT,
  condominio_creado_id UUID REFERENCES condominios(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS solo super_admin
ALTER TABLE propuestas_crm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propuestas_crm_all" ON propuestas_crm FOR ALL
  USING (es_super_admin())
  WITH CHECK (es_super_admin());
