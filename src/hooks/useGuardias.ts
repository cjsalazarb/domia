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

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guardias').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guardias', condominioId] }),
  })

  return { guardias: query.data || [], isLoading: query.isLoading, crear, actualizar, eliminar }
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

  const derivarTipo = (horaInicio: string): 'manana' | 'tarde' | 'noche' => {
    const h = parseInt(horaInicio.split(':')[0])
    if (h >= 6 && h < 14) return 'manana'
    if (h >= 14 && h < 22) return 'tarde'
    return 'noche'
  }

  const crearTurno = useMutation({
    mutationFn: async (input: { guardia_id: string; fecha: string; horaInicio: string; horaFin: string }) => {
      const { error } = await supabase.from('turnos').insert({
        guardia_id: input.guardia_id, condominio_id: condominioId,
        tipo: derivarTipo(input.horaInicio),
        fecha: input.fecha, hora_programada_inicio: input.horaInicio, hora_programada_fin: input.horaFin,
        estado: 'programado',
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos', condominioId] }),
  })

  const crearTurnosBatch = useMutation({
    mutationFn: async (input: { guardia_id: string; fechas: string[]; horaInicio: string; horaFin: string; sobreescribir?: string[] }) => {
      // Delete existing turnos for overwrite dates
      if (input.sobreescribir && input.sobreescribir.length > 0) {
        const { error: delErr } = await supabase.from('turnos').delete()
          .eq('guardia_id', input.guardia_id).eq('condominio_id', condominioId)
          .in('fecha', input.sobreescribir)
        if (delErr) throw delErr
      }
      const tipo = derivarTipo(input.horaInicio)
      // Insert all new turnos
      const rows = input.fechas.map(f => ({
        guardia_id: input.guardia_id, condominio_id: condominioId, tipo,
        fecha: f, hora_programada_inicio: input.horaInicio, hora_programada_fin: input.horaFin,
        estado: 'programado' as const,
      }))
      const { error } = await supabase.from('turnos').insert(rows)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos', condominioId] }),
  })

  const eliminarTurno = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('turnos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos', condominioId] }),
  })

  const actualizarTurno = useMutation({
    mutationFn: async (input: { id: string; fecha: string; horaInicio: string; horaFin: string }) => {
      const { error } = await supabase.from('turnos').update({
        fecha: input.fecha,
        hora_programada_inicio: input.horaInicio,
        hora_programada_fin: input.horaFin,
        tipo: derivarTipo(input.horaInicio),
      }).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['turnos', condominioId] }),
  })

  return { turnos: query.data || [], isLoading: query.isLoading, crearTurno, crearTurnosBatch, eliminarTurno, actualizarTurno }
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useMiTurno(guardiaId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['mi-turno', guardiaId],
    queryFn: async () => {
      const hoy = formatLocalDate(new Date())
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
