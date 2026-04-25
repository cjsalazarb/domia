import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Residente {
  id: string
  user_id: string | null
  unidad_id: string
  condominio_id: string
  tipo: 'propietario' | 'inquilino'
  nombre: string
  apellido: string
  ci: string | null
  telefono: string | null
  email: string | null
  propietario_id: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: 'activo' | 'inactivo' | 'moroso'
  doc_ci_url: string | null
  doc_contrato_url: string | null
  notas: string | null
  created_at: string
  unidades?: { numero: string; tipo: string; edificio_id: string }
}

export interface CreateResidenteInput {
  tipo: 'propietario' | 'inquilino'
  nombre: string
  apellido: string
  ci?: string
  telefono?: string
  email?: string
  unidad_id: string
  propietario_id?: string
  fecha_inicio?: string
  fecha_fin?: string
  notas?: string
}

export function useResidentes(condominioId: string) {
  const queryClient = useQueryClient()

  const residentesQuery = useQuery({
    queryKey: ['residentes', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residentes')
        .select('*, unidades(numero, tipo, edificio_id)')
        .eq('condominio_id', condominioId)
        .order('nombre')

      if (error) throw error
      return data as Residente[]
    },
    enabled: !!condominioId,
  })

  const createResidente = useMutation({
    mutationFn: async (input: CreateResidenteInput) => {
      const { data, error } = await supabase
        .from('residentes')
        .insert({
          ...input,
          condominio_id: condominioId,
          estado: 'activo',
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || 'Error al crear residente')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residentes', condominioId] })
    },
  })

  const updateResidente = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<CreateResidenteInput & { estado: string }> }) => {
      const { data, error } = await supabase
        .from('residentes')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message || 'Error al actualizar residente')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residentes', condominioId] })
    },
  })

  const eliminarResidente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('residentes')
        .update({ estado: 'inactivo', user_id: null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residentes', condominioId] })
    },
  })

  return {
    residentes: residentesQuery.data || [],
    isLoading: residentesQuery.isLoading,
    error: residentesQuery.error,
    createResidente,
    updateResidente,
    eliminarResidente,
  }
}

export function useHistorialUnidad(unidadId: string) {
  return useQuery({
    queryKey: ['historial-unidad', unidadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residentes')
        .select('id, tipo, nombre, apellido, estado, fecha_inicio, fecha_fin, created_at')
        .eq('unidad_id', unidadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!unidadId,
  })
}
