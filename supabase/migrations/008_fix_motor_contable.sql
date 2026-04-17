-- ============================================================
-- 008 — Fix motor contable: mapeo correcto + migración histórica
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. LIMPIAR asientos vacíos (si hubiera) y resetear
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELETE FROM asiento_detalles;
DELETE FROM asientos_contables;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. REEMPLAZAR trigger de RECIBO EMITIDO
--    Ya no genera asiento al emitir.
--    Los ingresos se reconocen al COBRAR (pago), no al facturar.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP TRIGGER IF EXISTS trg_asiento_recibo ON recibos;

CREATE OR REPLACE FUNCTION asiento_auto_recibo()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar asiento de MORA cuando un recibo tiene monto_recargo > 0
  -- y cambia a estado 'vencido' (mora generada)
  IF TG_OP = 'UPDATE'
     AND NEW.estado = 'vencido'
     AND OLD.estado != 'vencido'
     AND NEW.monto_recargo > 0 THEN

    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
      RETURN NEW;
    END IF;

    PERFORM crear_asiento(
      NEW.condominio_id,
      CURRENT_DATE,
      'Mora registrada - Unidad ' || (SELECT numero FROM unidades WHERE id = NEW.unidad_id) || ' - ' || NEW.periodo::TEXT,
      'recibo',
      NEW.id,
      jsonb_build_array(
        jsonb_build_object('codigo', '1.1.4', 'debe', NEW.monto_recargo, 'haber', 0),
        jsonb_build_object('codigo', '4.2',   'debe', 0, 'haber', NEW.monto_recargo)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_asiento_recibo
  AFTER UPDATE ON recibos
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_recibo();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. REEMPLAZAR trigger de PAGO
--    Pago de cuota: D:Caja/Banco  C:4.1 Cuotas de Mantenimiento
--    Si el recibo tenía mora y se paga completo:
--       línea adicional D:Caja/Banco  C:1.1.4 CxC Mora
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP TRIGGER IF EXISTS trg_asiento_pago ON pagos;

CREATE OR REPLACE FUNCTION asiento_auto_pago()
RETURNS TRIGGER AS $$
DECLARE
  v_cuenta_debito TEXT;
  v_unidad_num TEXT;
  v_residente TEXT;
  v_lineas JSONB;
  v_monto_cuota DECIMAL;
  v_monto_mora DECIMAL;
  v_monto_base DECIMAL;
  v_monto_recargo DECIMAL;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = NEW.condominio_id LIMIT 1) THEN
      RETURN NEW;
    END IF;

    -- Determinar cuenta de caja/banco
    v_cuenta_debito := CASE WHEN NEW.metodo = 'efectivo' THEN '1.1.1' ELSE '1.1.2' END;

    -- Obtener datos del recibo
    SELECT r.monto_base, r.monto_recargo, u.numero,
           (res.nombre || ' ' || res.apellido)
    INTO v_monto_base, v_monto_recargo, v_unidad_num, v_residente
    FROM recibos r
    JOIN unidades u ON u.id = r.unidad_id
    JOIN residentes res ON res.id = r.residente_id
    WHERE r.id = NEW.recibo_id;

    -- Calcular cuánto va a cuota y cuánto a mora
    v_monto_cuota := LEAST(NEW.monto, v_monto_base);
    v_monto_mora := GREATEST(0, NEW.monto - v_monto_base);
    IF v_monto_mora > v_monto_recargo THEN
      v_monto_mora := v_monto_recargo;
    END IF;

    -- Línea principal: pago de cuota
    v_lineas := jsonb_build_array(
      jsonb_build_object('codigo', v_cuenta_debito, 'debe', v_monto_cuota, 'haber', 0),
      jsonb_build_object('codigo', '4.1',           'debe', 0, 'haber', v_monto_cuota)
    );

    -- Línea de mora si aplica
    IF v_monto_mora > 0 THEN
      v_lineas := v_lineas || jsonb_build_array(
        jsonb_build_object('codigo', v_cuenta_debito, 'debe', v_monto_mora, 'haber', 0),
        jsonb_build_object('codigo', '1.1.4',         'debe', 0, 'haber', v_monto_mora)
      );
    END IF;

    PERFORM crear_asiento(
      NEW.condominio_id,
      NEW.fecha_pago,
      'Pago cuota mantenimiento - Unidad ' || COALESCE(v_unidad_num, '?') || ' - ' || COALESCE(v_residente, '?'),
      'pago',
      NEW.id,
      v_lineas
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_asiento_pago
  AFTER INSERT ON pagos
  FOR EACH ROW EXECUTE FUNCTION asiento_auto_pago();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. REEMPLAZAR trigger de GASTO
--    Registro de gasto: D:5.x gasto  C:2.1.1 CxP Proveedores
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP TRIGGER IF EXISTS trg_asiento_gasto ON gastos;

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
      'Gasto ' || NEW.categoria || ' - ' || NEW.descripcion,
      'gasto',
      NEW.id,
      jsonb_build_array(
        jsonb_build_object('codigo', v_codigo_gasto, 'debe', NEW.monto, 'haber', 0),
        jsonb_build_object('codigo', '2.1.1',        'debe', 0, 'haber', NEW.monto)
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
-- 5. MIGRACIÓN HISTÓRICA
--    Procesar todos los datos existentes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  v_pago RECORD;
  v_gasto RECORD;
  v_recibo RECORD;
  v_cuenta_debito TEXT;
  v_codigo_gasto TEXT;
  v_lineas JSONB;
  v_monto_cuota DECIMAL;
  v_monto_mora DECIMAL;
  v_unidad_num TEXT;
  v_residente TEXT;
  v_count_pagos INT := 0;
  v_count_gastos INT := 0;
  v_count_moras INT := 0;
BEGIN
  RAISE NOTICE '=== MIGRACIÓN HISTÓRICA DE ASIENTOS ===';

  -- ── A. Procesar PAGOS existentes ──
  FOR v_pago IN
    SELECT p.*, r.periodo, r.monto_base, r.monto_recargo,
           u.numero AS unidad_num,
           (res.nombre || ' ' || res.apellido) AS residente_nombre
    FROM pagos p
    JOIN recibos r ON r.id = p.recibo_id
    JOIN unidades u ON u.id = r.unidad_id
    JOIN residentes res ON res.id = r.residente_id
    ORDER BY p.fecha_pago
  LOOP
    -- Verificar que no exista ya un asiento para este pago
    IF EXISTS (SELECT 1 FROM asientos_contables WHERE referencia_tipo = 'pago' AND referencia_id = v_pago.id) THEN
      CONTINUE;
    END IF;

    -- Verificar que el condominio tenga plan de cuentas
    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = v_pago.condominio_id LIMIT 1) THEN
      CONTINUE;
    END IF;

    v_cuenta_debito := CASE WHEN v_pago.metodo = 'efectivo' THEN '1.1.1' ELSE '1.1.2' END;

    v_monto_cuota := LEAST(v_pago.monto, v_pago.monto_base);
    v_monto_mora := GREATEST(0, v_pago.monto - v_pago.monto_base);
    IF v_monto_mora > v_pago.monto_recargo THEN
      v_monto_mora := v_pago.monto_recargo;
    END IF;

    v_lineas := jsonb_build_array(
      jsonb_build_object('codigo', v_cuenta_debito, 'debe', v_monto_cuota, 'haber', 0),
      jsonb_build_object('codigo', '4.1',           'debe', 0, 'haber', v_monto_cuota)
    );

    IF v_monto_mora > 0 THEN
      v_lineas := v_lineas || jsonb_build_array(
        jsonb_build_object('codigo', v_cuenta_debito, 'debe', v_monto_mora, 'haber', 0),
        jsonb_build_object('codigo', '1.1.4',         'debe', 0, 'haber', v_monto_mora)
      );
    END IF;

    PERFORM crear_asiento(
      v_pago.condominio_id,
      v_pago.fecha_pago,
      'Pago cuota mantenimiento - Unidad ' || v_pago.unidad_num || ' - ' || v_pago.residente_nombre,
      'pago',
      v_pago.id,
      v_lineas
    );

    v_count_pagos := v_count_pagos + 1;
  END LOOP;

  RAISE NOTICE 'Pagos migrados: %', v_count_pagos;

  -- ── B. Procesar GASTOS existentes ──
  FOR v_gasto IN
    SELECT * FROM gastos ORDER BY fecha
  LOOP
    IF EXISTS (SELECT 1 FROM asientos_contables WHERE referencia_tipo = 'gasto' AND referencia_id = v_gasto.id) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = v_gasto.condominio_id LIMIT 1) THEN
      CONTINUE;
    END IF;

    v_codigo_gasto := mapear_cuenta_gasto(v_gasto.categoria);

    PERFORM crear_asiento(
      v_gasto.condominio_id,
      v_gasto.fecha,
      'Gasto ' || v_gasto.categoria || ' - ' || v_gasto.descripcion,
      'gasto',
      v_gasto.id,
      jsonb_build_array(
        jsonb_build_object('codigo', v_codigo_gasto, 'debe', v_gasto.monto, 'haber', 0),
        jsonb_build_object('codigo', '2.1.1',        'debe', 0, 'haber', v_gasto.monto)
      )
    );

    v_count_gastos := v_count_gastos + 1;
  END LOOP;

  RAISE NOTICE 'Gastos migrados: %', v_count_gastos;

  -- ── C. Procesar MORAS existentes (recibos vencidos con monto_recargo > 0) ──
  FOR v_recibo IN
    SELECT r.*, u.numero AS unidad_num
    FROM recibos r
    JOIN unidades u ON u.id = r.unidad_id
    WHERE r.estado = 'vencido'
      AND r.monto_recargo > 0
    ORDER BY r.periodo
  LOOP
    IF EXISTS (SELECT 1 FROM asientos_contables WHERE referencia_tipo = 'recibo' AND referencia_id = v_recibo.id) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM plan_cuentas WHERE condominio_id = v_recibo.condominio_id LIMIT 1) THEN
      CONTINUE;
    END IF;

    PERFORM crear_asiento(
      v_recibo.condominio_id,
      v_recibo.periodo,
      'Mora registrada - Unidad ' || v_recibo.unidad_num || ' - ' || v_recibo.periodo::TEXT,
      'recibo',
      v_recibo.id,
      jsonb_build_array(
        jsonb_build_object('codigo', '1.1.4', 'debe', v_recibo.monto_recargo, 'haber', 0),
        jsonb_build_object('codigo', '4.2',   'debe', 0, 'haber', v_recibo.monto_recargo)
      )
    );

    v_count_moras := v_count_moras + 1;
  END LOOP;

  RAISE NOTICE 'Moras migradas: %', v_count_moras;
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
  RAISE NOTICE 'Total asientos creados: %', v_count_pagos + v_count_gastos + v_count_moras;
END;
$$;
