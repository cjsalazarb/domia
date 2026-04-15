// Ejecutar migración 005: tabla propuestas_crm
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('Creando tabla propuestas_crm...')

  // Crear tabla
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS propuestas_crm (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre_prospecto TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        nombre_condominio TEXT NOT NULL,
        direccion TEXT,
        ciudad TEXT,
        num_pisos INTEGER NOT NULL DEFAULT 5,
        num_departamentos INTEGER NOT NULL DEFAULT 20,
        visitas_semanales INTEGER NOT NULL DEFAULT 2,
        precio_calculado DECIMAL(10,2) NOT NULL,
        precio_final DECIMAL(10,2) NOT NULL,
        estado TEXT NOT NULL DEFAULT 'borrador'
          CHECK (estado IN ('borrador','enviada','en_negociacion','aprobada','rechazada','en_pausa','vencida')),
        notas TEXT,
        condominio_creado_id UUID REFERENCES condominios(id),
        created_by UUID NOT NULL REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE propuestas_crm ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "propuestas_crm_all" ON propuestas_crm FOR ALL
        USING (es_super_admin())
        WITH CHECK (es_super_admin());
    `
  })

  if (e1) {
    console.error('Error con rpc exec_sql, intentando via REST...', e1.message)
    // Fallback: intentar crear via insert para verificar que la tabla existe
    // La migración se debe ejecutar manualmente en Supabase SQL Editor
    console.log('\n--- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR ---\n')
    console.log(`
CREATE TABLE IF NOT EXISTS propuestas_crm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_prospecto TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  nombre_condominio TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  num_pisos INTEGER NOT NULL DEFAULT 5,
  num_departamentos INTEGER NOT NULL DEFAULT 20,
  visitas_semanales INTEGER NOT NULL DEFAULT 2,
  precio_calculado DECIMAL(10,2) NOT NULL,
  precio_final DECIMAL(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','enviada','en_negociacion','aprobada','rechazada','en_pausa','vencida')),
  notas TEXT,
  condominio_creado_id UUID REFERENCES condominios(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE propuestas_crm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propuestas_crm_all" ON propuestas_crm FOR ALL
  USING (es_super_admin())
  WITH CHECK (es_super_admin());
    `)
    return
  }

  console.log('Tabla propuestas_crm creada exitosamente con RLS.')
}

run().catch(console.error)
