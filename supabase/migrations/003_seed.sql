INSERT INTO condominios (id, nombre, direccion, ciudad, departamento, estado) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Residencial Los Pinos', 'Av. Banzer 3er Anillo, Zona Norte', 'Santa Cruz de la Sierra', 'Santa Cruz', 'activo');

INSERT INTO edificios (id, condominio_id, nombre, numero_pisos) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Torre Única', 8);

INSERT INTO unidades (edificio_id, condominio_id, numero, piso, tipo, area_m2) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '101', 1, 'apartamento', 75.5),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '102', 1, 'apartamento', 75.5),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '201', 2, 'apartamento', 85.0),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '202', 2, 'apartamento', 85.0),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'P-01', NULL, 'parqueo', 12.0),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'P-02', NULL, 'parqueo', 12.0);

INSERT INTO cuotas (condominio_id, tipo_unidad, monto, descripcion) VALUES
  ('11111111-1111-1111-1111-111111111111', 'apartamento', 350.00, 'Cuota mensual apartamento'),
  ('11111111-1111-1111-1111-111111111111', 'parqueo', 80.00, 'Cuota mensual parqueo');

INSERT INTO areas_comunes (condominio_id, nombre, capacidad, horario_inicio, horario_fin, tarifa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Salón de Eventos', 80, '08:00', '22:00', 150.00),
  ('11111111-1111-1111-1111-111111111111', 'Piscina', 30, '07:00', '20:00', 0.00),
  ('11111111-1111-1111-1111-111111111111', 'BBQ', 20, '10:00', '21:00', 50.00);
