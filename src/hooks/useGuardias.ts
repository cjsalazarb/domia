import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Guardia {
  id: string
  user_id: string | null
  condominio_id: string
  nombre: string
  apellido: string
  ci: string
  telefono: string | null
  empresa: string | null
  foto_url: string | null
  habilitacion_dgsc: string | null
  habilitacion_vigente: string | null
  activo: boolean
  fecha_ingreso: string | null
  notas: string | null
  created_at: string
}

export interface Turno {
  id: string
  guardia_id: string
  condominio_id: string
  tipo: 'manana' | 'tarde' | 'noche'
  fecha: string
  hora_programada_inicio: string
  hora_programada_fin: string
  hora_real_inicio: string | null
  hora_real_fin: string | null
  estado: 'programado' | 'activo' | 'completado' | 'ausente'
  horas_trabajadas: number | null
  notas: string | null
  created_at: string
  guardias?: { nombre: string; apellido: string }
}

export interface Incidente {
  id: string
  turno_id: string
  guardia_id: string
  condominio_id: string
  tipo: string
  descripcion: string
  hora_incidente: string
  personas_involucradas: string | null
  acciones_tomadas: string | null
  foto_url: string | null
  created_at: string
}

export interface Novedad {
  id: string
  turno_id: string
  guardia_id: string
  condominio_id: string
  hora: string
  descripcion: string
  created_at: string
}

export function useGuardias(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['guardias', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('guardias').select('*').eq('condominio_id', condominioId).order('nombre')
      if (error) throw error
      return data as Guardia[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: Partial<Guardia>) => {
      const { data, error } = await supabase.from('guardias').insert({ ...input, condominio_id: condominioId, activo: true }).select().single()
      if (error) throw error
      return data as Guardia
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guardias', condominioId] }),
  })

  const actualizar = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Guardia> }) => {
      const { error } = await supabase.from('guardias').update(params.updates).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guardias', condominioId] }),
  })

  return { guardias: query.data || [], isLoading: query.isLoading, crear, actualizar }
}

export function useTurnos(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['turnos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('turnos').select('*, guardias(nombre, apellido)')
        .eq('condominio_id', condominioId).order('fecha', { ascending: false }).limit(50)
      if (error) throw error
      return data as Turno[]
    },
    enabled: !!condominioId,
  })

  const crearTurno = useMutation({
    mutationFn: async (input: { guardia_id: string; tipo: string; fecha: string }) => {
      const horarios: Record<string, { inicio: string; fin: string }> = {
        manana: { inicio: '06:00', fin: '14:00' },
        tarde: { inicio: '14:00', fin: '22:00' },
        noche: { inicio: '22:00', fin: '06:00' },
      }
      const h = horarios[input.tipo] || horarios.manana
      const { error } = await supabase.from('turnos').insert({
        guardia_id: input.guardia_id, condominio_id: condominioId, tipo: input.tipo,
        fecha: input.fecha, hora_programada_inicio: h.inicio, hora_programada_fin: h.fin, estado: 'programado',
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos', condominioId] }),
  })

  return { turnos: query.data || [], isLoading: query.isLoading, crearTurno }
}

export function useMiTurno(guardiaId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['mi-turno', guardiaId],
    queryFn: async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase.from('turnos').select('*')
        .eq('guardia_id', guardiaId).eq('fecha', hoy).in('estado', ['programado', 'activo']).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data as Turno | null
    },
    enabled: !!guardiaId,
  })

  const iniciar = useMutation({
    mutationFn: async (turnoId: string) => {
      const { error } = await supabase.from('turnos').update({ estado: 'activo', hora_real_inicio: new Date().toISOString() }).eq('id', turnoId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mi-turno', guardiaId] }),
  })

  const finalizar = useMutation({
    mutationFn: async (turnoId: string) => {
      const { error } = await supabase.from('turnos').update({ estado: 'completado', hora_real_fin: new Date().toISOString() }).eq('id', turnoId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mi-turno', guardiaId] }),
  })

  const historial = useQuery({
    queryKey: ['historial-turnos', guardiaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('turnos').select('*').eq('guardia_id', guardiaId)
        .eq('estado', 'completado').order('fecha', { ascending: false }).limit(10)
      if (error) throw error
      return data as Turno[]
    },
    enabled: !!guardiaId,
  })

  return { turnoActual: query.data, isLoading: query.isLoading, iniciar, finalizar, historial: historial.data || [] }
}

export function useIncidentes(turnoId: string, guardiaId: string, condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['incidentes', turnoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidentes').select('*').eq('turno_id', turnoId).order('hora_incidente', { ascending: false })
      if (error) throw error
      return data as Incidente[]
    },
    enabled: !!turnoId,
  })

  const crear = useMutation({
    mutationFn: async (input: { tipo: string; descripcion: string; personas_involucradas?: string; acciones_tomadas?: string; foto_url?: string }) => {
      const { error } = await supabase.from('incidentes').insert({
        turno_id: turnoId, guardia_id: guardiaId, condominio_id: condominioId,
        tipo: input.tipo, descripcion: input.descripcion, hora_incidente: new Date().toISOString(),
        personas_involucradas: input.personas_involucradas || null,
        acciones_tomadas: input.acciones_tomadas || null, foto_url: input.foto_url || null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidentes', turnoId] }),
  })

  return { incidentes: query.data || [], crear }
}

export function useNovedades(turnoId: string, guardiaId: string, condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['novedades', turnoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('libro_novedades').select('*').eq('turno_id', turnoId).order('hora', { ascending: false })
      if (error) throw error
      return data as Novedad[]
    },
    enabled: !!turnoId,
  })

  const crear = useMutation({
    mutationFn: async (descripcion: string) => {
      const { error } = await supabase.from('libro_novedades').insert({
        turno_id: turnoId, guardia_id: guardiaId, condominio_id: condominioId,
        hora: new Date().toISOString(), descripcion,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['novedades', turnoId] }),
  })

  return { novedades: query.data || [], crear }
}
