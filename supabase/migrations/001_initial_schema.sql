CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE rol_usuario AS ENUM ('super_admin','admin_condominio','propietario','inquilino','guardia');
CREATE TYPE estado_condominio AS ENUM ('activo','inactivo','en_configuracion');
CREATE TYPE tipo_unidad AS ENUM ('apartamento','local_comercial','parqueo','bodega','casa');
CREATE TYPE estado_residente AS ENUM ('activo','inactivo','moroso');
CREATE TYPE tipo_residente AS ENUM ('propietario','inquilino');
CREATE TYPE pagador_cuota AS ENUM ('propietario','inquilino');
CREATE TYPE estado_recibo AS ENUM ('emitido','pagado','vencido','anulado');
CREATE TYPE metodo_pago AS ENUM ('efectivo','transferencia','qr','deposito','otro');
CREATE TYPE estado_mantenimiento AS ENUM ('pendiente','asignado','en_proceso','resuelto','cancelado');
CREATE TYPE prioridad_mantenimiento AS ENUM ('baja','media','alta','urgente');
CREATE TYPE estado_reserva AS ENUM ('pendiente','aprobada','rechazada','cancelada');
CREATE TYPE estado_turno AS ENUM ('programado','activo','completado','ausente');
CREATE TYPE tipo_turno AS ENUM ('manana','tarde','noche');
CREATE TYPE tipo_incidente AS ENUM ('robo_hurto','vandalismo','pelea_altercado','emergencia_medica','incendio','inundacion','accidente','visita_no_autorizada','otro');
CREATE TYPE categoria_gasto AS ENUM ('agua','luz','gas','personal','mantenimiento','limpieza','administracion','seguridad','reparacion','otro');
CREATE TYPE accion_audit AS ENUM ('INSERT','UPDATE','DELETE');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol rol_usuario NOT NULL DEFAULT 'propietario',
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  ci TEXT,
  telefono TEXT,
  email TEXT NOT NULL,
  foto_url TEXT,
  condominio_id UUID,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE condominios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  nit TEXT,
  telefono TEXT,
  email_contacto TEXT,
  logo_url TEXT,
  estado estado_condominio NOT NULL DEFAULT 'en_configuracion',
  admin_id UUID,
  recargo_mora_porcentaje DECIMAL(5,2) DEFAULT 2.00,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_condominio FOREIGN KEY (condominio_id) REFERENCES condominios(id);

CREATE TABLE edificios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  numero_pisos INT NOT NULL DEFAULT 1,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edificio_id UUID NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  piso INT,
  tipo tipo_unidad NOT NULL DEFAULT 'apartamento',
  area_m2 DECIMAL(8,2),
  pagador_cuota pagador_cuota NOT NULL DEFAULT 'propietario',
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(edificio_id, numero)
);

CREATE TABLE residentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tipo tipo_residente NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  ci TEXT,
  telefono TEXT,
  email TEXT,
  propietario_id UUID REFERENCES residentes(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  estado estado_residente NOT NULL DEFAULT 'activo',
  doc_ci_url TEXT,
  doc_contrato_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cuotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tipo_unidad tipo_unidad NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'BOB',
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(condominio_id, tipo_unidad, vigente_desde)
);

