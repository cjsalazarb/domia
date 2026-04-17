import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/* ─── Tipos ─── */
export interface Cuenta {
  id: string
  condominio_id: string
  codigo: string
  nombre: string
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  grupo: string
  nivel: number
  activa: boolean
}

export interface Asiento {
  id: string
  condominio_id: string
  numero: number
  fecha: string
  descripcion: string
  referencia_tipo: 'recibo' | 'pago' | 'gasto' | 'arqueo' | 'manual'
  referencia_id: string | null
  creado_por: string | null
  created_at: string
  detalles?: AsientoDetalle[]
}

export interface AsientoDetalle {
  id: string
  asiento_id: string
  cuenta_id: string
  debe: number
  haber: number
  cuenta?: Cuenta
}

export interface Arqueo {
  id: string
  condominio_id: string
  fecha: string
  responsable: string
  saldo_libros: number
  total_contado: number
  cheques_cartera: number
  comprobantes_pendientes: number
  total_arqueo: number
  diferencia: number
  estado: 'conforme' | 'con_diferencia'
  notas: string | null
  creado_por: string | null
  created_at: string
  denominaciones?: ArqueoDenom[]
}

export interface ArqueoDenom {
  id: string
  arqueo_id: string
  denominacion: number
  cantidad: number
  subtotal: number
}

/* ─── Plan de cuentas ─── */
export function usePlanCuentas(condominioId: string) {
  const query = useQuery({
    queryKey: ['plan-cuentas', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('*')
        .eq('condominio_id', condominioId)
        .order('codigo')
      if (error) throw error
      return data as Cuenta[]
    },
    enabled: !!condominioId,
  })
  return { cuentas: query.data || [], isLoading: query.isLoading }
}

/* ─── Libro Diario (asientos con detalles) ─── */
export function useLibroDiario(condominioId: string, desde?: string, hasta?: string) {
  const query = useQuery({
    queryKey: ['libro-diario', condominioId, desde, hasta],
    queryFn: async () => {
      let q = supabase
        .from('asientos_contables')
        .select('*, detalles:asiento_detalles(*, cuenta:plan_cuentas(id, codigo, nombre))')
        .eq('condominio_id', condominioId)
        .order('numero', { ascending: false })

      if (desde) q = q.gte('fecha', desde)
      if (hasta) q = q.lte('fecha', hasta)

      const { data, error } = await q
      if (error) throw error
      return (data || []) as Asiento[]
    },
    enabled: !!condominioId,
  })
  return { asientos: query.data || [], isLoading: query.isLoading }
}

/* ─── Saldos por cuenta (para reportes) ─── */
export function useSaldosCuentas(condominioId: string, hasta?: string) {
  const query = useQuery({
    queryKey: ['saldos-cuentas', condominioId, hasta],
    queryFn: async () => {
      // Traer todas las cuentas
      const { data: cuentas, error: e1 } = await supabase
        .from('plan_cuentas')
        .select('*')
        .eq('condominio_id', condominioId)
        .order('codigo')
      if (e1) throw e1

      // Traer todos los detalles de asientos con fecha
      let q = supabase
        .from('asiento_detalles')
        .select('cuenta_id, debe, haber, asiento:asientos_contables!inner(fecha, condominio_id)')
        .eq('asiento.condominio_id', condominioId)

      if (hasta) q = q.lte('asiento.fecha', hasta)

      const { data: detalles, error: e2 } = await q
      if (e2) throw e2

      // Calcular saldos
      const saldos = new Map<string, { debe: number; haber: number }>()
      for (const d of (detalles || [])) {
        const prev = saldos.get(d.cuenta_id) || { debe: 0, haber: 0 }
        prev.debe += Number(d.debe)
        prev.haber += Number(d.haber)
        saldos.set(d.cuenta_id, prev)
      }

      return (cuentas || []).map(c => {
        const mov = saldos.get(c.id) || { debe: 0, haber: 0 }
        // Activo y Gasto: saldo deudor (debe - haber). Pasivo, Patrimonio, Ingreso: saldo acreedor (haber - debe)
        const saldo = ['activo', 'gasto'].includes(c.tipo)
          ? mov.debe - mov.haber
          : mov.haber - mov.debe
        return { ...c, debe: mov.debe, haber: mov.haber, saldo }
      })
    },
    enabled: !!condominioId,
  })
  return { saldos: query.data || [], isLoading: query.isLoading }
}

/* ─── Arqueos de caja ─── */
export function useArqueos(condominioId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['arqueos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqueos_caja')
        .select('*, denominaciones:arqueo_denominaciones(*)')
        .eq('condominio_id', condominioId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return (data || []) as Arqueo[]
    },
    enabled: !!condominioId,
  })

  const DENOMS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5]

  const crear = useMutation({
    mutationFn: async (input: {
      responsable: string
      saldo_libros: number
      total_contado: number
      cheques_cartera?: number
      comprobantes_pendientes?: number
      estado: 'conforme' | 'con_diferencia'
      notas?: string
      creado_por?: string
      denominaciones: { denominacion: number; cantidad: number }[]
    }) => {
      const { data: arqueo, error: e1 } = await supabase.from('arqueos_caja').insert({
        condominio_id: condominioId,
        responsable: input.responsable,
        saldo_libros: input.saldo_libros,
        total_contado: input.total_contado,
        cheques_cartera: input.cheques_cartera || 0,
        comprobantes_pendientes: input.comprobantes_pendientes || 0,
        estado: input.estado,
        notas: input.notas || null,
        creado_por: input.creado_por || null,
      }).select().single()
      if (e1) throw e1

      // Insertar denominaciones
      const denoms = input.denominaciones
        .filter(d => d.cantidad > 0)
        .map(d => ({
          arqueo_id: arqueo.id,
          denominacion: d.denominacion,
          cantidad: d.cantidad,
        }))
      if (denoms.length > 0) {
        const { error: e2 } = await supabase.from('arqueo_denominaciones').insert(denoms)
        if (e2) throw e2
      }

      return arqueo
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['arqueos', condominioId] })
    },
  })

  return { arqueos: query.data || [], isLoading: query.isLoading, crear, DENOMS }
}

/* ─── Asiento manual ─── */
export function useAsientoManual(condominioId: string) {
  const qc = useQueryClient()

  const crear = useMutation({
    mutationFn: async (input: {
      fecha: string
      descripcion: string
      lineas: { cuenta_id: string; debe: number; haber: number }[]
      creado_por?: string
    }) => {
      const { data: asiento, error: e1 } = await supabase.from('asientos_contables').insert({
        condominio_id: condominioId,
        numero: 0,
        fecha: input.fecha,
        descripcion: input.descripcion,
        referencia_tipo: 'manual',
        creado_por: input.creado_por || null,
      }).select().single()
      if (e1) throw e1

      const detalles = input.lineas.map(l => ({
        asiento_id: asiento.id,
        cuenta_id: l.cuenta_id,
        debe: l.debe,
        haber: l.haber,
      }))
      const { error: e2 } = await supabase.from('asiento_detalles').insert(detalles)
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['libro-diario', condominioId] })
      qc.invalidateQueries({ queryKey: ['saldos-cuentas', condominioId] })
    },
  })

  return { crear }
}
