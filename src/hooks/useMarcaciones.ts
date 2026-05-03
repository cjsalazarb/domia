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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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
      // Convert blob to base64
      const imagen_base64 = await blobToBase64(input.foto)

      // Call Edge Function with service role (bypasses storage RLS for PIN auth)
      const { data, error } = await supabase.functions.invoke('subir-marcador', {
        body: {
          imagen_base64,
          guardia_id: guardiaId,
          condominio_id: condominioId,
          tipo: input.tipo,
          gps_lat: input.latitud ?? null,
          gps_lng: input.longitud ?? null,
          turno_id: input.turno_id || null,
        },
      })

      if (error) {
        throw new Error(error.message || 'Error al subir marcación')
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Error al subir marcación')
      }

      return data as { success: boolean; foto_url: string | null }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marcaciones', guardiaId] }),
  })

  return { historial: historial.data || [], isLoading: historial.isLoading, registrar }
}
