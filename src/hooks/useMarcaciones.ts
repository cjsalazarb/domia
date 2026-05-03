import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ncrjcbwxlzhgswvwfhzu.supabase.co'

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
      // Use Edge Function with service role to bypass storage RLS (PIN auth has no auth.uid())
      const formData = new FormData()
      formData.append('foto', input.foto, 'selfie.jpg')
      formData.append('guardia_id', guardiaId)
      formData.append('condominio_id', condominioId)
      formData.append('tipo', input.tipo)
      if (input.turno_id) formData.append('turno_id', input.turno_id)
      if (input.latitud !== undefined) formData.append('latitud', input.latitud.toString())
      if (input.longitud !== undefined) formData.append('longitud', input.longitud.toString())

      const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-marcacion`, {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Error al subir marcación')
      }
      return result as { success: boolean; foto_url: string | null }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marcaciones', guardiaId] }),
  })

  return { historial: historial.data || [], isLoading: historial.isLoading, registrar }
}
