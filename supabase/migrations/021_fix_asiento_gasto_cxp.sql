-- 021: Fix asiento auto de gastos — creditar CxP Proveedores en vez de Caja
-- Para que el flujo correcto sea:
--   1. Al registrar gasto: D: Cuenta de gasto / C: 2.1.1 CxP Proveedores
--   2. Al pagar gasto:     D: 2.1.1 CxP Proveedores / C: 1.1.1 Caja o 1.1.2 Banco

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
        jsonb_build_object('codigo', '2.1.1',        'debe', 0, 'haber', NEW.monto)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
