-- ============================================
-- FIX: Residencial Las Palmas — diagnóstico y corrección
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. DIAGNÓSTICO: ¿El condominio existe?
SELECT 'condominios' as tabla, count(*) as registros
FROM condominios WHERE id = '33333333-3333-3333-3333-333333333333';

-- 2. DIAGNÓSTICO: ¿Qué usuario está logueado?
SELECT id, email, raw_user_meta_data->>'nombre' as nombre FROM auth.users;

-- 3. DIAGNÓSTICO: ¿El usuario es super_admin?
SELECT id, rol, condominio_id FROM profiles;

-- 4. DIAGNÓSTICO: ¿Cuántos datos del seed existen?
SELECT 'unidades' as t, count(*) as n FROM unidades WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
UNION ALL SELECT 'residentes', count(*) FROM residentes WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
UNION ALL SELECT 'recibos', count(*) FROM recibos WHERE condominio_id = '33333333-3333-3333-3333-333333333333'
UNION ALL SELECT 'pagos', count(*) FROM pagos WHERE condominio_id = '33333333-3333-3333-3333-333333333333';

-- 5. FIX: Si el condominio no existe, re-insertarlo
INSERT INTO condominios (id, nombre, direccion, ciudad, departamento, estado, recargo_mora_porcentaje) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Residencial Las Palmas', 'Av. Bánzer 4to Anillo', 'Santa Cruz de la Sierra', 'Santa Cruz', 'activo', 2.00)
ON CONFLICT (id) DO UPDATE SET estado = 'activo', nombre = 'Residencial Las Palmas';

-- 6. FIX: Asegurar que Carlos (super_admin) tiene el rol correcto
-- Reemplazar 'TU_USER_ID_AQUI' con el ID real del paso 2
-- UPDATE profiles SET rol = 'super_admin' WHERE id = 'TU_USER_ID_AQUI';
