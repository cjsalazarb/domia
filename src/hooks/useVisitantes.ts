import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Visitante {
  id: string
  condominio_id: string
  guardia_id: string
  unidad_id: string | null
  nombre: string
  ci: string | null
  motivo: string | null
  foto_url: string | null
  estado: 'dentro' | 'salido'
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
      const { data, error } = await supabase.from('visitantes').select('*, unidades(numero)')
        .eq('condominio_id', condominioId).is('salida_at', null).order('ingreso_at', { ascending: false })
      if (error) throw error
      return data as Visitante[]
    },
    enabled: !!condominioId,
  })

  const historial = useQuery({
    queryKey: ['visitantes-historial', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('visitantes').select('*, unidades(numero)')
        .eq('condominio_id', condominioId).order('ingreso_at', { ascending: false }).limit(20)
      if (error) throw error
      return data as Visitante[]
    },
    enabled: !!condominioId,
  })

  const registrarIngreso = useMutation({
    mutationFn: async (input: { nombre: string; ci?: string; motivo?: string; unidad_id?: string; foto?: Blob }) => {
      let foto_url: string | null = null

      if (input.foto) {
        const timestamp = Date.now()
        const path = `visitantes/${condominioId}/${timestamp}.jpg`
        const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, input.foto, {
          contentType: 'image/jpeg',
        })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
        foto_url = urlData.publicUrl
      }

      const { error } = await supabase.from('visitantes').insert({
        condominio_id: condominioId,
        guardia_id: guardiaId,
        unidad_id: input.unidad_id || null,
        nombre: input.nombre,
        ci: input.ci || null,
        motivo: input.motivo || null,
        foto_url,
        estado: 'dentro',
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
        estado: 'salido',
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
