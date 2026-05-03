import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Visitante {
  id: string
  condominio_id: string
  guardia_id: string
  unidad_destino_id: string | null
  nombre: string
  motivo: string | null
  placa_vehiculo: string | null
  foto_visitante_url: string | null
  estado: 'dentro' | 'pendiente' | 'salido'
  ingreso_at: string
  salida_at: string | null
  created_at: string
  unidades?: { numero: string }
}

export function useVisitantes(condominioId: string, guardiaId: string) {
  const queryClient = useQueryClient()

  const activos = useQuery({
    queryKey: ['visitantes-activos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('visitantes')
        .select('*, unidades:unidad_destino_id(numero)')
        .eq('condominio_id', condominioId).eq('estado', 'autorizado').order('ingreso_at', { ascending: false })
      if (error) throw error
      return data as Visitante[]
    },
    enabled: !!condominioId,
  })

  const historial = useQuery({
    queryKey: ['visitantes-historial', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('visitantes')
        .select('*, unidades:unidad_destino_id(numero)')
        .eq('condominio_id', condominioId).order('ingreso_at', { ascending: false }).limit(20)
      if (error) throw error
      return data as Visitante[]
    },
    enabled: !!condominioId,
  })

  const registrarIngreso = useMutation({
    mutationFn: async (input: { nombre: string; motivo?: string; unidad_id?: string; placa?: string; foto?: Blob }) => {
      let foto_visitante_url: string | null = null

      if (input.foto) {
        const timestamp = Date.now()
        const path = `visitantes/${condominioId}/${timestamp}.jpg`
        const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, input.foto, {
          contentType: 'image/jpeg',
        })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
        foto_visitante_url = urlData.publicUrl
      }

      const { error } = await supabase.from('visitantes').insert({
        condominio_id: condominioId,
        guardia_id: guardiaId,
        unidad_destino_id: input.unidad_id || null,
        nombre: input.nombre,
        motivo: input.motivo || 'visita',
        placa_vehiculo: input.placa || null,
        foto_visitante_url,
        estado: 'autorizado',
        ingreso_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes-activos', condominioId] })
      queryClient.invalidateQueries({ queryKey: ['visitantes-historial', condominioId] })
    },
  })

  const registrarSalida = useMutation({
    mutationFn: async (visitanteId: string) => {
      const { error } = await supabase.from('visitantes').update({
        salida_at: new Date().toISOString(),
        estado: 'salido' as any,
      }).eq('id', visitanteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitantes-activos', condominioId] })
      queryClient.invalidateQueries({ queryKey: ['visitantes-historial', condominioId] })
    },
  })

  return {
    activos: activos.data || [],
    historial: historial.data || [],
    isLoading: activos.isLoading,
    registrarIngreso,
    registrarSalida,
  }
}
