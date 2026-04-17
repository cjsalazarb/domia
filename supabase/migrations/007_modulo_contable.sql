-- ============================================================
-- 007 — Módulo Contable (normas contables bolivianas)
-- 5 tablas: plan_cuentas, asientos_contables, asiento_detalles,
--           arqueos_caja, arqueo_denominaciones
-- ============================================================

-- ─── ENUM para estado de arqueo ───
CREATE TYPE estado_arqueo AS ENUM ('conforme', 'con_diferencia');

-- ─── ENUM para tipo de cuenta contable ───
CREATE TYPE tipo_cuenta AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto');

-- ─── ENUM para referencia de asiento automático ───
CREATE TYPE referencia_contable AS ENUM ('recibo', 'pago', 'gasto', 'arqueo', 'manual');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. PLAN DE CUENTAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE plan_cuentas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,            -- ej: '1.1.1', '4.2'
  nombre        TEXT NOT NULL,
  tipo          tipo_cuenta NOT NULL,     -- activo, pasivo, patrimonio, ingreso, gasto
  grupo         TEXT NOT NULL,            -- ej: 'Activo Corriente', 'Egresos'
  nivel         INT NOT NULL DEFAULT 1,   -- 1=grupo, 2=subgrupo, 3=cuenta
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(condominio_id, codigo)
);

CREATE INDEX idx_plan_cuentas_condominio ON plan_cuentas(condominio_id);
CREATE INDEX idx_plan_cuentas_tipo ON plan_cuentas(condominio_id, tipo);
CREATE INDEX idx_plan_cuentas_codigo ON plan_cuentas(condominio_id, codigo);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. ASIENTOS CONTABLES (cabecera)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE asientos_contables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id   UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  numero          INT NOT NULL,             -- secuencial por condominio
  fecha           DATE NOT NULL,
  descripcion     TEXT NOT NULL,
  referencia_tipo referencia_contable NOT NULL DEFAULT 'manual',
  referencia_id   UUID,                     -- id del recibo, pago, gasto o arqueo origen
  creado_por      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(condominio_id, numero)
);

CREATE INDEX idx_asientos_condominio ON asientos_contables(condominio_id);
CREATE INDEX idx_asientos_fecha ON asientos_contables(condominio_id, fecha);
CREATE INDEX idx_asientos_referencia ON asientos_contables(referencia_tipo, referencia_id);

-- Secuencia automática por condominio
CREATE OR REPLACE FUNCTION asiento_auto_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO NEW.numero
    FROM asientos_contables
    WHERE condominio_id = NEW.condominio_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asiento_auto_numero
  BEFORE INSERT ON asientos_contables
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_numero();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. ASIENTO DETALLES (líneas débito/crédito)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE asiento_detalles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asiento_id UUID NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
  cuenta_id  UUID NOT NULL REFERENCES plan_cuentas(id) ON DELETE RESTRICT,
  debe       DECIMAL(12,2) NOT NULL DEFAULT 0,
  haber      DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_debe_o_haber CHECK (
    (debe > 0 AND haber = 0) OR (debe = 0 AND haber > 0)
  )
);

