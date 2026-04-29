import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PagoSuscripcion {
  id: string
  tenant_id: string
  monto: number
  periodo: string
  metodo: string
  referencia: string | null
  estado: 'pendiente' | 'verificado' | 'rechazado'
  qr_generado_en: string | null
  pagado_en: string | null
  verificado_por: string | null
  comprobante_url: string | null
  rechazado_motivo: string | null
  notas: string | null
  created_at: string
  tenants?: { nombre: string; email: string }
}

export function usePagosSuscripcion(tenantId: string | null) {
  return useQuery({
    queryKey: ['pagos-suscripcion', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      const { data, error } = await supabase
        .from('pagos_suscripcion')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PagoSuscripcion[]
    },
    enabled: !!tenantId,
  })
}

export function usePagosPendientes() {
  return useQuery({
    queryKey: ['pagos-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_suscripcion')
        .select('*, tenants(nombre, email)')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PagoSuscripcion[]
    },
  })
}

export function usePagosMutations() {
  const qc = useQueryClient()

  const crearPago = useMutation({
    mutationFn: async (input: {
      tenant_id: string
      monto: number
      periodo: string
      metodo: string
      referencia?: string
      comprobante_url?: string
    }) => {
      const { data, error } = await supabase
        .from('pagos_suscripcion')
        .insert({
          ...input,
          estado: 'pendiente',
          pagado_en: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data as PagoSuscripcion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos-suscripcion'] })
      qc.invalidateQueries({ queryKey: ['pagos-pendientes'] })
    },
  })

  const verificarPago = useMutation({
    mutationFn: async (params: { pagoId: string; tenantId: string; verificadoPor: string }) => {
      const { error: pagoErr } = await supabase
        .from('pagos_suscripcion')
        .update({
          estado: 'verificado',
          verificado_por: params.verificadoPor,
        })
        .eq('id', params.pagoId)
      if (pagoErr) throw pagoErr

      const proximoCobro = new Date()
      proximoCobro.setDate(proximoCobro.getDate() + 30)
      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({
          estado: 'activo',
          proximo_cobro: proximoCobro.toISOString().split('T')[0],
        })
        .eq('id', params.tenantId)
      if (tenantErr) throw tenantErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos-suscripcion'] })
      qc.invalidateQueries({ queryKey: ['pagos-pendientes'] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })

  const rechazarPago = useMutation({
    mutationFn: async (pagoId: string) => {
      const { error } = await supabase
        .from('pagos_suscripcion')
        .update({ estado: 'rechazado' })
        .eq('id', pagoId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos-suscripcion'] })
      qc.invalidateQueries({ queryKey: ['pagos-pendientes'] })
    },
  })

  return { crearPago, verificarPago, rechazarPago }
}