CREATE TABLE recibos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  residente_id UUID NOT NULL REFERENCES residentes(id) ON DELETE RESTRICT,
  periodo DATE NOT NULL,
  monto_base DECIMAL(10,2) NOT NULL,
  monto_recargo DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(10,2) GENERATED ALWAYS AS (monto_base + monto_recargo - monto_descuento) STORED,
  estado estado_recibo NOT NULL DEFAULT 'emitido',
  pdf_url TEXT,
  fecha_vencimiento DATE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(unidad_id, periodo)
);

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recibo_id UUID NOT NULL REFERENCES recibos(id) ON DELETE RESTRICT,
  residente_id UUID NOT NULL REFERENCES residentes(id) ON DELETE RESTRICT,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  metodo metodo_pago NOT NULL,
  fecha_pago DATE NOT NULL,
  comprobante_url TEXT,
  confirmado_por UUID REFERENCES profiles(id),
  confirmado_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id),
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  contacto_nombre TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  categoria categoria_gasto NOT NULL,
  descripcion TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id),
  proveedor_nombre TEXT,
  factura_url TEXT,
  recurrente BOOLEAN NOT NULL DEFAULT FALSE,
  registrado_por UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mantenimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  unidad_id UUID REFERENCES unidades(id),
  area_comun TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad prioridad_mantenimiento NOT NULL DEFAULT 'media',
  estado estado_mantenimiento NOT NULL DEFAULT 'pendiente',
  solicitado_por UUID REFERENCES profiles(id),
  asignado_a UUID REFERENCES proveedores(id),
  fecha_estimada DATE,
  fecha_resolucion DATE,
  costo DECIMAL(10,2),
  foto_url TEXT,
  notas_resolucion TEXT,
  gasto_id UUID REFERENCES gastos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE areas_comunes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  capacidad INT,
  horario_inicio TIME,
  horario_fin TIME,
  dias_habilitados TEXT[],
  tiempo_max_horas INT DEFAULT 4,
  tarifa DECIMAL(10,2),
  requiere_aprobacion BOOLEAN NOT NULL DEFAULT TRUE,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  descripcion TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reservas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas_comunes(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
  residente_id UUID NOT NULL REFERENCES residentes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado estado_reserva NOT NULL DEFAULT 'pendiente',
  motivo TEXT,
  aprobado_por UUID REFERENCES profiles(id),
  motivo_rechazo TEXT,
  cobro DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  destinatario_id UUID REFERENCES profiles(id),
  enviado_por UUID REFERENCES profiles(id),
  email_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  email_enviado_at TIMESTAMPTZ,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  leido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guardias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  ci TEXT NOT NULL,
  telefono TEXT,
  empresa TEXT,
  foto_url TEXT,
  doc_ci_url TEXT,
  habilitacion_dgsc TEXT,
  habilitacion_vigente DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_ingreso DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tipo tipo_turno NOT NULL,
  fecha DATE NOT NULL,
  hora_programada_inicio TIME NOT NULL,
  hora_programada_fin TIME NOT NULL,
  hora_real_inicio TIMESTAMPTZ,
  hora_real_fin TIMESTAMPTZ,
  estado estado_turno NOT NULL DEFAULT 'programado',
  horas_trabajadas DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN hora_real_inicio IS NOT NULL AND hora_real_fin IS NOT NULL
    THEN EXTRACT(EPOCH FROM (hora_real_fin - hora_real_inicio)) / 3600
    ELSE NULL END
  ) STORED,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tipo tipo_incidente NOT NULL,
  descripcion TEXT NOT NULL,
  hora_incidente TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  personas_involucradas TEXT,
  acciones_tomadas TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE libro_novedades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  guardia_id UUID NOT NULL REFERENCES guardias(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documentos_condominio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  subido_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  accion accion_audit NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  usuario_id UUID REFERENCES profiles(id),
  usuario_rol rol_usuario,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_profiles_rol ON profiles(rol);
CREATE INDEX idx_profiles_condominio ON profiles(condominio_id);
CREATE INDEX idx_unidades_condominio ON unidades(condominio_id);
CREATE INDEX idx_residentes_condominio ON residentes(condominio_id);
CREATE INDEX idx_recibos_condominio ON recibos(condominio_id);
CREATE INDEX idx_recibos_periodo ON recibos(periodo);
CREATE INDEX idx_pagos_condominio ON pagos(condominio_id);
CREATE INDEX idx_gastos_condominio ON gastos(condominio_id);
CREATE INDEX idx_mantenimientos_condominio ON mantenimientos(condominio_id);
CREATE INDEX idx_turnos_guardia ON turnos(guardia_id);
CREATE INDEX idx_turnos_condominio ON turnos(condominio_id);
CREATE INDEX idx_audit_logs_tabla ON audit_logs(tabla);

-- TRIGGER: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_condominios_updated_at BEFORE UPDATE ON condominios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_edificios_updated_at BEFORE UPDATE ON edificios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_unidades_updated_at BEFORE UPDATE ON unidades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_residentes_updated_at BEFORE UPDATE ON residentes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recibos_updated_at BEFORE UPDATE ON recibos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gastos_updated_at BEFORE UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mantenimientos_updated_at BEFORE UPDATE ON mantenimientos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guardias_updated_at BEFORE UPDATE ON guardias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_turnos_updated_at BEFORE UPDATE ON turnos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: audit log financiero
CREATE OR REPLACE FUNCTION registrar_audit_log() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tabla, registro_id, accion, datos_anteriores, datos_nuevos, usuario_id, usuario_rol)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP::accion_audit,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(), (SELECT rol FROM profiles WHERE id = auth.uid()));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_recibos AFTER INSERT OR UPDATE OR DELETE ON recibos FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();
CREATE TRIGGER trg_audit_pagos AFTER INSERT OR UPDATE OR DELETE ON pagos FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();
CREATE TRIGGER trg_audit_gastos AFTER INSERT OR UPDATE OR DELETE ON gastos FOR EACH ROW EXECUTE FUNCTION registrar_audit_log();

-- TRIGGER: estado moroso automático
CREATE OR REPLACE FUNCTION actualizar_estado_moroso() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'vencido' AND OLD.estado != 'vencido' THEN
    UPDATE residentes SET estado = 'moroso' WHERE id = NEW.residente_id AND estado = 'activo';
  END IF;
  IF NEW.estado = 'pagado' THEN
    UPDATE residentes SET estado = 'activo' WHERE id = NEW.residente_id AND estado = 'moroso'
    AND NOT EXISTS (SELECT 1 FROM recibos WHERE residente_id = NEW.residente_id AND estado IN ('emitido','vencido') AND id != NEW.id AND fecha_vencimiento < CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_moroso_recibo AFTER UPDATE OF estado ON recibos FOR EACH ROW EXECUTE FUNCTION actualizar_estado_moroso();

-- TRIGGER: crear profile al registrarse
CREATE OR REPLACE FUNCTION crear_profile_nuevo_usuario() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nombre, apellido, rol)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'propietario'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_nuevo_usuario_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION crear_profile_nuevo_usuario();
