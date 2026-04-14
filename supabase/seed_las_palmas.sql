-- ============================================
-- SEED QA: Residencial Las Palmas (v2 — UUIDs válidos)
-- Condominio completo con todos los escenarios operativos
-- ============================================
-- IMPORTANTE: Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/ncrjcbwxlzhgswvwfhzu/sql

-- Limpiar datos anteriores del seed si existen
DELETE FROM turnos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM guardias WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM reservas WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM pagos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM recibos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM mantenimientos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM gastos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM residentes WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM areas_comunes WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM cuotas WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM unidades WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM edificios WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
DELETE FROM condominios WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- También limpiar el ID viejo si quedó
DELETE FROM turnos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM guardias WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM reservas WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM pagos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM recibos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM mantenimientos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM gastos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM residentes WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM areas_comunes WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM cuotas WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM unidades WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM edificios WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM condominios WHERE id = '33333333-3333-3333-3333-333333333333';

-- ━━━ CONDOMINIO ━━━
INSERT INTO condominios (id, nombre, direccion, ciudad, departamento, estado, recargo_mora_porcentaje) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Residencial Las Palmas', 'Av. Bánzer 4to Anillo', 'Santa Cruz de la Sierra', 'Santa Cruz', 'activo', 2.00);

-- ━━━ EDIFICIO ━━━
INSERT INTO edificios (id, condominio_id, nombre, numero_pisos) VALUES
  ('aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Torre Principal', 4);

-- ━━━ 10 UNIDADES ━━━
INSERT INTO unidades (id, edificio_id, condominio_id, numero, piso, tipo, area_m2, activa) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000101', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '101', 1, 'apartamento', 85.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000102', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '102', 1, 'apartamento', 85.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000103', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '103', 1, 'apartamento', 90.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000201', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '201', 2, 'apartamento', 85.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000202', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '202', 2, 'apartamento', 85.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000203', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '203', 2, 'apartamento', 90.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '301', 3, 'apartamento', 95.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '302', 3, 'apartamento', 95.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '401', 4, 'apartamento', 100.0, true),
  ('aaaaaaaa-0000-0000-0000-000000000402', 'aaaaaaaa-0000-0000-eeee-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '402', 4, 'apartamento', 100.0, true);

-- ━━━ CUOTA MENSUAL ━━━
INSERT INTO cuotas (condominio_id, tipo_unidad, monto, descripcion) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'apartamento', 500.00, 'Cuota mensual Las Palmas');

-- ━━━ 9 RESIDENTES ━━━
-- 3 AL DÍA (101,102,103), 3 MOROSOS (201,202,203), 2 PENDIENTES (301,302), 1 S/RECIBO (401), 402 vacía
INSERT INTO residentes (id, unidad_id, condominio_id, tipo, nombre, apellido, ci, telefono, email, estado) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000101', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Carlos', 'Mendoza Rojas', '6234501', '78901234', 'carlos.mendoza@demo.test', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000102', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Ana', 'Flores Terán', '6234502', '78901235', 'ana.flores@demo.test', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000103', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Jorge', 'Peña Soliz', '6234503', '78901236', 'jorge.pena@demo.test', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000201', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Laura', 'Vidal Choque', '6234504', '78901237', 'laura.vidal@demo.test', 'moroso'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000202', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Pedro', 'Suárez Arancibia', '6234505', '78901238', 'pedro.suarez@demo.test', 'moroso'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000203', 'aaaaaaaa-0000-0000-0000-000000000001', 'inquilino', 'Rosa', 'Quispe Mamani', '6234506', '78901239', 'rosa.quispe@demo.test', 'moroso'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000301', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Miguel', 'Torres Delgado', '6234507', '78901240', 'miguel.torres@demo.test', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000302', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Sofía', 'Castro Jiménez', '6234508', '78901241', 'sofia.castro@demo.test', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000401', 'aaaaaaaa-0000-0000-0000-000000000001', 'propietario', 'Diego', 'Guzmán Ríos', '6234509', '78901242', 'diego.guzman@demo.test', 'activo');
-- Unidad 402: sin residente (s/recibo)

