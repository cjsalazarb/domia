import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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
}

export interface Reserva {
  id: string
  area_id: string
  condominio_id: string
  unidad_id: string
  residente_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'
  motivo: string | null
  aprobado_por: string | null
  motivo_rechazo: string | null
  cobro: number | null
  created_at: string
  areas_comunes?: { nombre: string }
  residentes?: { nombre: string; apellido: string }
  unidades?: { numero: string }
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

  return { areas: query.data || [], isLoading: query.isLoading, crear, actualizar }
}

export function useReservas(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['reservas', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*, areas_comunes(nombre), residentes(nombre, apellido), unidades(numero)')
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
      .in('estado', ['pendiente', 'aprobada'])
      .lt('hora_inicio', horaFin)
      .gt('hora_fin', horaInicio)
    return !data || data.length === 0
  }

  const crearReserva = useMutation({
    mutationFn: async (input: { area_id: string; unidad_id: string; residente_id: string; fecha: string; hora_inicio: string; hora_fin: string; motivo?: string; cobro?: number; requiere_aprobacion: boolean }) => {
      const disponible = await verificarDisponibilidad(input.area_id, input.fecha, input.hora_inicio, input.hora_fin)
      if (!disponible) throw new Error('Horario no disponible — ya existe una reserva en ese rango')

      const { error } = await supabase.from('reservas').insert({
        area_id: input.area_id,
        condominio_id: condominioId,
        unidad_id: input.unidad_id,
        residente_id: input.residente_id,
        fecha: input.fecha,
        hora_inicio: input.hora_inicio,
        hora_fin: input.hora_fin,
        motivo: input.motivo || null,
        cobro: input.cobro || 0,
        estado: input.requiere_aprobacion ? 'pendiente' : 'aprobada',
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  const aprobar = useMutation({
    mutationFn: async (params: { id: string; aprobado_por: string }) => {
      const { error } = await supabase.from('reservas').update({ estado: 'aprobada', aprobado_por: params.aprobado_por }).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  const rechazar = useMutation({
    mutationFn: async (params: { id: string; motivo_rechazo: string }) => {
      const { error } = await supabase.from('reservas').update({ estado: 'rechazada', motivo_rechazo: params.motivo_rechazo }).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas', condominioId] }),
  })

  return { reservas: query.data || [], isLoading: query.isLoading, verificarDisponibilidad, crearReserva, aprobar, rechazar }
}
