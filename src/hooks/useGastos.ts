import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Gasto {
  id: string
  condominio_id: string
  categoria: string
  descripcion: string
  monto: number
  monto_pagado: number
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

  const editar = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<{ descripcion: string; categoria: string; monto: number; fecha: string; proveedor_nombre: string | null; notas: string | null }> }) => {
      const { error } = await supabase.from('gastos').update(input.updates).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos', condominioId] })
      qc.invalidateQueries({ queryKey: ['balance', condominioId] })
    },
  })

  const pagarGasto = useMutation({
    mutationFn: async (input: { gastoId: string; monto: number; metodo: 'efectivo' | 'transferencia' | 'cheque'; fecha: string; descripcionGasto: string; proveedorNombre: string }) => {
      // 1. Crear asiento contable: D 2.1.1 CxP Proveedores / C Caja o Banco
      const cuentaCredito = input.metodo === 'efectivo' ? '1.1.1' : '1.1.2'

      // Buscar IDs de cuentas
      const { data: cuentas, error: e1 } = await supabase
        .from('plan_cuentas')
        .select('id, codigo')
        .eq('condominio_id', condominioId)
        .in('codigo', ['2.1.1', cuentaCredito])
      if (e1) throw e1

      const cxp = cuentas?.find(c => c.codigo === '2.1.1')
      const caja = cuentas?.find(c => c.codigo === cuentaCredito)
      if (!cxp || !caja) throw new Error('No se encontraron las cuentas contables necesarias')

      // Crear asiento
      const { data: asiento, error: e2 } = await supabase.from('asientos_contables').insert({
        condominio_id: condominioId,
        numero: 0,
        fecha: input.fecha,
        descripcion: `Pago proveedor ${input.proveedorNombre} - ${input.descripcionGasto}`,
        referencia_tipo: 'gasto',
        referencia_id: input.gastoId,
      }).select().single()
      if (e2) throw e2

      // Crear detalles
      const { error: e3 } = await supabase.from('asiento_detalles').insert([
        { asiento_id: asiento.id, cuenta_id: cxp.id, debe: input.monto, haber: 0 },
        { asiento_id: asiento.id, cuenta_id: caja.id, debe: 0, haber: input.monto },
      ])
      if (e3) throw e3

      // 2. Actualizar monto_pagado en el gasto
      const { data: gasto, error: e4 } = await supabase
        .from('gastos')
        .select('monto_pagado')
        .eq('id', input.gastoId)
        .single()
      if (e4) throw e4

      const nuevoMontoPagado = Number(gasto.monto_pagado) + input.monto
      const { error: e5 } = await supabase.from('gastos')
        .update({ monto_pagado: nuevoMontoPagado })
        .eq('id', input.gastoId)
      if (e5) throw e5
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos', condominioId] })
      qc.invalidateQueries({ queryKey: ['balance', condominioId] })
      qc.invalidateQueries({ queryKey: ['libro-diario', condominioId] })
      qc.invalidateQueries({ queryKey: ['saldos-cuentas', condominioId] })
    },
  })

  const totalMes = (query.data || []).reduce((s, g) => s + Number(g.monto), 0)

  return { gastos: query.data || [], isLoading: query.isLoading, crear, editar, pagarGasto, totalMes }
}
