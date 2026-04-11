import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Gasto {
  id: string
  condominio_id: string
  categoria: string
  descripcion: string
  monto: number
  fecha: string
  proveedor_id: string | null
  proveedor_nombre: string | null
  factura_url: string | null
  recurrente: boolean
  registrado_por: string | null
  notas: string | null
  created_at: string
}

export function useGastos(condominioId: string, mes?: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['gastos', condominioId, mes],
    queryFn: async () => {
      let q = supabase.from('gastos').select('*').eq('condominio_id', condominioId).order('fecha', { ascending: false })

      if (mes) {
        const start = `${mes}-01`
        const d = new Date(parseInt(mes.split('-')[0]), parseInt(mes.split('-')[1]), 0)
        const end = `${mes}-${String(d.getDate()).padStart(2, '0')}`
        q = q.gte('fecha', start).lte('fecha', end)
      }

      const { data, error } = await q
      if (error) throw error
      return data as Gasto[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: { descripcion: string; categoria: string; monto: number; fecha: string; proveedor_nombre?: string; proveedor_id?: string; factura_url?: string; recurrente?: boolean; notas?: string; registrado_por?: string }) => {
      const { error } = await supabase.from('gastos').insert({
        condominio_id: condominioId,
        descripcion: input.descripcion,
        categoria: input.categoria,
        monto: input.monto,
        fecha: input.fecha,
        proveedor_id: input.proveedor_id || null,
        proveedor_nombre: input.proveedor_nombre || null,
        factura_url: input.factura_url || null,
        recurrente: input.recurrente || false,
        registrado_por: input.registrado_por || null,
        notas: input.notas || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos', condominioId] })
      qc.invalidateQueries({ queryKey: ['balance', condominioId] })
    },
  })

  const totalMes = (query.data || []).reduce((s, g) => s + Number(g.monto), 0)

  return { gastos: query.data || [], isLoading: query.isLoading, crear, totalMes }
}
