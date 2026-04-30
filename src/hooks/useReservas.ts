import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  generarSolicitudReserva,
  generarComprobanteAprobacion,
  generarConfirmacionReserva,
} from '@/lib/reservaPDFUtils'

export interface AreaComun {
  id: string
  condominio_id: string
  nombre: string
  capacidad: number | null
  horario_inicio: string | null
  horario_fin: string | null
  dias_habilitados: string[] | null
  tiempo_max_horas: number | null
  tarifa: number | null
  requiere_aprobacion: boolean
  activa: boolean
  descripcion: string | null
  foto_url: string | null
  // New fields
  monto_garantia: number | null
  monto_alquiler: number | null
  condiciones_uso: string | null
  inventario: string | null
  reglas: string | null
  politica_garantia: string | null
  contacto_emergencia: string | null
}

export type EstadoReserva =
  | 'pendiente'
  | 'aprobado_pendiente_pago'
  | 'comprobante_enviado'
  | 'confirmado'
  | 'aprobada'           // legacy / auto-approved free
  | 'rechazada'
  | 'cancelada'
  | 'finalizado'

export interface Reserva {
  id: string
  area_id: string
  condominio_id: string
  unidad_id: string
  residente_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoReserva
  motivo: string | null
  aprobado_por: string | null
  motivo_rechazo: string | null
  cobro: number | null
  created_at: string
  // New fields
  comprobante_url: string | null
  numero_reserva: string | null
  monto_garantia: number | null
  monto_alquiler: number | null
  monto_total: number | null
  confirmacion_pdf_url: string | null
  numero_transaccion: string | null
  // Joins
  areas_comunes?: { nombre: string }
  residentes?: { nombre: string; apellido: string; email?: string; user_id?: string }
  unidades?: { numero: string }
}

function generarNumeroReserva(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `RES-${year}-${seq}`
}

async function getAdminEmail(condominioId: string): Promise<string | null> {
  const { data: condo } = await supabase.from('condominios').select('admin_id').eq('id', condominioId).single()
  if (!condo?.admin_id) return null
  // Try profiles table first (most reliable)
  const { data: profile } = await supabase.from('profiles').select('email').eq('id', condo.admin_id).single()
  return profile?.email || null
}

async function getResidenteEmail(residente: { email?: string; user_id?: string } | null): Promise<string | null> {
  if (!residente) return null
  if (residente.email) return residente.email
  if (residente.user_id) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', residente.user_id).single()
    return profile?.email || null
  }
  return null
}

export function useAreasComunes(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['areas-comunes', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('areas_comunes').select('*').eq('condominio_id', condominioId).order('nombre')
      if (error) throw error
      return data as AreaComun[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: Partial<AreaComun>) => {
      const { error } = await supabase.from('areas_comunes').insert({ ...input, condominio_id: condominioId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas-comunes', condominioId] }),
  })

  const actualizar = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<AreaComun> }) => {
      const { error } = await supabase.from('areas_comunes').update(params.updates).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas-comunes', condominioId] }),
  })

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('areas_comunes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas-comunes', condominioId] }),
  })

  return { areas: query.data || [], isLoading: query.isLoading, crear, actualizar, eliminar }
}

