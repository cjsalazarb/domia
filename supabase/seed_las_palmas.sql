-- ============================================
-- SEED QA: Residencial Las Palmas
-- Condominio completo con todos los escenarios operativos
-- ============================================

-- IDs determinísticos para este condominio
-- Condominio: 33333333-3333-3333-3333-333333333333
-- Edificio:   33333333-3333-3333-3333-eeee00000001
-- Unidades:   33333333-3333-3333-3333-uuuu00000101 .. 402
-- Residentes: 33333333-3333-3333-3333-rrrr00000101 .. 402
-- Guardias:   33333333-3333-3333-3333-gggg00000001 .. 002

-- ━━━ CONDOMINIO ━━━
INSERT INTO condominios (id, nombre, direccion, ciudad, departamento, estado, recargo_mora_porcentaje) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Residencial Las Palmas', 'Av. Bánzer 4to Anillo', 'Santa Cruz de la Sierra', 'Santa Cruz', 'activo', 2.00)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- ━━━ EDIFICIO ━━━
INSERT INTO edificios (id, condominio_id, nombre, numero_pisos) VALUES
  ('33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', 'Torre Principal', 4)
ON CONFLICT (id) DO NOTHING;

-- ━━━ 10 UNIDADES ━━━
INSERT INTO unidades (id, edificio_id, condominio_id, numero, piso, tipo, area_m2, activa) VALUES
  ('33333333-3333-3333-3333-uuuu00000101', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '101', 1, 'apartamento', 85.0, true),
  ('33333333-3333-3333-3333-uuuu00000102', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '102', 1, 'apartamento', 85.0, true),
  ('33333333-3333-3333-3333-uuuu00000103', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '103', 1, 'apartamento', 90.0, true),
  ('33333333-3333-3333-3333-uuuu00000201', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '201', 2, 'apartamento', 85.0, true),
  ('33333333-3333-3333-3333-uuuu00000202', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '202', 2, 'apartamento', 85.0, true),
  ('33333333-3333-3333-3333-uuuu00000203', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '203', 2, 'apartamento', 90.0, true),
  ('33333333-3333-3333-3333-uuuu00000301', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '301', 3, 'apartamento', 95.0, true),
  ('33333333-3333-3333-3333-uuuu00000302', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '302', 3, 'apartamento', 95.0, true),
  ('33333333-3333-3333-3333-uuuu00000401', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '401', 4, 'apartamento', 100.0, true),
  ('33333333-3333-3333-3333-uuuu00000402', '33333333-3333-3333-3333-eeee00000001', '33333333-3333-3333-3333-333333333333', '402', 4, 'apartamento', 100.0, true)
ON CONFLICT (id) DO NOTHING;

-- ━━━ CUOTA MENSUAL ━━━
INSERT INTO cuotas (condominio_id, tipo_unidad, monto, descripcion) VALUES
  ('33333333-3333-3333-3333-333333333333', 'apartamento', 500.00, 'Cuota mensual Las Palmas')
ON CONFLICT DO NOTHING;

