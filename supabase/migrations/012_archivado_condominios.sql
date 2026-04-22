-- 012: Archivado seguro de condominios — 3 capas de protección
-- Agrega estados 'archivado' y 'eliminado', columnas de auditoría, RLS por estado

-- 1. Agregar valores al enum estado_condominio
ALTER TYPE estado_condominio ADD VALUE IF NOT EXISTS 'archivado';
ALTER TYPE estado_condominio ADD VALUE IF NOT EXISTS 'eliminado';

-- 2. Columnas de auditoría
ALTER TABLE condominios
  ADD COLUMN IF NOT EXISTS archivado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archivado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES auth.users(id);

-- 3. Actualizar RLS — eliminar policy SELECT existente y recrear con filtro por estado
DROP POLICY IF EXISTS "condominios_select" ON condominios;

-- Activos: acceso normal según rol
CREATE POLICY "condominios_select_activos"
  ON condominios FOR SELECT
  USING (
    estado IN ('activo', 'en_configuracion', 'inactivo')
    AND (
      es_super_admin()
      OR id = get_mi_condominio()
      OR id = (SELECT condominio_id FROM residentes WHERE user_id = auth.uid() LIMIT 1)
    )
  );

-- Archivados: solo super_admin puede ver
CREATE POLICY "condominios_select_archivados"
  ON condominios FOR SELECT
  USING (
    estado = 'archivado'
    AND es_super_admin()
  );

-- Eliminados: nadie puede ver via RLS (solo acceso directo a BD)
-- No se crea policy para estado = 'eliminado'

-- 4. Bloquear portal para residentes de condominios archivados
-- Los residentes ya no podrán ver el condominio porque la policy
-- condominios_select_activos excluye 'archivado' para no-super_admin
