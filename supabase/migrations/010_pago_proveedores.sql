-- ============================================================
-- 010 — Pago a proveedores: tracking de pagos parciales/totales
-- Agrega monto_pagado a gastos para saber cuánto se ha liquidado
-- ============================================================

ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS monto_pagado DECIMAL(10,2) NOT NULL DEFAULT 0;
