-- ============================================
-- SEED DEMO DOMIA — Datos realistas para demos
-- ============================================
-- Condominio 1: Residencial Los Pinos (ya existe con ID 11111111...)
-- Condominio 2: Torres del Valle (nuevo)
-- 10 residentes con nombres bolivianos
-- Recibos últimos 3 meses, morosos, guardias, tickets

-- ━━━ CONDOMINIO 2: Torres del Valle ━━━
INSERT INTO condominios (id, nombre, direccion, ciudad, departamento, estado, recargo_mora_porcentaje) VALUES
  ('22222222-aaaa-bbbb-cccc-222222222222', 'Torres del Valle', 'Av. Cristo Redentor, 4to Anillo', 'Santa Cruz de la Sierra', 'Santa Cruz', 'activo', 2.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO edificios (id, condominio_id, nombre, numero_pisos) VALUES
  ('33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'Torre A', 10),
  ('33333333-aaaa-bbbb-cccc-444444444444', '22222222-aaaa-bbbb-cccc-222222222222', 'Torre B', 10)
ON CONFLICT (id) DO NOTHING;

-- Unidades Torres del Valle - Torre A
INSERT INTO unidades (id, edificio_id, condominio_id, numero, piso, tipo, area_m2) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', '33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'A-101', 1, 'apartamento', 95.0),
  ('aaaaaaaa-0001-0001-0001-000000000002', '33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'A-201', 2, 'apartamento', 95.0),
  ('aaaaaaaa-0001-0001-0001-000000000003', '33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'A-301', 3, 'apartamento', 110.0),
  ('aaaaaaaa-0001-0001-0001-000000000004', '33333333-aaaa-bbbb-cccc-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'A-P01', NULL, 'parqueo', 12.0)
ON CONFLICT DO NOTHING;

-- Unidades Torres del Valle - Torre B
INSERT INTO unidades (id, edificio_id, condominio_id, numero, piso, tipo, area_m2) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000005', '33333333-aaaa-bbbb-cccc-444444444444', '22222222-aaaa-bbbb-cccc-222222222222', 'B-101', 1, 'apartamento', 85.0),
  ('aaaaaaaa-0001-0001-0001-000000000006', '33333333-aaaa-bbbb-cccc-444444444444', '22222222-aaaa-bbbb-cccc-222222222222', 'B-201', 2, 'apartamento', 85.0)
ON CONFLICT DO NOTHING;

-- Cuotas Torres del Valle
INSERT INTO cuotas (condominio_id, tipo_unidad, monto, descripcion) VALUES
  ('22222222-aaaa-bbbb-cccc-222222222222', 'apartamento', 420.00, 'Cuota mensual apartamento Torres del Valle'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'parqueo', 100.00, 'Cuota mensual parqueo Torres del Valle')
ON CONFLICT DO NOTHING;

-- Áreas comunes Torres del Valle
INSERT INTO areas_comunes (condominio_id, nombre, capacidad, horario_inicio, horario_fin, tarifa, requiere_aprobacion) VALUES
  ('22222222-aaaa-bbbb-cccc-222222222222', 'Quincho', 30, '10:00', '22:00', 100.00, true),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'Gym', 15, '06:00', '22:00', 0.00, false)
ON CONFLICT DO NOTHING;

-- ━━━ RESIDENTES — Residencial Los Pinos ━━━
-- (María López ya existe en apto 101)

INSERT INTO residentes (id, unidad_id, condominio_id, tipo, nombre, apellido, ci, telefono, email, estado) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', '4fb2a617-a50a-4e69-bf21-51b61639c9ea', '11111111-1111-1111-1111-111111111111', 'propietario', 'Roberto', 'Mamani Quispe', '4523891', '76543210', 'roberto.mamani@demo.test', 'activo'),
  ('bbbbbbbb-0001-0001-0001-000000000002', 'e15c716d-838c-4834-b404-cf3cba23f210', '11111111-1111-1111-1111-111111111111', 'propietario', 'Patricia', 'Gutiérrez Vargas', '5234567', '71234567', 'patricia.gutierrez@demo.test', 'moroso'),
  ('bbbbbbbb-0001-0001-0001-000000000003', '3c62179c-6719-40ac-a425-f1f4ecd86944', '11111111-1111-1111-1111-111111111111', 'propietario', 'Fernando', 'Rojas Torrez', '3456789', '78901234', 'fernando.rojas@demo.test', 'activo'),
  ('bbbbbbbb-0001-0001-0001-000000000004', '0db3fbda-137e-4d9b-8739-849fac42e525', '11111111-1111-1111-1111-111111111111', 'propietario', 'Carmen', 'Chávez de Peña', '6789012', '69876543', 'carmen.chavez@demo.test', 'activo')
ON CONFLICT (id) DO NOTHING;

-- ━━━ RESIDENTES — Torres del Valle ━━━
INSERT INTO residentes (id, unidad_id, condominio_id, tipo, nombre, apellido, ci, telefono, email, estado) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000005', 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-aaaa-bbbb-cccc-222222222222', 'propietario', 'Gonzalo', 'Suárez Mendoza', '7890123', '76012345', 'gonzalo.suarez@demo.test', 'activo'),
  ('bbbbbbbb-0001-0001-0001-000000000006', 'aaaaaaaa-0001-0001-0001-000000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'propietario', 'Adriana', 'Céspedes Ríos', '8901234', '72345678', 'adriana.cespedes@demo.test', 'moroso'),
  ('bbbbbbbb-0001-0001-0001-000000000007', 'aaaaaaaa-0001-0001-0001-000000000003', '22222222-aaaa-bbbb-cccc-222222222222', 'inquilino', 'Diego', 'Montaño Quiroga', '9012345', '73456789', 'diego.montano@demo.test', 'activo'),
  ('bbbbbbbb-0001-0001-0001-000000000008', 'aaaaaaaa-0001-0001-0001-000000000005', '22222222-aaaa-bbbb-cccc-222222222222', 'propietario', 'Silvia', 'Paz Solíz', '1234890', '74567890', 'silvia.paz@demo.test', 'activo'),
  ('bbbbbbbb-0001-0001-0001-000000000009', 'aaaaaaaa-0001-0001-0001-000000000006', '22222222-aaaa-bbbb-cccc-222222222222', 'propietario', 'Marco', 'Vaca Pereira', '2345901', '75678901', 'marco.vaca@demo.test', 'activo')
ON CONFLICT (id) DO NOTHING;

-- ━━━ RECIBOS — Residencial Los Pinos (3 meses) ━━━
-- Roberto - Apto 102: al día
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('4fb2a617-a50a-4e69-bf21-51b61639c9ea', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', '2026-02-01', 350.00, 0, '2026-02-10', 'pagado'),
  ('4fb2a617-a50a-4e69-bf21-51b61639c9ea', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', '2026-03-01', 350.00, 0, '2026-03-10', 'pagado'),
  ('4fb2a617-a50a-4e69-bf21-51b61639c9ea', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', '2026-04-01', 350.00, 0, '2026-04-10', 'emitido')
ON CONFLICT DO NOTHING;

-- Patricia - Apto 201: MOROSA (2 meses sin pagar)
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('e15c716d-838c-4834-b404-cf3cba23f210', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000002', '2026-02-01', 350.00, 7.00, '2026-02-10', 'vencido'),
  ('e15c716d-838c-4834-b404-cf3cba23f210', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000002', '2026-03-01', 350.00, 7.00, '2026-03-10', 'vencido'),
  ('e15c716d-838c-4834-b404-cf3cba23f210', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000002', '2026-04-01', 350.00, 0, '2026-04-10', 'emitido')
ON CONFLICT DO NOTHING;

-- Fernando - Apto 202: al día
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('3c62179c-6719-40ac-a425-f1f4ecd86944', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', '2026-02-01', 350.00, 0, '2026-02-10', 'pagado'),
  ('3c62179c-6719-40ac-a425-f1f4ecd86944', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', '2026-03-01', 350.00, 0, '2026-03-10', 'pagado'),
  ('3c62179c-6719-40ac-a425-f1f4ecd86944', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', '2026-04-01', 350.00, 0, '2026-04-10', 'pagado')
ON CONFLICT DO NOTHING;

-- ━━━ RECIBOS — Torres del Valle (3 meses) ━━━
-- Gonzalo - A-101: al día
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000005', '2026-02-01', 420.00, 0, '2026-02-10', 'pagado'),
  ('aaaaaaaa-0001-0001-0001-000000000001', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000005', '2026-03-01', 420.00, 0, '2026-03-10', 'pagado'),
  ('aaaaaaaa-0001-0001-0001-000000000001', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000005', '2026-04-01', 420.00, 0, '2026-04-10', 'emitido')
ON CONFLICT DO NOTHING;

-- Adriana - A-201: MOROSA (3 meses)
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000006', '2026-02-01', 420.00, 8.40, '2026-02-10', 'vencido'),
  ('aaaaaaaa-0001-0001-0001-000000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000006', '2026-03-01', 420.00, 8.40, '2026-03-10', 'vencido'),
  ('aaaaaaaa-0001-0001-0001-000000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000006', '2026-04-01', 420.00, 0, '2026-04-10', 'emitido')
ON CONFLICT DO NOTHING;

-- Silvia - B-101: al día
INSERT INTO recibos (unidad_id, condominio_id, residente_id, periodo, monto_base, monto_recargo, fecha_vencimiento, estado) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000005', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000008', '2026-03-01', 420.00, 0, '2026-03-10', 'pagado'),
  ('aaaaaaaa-0001-0001-0001-000000000005', '22222222-aaaa-bbbb-cccc-222222222222', 'bbbbbbbb-0001-0001-0001-000000000008', '2026-04-01', 420.00, 0, '2026-04-10', 'emitido')
ON CONFLICT DO NOTHING;

-- ━━━ PROVEEDORES ━━━
INSERT INTO proveedores (id, condominio_id, nombre, rubro, telefono, email, activo) VALUES
  ('cccccccc-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Plomería Rápida SCZ', 'Plomería', '76001122', 'plomeria@demo.test', true),
  ('cccccccc-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'ElectroServicios SRL', 'Electricidad', '76003344', 'electro@demo.test', true),
  ('cccccccc-0001-0001-0001-000000000003', '22222222-aaaa-bbbb-cccc-222222222222', 'Limpieza Total', 'Limpieza', '76005566', 'limpieza@demo.test', true)
ON CONFLICT (id) DO NOTHING;

-- ━━━ MANTENIMIENTOS ━━━
INSERT INTO mantenimientos (condominio_id, unidad_id, titulo, descripcion, prioridad, estado, asignado_a, costo) VALUES
  ('11111111-1111-1111-1111-111111111111', '4fb2a617-a50a-4e69-bf21-51b61639c9ea', 'Fuga de agua en cocina', 'Sale agua por debajo del lavaplatos. Se forma un charco cada vez que se usa.', 'alta', 'en_proceso', 'cccccccc-0001-0001-0001-000000000001', NULL),
  ('11111111-1111-1111-1111-111111111111', 'e15c716d-838c-4834-b404-cf3cba23f210', 'Foco quemado en pasillo piso 2', 'El foco del pasillo del segundo piso no enciende desde hace 1 semana.', 'baja', 'resuelto', 'cccccccc-0001-0001-0001-000000000002', 35.00),
  ('11111111-1111-1111-1111-111111111111', NULL, 'Pintura del lobby principal', 'La pintura del lobby está descascarada y se ve deteriorada.', 'media', 'pendiente', NULL, NULL),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'aaaaaaaa-0001-0001-0001-000000000001', 'Puerta del balcón no cierra', 'La puerta corrediza del balcón no cierra completamente. Entra aire frío.', 'alta', 'asignado', NULL, NULL),
  ('22222222-aaaa-bbbb-cccc-222222222222', NULL, 'Limpieza profunda gimnasio', 'El gym necesita limpieza profunda y desinfección de equipos.', 'media', 'pendiente', 'cccccccc-0001-0001-0001-000000000003', NULL);

-- ━━━ GUARDIAS — Residencial Los Pinos ━━━
INSERT INTO guardias (id, condominio_id, nombre, apellido, ci, telefono, empresa, habilitacion_dgsc, activo, fecha_ingreso) VALUES
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Juan Carlos', 'Condori Flores', '3456123', '70112233', 'Seguridad Integral SRL', 'DGSC-2024-1234', true, '2025-06-01'),
  ('dddddddd-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Pedro', 'Ticona Mamani', '4567234', '70223344', 'Seguridad Integral SRL', 'DGSC-2024-5678', true, '2025-08-15')
ON CONFLICT (id) DO NOTHING;

-- Turnos de esta semana
INSERT INTO turnos (guardia_id, condominio_id, tipo, fecha, hora_programada_inicio, hora_programada_fin, estado) VALUES
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'manana', '2026-04-07', '06:00', '14:00', 'completado'),
  ('dddddddd-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'tarde', '2026-04-07', '14:00', '22:00', 'completado'),
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'noche', '2026-04-07', '22:00', '06:00', 'completado'),
  ('dddddddd-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'manana', '2026-04-08', '06:00', '14:00', 'completado'),
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'tarde', '2026-04-08', '14:00', '22:00', 'completado'),
  ('dddddddd-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'manana', '2026-04-09', '06:00', '14:00', 'programado'),
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'tarde', '2026-04-09', '14:00', '22:00', 'programado');

-- Pagos confirmados (Roberto feb + mar, Fernando feb + mar + abr)
INSERT INTO pagos (recibo_id, residente_id, condominio_id, monto, metodo, fecha_pago, confirmado_por, confirmado_at)
SELECT r.id, r.residente_id, r.condominio_id, r.monto_total, 'transferencia', r.periodo::date + interval '5 days', '20ef331a-2693-4e9c-827f-e5d6961180c7', NOW()
FROM recibos r WHERE r.estado = 'pagado' AND r.condominio_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- Pagos confirmados Torres del Valle
INSERT INTO pagos (recibo_id, residente_id, condominio_id, monto, metodo, fecha_pago, confirmado_por, confirmado_at)
SELECT r.id, r.residente_id, r.condominio_id, r.monto_total, 'qr', r.periodo::date + interval '3 days', '20ef331a-2693-4e9c-827f-e5d6961180c7', NOW()
FROM recibos r WHERE r.estado = 'pagado' AND r.condominio_id = '22222222-aaaa-bbbb-cccc-222222222222'
ON CONFLICT DO NOTHING;

-- ━━━ GASTOS de ejemplo ━━━
INSERT INTO gastos (condominio_id, categoria, descripcion, monto, fecha) VALUES
  ('11111111-1111-1111-1111-111111111111', 'limpieza', 'Servicio de limpieza mensual — Febrero', 800.00, '2026-02-05'),
  ('11111111-1111-1111-1111-111111111111', 'limpieza', 'Servicio de limpieza mensual — Marzo', 800.00, '2026-03-05'),
  ('11111111-1111-1111-1111-111111111111', 'agua', 'Factura de agua — Febrero', 450.00, '2026-02-15'),
  ('11111111-1111-1111-1111-111111111111', 'agua', 'Factura de agua — Marzo', 480.00, '2026-03-15'),
  ('11111111-1111-1111-1111-111111111111', 'luz', 'Factura de luz áreas comunes — Febrero', 620.00, '2026-02-20'),
  ('11111111-1111-1111-1111-111111111111', 'luz', 'Factura de luz áreas comunes — Marzo', 590.00, '2026-03-20'),
  ('11111111-1111-1111-1111-111111111111', 'seguridad', 'Factura guardias Seguridad Integral SRL — Febrero', 3200.00, '2026-02-28'),
  ('11111111-1111-1111-1111-111111111111', 'seguridad', 'Factura guardias Seguridad Integral SRL — Marzo', 3200.00, '2026-03-28'),
  ('11111111-1111-1111-1111-111111111111', 'reparacion', 'Reemplazo de foco pasillo piso 2', 35.00, '2026-03-12'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'limpieza', 'Limpieza mensual Torres del Valle — Marzo', 1200.00, '2026-03-05'),
  ('22222222-aaaa-bbbb-cccc-222222222222', 'agua', 'Factura de agua — Marzo', 680.00, '2026-03-15');
