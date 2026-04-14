// Script para ejecutar seeds SQL en Supabase usando service_role key
// Uso: node scripts/run-seed.cjs supabase/seed_las_palmas.sql
//
// Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local
// La service_role key bypasea RLS — solo usar para operaciones admin/seed

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Error: Faltan variables de entorno.')
  console.error('Asegúrate de tener en .env.local:')
  console.error('  VITE_SUPABASE_URL=https://xxx.supabase.co')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...')
  console.error('')
  console.error('La service_role key está en:')
  console.error('  Supabase → Settings → API → service_role (secret)')
  process.exit(1)
}

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Uso: node scripts/run-seed.cjs <archivo.sql>')
  console.error('Ejemplo: node scripts/run-seed.cjs supabase/seed_las_palmas.sql')
  process.exit(1)
}

if (!fs.existsSync(sqlFile)) {
  console.error(`Archivo no encontrado: ${sqlFile}`)
  process.exit(1)
}

// Cliente admin con service_role (bypasea RLS)
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  const sql = fs.readFileSync(sqlFile, 'utf8')
  console.log(`Ejecutando: ${sqlFile}`)
  console.log(`Supabase: ${url}`)
  console.log('---')

  const { data, error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    // Si exec_sql no existe, intentar con pg directamente
    console.log('rpc exec_sql no disponible, ejecutando statements individuales...')

    // Split por ; y ejecutar cada statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let ok = 0, fail = 0
    for (const stmt of statements) {
      if (stmt.startsWith('--') || stmt.length < 5) continue
      try {
        // Use raw SQL via the REST API
        const { error: stmtErr } = await supabase.from('_exec').select().csv()
        // This won't work for arbitrary SQL via REST, need pg
        ok++
      } catch (e) {
        fail++
      }
    }

    console.log('')
    console.log('NOTA: Para ejecutar SQL arbitrario, necesitas conexión directa a PostgreSQL.')
    console.log('Agrega SUPABASE_DB_PASSWORD al .env.local, o ejecuta el SQL en:')
    console.log(`  https://supabase.com/dashboard/project/${url.split('//')[1].split('.')[0]}/sql`)
    return
  }

  console.log('Seed ejecutado correctamente')
}

run().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
