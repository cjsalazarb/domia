import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Recibo {
  id: string
  unidad_id: string
  condominio_id: string
  residente_id: string
  periodo: string
  monto_base: number
  monto_recargo: number
  monto_descuento: number
  monto_total: number
  estado: 'emitido' | 'pagado' | 'vencido' | 'anulado'
  pdf_url: string | null
  fecha_vencimiento: string
  notas: string | null
  created_at: string
  // Joined
  unidades?: { numero: string; tipo: string; edificio_id: string }
  residentes?: { nombre: string; apellido: string; email: string | null }
}

export function useRecibos(condominioId: string, periodo?: string) {
  const queryClient = useQueryClient()

  const recibosQuery = useQuery({
    queryKey: ['recibos', condominioId, periodo],
    queryFn: async () => {
      let query = supabase
        .from('recibos')
        .select('*, unidades(numero, tipo, edificio_id), residentes(nombre, apellido, email)')
        .eq('condominio_id', condominioId)
        .order('created_at', { ascending: false })

      if (periodo) {
        query = query.eq('periodo', periodo)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Recibo[]
    },
    enabled: !!condominioId,
  })

  const confirmarPago = useMutation({
    mutationFn: async (params: { reciboId: string; monto: number; metodo: string; comprobante_url?: string }) => {
      // Insert pago
      const { error: pagoError } = await supabase.from('pagos').insert({
        recibo_id: params.reciboId,
        residente_id: recibosQuery.data?.find(r => r.id === params.reciboId)?.residente_id,
        condominio_id: condominioId,
        monto: params.monto,
        metodo: params.metodo,
        fecha_pago: new Date().toISOString().split('T')[0],
        comprobante_url: params.comprobante_url,
      })
      if (pagoError) throw pagoError

      // Update recibo status
      const { error: reciboError } = await supabase
        .from('recibos')
        .update({ estado: 'pagado' })
        .eq('id', params.reciboId)
      if (reciboError) throw reciboError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos', condominioId] })
    },
  })

  return {
    recibos: recibosQuery.data || [],
    isLoading: recibosQuery.isLoading,
    error: recibosQuery.error,
    confirmarPago,
  }
}
