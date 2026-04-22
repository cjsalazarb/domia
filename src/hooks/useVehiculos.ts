import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AccesoVehiculo {
  id: string
  condominio_id: string
  guardia_id: string
  placa: string
  marca: string | null
  color: string | null
  conductor: string | null
  unidad_id: string | null
  motivo: string | null
  foto_url: string | null
  entrada_at: string
  salida_at: string | null
  created_at: string
}

export function useVehiculos(condominioId: string, guardiaId: string) {
  const queryClient = useQueryClient()

  const activos = useQuery({
    queryKey: ['vehiculos-activos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('acceso_vehiculos').select('*')
        .eq('condominio_id', condominioId).is('salida_at', null).order('entrada_at', { ascending: false })
      if (error) throw error
      return data as AccesoVehiculo[]
    },
    enabled: !!condominioId,
  })

  const registrarEntrada = useMutation({
    mutationFn: async (input: { placa: string; marca?: string; color?: string; conductor?: string; unidad_id?: string; motivo?: string; foto?: Blob }) => {
      let foto_url: string | null = null

      if (input.foto) {
        const timestamp = Date.now()
        const path = `vehiculos/${condominioId}/${timestamp}.jpg`
        const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, input.foto, {
          contentType: 'image/jpeg',
        })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
        foto_url = urlData.publicUrl
      }

      const { error } = await supabase.from('acceso_vehiculos').insert({
        condominio_id: condominioId,
        guardia_id: guardiaId,
        placa: input.placa,
        marca: input.marca || null,
        color: input.color || null,
        conductor: input.conductor || null,
        unidad_id: input.unidad_id || null,
        motivo: input.motivo || null,
        foto_url,
        entrada_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehiculos-activos', condominioId] }),
  })

  const registrarSalida = useMutation({
    mutationFn: async (vehiculoId: string) => {
      const { error } = await supabase.from('acceso_vehiculos').update({
        salida_at: new Date().toISOString(),
      }).eq('id', vehiculoId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehiculos-activos', condominioId] }),
  })

  const buscarPlaca = async (placa: string) => {
    const { data, error } = await supabase.from('acceso_vehiculos').select('*')
      .eq('condominio_id', condominioId).ilike('placa', `%${placa}%`).order('entrada_at', { ascending: false }).limit(5)
    if (error) throw error
    return data as AccesoVehiculo[]
  }

  return {
    activos: activos.data || [],
    isLoading: activos.isLoading,
    registrarEntrada,
    registrarSalida,
    buscarPlaca,
  }
}
