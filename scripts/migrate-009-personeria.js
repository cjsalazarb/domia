// Ejecutar migración 009: Plan de Cuentas — personería jurídica + gestión manual
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const bloques = [
  {
    nombre: 'columna tiene_personeria_juridica en condominios',
    sql: `
      ALTER TABLE condominios
        ADD COLUMN IF NOT EXISTS tiene_personeria_juridica BOOLEAN NOT NULL DEFAULT FALSE;
    `
  },
  {
    nombre: 'columna is_custom en plan_cuentas',
    sql: `
      ALTER TABLE plan_cuentas
        ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;
    `
  },
  {
    nombre: 'función poblar_plan_cuentas (v2 con personería)',
    sql: `
      CREATE OR REPLACE FUNCTION poblar_plan_cuentas(
        p_condominio_id    UUID,
        p_con_personeria   BOOLEAN DEFAULT FALSE
      )
      RETURNS VOID AS $func$
      BEGIN
        IF EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = p_condominio_id) THEN
          RAISE NOTICE 'El condominio ya tiene plan de cuentas, omitiendo.';
          RETURN;
        END IF;

        INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel) VALUES
          (p_condominio_id, '1',     'ACTIVO',                                       'activo',     'Activo',              1),
          (p_condominio_id, '1.1',   'Activo Corriente',                             'activo',     'Activo Corriente',    2),
          (p_condominio_id, '1.1.1', 'Caja',                                         'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.2', 'Banco',                                        'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.3', 'Cuentas por Cobrar — Cuotas de Mantenimiento', 'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.4', 'Cuentas por Cobrar — Recargos por Mora',       'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.5', 'Fondo de Reserva',                             'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.6', 'Anticipos a Proveedores',                      'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.2',   'Activo No Corriente',                          'activo',     'Activo No Corriente', 2),
          (p_condominio_id, '1.2.1', 'Bienes del Condominio',                        'activo',     'Activo No Corriente', 3),
          (p_condominio_id, '1.2.2', 'Depreciacion Acumulada',                       'activo',     'Activo No Corriente', 3),
          (p_condominio_id, '2',     'PASIVO',                                       'pasivo',     'Pasivo',              1),
          (p_condominio_id, '2.1',   'Pasivo Corriente',                             'pasivo',     'Pasivo Corriente',    2),
          (p_condominio_id, '2.1.1', 'Cuentas por Pagar — Proveedores',              'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '2.1.2', 'Cuentas por Pagar — Personal',                 'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '2.1.3', 'Anticipos Recibidos de Propietarios',          'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '3',     'PATRIMONIO',                                   'patrimonio', 'Patrimonio',          1),
          (p_condominio_id, '3.1',   'Fondo Comunal',                                'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '3.2',   'Superavit / Deficit del Ejercicio',            'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '3.3',   'Resultados Acumulados',                        'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '4',     'INGRESOS',                                     'ingreso',    'Ingresos',            1),
          (p_condominio_id, '4.1',   'Cuotas de Mantenimiento',                      'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.2',   'Recargos por Mora',                            'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.3',   'Ingresos por Reserva de Areas Comunes',        'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.4',   'Otros Ingresos',                               'ingreso',    'Ingresos',            2),
          (p_condominio_id, '5',     'EGRESOS / GASTOS',                             'gasto',      'Gastos',              1),
          (p_condominio_id, '5.1',   'Gastos de Limpieza',                           'gasto',      'Gastos',              2),
          (p_condominio_id, '5.2',   'Gastos de Mantenimiento y Reparacion',         'gasto',      'Gastos',              2),
          (p_condominio_id, '5.3',   'Gastos de Personal',                           'gasto',      'Gastos',              2),
          (p_condominio_id, '5.4',   'Gastos de Administracion',                     'gasto',      'Gastos',              2),
          (p_condominio_id, '5.5',   'Gastos de Agua y Luz Areas Comunes',           'gasto',      'Gastos',              2),
          (p_condominio_id, '5.6',   'Gastos de Seguridad',                          'gasto',      'Gastos',              2),
          (p_condominio_id, '5.7',   'Gastos de Jardineria',                         'gasto',      'Gastos',              2),
          (p_condominio_id, '5.8',   'Otros Gastos',                                 'gasto',      'Gastos',              2);

        IF p_con_personeria THEN
          INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel) VALUES
            (p_condominio_id, '1.1.7',  'Credito Fiscal IVA',                   'activo',     'Activo Corriente',  3),
            (p_condominio_id, '2.1.4',  'Retenciones por Pagar — IT',           'pasivo',     'Pasivo Corriente',  3),
            (p_condominio_id, '2.1.5',  'Retenciones por Pagar — RC-IVA',       'pasivo',     'Pasivo Corriente',  3),
            (p_condominio_id, '2.1.6',  'Debito Fiscal IVA',                    'pasivo',     'Pasivo Corriente',  3),
            (p_condominio_id, '2.1.7',  'IUE por Pagar',                        'pasivo',     'Pasivo Corriente',  3),
            (p_condominio_id, '3.4',    'Reserva Legal',                         'patrimonio', 'Patrimonio',        2),
            (p_condominio_id, '4.5',    'Ingresos Financieros',                  'ingreso',    'Ingresos',          2),
            (p_condominio_id, '5.9',    'Gastos Tributarios (IT, RC-IVA)',       'gasto',      'Gastos',            2),
            (p_condominio_id, '5.10',   'Depreciaciones y Amortizaciones',       'gasto',      'Gastos',            2);
        END IF;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    nombre: 'función agregar_cuentas_personeria',
    sql: `
      CREATE OR REPLACE FUNCTION agregar_cuentas_personeria(p_condominio_id UUID)
      RETURNS VOID AS $func$
      BEGIN
        INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel)
        VALUES
          (p_condominio_id, '1.1.7',  'Credito Fiscal IVA',                   'activo',     'Activo Corriente',  3),
          (p_condominio_id, '2.1.4',  'Retenciones por Pagar — IT',           'pasivo',     'Pasivo Corriente',  3),
          (p_condominio_id, '2.1.5',  'Retenciones por Pagar — RC-IVA',       'pasivo',     'Pasivo Corriente',  3),
          (p_condominio_id, '2.1.6',  'Debito Fiscal IVA',                    'pasivo',     'Pasivo Corriente',  3),
          (p_condominio_id, '2.1.7',  'IUE por Pagar',                        'pasivo',     'Pasivo Corriente',  3),
          (p_condominio_id, '3.4',    'Reserva Legal',                         'patrimonio', 'Patrimonio',        2),
          (p_condominio_id, '4.5',    'Ingresos Financieros',                  'ingreso',    'Ingresos',          2),
          (p_condominio_id, '5.9',    'Gastos Tributarios (IT, RC-IVA)',       'gasto',      'Gastos',            2),
          (p_condominio_id, '5.10',   'Depreciaciones y Amortizaciones',       'gasto',      'Gastos',            2)
        ON CONFLICT (condominio_id, codigo) DO NOTHING;

        UPDATE plan_cuentas
        SET activa = TRUE, updated_at = NOW()
        WHERE condominio_id = p_condominio_id
          AND codigo IN ('1.1.7', '2.1.4', '2.1.5', '2.1.6', '2.1.7', '3.4', '4.5', '5.9', '5.10')
          AND activa = FALSE;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
]

async function run() {
  console.log('=== Migración 009: Plan de Cuentas — personería jurídica ===\n')

  for (const bloque of bloques) {
    process.stdout.write(`  ${bloque.nombre}... `)

    const { error } = await supabase.rpc('exec_sql', { sql: bloque.sql })

    if (error) {
      console.error(`ERROR: ${error.message}`)
      console.log('\n--- EJECUTAR EL SQL DE supabase/migrations/009_plan_cuentas_personeria.sql EN SUPABASE SQL EDITOR ---\n')
      process.exit(1)
    }

    console.log('OK')
  }

  // Verificar
  const { data } = await supabase.from('condominios').select('id, nombre, tiene_personeria_juridica').limit(5)
  if (data) {
    console.log(`\n✓ Migración completada. Columna tiene_personeria_juridica agregada.`)
    console.log(`  Condominios existentes:`, data.map(c => `${c.nombre} (personería: ${c.tiene_personeria_juridica})`).join(', '))
  }
}

run().catch(console.error)