-- ━━━ 10 RESIDENTES ━━━
-- 3 AL DÍA, 3 MOROSOS, 2 PENDIENTES, 1 S/RECIBO, 1 sin residente
INSERT INTO residentes (id, unidad_id, condominio_id, tipo, nombre, apellido, ci, telefono, email, estado) VALUES
  ('33333333-3333-3333-3333-rrrr00000101', '33333333-3333-3333-3333-uuuu00000101', '33333333-3333-3333-3333-333333333333', 'propietario', 'Carlos', 'Mendoza Rojas', '6234501', '78901234', 'carlos.mendoza@demo.test', 'activo'),
  ('33333333-3333-3333-3333-rrrr00000102', '33333333-3333-3333-3333-uuuu00000102', '33333333-3333-3333-3333-333333333333', 'propietario', 'Ana', 'Flores Terán', '6234502', '78901235', 'ana.flores@demo.test', 'activo'),
  ('33333333-3333-3333-3333-rrrr00000103', '33333333-3333-3333-3333-uuuu00000103', '33333333-3333-3333-3333-333333333333', 'propietario', 'Jorge', 'Peña Soliz', '6234503', '78901236', 'jorge.pena@demo.test', 'activo'),
  ('33333333-3333-3333-3333-rrrr00000201', '33333333-3333-3333-3333-uuuu00000201', '33333333-3333-3333-3333-333333333333', 'propietario', 'Laura', 'Vidal Choque', '6234504', '78901237', 'laura.vidal@demo.test', 'moroso'),
  ('33333333-3333-3333-3333-rrrr00000202', '33333333-3333-3333-3333-uuuu00000202', '33333333-3333-3333-3333-333333333333', 'propietario', 'Pedro', 'Suárez Arancibia', '6234505', '78901238', 'pedro.suarez@demo.test', 'moroso'),
  ('33333333-3333-3333-3333-rrrr00000203', '33333333-3333-3333-3333-uuuu00000203', '33333333-3333-3333-3333-333333333333', 'inquilino', 'Rosa', 'Quispe Mamani', '6234506', '78901239', 'rosa.quispe@demo.test', 'moroso'),
  ('33333333-3333-3333-3333-rrrr00000301', '33333333-3333-3333-3333-uuuu00000301', '33333333-3333-3333-3333-333333333333', 'propietario', 'Miguel', 'Torres Delgado', '6234507', '78901240', 'miguel.torres@demo.test', 'activo'),
  ('33333333-3333-3333-3333-rrrr00000302', '33333333-3333-3333-3333-uuuu00000302', '33333333-3333-3333-3333-333333333333', 'propietario', 'Sofía', 'Castro Jiménez', '6234508', '78901241', 'sofia.castro@demo.test', 'activo'),
  ('33333333-3333-3333-3333-rrrr00000401', '33333333-3333-3333-3333-uuuu00000401', '33333333-3333-3333-3333-333333333333', 'propietario', 'Diego', 'Guzmán Ríos', '6234509', '78901242', 'diego.guzman@demo.test', 'activo')
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, nombre = EXCLUDED.nombre, apellido = EXCLUDED.apellido;
-- Unidad 402: sin residente asignado (s/recibo)

-- ━━━ RECIBOS ━━━
-- Febrero 2026
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000101', '33333333-3333-3333-3333-rrrr00000101', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000102', '33333333-3333-3333-3333-rrrr00000102', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000103', '33333333-3333-3333-3333-rrrr00000103', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000201', '33333333-3333-3333-3333-rrrr00000201', '2026-02-01', 500, 500, 'vencido', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000202', '33333333-3333-3333-3333-rrrr00000202', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000203', '33333333-3333-3333-3333-rrrr00000203', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000301', '33333333-3333-3333-3333-rrrr00000301', '2026-02-01', 500, 500, 'pagado', '2026-02-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000302', '33333333-3333-3333-3333-rrrr00000302', '2026-02-01', 500, 500, 'pagado', '2026-02-15');

-- Marzo 2026
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000101', '33333333-3333-3333-3333-rrrr00000101', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000102', '33333333-3333-3333-3333-rrrr00000102', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000103', '33333333-3333-3333-3333-rrrr00000103', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000201', '33333333-3333-3333-3333-rrrr00000201', '2026-03-01', 500, 500, 'vencido', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000202', '33333333-3333-3333-3333-rrrr00000202', '2026-03-01', 500, 500, 'vencido', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000203', '33333333-3333-3333-3333-rrrr00000203', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000301', '33333333-3333-3333-3333-rrrr00000301', '2026-03-01', 500, 500, 'pagado', '2026-03-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000302', '33333333-3333-3333-3333-rrrr00000302', '2026-03-01', 500, 500, 'pagado', '2026-03-15');

