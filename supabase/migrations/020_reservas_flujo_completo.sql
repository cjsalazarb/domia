-- 020: Reservas flujo completo — campos extra areas_comunes + reservas + nuevos estados

-- Nuevos estados para el flujo completo de reservas
ALTER TYPE estado_reserva ADD VALUE IF NOT EXISTS 'aprobado_pendiente_pago';
ALTER TYPE estado_reserva ADD VALUE IF NOT EXISTS 'comprobante_enviado';
ALTER TYPE estado_reserva ADD VALUE IF NOT EXISTS 'confirmado';
ALTER TYPE estado_reserva ADD VALUE IF NOT EXISTS 'finalizado';

-- Campos de configuración de tarifas y condiciones en areas_comunes
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS monto_garantia DECIMAL(10,2) DEFAULT 0;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS monto_alquiler DECIMAL(10,2) DEFAULT 0;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS condiciones_uso TEXT;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS inventario TEXT;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS reglas TEXT;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS politica_garantia TEXT;
ALTER TABLE areas_comunes ADD COLUMN IF NOT EXISTS contacto_emergencia TEXT;

-- Campos adicionales en reservas para el flujo de pago
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comprobante_url TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS numero_reserva TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS monto_garantia DECIMAL(10,2);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS monto_alquiler DECIMAL(10,2);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS monto_total DECIMAL(10,2);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS confirmacion_pdf_url TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS numero_transaccion TEXT;
