-- ============================================================
-- 009 — Plan de Cuentas: personería jurídica + gestión manual
-- Agrega campo tiene_personeria_juridica a condominios
-- Reemplaza poblar_plan_cuentas con versión paramétrica
-- Agrega columna is_custom para cuentas creadas manualmente
-- ============================================================

-- ─── 1. Nueva columna en condominios ───
ALTER TABLE condominios
  ADD COLUMN IF NOT EXISTS tiene_personeria_juridica BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 2. Nueva columna is_custom en plan_cuentas ───
ALTER TABLE plan_cuentas
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 3. Reemplazar función poblar_plan_cuentas ───
-- Ahora acepta parámetro p_con_personeria (default false)
CREATE OR REPLACE FUNCTION poblar_plan_cuentas(
  p_condominio_id    UUID,
  p_con_personeria   BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  -- Verificar que no existan cuentas ya
  IF EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = p_condominio_id) THEN
    RAISE NOTICE 'El condominio ya tiene plan de cuentas, omitiendo.';
    RETURN;
  END IF;

  -- ═══ PLAN A — Sin personería jurídica (base) ═══
  INSERT INTO plan_cuentas (condominio_id, codigo, nombre, tipo, grupo, nivel) VALUES
    -- ── 1. ACTIVO ──
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

    -- ── 2. PASIVO ──
    (p_condominio_id, '2',     'PASIVO',                                       'pasivo',     'Pasivo',              1),
    (p_condominio_id, '2.1',   'Pasivo Corriente',                             'pasivo',     'Pasivo Corriente',    2),
    (p_condominio_id, '2.1.1', 'Cuentas por Pagar — Proveedores',              'pasivo',     'Pasivo Corriente',    3),
    (p_condominio_id, '2.1.2', 'Cuentas por Pagar — Personal',                 'pasivo',     'Pasivo Corriente',    3),
    (p_condominio_id, '2.1.3', 'Anticipos Recibidos de Propietarios',          'pasivo',     'Pasivo Corriente',    3),

    -- ── 3. PATRIMONIO ──
    (p_condominio_id, '3',     'PATRIMONIO',                                   'patrimonio', 'Patrimonio',          1),
    (p_condominio_id, '3.1',   'Fondo Comunal',                                'patrimonio', 'Patrimonio',          2),
    (p_condominio_id, '3.2',   'Superavit / Deficit del Ejercicio',            'patrimonio', 'Patrimonio',          2),
    (p_condominio_id, '3.3',   'Resultados Acumulados',                        'patrimonio', 'Patrimonio',          2),

    -- ── 4. INGRESOS ──
    (p_condominio_id, '4',     'INGRESOS',                                     'ingreso',    'Ingresos',            1),
    (p_condominio_id, '4.1',   'Cuotas de Mantenimiento',                      'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.2',   'Recargos por Mora',                            'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.3',   'Ingresos por Reserva de Areas Comunes',        'ingreso',    'Ingresos',            2),
    (p_condominio_id, '4.4',   'Otros Ingresos',                               'ingreso',    'Ingresos',            2),

    -- ── 5. EGRESOS / GASTOS ──
    (p_condominio_id, '5',     'EGRESOS / GASTOS',                             'gasto',      'Gastos',              1),
    (p_condominio_id, '5.1',   'Gastos de Limpieza',                           'gasto',      'Gastos',              2),
    (p_condominio_id, '5.2',   'Gastos de Mantenimiento y Reparacion',         'gasto',      'Gastos',              2),
    (p_condominio_id, '5.3',   'Gastos de Personal',                           'gasto',      'Gastos',              2),
    (p_condominio_id, '5.4',   'Gastos de Administracion',                     'gasto',      'Gastos',              2),
    (p_condominio_id, '5.5',   'Gastos de Agua y Luz Areas Comunes',           'gasto',      'Gastos',              2),
    (p_condominio_id, '5.6',   'Gastos de Seguridad',                          'gasto',      'Gastos',              2),
    (p_condominio_id, '5.7',   'Gastos de Jardineria',                         'gasto',      'Gastos',              2),
    (p_condominio_id, '5.8',   'Otros Gastos',                                 'gasto',      'Gastos',              2);

  -- ═══ PLAN B — Cuentas adicionales para personería jurídica ═══
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. Función auxiliar: agregar cuentas tributarias a condominio existente ───
CREATE OR REPLACE FUNCTION agregar_cuentas_personeria(p_condominio_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Solo insertar las que no existan todavía
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

  -- Reactivar si estaban desactivadas
  UPDATE plan_cuentas
  SET activa = TRUE, updated_at = NOW()
  WHERE condominio_id = p_condominio_id
    AND codigo IN ('1.1.7', '2.1.4', '2.1.5', '2.1.6', '2.1.7', '3.4', '4.5', '5.9', '5.10')
    AND activa = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Migrar condominios existentes ───
-- Los condominios existentes que tenían cuenta 2.1.4 (Retenciones por Pagar)
-- probablemente se crearon con el plan completo, así que marcamos como sin personería
-- y la cuenta 2.1.4 original (que combina IT+RC-IVA) se conserva tal cual.
-- No tocamos datos existentes para no romper asientos históricos.