-- Abril 2026 (mes actual)
INSERT INTO recibos (id, condominio_id, unidad_id, residente_id, periodo, monto_base, monto_total, estado, fecha_vencimiento) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000101', '33333333-3333-3333-3333-rrrr00000101', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000102', '33333333-3333-3333-3333-rrrr00000102', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000103', '33333333-3333-3333-3333-rrrr00000103', '2026-04-01', 500, 500, 'pagado', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000201', '33333333-3333-3333-3333-rrrr00000201', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000202', '33333333-3333-3333-3333-rrrr00000202', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000203', '33333333-3333-3333-3333-rrrr00000203', '2026-04-01', 500, 500, 'vencido', '2026-04-15'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000301', '33333333-3333-3333-3333-rrrr00000301', '2026-04-01', 500, 500, 'emitido', '2026-04-30'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000302', '33333333-3333-3333-3333-rrrr00000302', '2026-04-01', 500, 500, 'emitido', '2026-04-30');
-- Unidades 401 y 402: sin recibos (s/recibo)

-- ━━━ PAGOS CONFIRMADOS ━━━
-- Pagos para recibos pagados (usar subquery para obtener recibo_id)
-- Febrero: 101,102,103 pagaron + 202,203 pagaron + 301,302 pagaron = 7 pagos
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at)
SELECT gen_random_uuid(), '33333333-3333-3333-3333-333333333333', r.id, r.residente_id, 500, '2026-02-10', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-02-10T10:00:00Z'
FROM recibos r WHERE r.condominio_id = '33333333-3333-3333-3333-333333333333' AND r.periodo = '2026-02-01' AND r.estado = 'pagado';

-- Marzo: 101,102,103 + 203 + 301,302 = 6 pagos
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at)
SELECT gen_random_uuid(), '33333333-3333-3333-3333-333333333333', r.id, r.residente_id, 500, '2026-03-08', 'transferencia', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-03-08T10:00:00Z'
FROM recibos r WHERE r.condominio_id = '33333333-3333-3333-3333-333333333333' AND r.periodo = '2026-03-01' AND r.estado = 'pagado';

-- Abril: 101,102,103 = 3 pagos
INSERT INTO pagos (id, condominio_id, recibo_id, residente_id, monto, fecha_pago, metodo_pago, confirmado_por, created_at)
SELECT gen_random_uuid(), '33333333-3333-3333-3333-333333333333', r.id, r.residente_id, 500, '2026-04-05', 'qr', '20ef331a-2693-4e9c-827f-e5d6961180c7', '2026-04-05T10:00:00Z'
FROM recibos r WHERE r.condominio_id = '33333333-3333-3333-3333-333333333333' AND r.periodo = '2026-04-01' AND r.estado = 'pagado';

-- ━━━ GASTOS / EGRESOS ABRIL 2026 ━━━
INSERT INTO gastos (id, condominio_id, categoria, descripcion, monto, fecha) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'limpieza', 'Limpieza áreas comunes — abril', 300, '2026-04-03'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'mantenimiento', 'Reparación bomba de agua', 220, '2026-04-07'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'mantenimiento', 'Pintura pasillo piso 3', 400, '2026-04-12'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'mantenimiento', 'Jardinería mensual', 150, '2026-04-10');

-- ━━━ TICKETS DE MANTENIMIENTO ━━━
INSERT INTO mantenimientos (id, condominio_id, unidad_id, titulo, descripcion, prioridad, estado, solicitado_por, created_at) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-uuuu00000201', 'Fuga de agua en baño principal', 'Se detectó una fuga de agua en el baño del departamento 201. El agua filtra al piso inferior.', 'urgente', 'en_proceso', NULL, '2026-04-10T08:00:00Z'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', NULL, 'Luz quemada pasillo piso 2', 'La luz del pasillo del segundo piso está quemada desde hace 3 días.', 'media', 'en_proceso', NULL, '2026-04-11T09:00:00Z'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', NULL, 'Pintura lobby principal', 'El lobby principal necesita repintado. Hay marcas y descascarado en varias paredes.', 'media', 'pendiente', NULL, '2026-04-12T10:00:00Z'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', NULL, 'Ascensor revisión anual', 'Revisión técnica anual del ascensor según normativa municipal.', 'media', 'resuelto', NULL, '2026-04-01T08:00:00Z'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', NULL, 'Portón eléctrico con falla', 'El portón eléctrico del estacionamiento no abre correctamente. Se queda trabado a mitad de camino.', 'urgente', 'pendiente', NULL, '2026-04-13T14:00:00Z');

