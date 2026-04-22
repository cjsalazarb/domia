import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Marcacion {
  id: string
  guardia_id: string
  condominio_id: string
  turno_id: string | null
  tipo: 'entrada' | 'salida'
  foto_url: string | null
  latitud: number | null
  longitud: number | null
  created_at: string
}

export function useMarcaciones(guardiaId: string, condominioId: string) {
  const queryClient = useQueryClient()

  const historial = useQuery({
    queryKey: ['marcaciones', guardiaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('marcaciones_guardia').select('*')
        .eq('guardia_id', guardiaId).order('created_at', { ascending: false }).limit(10)
      if (error) throw error
      return data as Marcacion[]
    },
    enabled: !!guardiaId,
  })

  const registrar = useMutation({
    mutationFn: async (input: { tipo: 'entrada' | 'salida'; foto: Blob; latitud?: number; longitud?: number; turno_id?: string }) => {
      const timestamp = Date.now()
      const path = `marcaciones/${guardiaId}/${timestamp}.jpg`

      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, input.foto, {
        contentType: 'image/jpeg',
      })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)

      const { error } = await supabase.from('marcaciones_guardia').insert({
        guardia_id: guardiaId,
        condominio_id: condominioId,
        turno_id: input.turno_id || null,
        tipo: input.tipo,
        foto_url: urlData.publicUrl,
        latitud: input.latitud ?? null,
        longitud: input.longitud ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marcaciones', guardiaId] }),
  })

  return { historial: historial.data || [], isLoading: historial.isLoading, registrar }
}
