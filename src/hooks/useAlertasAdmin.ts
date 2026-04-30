import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AlertaAdmin {
  id: string
  condominio_id: string
  residente_id: string
  unidad_id: string | null
  tipo: string
  mensaje: string | null
  atendida: boolean
  atendida_por: string | null
  atendida_at: string | null
  created_at: string
  residentes?: { nombre: string; apellido: string }
  unidades?: { numero: string }
  condominios?: { nombre: string }
}

export function useAlertasAdmin(condominioIds?: string[]) {
  const queryClient = useQueryClient()

  const alertas = useQuery({
    queryKey: ['alertas-admin', condominioIds],
    queryFn: async () => {
      let q = supabase.from('alertas_residentes')
        .select('*, residentes(nombre, apellido), unidades(numero), condominios:condominio_id(nombre)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (condominioIds && condominioIds.length > 0) {
        q = q.in('condominio_id', condominioIds)
      }

      const { data, error } = await q
      if (error) throw error
      return data as AlertaAdmin[]
    },
    enabled: true,
  })

  const pendientes = useMemo(() => {
    return (alertas.data || []).filter(a => !a.atendida).length
  }, [alertas.data])

  const emergenciasPendientes = useMemo(() => {
    return (alertas.data || []).filter(a => !a.atendida && a.tipo === 'emergencia')
  }, [alertas.data])

  const marcarAtendida = useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase.from('alertas_residentes').update({
        atendida: true,
        atendida_at: new Date().toISOString(),
      }).eq('id', alertaId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas-admin'] }),
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('alertas-admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alertas_residentes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alertas-admin'] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  return {
    alertas: alertas.data || [],
    isLoading: alertas.isLoading,
    pendientes,
    emergenciasPendientes,
    marcarAtendida,
  }
}
