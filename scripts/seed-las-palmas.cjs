// Seed QA: Residencial Las Palmas — via Supabase JS client
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const C = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001' // condominio
const E = 'aaaaaaaa-aaaa-aaaa-eeee-000000000001' // edificio
const ADMIN = '20ef331a-2693-4e9c-827f-e5d6961180c7'

const u = (n) => `aaaaaaaa-aaaa-aaaa-aaaa-000000000${n}` // unidad
const r = (n) => `bbbbbbbb-bbbb-bbbb-bbbb-00000000000${n}` // residente
const rec = (mes, n) => `cccccccc-cccc-cccc-${mes}-00000000000${n}` // recibo
const p = (mes, n) => `dddddddd-dddd-dddd-${mes}-00000000000${n}` // pago

async function run() {
  console.log('Limpiando datos anteriores...')
  for (const table of ['turnos','reservas','pagos','recibos','mantenimientos','gastos','residentes','areas_comunes','cuotas','guardias','unidades','edificios']) {
    await supabase.from(table).delete().eq('condominio_id', C)
  }
  await supabase.from('condominios').delete().eq('id', C)
  // Limpiar IDs viejos
  for (const oldId of ['aaaaaaaa-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333']) {
    for (const table of ['turnos','reservas','pagos','recibos','mantenimientos','gastos','residentes','areas_comunes','cuotas','guardias','unidades','edificios']) {
      await supabase.from(table).delete().eq('condominio_id', oldId)
    }
    await supabase.from('condominios').delete().eq('id', oldId)
  }

  // 1. Condominio
  console.log('Insertando condominio...')
  const { error: e1 } = await supabase.from('condominios').insert({
    id: C, nombre: 'Residencial Las Palmas', direccion: 'Av. Bánzer 4to Anillo',
    ciudad: 'Santa Cruz de la Sierra', departamento: 'Santa Cruz',
    estado: 'activo', admin_id: ADMIN, recargo_mora_porcentaje: 2.00,
  })
  if (e1) { console.error('condominios:', e1.message); return }

  // 2. Edificio
  console.log('Insertando edificio...')
  const { error: e2 } = await supabase.from('edificios').insert({ id: E, condominio_id: C, nombre: 'Torre Principal', numero_pisos: 4 })
  if (e2) { console.error('edificios:', e2.message); return }

  // 3. Unidades
  console.log('Insertando 10 unidades...')
  const unidades = [
    { id: u('101'), numero: '101', piso: 1, area_m2: 85 },
    { id: u('102'), numero: '102', piso: 1, area_m2: 85 },
    { id: u('103'), numero: '103', piso: 1, area_m2: 90 },
    { id: u('201'), numero: '201', piso: 2, area_m2: 85 },
    { id: u('202'), numero: '202', piso: 2, area_m2: 85 },
    { id: u('203'), numero: '203', piso: 2, area_m2: 90 },
    { id: u('301'), numero: '301', piso: 3, area_m2: 95 },
    { id: u('302'), numero: '302', piso: 3, area_m2: 95 },
    { id: u('401'), numero: '401', piso: 4, area_m2: 100 },
    { id: u('402'), numero: '402', piso: 4, area_m2: 100 },
  ].map(x => ({ ...x, edificio_id: E, condominio_id: C, tipo: 'apartamento', activa: true }))
  const { error: e3 } = await supabase.from('unidades').insert(unidades)
  if (e3) { console.error('unidades:', e3.message); return }

  // 4. Cuota
  console.log('Insertando cuota...')
  await supabase.from('cuotas').insert({ condominio_id: C, tipo_unidad: 'apartamento', monto: 500, descripcion: 'Cuota mensual Las Palmas' })

  // 5. Residentes
  console.log('Insertando 9 residentes...')
  const residentes = [
    { id: r(1), unidad_id: u('101'), nombre: 'Carlos', apellido: 'Mendoza Rojas', ci: '6234501', telefono: '78901234', email: 'carlos.mendoza@demo.test', tipo: 'propietario', estado: 'activo' },
    { id: r(2), unidad_id: u('102'), nombre: 'Ana', apellido: 'Flores Terán', ci: '6234502', telefono: '78901235', email: 'ana.flores@demo.test', tipo: 'propietario', estado: 'activo' },
    { id: r(3), unidad_id: u('103'), nombre: 'Jorge', apellido: 'Peña Soliz', ci: '6234503', telefono: '78901236', email: 'jorge.pena@demo.test', tipo: 'propietario', estado: 'activo' },
    { id: r(4), unidad_id: u('201'), nombre: 'Laura', apellido: 'Vidal Choque', ci: '6234504', telefono: '78901237', email: 'laura.vidal@demo.test', tipo: 'propietario', estado: 'moroso' },
    { id: r(5), unidad_id: u('202'), nombre: 'Pedro', apellido: 'Suárez Arancibia', ci: '6234505', telefono: '78901238', email: 'pedro.suarez@demo.test', tipo: 'propietario', estado: 'moroso' },
    { id: r(6), unidad_id: u('203'), nombre: 'Rosa', apellido: 'Quispe Mamani', ci: '6234506', telefono: '78901239', email: 'rosa.quispe@demo.test', tipo: 'inquilino', estado: 'moroso' },
    { id: r(7), unidad_id: u('301'), nombre: 'Miguel', apellido: 'Torres Delgado', ci: '6234507', telefono: '78901240', email: 'miguel.torres@demo.test', tipo: 'propietario', estado: 'activo' },
    { id: r(8), unidad_id: u('302'), nombre: 'Sofía', apellido: 'Castro Jiménez', ci: '6234508', telefono: '78901241', email: 'sofia.castro@demo.test', tipo: 'propietario', estado: 'activo' },
    { id: r(9), unidad_id: u('401'), nombre: 'Diego', apellido: 'Guzmán Ríos', ci: '6234509', telefono: '78901242', email: 'diego.guzman@demo.test', tipo: 'propietario', estado: 'activo' },
  ].map(x => ({ ...x, condominio_id: C }))
  const { error: e5 } = await supabase.from('residentes').insert(residentes)
  if (e5) { console.error('residentes:', e5.message); return }

  // 6. Recibos — Feb, Mar, Abr
  console.log('Insertando 24 recibos...')
  const recibosData = []
  const meses = [
    { periodo: '2026-02-01', venc: '2026-02-15', prefix: '0201', estados: { 1:'pagado',2:'pagado',3:'pagado',4:'vencido',5:'pagado',6:'pagado',7:'pagado',8:'pagado' } },
    { periodo: '2026-03-01', venc: '2026-03-15', prefix: '0301', estados: { 1:'pagado',2:'pagado',3:'pagado',4:'vencido',5:'vencido',6:'pagado',7:'pagado',8:'pagado' } },
    { periodo: '2026-04-01', venc: '2026-04-15', prefix: '0401', estados: { 1:'pagado',2:'pagado',3:'pagado',4:'vencido',5:'vencido',6:'vencido',7:'emitido',8:'emitido' } },
  ]
  // Override abril vencimiento for pendientes (301,302)
  for (const mes of meses) {
    for (let i = 1; i <= 8; i++) {
      const unidadNum = [101,102,103,201,202,203,301,302][i-1]
      const venc = mes.prefix === '0401' && i >= 7 ? '2026-04-30' : mes.venc
      recibosData.push({
        id: rec(mes.prefix, i), condominio_id: C, unidad_id: u(String(unidadNum)),
        residente_id: r(i), periodo: mes.periodo, monto_base: 500,
        estado: mes.estados[i], fecha_vencimiento: venc,
      })
    }
  }
  const { error: e6 } = await supabase.from('recibos').insert(recibosData)
  if (e6) { console.error('recibos:', e6.message); return }

  // 7. Pagos — solo para recibos pagados
  console.log('Insertando 16 pagos...')
  const pagosData = []
  const pagosMeses = [
    { prefix: '0201', fecha: '2026-02-10', pagaron: [1,2,3,5,6,7,8] },
    { prefix: '0301', fecha: '2026-03-08', pagaron: [1,2,3,6,7,8] },
    { prefix: '0401', fecha: '2026-04-05', pagaron: [1,2,3] },
  ]
  for (const mes of pagosMeses) {
    for (const i of mes.pagaron) {
      pagosData.push({
        id: p(mes.prefix, i), condominio_id: C, recibo_id: rec(mes.prefix, i),
        residente_id: r(i), monto: 500, fecha_pago: mes.fecha,
        metodo: i % 3 === 0 ? 'qr' : i % 2 === 0 ? 'efectivo' : 'transferencia',
        confirmado_por: ADMIN, confirmado_at: `${mes.fecha}T10:00:00Z`,
      })
    }
  }
  const { error: e7 } = await supabase.from('pagos').insert(pagosData)
  if (e7) { console.error('pagos:', e7.message); return }

  // 8. Gastos
  console.log('Insertando 4 gastos...')
  const { error: e8 } = await supabase.from('gastos').insert([
    { id: 'eeeeeeee-eeee-eeee-eeee-000000000001', condominio_id: C, categoria: 'limpieza', descripcion: 'Limpieza áreas comunes — abril', monto: 300, fecha: '2026-04-03', registrado_por: ADMIN },
    { id: 'eeeeeeee-eeee-eeee-eeee-000000000002', condominio_id: C, categoria: 'mantenimiento', descripcion: 'Reparación bomba de agua', monto: 220, fecha: '2026-04-07', registrado_por: ADMIN },
    { id: 'eeeeeeee-eeee-eeee-eeee-000000000003', condominio_id: C, categoria: 'mantenimiento', descripcion: 'Pintura pasillo piso 3', monto: 400, fecha: '2026-04-12', registrado_por: ADMIN },
    { id: 'eeeeeeee-eeee-eeee-eeee-000000000004', condominio_id: C, categoria: 'mantenimiento', descripcion: 'Jardinería mensual', monto: 150, fecha: '2026-04-10', registrado_por: ADMIN },
  ])
  if (e8) { console.error('gastos:', e8.message); return }

  // 9. Tickets mantenimiento
  console.log('Insertando 5 tickets...')
  const { error: e9 } = await supabase.from('mantenimientos').insert([
    { id: 'ffffffff-ffff-ffff-ffff-000000000001', condominio_id: C, unidad_id: u('201'), titulo: 'Fuga de agua en baño principal', descripcion: 'Fuga en el baño del depto 201.', prioridad: 'urgente', estado: 'en_proceso' },
    { id: 'ffffffff-ffff-ffff-ffff-000000000002', condominio_id: C, titulo: 'Luz quemada pasillo piso 2', descripcion: 'La luz del pasillo está quemada.', prioridad: 'media', estado: 'en_proceso' },
    { id: 'ffffffff-ffff-ffff-ffff-000000000003', condominio_id: C, titulo: 'Pintura lobby principal', descripcion: 'El lobby necesita repintado.', prioridad: 'media', estado: 'pendiente' },
    { id: 'ffffffff-ffff-ffff-ffff-000000000004', condominio_id: C, titulo: 'Ascensor revisión anual', descripcion: 'Revisión técnica anual.', prioridad: 'media', estado: 'resuelto' },
    { id: 'ffffffff-ffff-ffff-ffff-000000000005', condominio_id: C, titulo: 'Portón eléctrico con falla', descripcion: 'No abre correctamente.', prioridad: 'urgente', estado: 'pendiente' },
  ])
  if (e9) { console.error('mantenimientos:', e9.message); return }

  // 10. Áreas comunes
  console.log('Insertando 3 áreas comunes...')
  const AC1 = 'aabbccdd-aabb-aabb-aabb-000000000001'
  const AC2 = 'aabbccdd-aabb-aabb-aabb-000000000002'
  const AC3 = 'aabbccdd-aabb-aabb-aabb-000000000003'
  const { error: e10 } = await supabase.from('areas_comunes').insert([
    { id: AC1, condominio_id: C, nombre: 'Salón de Eventos', capacidad: 50, horario_inicio: '08:00', horario_fin: '22:00', tarifa: 200, requiere_aprobacion: true, activa: true },
    { id: AC2, condominio_id: C, nombre: 'Piscina', capacidad: 20, horario_inicio: '08:00', horario_fin: '20:00', tarifa: 0, requiere_aprobacion: true, activa: true },
    { id: AC3, condominio_id: C, nombre: 'BBQ', capacidad: 15, horario_inicio: '10:00', horario_fin: '22:00', tarifa: 100, requiere_aprobacion: true, activa: true },
  ])
  if (e10) { console.error('areas_comunes:', e10.message); return }

  // 11. Reservas
  console.log('Insertando 4 reservas...')
  const { error: e11 } = await supabase.from('reservas').insert([
    { id: 'aabbccdd-aabb-aabb-aaaa-000000000001', condominio_id: C, area_id: AC1, residente_id: r(1), unidad_id: u('101'), fecha: '2026-04-19', hora_inicio: '18:00', hora_fin: '22:00', estado: 'aprobada', motivo: 'Cumpleaños familiar' },
    { id: 'aabbccdd-aabb-aabb-aaaa-000000000002', condominio_id: C, area_id: AC2, residente_id: r(3), unidad_id: u('103'), fecha: '2026-04-20', hora_inicio: '10:00', hora_fin: '14:00', estado: 'aprobada', motivo: 'Reunión con amigos' },
    { id: 'aabbccdd-aabb-aabb-aaaa-000000000003', condominio_id: C, area_id: AC3, residente_id: r(5), unidad_id: u('202'), fecha: '2026-04-26', hora_inicio: '12:00', hora_fin: '18:00', estado: 'pendiente', motivo: 'Asado familiar' },
    { id: 'aabbccdd-aabb-aabb-aaaa-000000000004', condominio_id: C, area_id: AC1, residente_id: r(7), unidad_id: u('301'), fecha: '2026-05-03', hora_inicio: '10:00', hora_fin: '14:00', estado: 'pendiente', motivo: 'Reunión de vecinos' },
  ])
  if (e11) { console.error('reservas:', e11.message); return }

  // 12. Guardias
  console.log('Insertando 2 guardias...')
  const G1 = 'aabbccdd-aabb-aabb-bbbb-000000000001'
  const G2 = 'aabbccdd-aabb-aabb-bbbb-000000000002'
  const { error: e12 } = await supabase.from('guardias').insert([
    { id: G1, condominio_id: C, nombre: 'Juan', apellido: 'Mamani Condori', ci: '4567890', telefono: '76543211', empresa: 'Seguridad Total SRL', habilitacion_dgsc: 'DGSC-2024-1234', activo: true },
    { id: G2, condominio_id: C, nombre: 'Carlos', apellido: 'Ríos Escalante', ci: '4567891', telefono: '76543212', empresa: 'Seguridad Total SRL', habilitacion_dgsc: 'DGSC-2024-1235', activo: true },
  ])
  if (e12) { console.error('guardias:', e12.message); return }

  // 13. Turnos hoy
  console.log('Insertando 2 turnos...')
  const hoy = new Date().toISOString().split('T')[0]
  const { error: e13 } = await supabase.from('turnos').insert([
    { id: 'aabbccdd-aabb-aabb-cccc-000000000001', guardia_id: G1, condominio_id: C, tipo: 'manana', fecha: hoy, hora_programada_inicio: '07:00', hora_programada_fin: '19:00', estado: 'activo' },
    { id: 'aabbccdd-aabb-aabb-cccc-000000000002', guardia_id: G2, condominio_id: C, tipo: 'noche', fecha: hoy, hora_programada_inicio: '19:00', hora_programada_fin: '07:00', estado: 'programado' },
  ])
  if (e13) { console.error('turnos:', e13.message); return }

  // Verificar
  console.log('\n━━━ VERIFICACIÓN ━━━')
  for (const table of ['condominios','unidades','residentes','recibos','pagos','gastos','mantenimientos','areas_comunes','reservas','guardias','turnos']) {
    const col = table === 'condominios' ? 'id' : 'condominio_id'
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, C)
    console.log(`${table}: ${count}`)
  }
  console.log('\n✅ Seed Residencial Las Palmas completado!')
}

run().catch(err => { console.error('Error fatal:', err.message); process.exit(1) })
