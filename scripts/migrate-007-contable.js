// Ejecutar migración 007: Módulo Contable
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// Dividir la migración en bloques lógicos para evitar límites de tamaño
const bloques = [
  {
    nombre: 'ENUMs + tabla plan_cuentas',
    sql: `
      CREATE TYPE IF NOT EXISTS estado_arqueo AS ENUM ('conforme', 'con_diferencia');
      CREATE TYPE IF NOT EXISTS tipo_cuenta AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto');
      CREATE TYPE IF NOT EXISTS referencia_contable AS ENUM ('recibo', 'pago', 'gasto', 'arqueo', 'manual');

      CREATE TABLE IF NOT EXISTS plan_cuentas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        tipo tipo_cuenta NOT NULL,
        grupo TEXT NOT NULL,
        nivel INT NOT NULL DEFAULT 1,
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(condominio_id, codigo)
      );

      CREATE INDEX IF NOT EXISTS idx_plan_cuentas_condominio ON plan_cuentas(condominio_id);
      CREATE INDEX IF NOT EXISTS idx_plan_cuentas_tipo ON plan_cuentas(condominio_id, tipo);
      CREATE INDEX IF NOT EXISTS idx_plan_cuentas_codigo ON plan_cuentas(condominio_id, codigo);
    `
  },
  {
    nombre: 'tabla asientos_contables + trigger auto-numero',
    sql: `
      CREATE TABLE IF NOT EXISTS asientos_contables (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
        numero INT NOT NULL,
        fecha DATE NOT NULL,
        descripcion TEXT NOT NULL,
        referencia_tipo referencia_contable NOT NULL DEFAULT 'manual',
        referencia_id UUID,
        creado_por UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(condominio_id, numero)
      );

      CREATE INDEX IF NOT EXISTS idx_asientos_condominio ON asientos_contables(condominio_id);
      CREATE INDEX IF NOT EXISTS idx_asientos_fecha ON asientos_contables(condominio_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_asientos_referencia ON asientos_contables(referencia_tipo, referencia_id);

      CREATE OR REPLACE FUNCTION asiento_auto_numero()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF NEW.numero IS NULL OR NEW.numero = 0 THEN
          SELECT COALESCE(MAX(numero), 0) + 1
          INTO NEW.numero
          FROM asientos_contables
          WHERE condominio_id = NEW.condominio_id;
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_asiento_auto_numero ON asientos_contables;
      CREATE TRIGGER trg_asiento_auto_numero
        BEFORE INSERT ON asientos_contables
        FOR EACH ROW EXECUTE FUNCTION asiento_auto_numero();
    `
  },
  {
    nombre: 'tabla asiento_detalles',
    sql: `
      CREATE TABLE IF NOT EXISTS asiento_detalles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        asiento_id UUID NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
        cuenta_id UUID NOT NULL REFERENCES plan_cuentas(id) ON DELETE RESTRICT,
        debe DECIMAL(12,2) NOT NULL DEFAULT 0,
        haber DECIMAL(12,2) NOT NULL DEFAULT 0,
        CONSTRAINT chk_debe_o_haber CHECK (
          (debe > 0 AND haber = 0) OR (debe = 0 AND haber > 0)
        )
      );

      CREATE INDEX IF NOT EXISTS idx_asiento_detalles_asiento ON asiento_detalles(asiento_id);
      CREATE INDEX IF NOT EXISTS idx_asiento_detalles_cuenta ON asiento_detalles(cuenta_id);
    `
  },
  {
    nombre: 'tabla arqueos_caja + denominaciones',
    sql: `
      CREATE TABLE IF NOT EXISTS arqueos_caja (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
        fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        responsable TEXT NOT NULL,
        saldo_libros DECIMAL(12,2) NOT NULL,
        total_contado DECIMAL(12,2) NOT NULL DEFAULT 0,
        cheques_cartera DECIMAL(12,2) NOT NULL DEFAULT 0,
        comprobantes_pendientes DECIMAL(12,2) NOT NULL DEFAULT 0,
        total_arqueo DECIMAL(12,2) GENERATED ALWAYS AS (total_contado + cheques_cartera + comprobantes_pendientes) STORED,
        diferencia DECIMAL(12,2) GENERATED ALWAYS AS ((total_contado + cheques_cartera + comprobantes_pendientes) - saldo_libros) STORED,
        estado estado_arqueo NOT NULL DEFAULT 'conforme',
        notas TEXT,
        creado_por UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_arqueos_condominio ON arqueos_caja(condominio_id);
      CREATE INDEX IF NOT EXISTS idx_arqueos_fecha ON arqueos_caja(condominio_id, fecha);

      CREATE TABLE IF NOT EXISTS arqueo_denominaciones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        arqueo_id UUID NOT NULL REFERENCES arqueos_caja(id) ON DELETE CASCADE,
        denominacion DECIMAL(6,2) NOT NULL,
        cantidad INT NOT NULL DEFAULT 0,
        subtotal DECIMAL(12,2) GENERATED ALWAYS AS (denominacion * cantidad) STORED
      );

      CREATE INDEX IF NOT EXISTS idx_arqueo_denom_arqueo ON arqueo_denominaciones(arqueo_id);
    `
  },
  {
    nombre: 'triggers updated_at + audit',
    sql: `
      DROP TRIGGER IF EXISTS trg_plan_cuentas_updated_at ON plan_cuentas;
      CREATE TRIGGER trg_plan_cuentas_updated_at
        BEFORE UPDATE ON plan_cuentas
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS trg_arqueos_caja_updated_at ON arqueos_caja;
      CREATE TRIGGER trg_arqueos_caja_updated_at
        BEFORE UPDATE ON arqueos_caja
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

      DROP TRIGGER IF EXISTS trg_audit_asientos ON asientos_contables;
      CREATE TRIGGER trg_audit_asientos
        AFTER INSERT OR UPDATE OR DELETE ON asientos_contables
        FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();

      DROP TRIGGER IF EXISTS trg_audit_arqueos ON arqueos_caja;
      CREATE TRIGGER trg_audit_arqueos
        AFTER INSERT OR UPDATE OR DELETE ON arqueos_caja
        FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();
    `
  },
  {
    nombre: 'RLS plan_cuentas + asientos',
    sql: `
      ALTER TABLE plan_cuentas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE asientos_contables ENABLE ROW LEVEL SECURITY;
      ALTER TABLE asiento_detalles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE arqueos_caja ENABLE ROW LEVEL SECURITY;
      ALTER TABLE arqueo_denominaciones ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "plan_cuentas_select" ON plan_cuentas;
      CREATE POLICY "plan_cuentas_select" ON plan_cuentas FOR SELECT USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "plan_cuentas_insert" ON plan_cuentas;
      CREATE POLICY "plan_cuentas_insert" ON plan_cuentas FOR INSERT WITH CHECK (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "plan_cuentas_update" ON plan_cuentas;
      CREATE POLICY "plan_cuentas_update" ON plan_cuentas FOR UPDATE USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );

      DROP POLICY IF EXISTS "asientos_select" ON asientos_contables;
      CREATE POLICY "asientos_select" ON asientos_contables FOR SELECT USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "asientos_insert" ON asientos_contables;
      CREATE POLICY "asientos_insert" ON asientos_contables FOR INSERT WITH CHECK (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "asientos_update" ON asientos_contables;
      CREATE POLICY "asientos_update" ON asientos_contables FOR UPDATE USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
    `
  },
  {
    nombre: 'RLS asiento_detalles + arqueos',
    sql: `
      DROP POLICY IF EXISTS "asiento_detalles_select" ON asiento_detalles;
      CREATE POLICY "asiento_detalles_select" ON asiento_detalles FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM asientos_contables a
          WHERE a.id = asiento_detalles.asiento_id
          AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
        )
      );
      DROP POLICY IF EXISTS "asiento_detalles_insert" ON asiento_detalles;
      CREATE POLICY "asiento_detalles_insert" ON asiento_detalles FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM asientos_contables a
          WHERE a.id = asiento_detalles.asiento_id
          AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
        )
      );
      DROP POLICY IF EXISTS "asiento_detalles_update" ON asiento_detalles;
      CREATE POLICY "asiento_detalles_update" ON asiento_detalles FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM asientos_contables a
          WHERE a.id = asiento_detalles.asiento_id
          AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
        )
      );

      DROP POLICY IF EXISTS "arqueos_select" ON arqueos_caja;
      CREATE POLICY "arqueos_select" ON arqueos_caja FOR SELECT USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "arqueos_insert" ON arqueos_caja;
      CREATE POLICY "arqueos_insert" ON arqueos_caja FOR INSERT WITH CHECK (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );
      DROP POLICY IF EXISTS "arqueos_update" ON arqueos_caja;
      CREATE POLICY "arqueos_update" ON arqueos_caja FOR UPDATE USING (
        es_super_admin()
        OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
      );

      DROP POLICY IF EXISTS "arqueo_denom_select" ON arqueo_denominaciones;
      CREATE POLICY "arqueo_denom_select" ON arqueo_denominaciones FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM arqueos_caja a
          WHERE a.id = arqueo_denominaciones.arqueo_id
          AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
        )
      );
      DROP POLICY IF EXISTS "arqueo_denom_insert" ON arqueo_denominaciones;
      CREATE POLICY "arqueo_denom_insert" ON arqueo_denominaciones FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM arqueos_caja a
          WHERE a.id = arqueo_denominaciones.arqueo_id
          AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
        )
      );
    `
  },
  {
    nombre: 'función poblar_plan_cuentas',
    sql: `
      CREATE OR REPLACE FUNCTION poblar_plan_cuentas(p_condominio_id UUID)
      RETURNS VOID AS $func$
      BEGIN
        IF EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = p_condominio_id) THEN
          RAISE NOTICE 'El condominio ya tiene plan de cuentas, omitiendo.';
          RETURN;
        END IF;

        INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel) VALUES
          (p_condominio_id, '1',     'ACTIVO',                                       'activo',     'Activo',              1),
          (p_condominio_id, '1.1',   'Activo Corriente',                              'activo',     'Activo Corriente',    2),
          (p_condominio_id, '1.1.1', 'Caja',                                          'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.2', 'Banco',                                         'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.3', 'Cuentas por Cobrar - Cuotas de Mantenimiento',  'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.4', 'Cuentas por Cobrar - Recargos por Mora',        'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.5', 'Fondo de Reserva',                              'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.1.6', 'Anticipos a Proveedores',                       'activo',     'Activo Corriente',    3),
          (p_condominio_id, '1.2',   'Activo No Corriente',                            'activo',     'Activo No Corriente', 2),
          (p_condominio_id, '1.2.1', 'Bienes del Condominio',                          'activo',     'Activo No Corriente', 3),
          (p_condominio_id, '1.2.2', 'Depreciacion Acumulada',                         'activo',     'Activo No Corriente', 3),
          (p_condominio_id, '2',     'PASIVO',                                         'pasivo',     'Pasivo',              1),
          (p_condominio_id, '2.1',   'Pasivo Corriente',                               'pasivo',     'Pasivo Corriente',    2),
          (p_condominio_id, '2.1.1', 'Cuentas por Pagar - Proveedores',                'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '2.1.2', 'Cuentas por Pagar - Personal',                   'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '2.1.3', 'Anticipos Recibidos de Propietarios',             'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '2.1.4', 'Retenciones por Pagar (IT, RC-IVA)',              'pasivo',     'Pasivo Corriente',    3),
          (p_condominio_id, '3',     'PATRIMONIO',                                      'patrimonio', 'Patrimonio',          1),
          (p_condominio_id, '3.1',   'Fondo Patrimonial del Condominio',                'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '3.2',   'Superavit / Deficit del Ejercicio',               'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '3.3',   'Resultados Acumulados',                           'patrimonio', 'Patrimonio',          2),
          (p_condominio_id, '4',     'INGRESOS',                                        'ingreso',    'Ingresos',            1),
          (p_condominio_id, '4.1',   'Cuotas de Mantenimiento',                         'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.2',   'Recargos por Mora',                               'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.3',   'Ingresos por Reserva de Areas Comunes',           'ingreso',    'Ingresos',            2),
          (p_condominio_id, '4.4',   'Otros Ingresos',                                  'ingreso',    'Ingresos',            2),
          (p_condominio_id, '5',     'EGRESOS / GASTOS',                                'gasto',      'Gastos',              1),
          (p_condominio_id, '5.1',   'Gastos de Limpieza',                              'gasto',      'Gastos',              2),
          (p_condominio_id, '5.2',   'Gastos de Mantenimiento y Reparacion',            'gasto',      'Gastos',              2),
          (p_condominio_id, '5.3',   'Gastos de Personal',                              'gasto',      'Gastos',              2),
          (p_condominio_id, '5.4',   'Gastos de Administracion',                        'gasto',      'Gastos',              2),
          (p_condominio_id, '5.5',   'Gastos de Agua y Luz Areas Comunes',              'gasto',      'Gastos',              2),
          (p_condominio_id, '5.6',   'Gastos de Seguridad',                             'gasto',      'Gastos',              2),
          (p_condominio_id, '5.7',   'Gastos de Jardineria',                            'gasto',      'Gastos',              2),
          (p_condominio_id, '5.8',   'Otros Gastos',                                    'gasto',      'Gastos',              2);
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    nombre: 'función mapear_cuenta_gasto + crear_asiento',
    sql: `
      CREATE OR REPLACE FUNCTION mapear_cuenta_gasto(p_categoria categoria_gasto)
      RETURNS TEXT AS $func$
      BEGIN
        RETURN CASE p_categoria
          WHEN 'limpieza'       THEN '5.1'
          WHEN 'mantenimiento'  THEN '5.2'
          WHEN 'reparacion'     THEN '5.2'
          WHEN 'personal'       THEN '5.3'
          WHEN 'administracion' THEN '5.4'
          WHEN 'agua'           THEN '5.5'
          WHEN 'luz'            THEN '5.5'
          WHEN 'gas'            THEN '5.5'
          WHEN 'seguridad'      THEN '5.6'
          ELSE                       '5.8'
        END;
      END;
      $func$ LANGUAGE plpgsql IMMUTABLE;

      CREATE OR REPLACE FUNCTION crear_asiento(
        p_condominio_id UUID,
        p_fecha DATE,
        p_descripcion TEXT,
        p_ref_tipo referencia_contable,
        p_ref_id UUID,
        p_lineas JSONB
      )
      RETURNS UUID AS $func$
      DECLARE
        v_asiento_id UUID;
        v_linea JSONB;
        v_cuenta_id UUID;
      BEGIN
        INSERT INTO asientos_contables (condominio_id, numero, fecha, descripcion, referencia_tipo, referencia_id)
        VALUES (p_condominio_id, 0, p_fecha, p_descripcion, p_ref_tipo, p_ref_id)
        RETURNING id INTO v_asiento_id;

        FOR v_linea IN SELECT * FROM jsonb_array_elements(p_lineas)
        LOOP
          SELECT id INTO v_cuenta_id
          FROM plan_cuentas
          WHERE condominio_id = p_condominio_id
            AND codigo = v_linea->>'codigo';

          IF v_cuenta_id IS NULL THEN
            RAISE EXCEPTION 'Cuenta % no encontrada para condominio %', v_linea->>'codigo', p_condominio_id;
          END IF;

          INSERT INTO asiento_detalles (asiento_id, cuenta_id, debe, haber)
          VALUES (
            v_asiento_id,
            v_cuenta_id,
            COALESCE((v_linea->>'debe')::DECIMAL, 0),
            COALESCE((v_linea->>'haber')::DECIMAL, 0)
          );
        END LOOP;

        RETURN v_asiento_id;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    nombre: 'trigger asiento automático recibo',
    sql: `
      CREATE OR REPLACE FUNCTION asiento_auto_recibo()
      RETURNS TRIGGER AS $func$
      DECLARE
        v_lineas JSONB;
      BEGIN
        IF TG_OP = 'INSERT' AND NEW.estado = 'emitido' THEN
          IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
            RETURN NEW;
          END IF;

          v_lineas := jsonb_build_array(
            jsonb_build_object('codigo', '1.1.3', 'debe', NEW.monto_base, 'haber', 0),
            jsonb_build_object('codigo', '4.1',   'debe', 0, 'haber', NEW.monto_base)
          );

          IF NEW.monto_recargo > 0 THEN
            v_lineas := v_lineas || jsonb_build_array(
              jsonb_build_object('codigo', '1.1.4', 'debe', NEW.monto_recargo, 'haber', 0),
              jsonb_build_object('codigo', '4.2',   'debe', 0, 'haber', NEW.monto_recargo)
            );
          END IF;

          PERFORM crear_asiento(
            NEW.condominio_id,
            CURRENT_DATE,
            'Emision recibo ' || NEW.periodo::TEXT || ' - Unidad ' || (SELECT numero FROM unidades WHERE id = NEW.unidad_id),
            'recibo',
            NEW.id,
            v_lineas
          );
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_asiento_recibo ON recibos;
      CREATE TRIGGER trg_asiento_recibo
        AFTER INSERT ON recibos
        FOR EACH ROW EXECUTE FUNCTION asiento_auto_recibo();
    `
  },
  {
    nombre: 'trigger asiento automático pago',
    sql: `
      CREATE OR REPLACE FUNCTION asiento_auto_pago()
      RETURNS TRIGGER AS $func$
      DECLARE
        v_cuenta_debito TEXT;
        v_recibo_periodo DATE;
        v_unidad_num TEXT;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
            RETURN NEW;
          END IF;

          v_cuenta_debito := CASE WHEN NEW.metodo = 'efectivo' THEN '1.1.1' ELSE '1.1.2' END;

          SELECT r.periodo, u.numero
          INTO v_recibo_periodo, v_unidad_num
          FROM recibos r
          JOIN unidades u ON u.id = r.unidad_id
          WHERE r.id = NEW.recibo_id;

          PERFORM crear_asiento(
            NEW.condominio_id,
            NEW.fecha_pago,
            'Pago recibido - ' || NEW.metodo::TEXT || ' - Unidad ' || COALESCE(v_unidad_num, '?') || ' periodo ' || COALESCE(v_recibo_periodo::TEXT, '?'),
            'pago',
            NEW.id,
            jsonb_build_array(
              jsonb_build_object('codigo', v_cuenta_debito, 'debe', NEW.monto, 'haber', 0),
              jsonb_build_object('codigo', '1.1.3',         'debe', 0, 'haber', NEW.monto)
            )
          );
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_asiento_pago ON pagos;
      CREATE TRIGGER trg_asiento_pago
        AFTER INSERT ON pagos
        FOR EACH ROW EXECUTE FUNCTION asiento_auto_pago();
    `
  },
  {
    nombre: 'trigger asiento automático gasto',
    sql: `
      CREATE OR REPLACE FUNCTION asiento_auto_gasto()
      RETURNS TRIGGER AS $func$
      DECLARE
        v_codigo_gasto TEXT;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
            RETURN NEW;
          END IF;

          v_codigo_gasto := mapear_cuenta_gasto(NEW.categoria);

          PERFORM crear_asiento(
            NEW.condominio_id,
            NEW.fecha,
            'Gasto: ' || NEW.descripcion,
            'gasto',
            NEW.id,
            jsonb_build_array(
              jsonb_build_object('codigo', v_codigo_gasto, 'debe', NEW.monto, 'haber', 0),
              jsonb_build_object('codigo', '1.1.1',        'debe', 0, 'haber', NEW.monto)
            )
          );
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_asiento_gasto ON gastos;
      CREATE TRIGGER trg_asiento_gasto
        AFTER INSERT ON gastos
        FOR EACH ROW EXECUTE FUNCTION asiento_auto_gasto();
    `
  },
  {
    nombre: 'poblar plan de cuentas condominios existentes',
    sql: `
      DO $do$
      DECLARE
        v_condo RECORD;
      BEGIN
        FOR v_condo IN SELECT id FROM condominios WHERE estado != 'inactivo'
        LOOP
          PERFORM poblar_plan_cuentas(v_condo.id);
        END LOOP;
      END;
      $do$;
    `
  }
]

async function run() {
  console.log('=== Migración 007: Módulo Contable ===\n')

  for (const bloque of bloques) {
    process.stdout.write(`  ${bloque.nombre}... `)

    const { error } = await supabase.rpc('exec_sql', { sql: bloque.sql })

    if (error) {
      console.error(`ERROR: ${error.message}`)
      console.log('\n--- EJECUTAR EL SQL DE supabase/migrations/007_modulo_contable.sql EN SUPABASE SQL EDITOR ---\n')
      process.exit(1)
    }

    console.log('OK')
  }

  // Verificar
  const { data, error: verr } = await supabase.from('plan_cuentas').select('id', { count: 'exact', head: true })
  if (verr) {
    console.log(`\nVerificación: error al consultar plan_cuentas: ${verr.message}`)
  } else {
    console.log(`\n✓ Migración completada. Tablas creadas y plan de cuentas poblado.`)
  }
}

run().catch(console.error)