-- ━━━ RECIBOS FEBRERO 2026 ━━━
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  ('cccccccc-0000-0000-0201-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000101', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000102', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000103', 'bbbbbbbb-0000-0000-0000-000000000003', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000201', 'bbbbbbbb-0000-0000-0000-000000000004', '2026-02-01', 500, 500, 'vencido', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000202', 'bbbbbbbb-0000-0000-0000-000000000005', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000203', 'bbbbbbbb-0000-0000-0000-000000000006', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000301', 'bbbbbbbb-0000-0000-0000-000000000007', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  ('cccccccc-0000-0000-0201-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000302', 'bbbbbbbb-0000-0000-0000-000000000008', '2026-02-01', 500, 500, 'pagado', '2026-02-15');

-- ━━━ RECIBOS MARZO 2026 ━━━
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  ('cccccccc-0000-0000-0301-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000101', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000102', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000103', 'bbbbbbbb-0000-0000-0000-000000000003', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000201', 'bbbbbbbb-0000-0000-0000-000000000004', '2026-03-01', 500, 500, 'vencido', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000202', 'bbbbbbbb-0000-0000-0000-000000000005', '2026-03-01', 500, 500, 'vencido', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000203', 'bbbbbbbb-0000-0000-0000-000000000006', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000301', 'bbbbbbbb-0000-0000-0000-000000000007', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  ('cccccccc-0000-0000-0301-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000302', 'bbbbbbbb-0000-0000-0000-000000000008', '2026-03-01', 500, 500, 'pagado', '2026-03-15');

-- ━━━ RECIBOS ABRIL 2026 (mes actual) ━━━
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  ('cccccccc-0000-0000-0401-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000101', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000102', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000103', 'bbbbbbbb-0000-0000-0000-000000000003', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000201', 'bbbbbbbb-0000-0000-0000-000000000004', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000202', 'bbbbbbbb-0000-0000-0000-000000000005', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000203', 'bbbbbbbb-0000-0000-0000-000000000006', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  ('cccccccc-0000-0000-0401-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000301', 'bbbbbbbb-0000-0000-0000-000000000007', '2026-04-01', 500, 500, 'emitido', '2026-04-30'),
  ('cccccccc-0000-0000-0401-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000302', 'bbbbbbbb-0000-0000-0000-000000000008', '2026-04-01', 500, 500, 'emitido', '2026-04-30');

-- ━━━ PAGOS CONFIRMADOS ━━━
-- Admin user_id: 20ef331a-2693-4e9c-827f-e5d6961180c7
-- Febrero: 7 pagos (101-103, 202, 203, 301, 302)
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at) VALUES
  ('dddddddd-0000-0000-0201-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 500, '2026-02-10', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-10T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 500, '2026-02-10', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-10T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000003', 'bbbbbbbb-0000-0000-0000-000000000003', 500, '2026-02-12', 'qr', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-12T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000005', 'bbbbbbbb-0000-0000-0000-000000000005', 500, '2026-02-08', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-08T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000006', 'bbbbbbbb-0000-0000-0000-000000000006', 500, '2026-02-09', 'efectivo', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-09T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000007', 'bbbbbbbb-0000-0000-0000-000000000007', 500, '2026-02-10', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-10T10:00:00Z'),
  ('dddddddd-0000-0000-0201-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0201-000000000008', 'bbbbbbbb-0000-0000-0000-000000000008', 500, '2026-02-11', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-11T10:00:00Z');

-- Marzo: 6 pagos (101-103, 203, 301, 302)
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at) VALUES
  ('dddddddd-0000-0000-0301-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 500, '2026-03-05', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-05T10:00:00Z'),
  ('dddddddd-0000-0000-0301-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 500, '2026-03-06', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-06T10:00:00Z'),
  ('dddddddd-0000-0000-0301-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000003', 'bbbbbbbb-0000-0000-0000-000000000003', 500, '2026-03-07', 'qr', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-07T10:00:00Z'),
  ('dddddddd-0000-0000-0301-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000006', 'bbbbbbbb-0000-0000-0000-000000000006', 500, '2026-03-08', 'efectivo', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-08T10:00:00Z'),
  ('dddddddd-0000-0000-0301-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000007', 'bbbbbbbb-0000-0000-0000-000000000007', 500, '2026-03-09', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-09T10:00:00Z'),
  ('dddddddd-0000-0000-0301-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0301-000000000008', 'bbbbbbbb-0000-0000-0000-000000000008', 500, '2026-03-10', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-10T10:00:00Z');

-- Abril: 3 pagos (101-103)
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at) VALUES
  ('dddddddd-0000-0000-0401-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0401-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 500, '2026-04-03', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-04-03T10:00:00Z'),
  ('dddddddd-0000-0000-0401-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0401-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 500, '2026-04-04', 'qr', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-04-04T10:00:00Z'),
  ('dddddddd-0000-0000-0401-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0401-000000000003', 'bbbbbbbb-0000-0000-0000-000000000003', 500, '2026-04-05', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-04-05T10:00:00Z');

-- ━━━ GASTOS ABRIL 2026 ━━━
INSERT INTO gastos (id, condominio_id, categoria, descripcion, monto, fecha) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'limpieza', 'Limpieza áreas comunes — abril', 300, '2026-04-03'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'mantenimiento', 'Reparación bomba de agua', 220, '2026-04-07'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'mantenimiento', 'Pintura pasillo piso 3', 400, '2026-04-12'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'mantenimiento', 'Jardinería mensual', 150, '2026-04-10');

-- ━━━ TICKETS MANTENIMIENTO ━━━
INSERT INTO mantenimientos (id, condominio_id, unidad_id, titulo, descripcion, prioridad, estado, created_at) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000201', 'Fuga de agua en baño principal', 'Se detectó una fuga de agua en el baño del departamento 201.', 'urgente', 'en_proceso', '2026-04-10T08:00:00Z'),
  ('ffffffff-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Luz quemada pasillo piso 2', 'La luz del pasillo del segundo piso está quemada.', 'media', 'en_proceso', '2026-04-11T09:00:00Z'),
  ('ffffffff-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Pintura lobby principal', 'El lobby necesita repintado.', 'media', 'pendiente', '2026-04-12T10:00:00Z'),
  ('ffffffff-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Ascensor revisión anual', 'Revisión técnica anual del ascensor.', 'media', 'resuelto', '2026-04-01T08:00:00Z'),
  ('ffffffff-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', NULL, 'Portón eléctrico con falla', 'El portón eléctrico no abre correctamente.', 'urgente', 'pendiente', '2026-04-13T14:00:00Z');

-- ━━━ ÁREAS COMUNES ━━━
INSERT INTO areas_comunes (id, condominio_id, nombre, capacidad, horario_inicio, horario_fin, tarifa, requiere_aprobacion, activa) VALUES
  ('aabbccdd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Salón de Eventos', 50, '08:00', '22:00', 200.00, true, true),
  ('aabbccdd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Piscina', 20, '08:00', '20:00', 0.00, true, true),
  ('aabbccdd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'BBQ', 15, '10:00', '22:00', 100.00, true, true);

-- ━━━ RESERVAS ━━━
INSERT INTO reservas (id, condominio_id, area_comun_id, residente_id, unidad_id, fecha, hora_inicio, hora_fin, estado, motivo, cobro) VALUES
  ('aabbccdd-0000-0000-aaaa-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aabbccdd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000101', '2026-04-19', '18:00', '22:00', 'aprobada', 'Cumpleaños familiar', 200),
  ('aabbccdd-0000-0000-aaaa-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aabbccdd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000103', '2026-04-20', '10:00', '14:00', 'aprobada', 'Reunión con amigos', 0),
  ('aabbccdd-0000-0000-aaaa-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'aabbccdd-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000202', '2026-04-26', '12:00', '18:00', 'pendiente', 'Asado familiar', 100),
  ('aabbccdd-0000-0000-aaaa-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'aabbccdd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000301', '2026-05-03', '10:00', '14:00', 'pendiente', 'Reunión de vecinos', 200);

-- ━━━ GUARDIAS ━━━
INSERT INTO guardias (id, condominio_id, nombre, apellido, ci, telefono, empresa, habilitacion_dgsc, activo) VALUES
  ('aabbccdd-0000-0000-bbbb-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Juan', 'Mamani Condori', '4567890', '76543211', 'Seguridad Total SRL', 'DGSC-2024-1234', true),
  ('aabbccdd-0000-0000-bbbb-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Carlos', 'Ríos Escalante', '4567891', '76543212', 'Seguridad Total SRL', 'DGSC-2024-1235', true);

-- ━━━ TURNOS HOY ━━━
INSERT INTO turnos (id, guardia_id, condominio_id, tipo, fecha, hora_programada_inicio, hora_programada_fin, estado) VALUES
  ('aabbccdd-0000-0000-cccc-000000000001', 'aabbccdd-0000-0000-bbbb-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'manana', CURRENT_DATE::text, '07:00', '19:00', 'activo'),
  ('aabbccdd-0000-0000-cccc-000000000002', 'aabbccdd-0000-0000-bbbb-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'noche', CURRENT_DATE::text, '19:00', '07:00', 'programado');

-- ━━━ VERIFICACIÓN ━━━
SELECT 'condominios' as tabla, count(*)::int as n FROM condominios WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'unidades', count(*)::int FROM unidades WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'residentes', count(*)::int FROM residentes WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'recibos', count(*)::int FROM recibos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'pagos', count(*)::int FROM pagos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'gastos', count(*)::int FROM gastos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'tickets', count(*)::int FROM mantenimientos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'reservas', count(*)::int FROM reservas WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'guardias', count(*)::int FROM guardias WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001'
UNION ALL SELECT 'turnos', count(*)::int FROM turnos WHERE condominio_id = 'aaaaaaaa-0000-0000-0000-000000000001';