CREATE INDEX idx_asiento_detalles_asiento ON asiento_detalles(asiento_id);
CREATE INDEX idx_asiento_detalles_cuenta ON asiento_detalles(cuenta_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. ARQUEOS DE CAJA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE arqueos_caja (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id   UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responsable     TEXT NOT NULL,
  saldo_libros    DECIMAL(12,2) NOT NULL,     -- saldo según sistema
  total_contado   DECIMAL(12,2) NOT NULL DEFAULT 0,
  cheques_cartera DECIMAL(12,2) NOT NULL DEFAULT 0,
  comprobantes_pendientes DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_arqueo    DECIMAL(12,2) GENERATED ALWAYS AS (total_contado + cheques_cartera + comprobantes_pendientes) STORED,
  diferencia      DECIMAL(12,2) GENERATED ALWAYS AS ((total_contado + cheques_cartera + comprobantes_pendientes) - saldo_libros) STORED,
  estado          estado_arqueo NOT NULL DEFAULT 'conforme',
  notas           TEXT,
  creado_por      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arqueos_condominio ON arqueos_caja(condominio_id);
CREATE INDEX idx_arqueos_fecha ON arqueos_caja(condominio_id, fecha);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. ARQUEO DENOMINACIONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE arqueo_denominaciones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arqueo_id     UUID NOT NULL REFERENCES arqueos_caja(id) ON DELETE CASCADE,
  denominacion  DECIMAL(6,2) NOT NULL,      -- 200, 100, 50, 20, 10, 5, 2, 1, 0.50
  cantidad      INT NOT NULL DEFAULT 0,
  subtotal      DECIMAL(12,2) GENERATED ALWAYS AS (denominacion * cantidad) STORED
);

CREATE INDEX idx_arqueo_denom_arqueo ON arqueo_denominaciones(arqueo_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS: updated_at + audit
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TRIGGER trg_plan_cuentas_updated_at
  BEFORE UPDATE ON plan_cuentas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_arqueos_caja_updated_at
  BEFORE UPDATE ON arqueos_caja
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_audit_asientos
  AFTER INSERT OR UPDATE OR DELETE ON asientos_contables
  FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();

CREATE TRIGGER trg_audit_arqueos
  AFTER INSERT OR UPDATE OR DELETE ON arqueos_caja
  FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS: solo super_admin y admin_condominio del condominio
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE plan_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE asiento_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueo_denominaciones ENABLE ROW LEVEL SECURITY;

-- plan_cuentas
CREATE POLICY "plan_cuentas_select" ON plan_cuentas FOR SELECT USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "plan_cuentas_insert" ON plan_cuentas FOR INSERT WITH CHECK (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "plan_cuentas_update" ON plan_cuentas FOR UPDATE USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- asientos_contables
CREATE POLICY "asientos_select" ON asientos_contables FOR SELECT USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "asientos_insert" ON asientos_contables FOR INSERT WITH CHECK (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "asientos_update" ON asientos_contables FOR UPDATE USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- asiento_detalles (hereda acceso a través del asiento padre)
CREATE POLICY "asiento_detalles_select" ON asiento_detalles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM asientos_contables a
    WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
  )
);
CREATE POLICY "asiento_detalles_insert" ON asiento_detalles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM asientos_contables a
    WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
  )
);
CREATE POLICY "asiento_detalles_update" ON asiento_detalles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM asientos_contables a
    WHERE a.id = asiento_detalles.asiento_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
  )
);

-- arqueos_caja
CREATE POLICY "arqueos_select" ON arqueos_caja FOR SELECT USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "arqueos_insert" ON arqueos_caja FOR INSERT WITH CHECK (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);
CREATE POLICY "arqueos_update" ON arqueos_caja FOR UPDATE USING (
  es_super_admin()
  OR (get_mi_rol() = 'admin_condominio' AND condominio_id = get_mi_condominio())
);

