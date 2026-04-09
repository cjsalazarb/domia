import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Mantenimiento {
  id: string
  condominio_id: string
  unidad_id: string | null
  area_comun: string | null
  titulo: string
  descripcion: string
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  estado: 'pendiente' | 'asignado' | 'en_proceso' | 'resuelto' | 'cancelado'
  solicitado_por: string | null
  asignado_a: string | null
  fecha_estimada: string | null
  fecha_resolucion: string | null
  costo: number | null
  foto_url: string | null
  notas_resolucion: string | null
  gasto_id: string | null
  created_at: string
  proveedores?: { nombre: string } | null
  unidades?: { numero: string } | null
  profiles?: { nombre: string; apellido: string } | null
}

export function useMantenimientos(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['mantenimientos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mantenimientos')
        .select('*, proveedores(nombre), unidades(numero), profiles:solicitado_por(nombre, apellido)')
        .eq('condominio_id', condominioId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Mantenimiento[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: { titulo: string; descripcion: string; prioridad: string; unidad_id?: string; foto_url?: string; solicitado_por?: string }) => {
      const { data, error } = await supabase.from('mantenimientos').insert({
        condominio_id: condominioId,
        titulo: input.titulo,
        descripcion: input.descripcion,
        prioridad: input.prioridad,
        unidad_id: input.unidad_id || null,
        foto_url: input.foto_url || null,
        solicitado_por: input.solicitado_por || null,
        estado: 'pendiente',
      }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos', condominioId] }),
  })

  const actualizar = useMutation({
    mutationFn: async (params: { id: string; estado?: string; asignado_a?: string; costo?: number; notas_resolucion?: string; fecha_estimada?: string }) => {
      const updates: Record<string, unknown> = {}
      if (params.estado) updates.estado = params.estado
      if (params.asignado_a) updates.asignado_a = params.asignado_a
      if (params.costo !== undefined) updates.costo = params.costo
      if (params.notas_resolucion) updates.notas_resolucion = params.notas_resolucion
      if (params.fecha_estimada) updates.fecha_estimada = params.fecha_estimada
      if (params.estado === 'resuelto') updates.fecha_resolucion = new Date().toISOString().split('T')[0]

      // If resolved with cost, create a gasto
      if (params.estado === 'resuelto' && params.costo && params.costo > 0) {
        const ticket = query.data?.find(t => t.id === params.id)
        const { data: gasto } = await supabase.from('gastos').insert({
          condominio_id: condominioId,
          categoria: 'mantenimiento',
          descripcion: `Mantenimiento: ${ticket?.titulo || 'Sin título'}`,
          monto: params.costo,
          fecha: new Date().toISOString().split('T')[0],
          proveedor_id: ticket?.asignado_a || params.asignado_a || null,
        }).select().single()
        if (gasto) updates.gasto_id = gasto.id
      }

      const { error } = await supabase.from('mantenimientos').update(updates).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos', condominioId] }),
  })

  return { tickets: query.data || [], isLoading: query.isLoading, crear, actualizar }
}

export function useProveedores(condominioId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['proveedores', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('condominio_id', condominioId)
        .order('nombre')
      if (error) throw error
      return data
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: { nombre: string; rubro: string; telefono?: string; email?: string; contacto_nombre?: string }) => {
      const { error } = await supabase.from('proveedores').insert({ ...input, condominio_id: condominioId, activo: true })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores', condominioId] }),
  })

  const actualizar = useMutation({
    mutationFn: async (params: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('proveedores').update(params.updates).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores', condominioId] }),
  })

  return { proveedores: query.data || [], isLoading: query.isLoading, crear, actualizar }
}