export function useReservas(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['reservas', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*, areas_comunes(nombre), residentes(nombre, apellido, email, user_id), unidades(numero)')
        .eq('condominio_id', condominioId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as Reserva[]
    },
    enabled: !!condominioId,
  })

  const verificarDisponibilidad = async (areaId: string, fecha: string, horaInicio: string, horaFin: string): Promise<boolean> => {
    const { data } = await supabase
      .from('reservas')
      .select('id')
      .eq('area_id', areaId)
      .eq('fecha', fecha)
      .in('estado', ['pendiente', 'aprobada', 'aprobado_pendiente_pago', 'comprobante_enviado', 'confirmado'])
      .lt('hora_inicio', horaFin)
      .gt('hora_fin', horaInicio)
    return !data || data.length === 0
  }

  // PASO 1: Residente solicita reserva
  const crearReserva = useMutation({
    mutationFn: async (input: {
      area_id: string; unidad_id: string; residente_id: string
      fecha: string; hora_inicio: string; hora_fin: string
      motivo?: string; cobro?: number; requiere_aprobacion: boolean
      monto_garantia?: number; monto_alquiler?: number
    }) => {
      const disponible = await verificarDisponibilidad(input.area_id, input.fecha, input.hora_inicio, input.hora_fin)
      if (!disponible) throw new Error('Horario no disponible — ya existe una reserva en ese rango')

      const garantia = input.monto_garantia || 0
      const alquiler = input.monto_alquiler || 0
      const total = garantia + alquiler
      const numero = generarNumeroReserva()

      const { data: inserted, error } = await supabase.from('reservas').insert({
        area_id: input.area_id,
        condominio_id: condominioId,
        unidad_id: input.unidad_id,
        residente_id: input.residente_id,
        fecha: input.fecha,
        hora_inicio: input.hora_inicio,
        hora_fin: input.hora_fin,
        motivo: input.motivo || null,
        cobro: total,
        monto_garantia: garantia,
        monto_alquiler: alquiler,
        monto_total: total,
        numero_reserva: numero,
        estado: input.requiere_aprobacion ? 'pendiente' : (total > 0 ? 'aprobado_pendiente_pago' : 'confirmado'),
      }).select('id').single()
      if (error) throw error

      // Email to admin (fire and forget)
      if (input.requiere_aprobacion && inserted) {
        const [resData, areaData, unidadData, condoData] = await Promise.all([
          supabase.from('residentes').select('nombre, apellido').eq('id', input.residente_id).single(),
          supabase.from('areas_comunes').select('nombre').eq('id', input.area_id).single(),
          supabase.from('unidades').select('numero').eq('id', input.unidad_id).single(),
          supabase.from('condominios').select('nombre').eq('id', condominioId).single(),
        ])
        const adminEmail = await getAdminEmail(condominioId)

        if (adminEmail) {
          generarSolicitudReserva({
            reservaId: inserted.id,
            residenteNombre: `${resData.data?.nombre || ''} ${resData.data?.apellido || ''}`.trim(),
            unidadNumero: unidadData.data?.numero || '',
            areaNombre: areaData.data?.nombre || '',
            fecha: input.fecha,
            horaInicio: input.hora_inicio,
            horaFin: input.hora_fin,
            cobro: total,
            condominioNombre: condoData.data?.nombre || '',
            emailAdmin: adminEmail,
          }).catch(e => console.error('Error generando solicitud PDF:', e))
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  // PASO 2a: Admin aprueba → aprobado_pendiente_pago (if has cost) or confirmado (if free)
  const aprobar = useMutation({
    mutationFn: async (params: { id: string; aprobado_por: string }) => {
      // Get reserva to check if it has a cost
      const { data: reserva } = await supabase
        .from('reservas')
        .select('*, areas_comunes(nombre), residentes(nombre, apellido, email, user_id), unidades(numero), condominios:condominio_id(nombre)')
        .eq('id', params.id)
        .single()

      if (!reserva) throw new Error('Reserva no encontrada')

      const total = Number(reserva.monto_total) || Number(reserva.cobro) || 0
      const nuevoEstado = total > 0 ? 'aprobado_pendiente_pago' : 'confirmado'

      const { error } = await supabase.from('reservas').update({
        estado: nuevoEstado,
        aprobado_por: params.aprobado_por,
      }).eq('id', params.id)
      if (error) throw error

      // Email to residente
      const res = reserva.residentes as { nombre: string; apellido: string; email?: string; user_id?: string } | null
      const resEmail = await getResidenteEmail(res)

      if (resEmail) {
        generarComprobanteAprobacion({
          reservaId: params.id,
          residenteNombre: `${res?.nombre || ''} ${res?.apellido || ''}`.trim(),
          residenteEmail: resEmail,
          unidadNumero: (reserva.unidades as { numero: string } | null)?.numero || '',
          areaNombre: (reserva.areas_comunes as { nombre: string } | null)?.nombre || '',
          fecha: reserva.fecha,
          horaInicio: reserva.hora_inicio,
          horaFin: reserva.hora_fin,
          cobro: total,
          condominioNombre: (reserva.condominios as { nombre: string } | null)?.nombre || '',
          numeroReserva: reserva.numero_reserva || '',
        }).catch(e => console.error('Error generando comprobante aprobacion:', e))
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  // PASO 2b: Admin rechaza
  const rechazar = useMutation({
    mutationFn: async (params: { id: string; motivo_rechazo: string }) => {
      const { error } = await supabase.from('reservas').update({ estado: 'rechazada', motivo_rechazo: params.motivo_rechazo }).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  // PASO 3: Residente sube comprobante de pago
  const subirComprobante = useMutation({
    mutationFn: async (params: { id: string; file: File; numero_transaccion?: string }) => {
      const ext = params.file.name.split('.').pop() || 'jpg'
      const path = `reservas/${params.id}/comprobante.${ext}`
      const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, params.file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)

      const { error } = await supabase.from('reservas').update({
        estado: 'comprobante_enviado',
        comprobante_url: urlData?.publicUrl || null,
        numero_transaccion: params.numero_transaccion || null,
      }).eq('id', params.id)
      if (error) throw error

      // Notify admin
      const { data: reserva } = await supabase
        .from('reservas')
        .select('numero_reserva, residentes(nombre, apellido)')
        .eq('id', params.id)
        .single()
      const adminEmail = await getAdminEmail(condominioId)
      if (adminEmail && reserva) {
        const resName = (reserva.residentes as unknown as { nombre: string; apellido: string } | null)
        await supabase.functions.invoke('notificar-reserva', {
          body: {
            tipo: 'comprobante_subido',
            reservaId: params.id,
            emailDestinatario: adminEmail,
            emailAsunto: `Comprobante de pago recibido — ${reserva.numero_reserva || params.id}`,
            emailHtml: `<p>El residente <strong>${resName?.nombre || ''} ${resName?.apellido || ''}</strong> subió su comprobante de pago para la reserva <strong>${reserva.numero_reserva || ''}</strong>.</p><p><a href="${urlData?.publicUrl}">Ver comprobante</a></p>`,
          },
        }).catch(e => console.error('Error notificando comprobante:', e))
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  // PASO 4: Admin confirma pago → confirmado + PDF confirmación con condiciones
  const confirmarPago = useMutation({
    mutationFn: async (params: { id: string }) => {
      const { error } = await supabase.from('reservas').update({ estado: 'confirmado' }).eq('id', params.id)
      if (error) throw error

      // Get full data for confirmation PDF
      const { data: reserva } = await supabase
        .from('reservas')
        .select('*, areas_comunes(*), residentes(nombre, apellido, email, user_id), unidades(numero), condominios:condominio_id(nombre)')
        .eq('id', params.id)
        .single()

      if (reserva) {
        const res = reserva.residentes as { nombre: string; apellido: string; email?: string; user_id?: string } | null
        const resEmail = await getResidenteEmail(res)
        const area = reserva.areas_comunes as AreaComun | null

        if (resEmail) {
          generarConfirmacionReserva({
            reservaId: params.id,
            residenteNombre: `${res?.nombre || ''} ${res?.apellido || ''}`.trim(),
            residenteEmail: resEmail,
            unidadNumero: (reserva.unidades as { numero: string } | null)?.numero || '',
            areaNombre: area?.nombre || '',
            fecha: reserva.fecha,
            horaInicio: reserva.hora_inicio,
            horaFin: reserva.hora_fin,
            montoGarantia: Number(reserva.monto_garantia) || 0,
            montoAlquiler: Number(reserva.monto_alquiler) || 0,
            montoTotal: Number(reserva.monto_total) || Number(reserva.cobro) || 0,
            condominioNombre: (reserva.condominios as { nombre: string } | null)?.nombre || '',
            numeroReserva: reserva.numero_reserva || '',
            condicionesUso: area?.condiciones_uso || null,
            inventario: area?.inventario || null,
            reglas: area?.reglas || null,
            politicaGarantia: area?.politica_garantia || null,
            contactoEmergencia: area?.contacto_emergencia || null,
          }).catch(e => console.error('Error generando confirmacion:', e))
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  // PASO 5: Admin devuelve garantía → finalizado
  const devolverGarantia = useMutation({
    mutationFn: async (params: { id: string }) => {
      const { error } = await supabase.from('reservas').update({ estado: 'finalizado' }).eq('id', params.id)
      if (error) throw error

      // Email to residente
      const { data: reserva } = await supabase
        .from('reservas')
        .select('monto_garantia, residentes(nombre, apellido, email, user_id), condominios:condominio_id(nombre)')
        .eq('id', params.id)
        .single()

      if (reserva) {
        const res = reserva.residentes as unknown as { nombre: string; apellido: string; email?: string; user_id?: string } | null
        const resEmail = await getResidenteEmail(res)
        if (resEmail) {
          await supabase.functions.invoke('notificar-reserva', {
            body: {
              tipo: 'garantia_devuelta',
              reservaId: params.id,
              emailDestinatario: resEmail,
              emailAsunto: 'Garantia procesada — Reserva finalizada',
              emailHtml: `<p>Estimado/a <strong>${res?.nombre || ''} ${res?.apellido || ''}</strong>,</p><p>Su garantia de <strong>Bs. ${Number(reserva.monto_garantia || 0).toFixed(2)}</strong> ha sido procesada para devolucion.</p><p>Gracias por usar nuestras instalaciones.</p><p>ALTRION S.R.L.</p>`,
            },
          }).catch(e => console.error('Error notificando garantia:', e))
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  return {
    reservas: query.data || [],
    isLoading: query.isLoading,
    verificarDisponibilidad,
    crearReserva,
    aprobar,
    rechazar,
    subirComprobante,
    confirmarPago,
    devolverGarantia,
  }
}
