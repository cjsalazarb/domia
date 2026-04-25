import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Tenant {
  id: string
  nombre: string
  email: string
  telefono: string | null
  plan: string
  estado: string
  trial_hasta: string | null
  proximo_cobro: string | null
  total_unidades: number
  monto_mensual: number
  created_at: string
  updated_at: string
}

export function useTenants() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Tenant[]
    },
  })

  const actualizar = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Tenant> }) => {
      const { error } = await supabase.from('tenants').update(params.updates).eq('id', params.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return { tenants: query.data || [], isLoading: query.isLoading, actualizar }
}

export function useMiTenant(tenantId: string | null) {
  return useQuery({
    queryKey: ['mi-tenant', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
      if (error) throw error
      return data as Tenant
    },
    enabled: !!tenantId,
  })
}
