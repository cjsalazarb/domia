// Seed: Datos de prueba para flujo completo de reservas — Residencial Las Palmas
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local'); process.exit(1) }

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const C = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'
const ADMIN = '20ef331a-2693-4e9c-827f-e5d6961180c7'

// Area IDs
const AC1 = 'aabbccdd-aabb-aabb-aabb-000000000001' // Salon de Eventos
const AC2 = 'aabbccdd-aabb-aabb-aabb-000000000002' // Piscina
const AC3 = 'aabbccdd-aabb-aabb-aabb-000000000003' // BBQ → Sala de Reuniones

// Resident/unit helpers
const u = (n) => `aaaaaaaa-aaaa-aaaa-aaaa-000000000${n}`
const r = (n) => `bbbbbbbb-bbbb-bbbb-bbbb-00000000000${n}`

// Reserva IDs
const RV = (n) => `aabbccdd-aabb-aabb-eeee-00000000000${n}`

function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function run() {
  console.log('━━━ PASO 1: Actualizar áreas comunes con todos los campos ━━━\n')

  // Update Salon de Eventos
  const { error: ea1 } = await supabase.from('areas_comunes').update({
    nombre: 'Salón de Eventos',
    capacidad: 50,
    horario_inicio: '08:00',
    horario_fin: '22:00',
    tarifa: 500,
    monto_garantia: 200,
    monto_alquiler: 300,
    requiere_aprobacion: true,
    condiciones_uso: 'El área debe entregarse limpia y ordenada.\nNo se permite música después de las 22:00.\nNo se permite el ingreso de mascotas.',
    inventario: '6 mesas largas, 24 sillas, 1 parrilla a gas, 2 tomas de corriente 220V, 1 lavaplatos',
    reglas: 'No se permite música después de las 22:00.\nNo se permite el ingreso de mascotas.\nEl área debe entregarse limpia.',
    politica_garantia: 'La garantía se devuelve dentro de 48 horas después del evento previa inspección del área.',
    contacto_emergencia: 'María del Carmen · 591-78901234',
  }).eq('id', AC1)
  if (ea1) console.error('Error actualizando Salón:', ea1.message)
  else console.log('✅ Salón de Eventos actualizado')

  // Update Piscina
  const { error: ea2 } = await supabase.from('areas_comunes').update({
    nombre: 'Piscina',
    capacidad: 20,
    horario_inicio: '09:00',
    horario_fin: '19:00',
    tarifa: 250,
    monto_garantia: 100,
    monto_alquiler: 150,
    requiere_aprobacion: true,
    condiciones_uso: 'Uso exclusivo para residentes y sus invitados.\nMáximo 5 invitados por unidad.\nDucha obligatoria antes de ingresar.\nNo se permite vidrio en el área.',
    inventario: '4 reposeras, 2 mesas, 8 sillas de plástico',
    reglas: 'Ducha obligatoria antes de ingresar.\nNo se permite vidrio en el área de la piscina.\nMenores de 12 años deben estar acompañados.',
    politica_garantia: 'Garantía devuelta en 24 horas.',
    contacto_emergencia: 'Administración · 591-78901234',
  }).eq('id', AC2)
  if (ea2) console.error('Error actualizando Piscina:', ea2.message)
  else console.log('✅ Piscina actualizada')

  // Update BBQ → Sala de Reuniones
  const { error: ea3 } = await supabase.from('areas_comunes').update({
    nombre: 'Sala de Reuniones',
    capacidad: 15,
    horario_inicio: '08:00',
    horario_fin: '20:00',
    tarifa: 130,
    monto_garantia: 50,
    monto_alquiler: 80,
    requiere_aprobacion: true,
    condiciones_uso: 'Uso máximo 4 horas.\nNo se permite consumo de alimentos.\nApagar luces y aire acondicionado al salir.',
    inventario: '1 mesa de reuniones, 12 sillas, 1 proyector, 1 pizarra blanca, 2 marcadores',
    reglas: 'No se permite consumo de alimentos.\nApagar luces y aire acondicionado al salir.\nUso máximo 4 horas por reserva.',
    politica_garantia: 'Garantía devuelta inmediatamente si el área está en buen estado.',
    contacto_emergencia: 'Administración · 591-78901234',
  }).eq('id', AC3)
  if (ea3) console.error('Error actualizando Sala Reuniones:', ea3.message)
  else console.log('✅ Sala de Reuniones actualizada')

  console.log('\n━━━ PASO 2: Limpiar reservas anteriores y crear nuevas ━━━\n')

  // Delete existing test reservas
  await supabase.from('reservas').delete().eq('condominio_id', C)
  console.log('Reservas anteriores eliminadas')

  const reservas = [
    // RESERVA 1: PENDIENTE
    {
      id: RV(1),
      condominio_id: C,
      area_id: AC1,
      residente_id: r(1), // Carlos Mendoza
      unidad_id: u('101'),
      fecha: tomorrow(),
      hora_inicio: '14:00',
      hora_fin: '20:00',
      estado: 'pendiente',
      motivo: 'Cumpleaños de mi hija',
      cobro: 500,
      monto_garantia: 200,
      monto_alquiler: 300,
      monto_total: 500,
      numero_reserva: 'RES-2026-0001',
    },
    // RESERVA 2: RECHAZADA
    {
      id: RV(2),
      condominio_id: C,
      area_id: AC2,
      residente_id: r(3), // Jorge Peña
      unidad_id: u('103'),
      fecha: daysFromNow(2),
      hora_inicio: '10:00',
      hora_fin: '14:00',
      estado: 'rechazada',
      motivo: 'Pool party',
      motivo_rechazo: 'Fecha no disponible, ya existe otra reserva en ese horario.',
      cobro: 250,
      monto_garantia: 100,
      monto_alquiler: 150,
      monto_total: 250,
      numero_reserva: 'RES-2026-0002',
    },
    // RESERVA 3: APROBADO PENDIENTE PAGO
    {
      id: RV(3),
      condominio_id: C,
      area_id: AC3,
      residente_id: r(7), // Miguel Torres
      unidad_id: u('301'),
      fecha: daysFromNow(7),
      hora_inicio: '09:00',
      hora_fin: '13:00',
      estado: 'aprobado_pendiente_pago',
      motivo: 'Reunión de directorio',
      aprobado_por: ADMIN,
      cobro: 130,
      monto_garantia: 50,
      monto_alquiler: 80,
      monto_total: 130,
      numero_reserva: 'RES-2026-0003',
    },
    // RESERVA 4: COMPROBANTE ENVIADO
    {
      id: RV(4),
      condominio_id: C,
      area_id: AC1,
      residente_id: r(8), // Sofía Castro
      unidad_id: u('302'),
      fecha: daysFromNow(8),
      hora_inicio: '15:00',
      hora_fin: '21:00',
      estado: 'comprobante_enviado',
      motivo: 'Fiesta de graduación',
      aprobado_por: ADMIN,
      cobro: 500,
      monto_garantia: 200,
      monto_alquiler: 300,
      monto_total: 500,
      numero_reserva: 'RES-2026-0004',
      comprobante_url: 'https://placehold.co/400x600/E8F4F0/1A7A4A?text=Comprobante+Pago',
      numero_transaccion: 'TXN-2026-04-29-001',
    },
    // RESERVA 5: CONFIRMADA
    {
      id: RV(5),
      condominio_id: C,
      area_id: AC2,
      residente_id: r(2), // Ana Flores
      unidad_id: u('102'),
      fecha: daysFromNow(9),
      hora_inicio: '11:00',
      hora_fin: '16:00',
      estado: 'confirmado',
      motivo: 'Día de piscina familiar',
      aprobado_por: ADMIN,
      cobro: 250,
      monto_garantia: 100,
      monto_alquiler: 150,
      monto_total: 250,
      numero_reserva: 'RES-2026-0005',
      comprobante_url: 'https://placehold.co/400x600/E8F4F0/1A7A4A?text=Comprobante+Verificado',
    },
    // RESERVA 6: FINALIZADA
    {
      id: RV(6),
      condominio_id: C,
      area_id: AC1,
      residente_id: r(9), // Diego Guzmán
      unidad_id: u('401'),
      fecha: daysAgo(5),
      hora_inicio: '16:00',
      hora_fin: '22:00',
      estado: 'finalizado',
      motivo: 'Celebración de cumpleaños',
      aprobado_por: ADMIN,
      cobro: 500,
      monto_garantia: 200,
      monto_alquiler: 300,
      monto_total: 500,
      numero_reserva: 'RES-2026-0006',
    },
  ]

  const { error: eR } = await supabase.from('reservas').insert(reservas)
  if (eR) {
    console.error('Error insertando reservas:', eR.message)
    return
  }
  console.log(`✅ ${reservas.length} reservas insertadas`)

  console.log('\n━━━ PASO 3: Verificación ━━━\n')

  const { data: areas } = await supabase.from('areas_comunes').select('nombre, monto_garantia, monto_alquiler, condiciones_uso, inventario').eq('condominio_id', C)
  console.log('Áreas comunes:')
  for (const a of (areas || [])) {
    console.log(`  ${a.nombre}: Garantía Bs.${a.monto_garantia} + Alquiler Bs.${a.monto_alquiler} | Condiciones: ${a.condiciones_uso ? '✅' : '❌'} | Inventario: ${a.inventario ? '✅' : '❌'}`)
  }

  const { data: revs } = await supabase.from('reservas').select('numero_reserva, estado, fecha, areas_comunes(nombre), residentes(nombre, apellido)').eq('condominio_id', C).order('estado')
  console.log('\nReservas:')
  for (const rv of (revs || [])) {
    const area = rv.areas_comunes?.nombre || '?'
    const res = `${rv.residentes?.nombre || ''} ${rv.residentes?.apellido || ''}`.trim()
    console.log(`  ${rv.numero_reserva} | ${rv.estado.padEnd(25)} | ${area.padEnd(20)} | ${res} | ${rv.fecha}`)
  }

  console.log('\n✅ Seed de reservas completado!')
}

run().catch(err => { console.error('Error fatal:', err.message); process.exit(1) })
