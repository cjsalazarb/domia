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
  dia_cobro: number
  created_at: string
  updated_at: string
  condominios?: { nombre: string }[]
}

export interface CrearClienteInput {
  nombre_empresa: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  nombre_condominio: string
  tipo_propiedad: 'edificio' | 'conjunto'
  num_pisos?: number
  dptos_por_piso?: number
  total_casas?: number
  cuota_mensual?: number
  direccion_condominio?: string
  valor_mensual_saas?: number
  dia_cobro?: number
}

export function useTenants() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*, condominios(nombre)').neq('estado', 'cancelado').order('created_at', { ascending: false })
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

  const crearCliente = useMutation({
    mutationFn: async (input: CrearClienteInput) => {
      const { data, error } = await supabase.functions.invoke('registrar-tenant', { body: input })
      if (error) {
        // Extract the real error from the response body if available
        const ctx = (error as any).context
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json()
            if (body?.error) throw new Error(body.error)
          } catch (e) {
            if (e instanceof Error && e.message !== 'Error creando cliente') throw e
          }
        }
        throw new Error(error.message || 'Error creando cliente')
      }
      if (data && !data.success) throw new Error(data.error || 'Error creando cliente')
      return data as { tenant_id: string; user_id: string; condominio_id: string | null; email_sent: boolean }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tenants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return { tenants: query.data || [], isLoading: query.isLoading, actualizar, crearCliente, eliminar }
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
