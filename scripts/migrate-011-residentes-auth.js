// Ejecutar migración 011: tabla residentes_auth
import pg from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL
if (!url) { console.error('Falta VITE_SUPABASE_URL'); process.exit(1) }

// Extract project ref from URL
const ref = url.replace('https://', '').replace('.supabase.co', '')
const dbPassword = process.env.SUPABASE_DB_PASSWORD
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

// Use Supabase pooler connection
const connectionString = `postgresql://postgres.${ref}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`

// Fallback: use REST API via supabase-js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const SQL_BLOQUES = [
  {
    nombre: 'Tabla residentes_auth',
    sql: `
      CREATE TABLE IF NOT EXISTS residentes_auth (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        residente_id uuid NOT NULL REFERENCES residentes(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        debe_cambiar_password boolean NOT NULL DEFAULT true,
        password_enviada_at timestamptz DEFAULT now(),
        ultimo_acceso timestamptz,
        created_at timestamptz DEFAULT now(),
        UNIQUE(residente_id),
        UNIQUE(user_id)
      );
    `
  },
  {
    nombre: 'Índices',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_residentes_auth_user ON residentes_auth(user_id);
      CREATE INDEX IF NOT EXISTS idx_residentes_auth_residente ON residentes_auth(residente_id);
    `
  },
  {
    nombre: 'RLS habilitado',
    sql: `ALTER TABLE residentes_auth ENABLE ROW LEVEL SECURITY;`
  },
  {
    nombre: 'Policy: residente ve su auth',
    sql: `
      DO $$ BEGIN
        CREATE POLICY "residente_ve_su_auth"
          ON residentes_auth FOR SELECT
          USING (user_id = auth.uid());
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `
  },
  {
    nombre: 'Policy: residente actualiza su password',
    sql: `
      DO $$ BEGIN
        CREATE POLICY "residente_actualiza_su_password"
          ON residentes_auth FOR UPDATE
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `
  },
  {
    nombre: 'Policy: admin ve residentes_auth',
    sql: `
      DO $$ BEGIN
        CREATE POLICY "admin_ve_residentes_auth"
          ON residentes_auth FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.rol IN ('super_admin', 'admin_condominio')
            )
          );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `
  },
]

async function runWithPg() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('Conectado a la base de datos via pg\n')

  for (const bloque of SQL_BLOQUES) {
    process.stdout.write(`  ${bloque.nombre}... `)
    try {
      await client.query(bloque.sql)
      console.log('OK')
    } catch (err) {
      console.error(`ERROR: ${err.message}`)
    }
  }

  await client.end()
  console.log('\n🎉 Migración 011 completada')
}

async function runWithRpc() {
  console.log('Intentando via supabase.rpc("exec_sql")...\n')
  for (const bloque of SQL_BLOQUES) {
    process.stdout.write(`  ${bloque.nombre}... `)
    const { error } = await supabase.rpc('exec_sql', { sql: bloque.sql })
    if (error) {
      console.error(`ERROR: ${error.message}`)
      return false
    }
    console.log('OK')
  }
  console.log('\n🎉 Migración 011 completada')
  return true
}

async function run() {
  console.log('=== Migración 011: residentes_auth ===\n')

  // Try RPC first, fallback to pg
  const rpcOk = await runWithRpc().catch(() => false)
  if (!rpcOk) {
    if (dbPassword) {
      console.log('\nRPC no disponible. Usando pg directo...\n')
      await runWithPg()
    } else {
      console.log('\n--- Sin exec_sql ni SUPABASE_DB_PASSWORD ---')
      console.log('Ejecute el SQL de supabase/migrations/011_residentes_auth.sql')
      console.log('en el SQL Editor de Supabase Dashboard ---\n')
      process.exit(1)
    }
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
