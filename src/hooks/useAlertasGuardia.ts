import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AlertaResidente {
  id: string
  condominio_id: string
  residente_id: string
  unidad_id: string
  tipo: string
  mensaje: string | null
  atendida: boolean
  atendida_por: string | null
  atendida_at: string | null
  created_at: string
  residentes?: { nombre: string; apellido: string }
  unidades?: { numero: string }
}

export function useAlertasGuardia(condominioId: string) {
  const queryClient = useQueryClient()

  const alertas = useQuery({
    queryKey: ['alertas-guardia', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('alertas_residentes')
        .select('*, residentes(nombre, apellido), unidades(numero)')
        .eq('condominio_id', condominioId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as AlertaResidente[]
    },
    enabled: !!condominioId,
  })

  const pendientes = useMemo(() => {
    return (alertas.data || []).filter(a => !a.atendida).length
  }, [alertas.data])

  const marcarAtendida = useMutation({
    mutationFn: async (params: { alertaId: string; guardiaId: string }) => {
      const { error } = await supabase.from('alertas_residentes').update({
        atendida: true,
        atendida_por: params.guardiaId,
        atendida_at: new Date().toISOString(),
      }).eq('id', params.alertaId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas-guardia', condominioId] }),
  })

  useEffect(() => {
    if (!condominioId) return

    const channel = supabase
      .channel(`alertas-${condominioId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas_residentes', filter: `condominio_id=eq.${condominioId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alertas-guardia', condominioId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [condominioId, queryClient])

  return {
    alertas: alertas.data || [],
    isLoading: alertas.isLoading,
    pendientes,
    marcarAtendida,
  }
}