-- ━━━ ÁREAS COMUNES ━━━
INSERT INTO areas_comunes (id, condominio_id, nombre, capacidad, horario_inicio, horario_fin, tarifa, requiere_aprobacion, activa) VALUES
  ('33333333-3333-3333-3333-aaaa00000001', '33333333-3333-3333-3333-333333333333', 'Salón de Eventos', 50, '08:00', '22:00', 200.00, true, true),
  ('33333333-3333-3333-3333-aaaa00000002', '33333333-3333-3333-3333-333333333333', 'Piscina', 20, '08:00', '20:00', 0.00, true, true),
  ('33333333-3333-3333-3333-aaaa00000003', '33333333-3333-3333-3333-333333333333', 'BBQ', 15, '10:00', '22:00', 100.00, true, true)
ON CONFLICT (id) DO NOTHING;

-- ━━━ RESERVAS ━━━
INSERT INTO reservas (id, condominio_id, area_comun_id, residente_id, unidad_id, fecha, hora_inicio, hora_fin, estado, motivo, cobro) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-aaaa00000001', '33333333-3333-3333-3333-rrrr00000101', '33333333-3333-3333-3333-uuuu00000101', '2026-04-19', '18:00', '22:00', 'aprobada', 'Cumpleaños familiar', 200),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-aaaa00000002', '33333333-3333-3333-3333-rrrr00000103', '33333333-3333-3333-3333-uuuu00000103', '2026-04-20', '10:00', '14:00', 'aprobada', 'Reunión con amigos', 0),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-aaaa00000003', '33333333-3333-3333-3333-rrrr00000202', '33333333-3333-3333-3333-uuuu00000202', '2026-04-26', '12:00', '18:00', 'pendiente', 'Asado familiar', 100),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-aaaa00000001', '33333333-3333-3333-3333-rrrr00000301', '33333333-3333-3333-3333-uuuu00000301', '2026-05-03', '10:00', '14:00', 'pendiente', 'Reunión de vecinos', 200);

-- ━━━ GUARDIAS ━━━
INSERT INTO guardias (id, condominio_id, nombre, apellido, ci, telefono, empresa, habilitacion_dgsc, activo) VALUES
  ('33333333-3333-3333-3333-gggg00000001', '33333333-3333-3333-3333-333333333333', 'Juan', 'Mamani Condori', '4567890', '76543211', 'Seguridad Total SRL', 'DGSC-2024-1234', true),
  ('33333333-3333-3333-3333-gggg00000002', '33333333-3333-3333-3333-333333333333', 'Carlos', 'Ríos Escalante', '4567891', '76543212', 'Seguridad Total SRL', 'DGSC-2024-1235', true)
ON CONFLICT (id) DO UPDATE SET activo = true;

-- ━━━ TURNOS ━━━
INSERT INTO turnos (id, guardia_id, condominio_id, tipo, fecha, hora_programada_inicio, hora_programada_fin, estado) VALUES
  (gen_random_uuid(), '33333333-3333-3333-3333-gggg00000001', '33333333-3333-3333-3333-333333333333', 'manana', '2026-04-14', '07:00', '19:00', 'activo'),
  (gen_random_uuid(), '33333333-3333-3333-3333-gggg00000002', '33333333-3333-3333-3333-333333333333', 'noche', '2026-04-14', '19:00', '07:00', 'programado');

-- ━━━ VERIFICACIÓN ━━━
-- Ejecutar después para confirmar:
-- SELECT 'Residentes' as tipo, count(*) FROM residentes WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Recibos', count(*) FROM recibos WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Pagos', count(*) FROM pagos WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Gastos', count(*) FROM gastos WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Tickets', count(*) FROM mantenimientos WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Reservas', count(*) FROM reservas WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Guardias', count(*) FROM guardias WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
-- UNION ALL SELECT 'Turnos', count(*) FROM turnos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';