-- arqueo_denominaciones (hereda acceso a través del arqueo padre)
CREATE POLICY "arqueo_denom_select" ON arqueo_denominaciones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM arqueos_caja a
    WHERE a.id = arqueo_denominaciones.arqueo_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
  )
);
CREATE POLICY "arqueo_denom_insert" ON arqueo_denominaciones FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM arqueos_caja a
    WHERE a.id = arqueo_denominaciones.arqueo_id
    AND (es_super_admin() OR (get_mi_rol() = 'admin_condominio' AND a.condominio_id = get_mi_condominio()))
  )
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIÓN: Poblar plan de cuentas predeterminado para un condominio
-- Llamar: SELECT poblar_plan_cuentas('uuid-del-condominio');
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION poblar_plan_cuentas(p_condominio_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar que no existan cuentas ya
  IF EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = p_condominio_id) THEN
    RAISE NOTICE 'El condominio ya tiene plan de cuentas, omitiendo.';
    RETURN;
  END IF;

  INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel) VALUES
    -- ── 1. ACTIVO ──
    (p_condominio_id, '1',     'ACTIVO',                                    'activo',     'Activo',              1),
    (p_condominio_id, '1.1',   'Activo Corriente',                          'activo',     'Activo Corriente',    2),
    (p_condominio_id, '1.1.1', 'Caja',                                      'activo',     'Activo Corriente',    3),
    (p_condominio_id, '1.1.2', 'Banco',                                     'activo',     'Activo Corriente',    3),
    (p_condominio_id, '1.1.3', 'Cuentas por Cobrar - Cuotas de Mantenimiento', 'activo',  'Activo Corriente',    3),
    (p_condominio_id, '1.1.4', 'Cuentas por Cobrar - Recargos por Mora',    'activo',     'Activo Corriente',    3),
    (p_condominio_id, '1.1.5', 'Fondo de Reserva',                          'activo',     'Activo Corriente',    3),
    (p_condominio_id, '1.1.6', 'Anticipos a Proveedores',                   'activo',     'Activo Corriente',    3),
    (p_condominio_id, '1.2',   'Activo No Corriente',                       'activo',     'Activo No Corriente', 2),
    (p_condominio_id, '1.2.1', 'Bienes del Condominio',                     'activo',     'Activo No Corriente', 3),
    (p_condominio_id, '1.2.2', 'Depreciacion Acumulada',                    'activo',     'Activo No Corriente', 3),

    -- ── 2. PASIVO ──
    (p_condominio_id, '2',     'PASIVO',                                    'pasivo',     'Pasivo',              1),
    (p_condominio_id, '2.1',   'Pasivo Corriente',                          'pasivo',     'Pasivo Corriente',    2),
    (p_condominio_id, '2.1.1', 'Cuentas por Pagar - Proveedores',           'pasivo',     'Pasivo Corriente',    3),
    (p_condominio_id, '2.1.2', 'Cuentas por Pagar - Personal',              'pasivo',     'Pasivo Corriente',    3),
    (p_condominio_id, '2.1.3', 'Anticipos Recibidos de Propietarios',       'pasivo',     'Pasivo Corriente',    3),
    (p_condominio_id, '2.1.4', 'Retenciones por Pagar (IT, RC-IVA)',        'pasivo',     'Pasivo Corriente',    3),

    -- ── 3. PATRIMONIO ──
    (p_condominio_id, '3',     'PATRIMONIO',                                'patrimonio', 'Patrimonio',          1),
    (p_condominio_id, '3.1',   'Fondo Patrimonial del Condominio',          'patrimonio', 'Patrimonio',          2),
    (p_condominio_id, '3.2',   'Superavit / Deficit del Ejercicio',         'patrimonio', 'Patrimonio',          2),
    (p_condominio_id, '3.3',   'Resultados Acumulados',                     'patrimonio', 'Patrimonio',          2),

    -- ── 4. INGRESOS ──
    (p_condominio_id, '4',     'INGRESOS',                                  'ingreso',    'Ingresos',            1),
    (p_condominio_id, '4.1',   'Cuotas de Mantenimiento',                   'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.2',   'Recargos por Mora',                         'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.3',   'Ingresos por Reserva de Areas Comunes',     'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.4',   'Otros Ingresos',                            'ingreso',    'Ingresos',            2),

    -- ── 5. EGRESOS / GASTOS ──
    (p_condominio_id, '5',     'EGRESOS / GASTOS',                          'gasto',      'Gastos',              1),
    (p_condominio_id, '5.1',   'Gastos de Limpieza',                        'gasto',      'Gastos',              2),
    (p_condominio_id, '5.2',   'Gastos de Mantenimiento y Reparacion',      'gasto',      'Gastos',              2),
    (p_condominio_id, '5.3',   'Gastos de Personal',                        'gasto',      'Gastos',              2),
    (p_condominio_id, '5.4',   'Gastos de Administracion',                  'gasto',      'Gastos',              2),
    (p_condominio_id, '5.5',   'Gastos de Agua y Luz Areas Comunes',        'gasto',      'Gastos',              2),
    (p_condominio_id, '5.6',   'Gastos de Seguridad',                       'gasto',      'Gastos',              2),
    (p_condominio_id, '5.7',   'Gastos de Jardineria',                      'gasto',      'Gastos',              2),
    (p_condominio_id, '5.8',   'Otros Gastos',                              'gasto',      'Gastos',              2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIÓN: Mapeo categoria_gasto → código de cuenta contable
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION mapear_cuenta_gasto(p_categoria categoria_gasto)
RETURNS TEXT AS $$
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
    ELSE                       '5.8'  -- otro
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIÓN: Crear asiento contable genérico (helper)
-- Retorna el id del asiento creado
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION crear_asiento(
  p_condominio_id UUID,
  p_fecha         DATE,
  p_descripcion   TEXT,
  p_ref_tipo      referencia_contable,
  p_ref_id        UUID,
  p_lineas        JSONB  -- array de {codigo, debe, haber}
)
RETURNS UUID AS $$
DECLARE
  v_asiento_id UUID;
  v_linea      JSONB;
  v_cuenta_id  UUID;
BEGIN
  -- Insertar cabecera (numero se auto-genera por trigger)
  INSERT INTO asientos_contables (condominio_id, numero, fecha, descripcion, referencia_tipo, referencia_id)
  VALUES (p_condominio_id, 0, p_fecha, p_descripcion, p_ref_tipo, p_ref_id)
  RETURNING id INTO v_asiento_id;

  -- Insertar líneas
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGER: Asiento automático al emitir recibo
-- DÉBITO  1.1.3 Cuentas por Cobrar (monto_base)
-- CRÉDITO 4.1   Cuotas de Mantenimiento
-- Si hay recargo de mora:
-- DÉBITO  1.1.4 Cuentas por Cobrar - Recargos
-- CRÉDITO 4.2   Recargos por Mora
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION asiento_auto_recibo()
RETURNS TRIGGER AS $$
DECLARE
  v_lineas JSONB;
BEGIN
  -- Solo en INSERT con estado 'emitido'
  IF TG_OP = 'INSERT' AND NEW.estado = 'emitido' THEN
    -- Verificar que el condominio tenga plan de cuentas
    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
      RETURN NEW;
    END IF;

    v_lineas := jsonb_build_array(
      jsonb_build_object('codigo', '1.1.3', 'debe', NEW.monto_base, 'haber', 0),
      jsonb_build_object('codigo', '4.1',   'debe', 0, 'haber', NEW.monto_base)
    );

    -- Si hay recargo por mora
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_asiento_recibo
  AFTER INSERT ON recibos
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_recibo();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGER: Asiento automático al registrar pago
-- DÉBITO  1.1.1 Caja o 1.1.2 Banco (según método)
-- CRÉDITO 1.1.3 Cuentas por Cobrar
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION asiento_auto_pago()
RETURNS TRIGGER AS $$
DECLARE
  v_cuenta_debito TEXT;
  v_recibo_periodo DATE;
  v_unidad_num TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
      RETURN NEW;
    END IF;

    -- Efectivo → Caja, todo lo demás → Banco
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_asiento_pago
  AFTER INSERT ON pagos
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_pago();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGER: Asiento automático al registrar gasto
-- DÉBITO  5.x cuenta según categoría
-- CRÉDITO 1.1.1 Caja (por defecto)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION asiento_auto_gasto()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_asiento_gasto
  AFTER INSERT ON gastos
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_gasto();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- POBLAR plan de cuentas para condominios activos existentes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_condo RECORD;
BEGIN
  FOR v_condo IN SELECT id FROM condominios WHERE estado != 'inactivo'
  LOOP
    PERFORM poblar_plan_cuentas(v_condo.id);
  END LOOP;
END;
$$;
