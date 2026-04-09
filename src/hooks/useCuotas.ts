import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Cuota {
  id: string
  condominio_id: string
  tipo_unidad: string
  monto: number
  moneda: string
  descripcion: string | null
  activa: boolean
  vigente_desde: string
  created_at: string
  updated_at: string
}

export function useCuotas(condominioId: string) {
  const queryClient = useQueryClient()

  const cuotasQuery = useQuery({
    queryKey: ['cuotas', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuotas')
        .select('*')
        .eq('condominio_id', condominioId)
        .order('tipo_unidad')
        .order('vigente_desde', { ascending: false })

      if (error) throw error
      return data as Cuota[]
    },
    enabled: !!condominioId,
  })

  const upsertCuota = useMutation({
    mutationFn: async (params: { tipo_unidad: string; monto: number; descripcion?: string }) => {
      const hoy = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('cuotas')
        .upsert({
          condominio_id: condominioId,
          tipo_unidad: params.tipo_unidad,
          monto: params.monto,
          descripcion: params.descripcion || `Cuota mensual ${params.tipo_unidad}`,
          vigente_desde: hoy,
          activa: true,
          moneda: 'BOB',
        }, {
          onConflict: 'condominio_id,tipo_unidad,vigente_desde',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuotas', condominioId] })
    },
  })

  // Get current active cuota per type
  const cuotasActuales = (cuotasQuery.data || []).reduce<Record<string, Cuota>>((acc, cuota) => {
    if (cuota.activa && !acc[cuota.tipo_unidad]) {
      acc[cuota.tipo_unidad] = cuota
    }
    return acc
  }, {})

  return {
    cuotas: cuotasQuery.data || [],
    cuotasActuales,
    isLoading: cuotasQuery.isLoading,
    error: cuotasQuery.error,
    upsertCuota,
  }
}
