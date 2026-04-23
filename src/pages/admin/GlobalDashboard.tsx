import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useCondominios } from '@/hooks/useCondominios'

type Tab = 'activos' | 'archivados'

export default function GlobalDashboard() {
  const { profile, signOut } = useAuthStore()
  const { archivar, restaurar, eliminarPermanentemente } = useCondominios()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('activos')

  // Modal state
  const [modalArchivar, setModalArchivar] = useState<{ id: string; nombre: string } | null>(null)
  const [modalEliminar, setModalEliminar] = useState<{ id: string; nombre: string; paso: 1 | 2 } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

  const { data, isLoading } = useQuery({
    queryKey: ['global-dashboard-v1'],
    queryFn: async () => {
      const [condosRes, residentesRes, recibosRes, pagosRes, gastosRes, mttoRes, unidadesRes, guardiasRes, turnosRes, actividadRes] = await Promise.all([
        supabase.from('condominios').select('*').in('estado', ['activo', 'archivado', 'en_configuracion']).order('nombre'),
        supabase.from('residentes').select('id, condominio_id, estado'),
        supabase.from('recibos').select('id, condominio_id, estado, monto_total, periodo, residente_id'),
        supabase.from('pagos').select('id, condominio_id, monto, fecha_pago, residente_id, recibo_id').not('confirmado_por', 'is', null),
        supabase.from('gastos').select('id, condominio_id, monto, fecha, categoria, descripcion'),
        supabase.from('mantenimientos').select('id, condominio_id, estado, prioridad, titulo, created_at'),
        supabase.from('unidades').select('id, condominio_id').eq('activa', true),
        supabase.from('guardias').select('id, condominio_id, nombre, apellido, activo').eq('activo', true),
        supabase.from('turnos').select('id, condominio_id, guardia_id, fecha, tipo').gte('fecha', hoy.toISOString().split('T')[0]).lte('fecha', new Date(hoy.getTime() + 7 * 86400000).toISOString().split('T')[0]),
        // Recent activity: last payments, incidents, new residents
        Promise.all([
          supabase.from('pagos').select('id, monto, fecha_pago, condominio_id, condominios(nombre)').not('confirmado_por', 'is', null).order('fecha_pago', { ascending: false }).limit(10),
          supabase.from('mantenimientos').select('id, titulo, estado, created_at, condominio_id, condominios(nombre)').order('created_at', { ascending: false }).limit(10),
          supabase.from('residentes').select('id, nombre, apellido, created_at, condominio_id, condominios(nombre)').order('created_at', { ascending: false }).limit(5),
          supabase.from('arqueos').select('id, fecha, created_at, condominio_id, condominios(nombre)').order('created_at', { ascending: false }).limit(5),
        ]),
      ])

      const condos = condosRes.data || []
      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const pagos = pagosRes.data || []
      const gastos = gastosRes.data || []
      const mtto = mttoRes.data || []
      const unidades = unidadesRes.data || []
      const guardias = guardiasRes.data || []
      const turnos = turnosRes.data || []
      const [pagosRecientes, mttoRecientes, residentesRecientes, arqueosRecientes] = actividadRes

      // ─── SECTION 1: Business summary cards ───
      const condosActivos = condos.filter(c => c.estado === 'activo')
      const totalCondominios = condosActivos.length
      const totalUnidades = unidades.length
      const totalResidentes = residentes.filter(r => r.estado === 'activo' || r.estado === 'moroso').length
      const totalGuardias = guardias.length

      // Global collection rate (weighted average)
      const recibosMes = recibos.filter(r => r.periodo?.startsWith(mesActual))
      const totalEmitidoMes = recibosMes.reduce((s, r) => s + Number(r.monto_total), 0)
      const totalPagadoMes = recibosMes.filter(r => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
      const cobranzaGlobal = totalEmitidoMes > 0 ? Math.min(100, Math.round((totalPagadoMes / totalEmitidoMes) * 100)) : 0

      // Delinquent units
      const unidadesMorosas = new Set(recibos.filter(r => r.estado === 'vencido' || r.estado === 'emitido').map(r => r.residente_id)).size

      // ─── SECTION 2: Financial summary ───
      const pagosMes = pagos.filter((p: any) => p.fecha_pago?.startsWith(mesActual))
      const ingresosRecaudadosMes = pagosMes.reduce((s: number, p: any) => s + Number(p.monto), 0)
      const gastosMes = gastos.filter(g => g.fecha?.startsWith(mesActual))
      const totalGastosMes = gastosMes.reduce((s, g) => s + Number(g.monto), 0)
      const superavitMes = ingresosRecaudadosMes - totalGastosMes
      const pendienteCobroMes = totalEmitidoMes - totalPagadoMes

      // ─── SECTION 3: Active alerts ───
      const incidentesSinResolver = mtto.filter(m => ['pendiente', 'asignado', 'en_proceso'].includes(m.estado)).length
      const recibosVencidos30 = recibos.filter(r => {
        if (r.estado !== 'vencido') return false
        return true // All vencidos count
      }).length
      const condosBajaCobranza = condosActivos.filter(c => {
        const cRecibos = recibosMes.filter(r => r.condominio_id === c.id)
        const cTotal = cRecibos.reduce((s, r) => s + Number(r.monto_total), 0)
        const cPagado = cRecibos.filter(r => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
        const pct = cTotal > 0 ? Math.round((cPagado / cTotal) * 100) : 100
        return pct < 50
      })
      // Guards without shift this week
      const guardiaIdsConTurno = new Set(turnos.map(t => t.guardia_id))
      const guardiasSinTurno = guardias.filter(g => !guardiaIdsConTurno.has(g.id))

      // ─── SECTION 4: Per-condominium stats ───
      const condoStats = condos.map(c => {
        const cRecibos = recibos.filter(r => r.condominio_id === c.id)
        const cRecibosMes = cRecibos.filter(r => r.periodo?.startsWith(mesActual))
        const cEmitido = cRecibosMes.reduce((s, r) => s + Number(r.monto_total), 0)
        const cPagado = cRecibosMes.filter(r => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
        const cobranza = cEmitido > 0 ? Math.min(100, Math.round((cPagado / cEmitido) * 100)) : 0
        const morosos = cRecibos.filter(r => r.estado === 'emitido' || r.estado === 'vencido').length
        const cMtto = mtto.filter(m => m.condominio_id === c.id && ['pendiente', 'asignado', 'en_proceso'].includes(m.estado)).length
        const cUnidades = unidades.filter(u => u.condominio_id === c.id).length
        const cResidentes = residentes.filter(r => r.condominio_id === c.id).length
        return { ...c, cobranza, morosos, ticketsPendientes: cMtto, totalUnidades: cUnidades, residentes: cResidentes }
      })

      // ─── SECTION 5: Recent activity ───
      const actividad: Array<{ icon: string; desc: string; condominio: string; tiempo: string; ts: number }> = []

      for (const p of (pagosRecientes.data || []) as any[]) {
        actividad.push({
          icon: '💰', desc: `Pago recibido — Bs. ${Number(p.monto).toFixed(0)}`,
          condominio: p.condominios?.nombre || '', tiempo: timeAgo(new Date(p.fecha_pago)),
          ts: new Date(p.fecha_pago).getTime(),
        })
      }
      for (const m of (mttoRecientes.data || []) as any[]) {
        const est = m.estado === 'resuelto' ? 'resuelto' : m.estado === 'pendiente' ? 'reportado' : m.estado
        actividad.push({
          icon: '🔧', desc: `Incidente ${est}: ${m.titulo}`,
          condominio: m.condominios?.nombre || '', tiempo: timeAgo(new Date(m.created_at)),
          ts: new Date(m.created_at).getTime(),
        })
      }
      for (const r of (residentesRecientes.data || []) as any[]) {
        actividad.push({
          icon: '👤', desc: `Nuevo residente: ${r.nombre} ${r.apellido}`,
          condominio: r.condominios?.nombre || '', tiempo: timeAgo(new Date(r.created_at)),
          ts: new Date(r.created_at).getTime(),
        })
      }
      for (const a of (arqueosRecientes.data || []) as any[]) {
        actividad.push({
          icon: '📒', desc: `Arqueo de caja realizado`,
          condominio: a.condominios?.nombre || '', tiempo: timeAgo(new Date(a.created_at)),
          ts: new Date(a.created_at).getTime(),
        })
      }
      actividad.sort((a, b) => b.ts - a.ts)

      return {
        totalCondominios, totalUnidades, totalResidentes, totalGuardias,
        cobranzaGlobal, unidadesMorosas,
        ingresosRecaudadosMes, totalGastosMes, superavitMes, pendienteCobroMes,
        incidentesSinResolver, recibosVencidos30,
        condosBajaCobranza, guardiasSinTurno,
        condoStats,
        actividad: actividad.slice(0, 10),
      }
    },
  })

  const activos = (data?.condoStats || []).filter(c => c.estado === 'activo' || c.estado === 'en_configuracion')
  const archivados = (data?.condoStats || []).filter(c => c.estado === 'archivado')

  function diasRestantes(archivadoEn: string | null): number {
    if (!archivadoEn) return 30
    const diff = 30 - Math.floor((Date.now() - new Date(archivadoEn).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  async function handleArchivar() {
    if (!modalArchivar) return
    setActionLoading(true)
    await archivar.mutateAsync(modalArchivar.id)
    setActionLoading(false)
    setModalArchivar(null)
  }

  async function handleRestaurar(id: string) {
    setActionLoading(true)
    await restaurar.mutateAsync(id)
    setActionLoading(false)
  }

  async function handleEliminar() {
    if (!modalEliminar) return
    setActionLoading(true)
    await eliminarPermanentemente.mutateAsync(modalEliminar.id)
    setActionLoading(false)
    setModalEliminar(null)
    setConfirmText('')
  }

  const alertas: Array<{ color: string; bg: string; icon: string; text: string }> = []
  if ((data?.incidentesSinResolver || 0) > 0)
    alertas.push({ color: '#C07A2E', bg: '#FEF9EC', icon: '🔧', text: `${data!.incidentesSinResolver} incidentes sin resolver` })
  if ((data?.recibosVencidos30 || 0) > 0)
    alertas.push({ color: '#B83232', bg: '#FCEAEA', icon: '🔴', text: `${data!.recibosVencidos30} pagos vencidos` })
  if ((data?.condosBajaCobranza || []).length > 0)
    alertas.push({ color: '#B83232', bg: '#FCEAEA', icon: '📉', text: `${data!.condosBajaCobranza.length} condominio${data!.condosBajaCobranza.length !== 1 ? 's' : ''} con cobranza < 50%: ${data!.condosBajaCobranza.map(c => c.nombre).join(', ')}` })
  if ((data?.guardiasSinTurno || []).length > 0)
    alertas.push({ color: '#C07A2E', bg: '#FEF9EC', icon: '🛡️', text: `${data!.guardiasSinTurno.length} guardia${data!.guardiasSinTurno.length !== 1 ? 's' : ''} sin turno esta semana` })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
            DOM<span style={{ color: '#0D9E6E' }}>IA</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
              { label: 'Condominios', path: '/admin', icon: '🏢' },
              { label: 'Finanzas Global', path: '/finanzas-global', icon: '💰' },
            ].map(item => {
              const active = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400,
                    backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent',
                    color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
            Dashboard Global
          </h1>
          <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
            Vista general de todos tus condominios · {hoy.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62', fontSize: '14px' }}>Cargando dashboard...</div>
        )}

        {!isLoading && data && (
          <>
            {/* ═══ SECTION 1: Business Summary Cards ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Condominios activos', value: data.totalCondominios, color: '#0D1117' },
                { label: 'Unidades gestionadas', value: data.totalUnidades, color: '#0D1117' },
                { label: 'Residentes registrados', value: data.totalResidentes, color: '#0D1117' },
                { label: 'Guardias activos', value: data.totalGuardias, color: '#0D4A8F' },
                { label: 'Cobranza global', value: `${data.cobranzaGlobal}%`, color: data.cobranzaGlobal >= 80 ? '#1A7A4A' : data.cobranzaGlobal >= 50 ? '#C07A2E' : '#B83232' },
                { label: 'Unidades morosas', value: data.unidadesMorosas, color: data.unidadesMorosas > 0 ? '#B83232' : '#1A7A4A' },
              ].map((kpi, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif", marginBottom: '6px' }}>{kpi.label}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '26px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* ═══ SECTION 2: Financial Summary ═══ */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Resumen Financiero — {hoy.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#E8F4F0', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ingresos cobrados</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#1A7A4A' }}>Bs. {data.ingresosRecaudadosMes.toFixed(0)}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#FCEAEA', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Gastos registrados</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#B83232' }}>Bs. {data.totalGastosMes.toFixed(0)}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: data.superavitMes >= 0 ? '#E8F4F0' : '#FCEAEA', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{data.superavitMes >= 0 ? 'Superávit' : 'Déficit'} del mes</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: data.superavitMes >= 0 ? '#1A7A4A' : '#B83232' }}>Bs. {data.superavitMes.toFixed(0)}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#FEF9EC', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pendiente de cobro</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#C07A2E' }}>Bs. {data.pendienteCobroMes.toFixed(0)}</div>
                </div>
              </div>
            </div>

            {/* ═══ SECTION 3: Active Alerts ═══ */}
            <div style={{ marginBottom: '20px' }}>
              {alertas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {alertas.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', backgroundColor: a.bg, borderRadius: '12px',
                      borderLeft: `3px solid ${a.color}`,
                    }}>
                      <span style={{ fontSize: '14px' }}>{a.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: a.color, fontFamily: "'Inter', sans-serif" }}>{a.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '14px 16px', backgroundColor: '#E8F4F0', borderRadius: '12px', borderLeft: '3px solid #1A7A4A',
                }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <span style={{ fontSize: '13px', color: '#1A7A4A', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Todo al día — sin alertas pendientes</span>
                </div>
              )}
            </div>

            {/* ═══ SECTION 4: Condominiums List ═══ */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
                  Mis Condominios
                </h2>
                <a href="/admin/condominios"
                  style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', textDecoration: 'none' }}>
                  + Nuevo
                </a>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#E8F4F0', borderRadius: '12px', padding: '4px', maxWidth: '320px' }}>
                {([
                  { key: 'activos' as Tab, label: 'Activos', count: activos.length },
                  { key: 'archivados' as Tab, label: 'Archivados', count: archivados.length },
                ]).map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: '8px 14px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: tab === t.key ? 'white' : 'transparent',
                      boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600,
                      color: tab === t.key ? '#0D1117' : '#5E6B62', transition: 'all 0.2s',
                    }}>
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>

              {tab === 'activos' && activos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {activos.map(c => (
                    <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '3px' }}>{c.ciudad} {c.direccion ? `· ${c.direccion}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.totalUnidades}</div>
                          <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unidades</div>
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#E8F4F0' }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.residentes}</div>
                          <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Residentes</div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5E6B62', marginBottom: '4px' }}>
                          <span>Cobranza del mes</span>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#E8F4F0', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${c.cobranza}%`, backgroundColor: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232', borderRadius: '100px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {c.morosos > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{c.morosos} pendiente{c.morosos !== 1 ? 's' : ''}</span>}
                        {c.ticketsPendientes > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FEF9EC', color: '#C07A2E', padding: '3px 8px', borderRadius: '6px' }}>{c.ticketsPendientes} ticket{c.ticketsPendientes !== 1 ? 's' : ''}</span>}
                        {c.morosos === 0 && c.ticketsPendientes === 0 && <span style={{ fontSize: '11px', backgroundColor: '#E8F4F0', color: '#1A7A4A', padding: '3px 8px', borderRadius: '6px' }}>Todo al dia</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/admin/condominio/${c.id}/dashboard`}
                          style={{
                            flex: 1, display: 'block', padding: '12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none',
                            borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                            textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                          }}>
                          Entrar
                        </a>
                        <button onClick={() => setModalArchivar({ id: c.id, nombre: c.nombre })}
                          style={{
                            padding: '12px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none',
                            borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          }}
                          title="Archivar condominio">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/>
                            <rect x="1" y="3" width="22" height="5"/>
                            <line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'activos' && activos.length === 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                  <p style={{ color: '#5E6B62', fontSize: '15px', marginBottom: '20px' }}>No hay condominios activos</p>
                  <a href="/admin/condominios"
                    style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: '#1A7A4A', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none' }}>
                    Crear primer condominio
                  </a>
                </div>
              )}

              {tab === 'archivados' && archivados.length === 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center' }}>
                  <p style={{ color: '#5E6B62', fontSize: '15px' }}>No hay condominios archivados</p>
                </div>
              )}

              {tab === 'archivados' && archivados.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {archivados.map(c => {
                    const dias = diasRestantes(c.archivado_en)
                    const fechaArchivado = c.archivado_en ? new Date(c.archivado_en).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                    return (
                      <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', borderLeft: '4px solid #C07A2E' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</span>
                              <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: '#FEF3E0', color: '#C07A2E' }}>ARCHIVADO</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#5E6B62' }}>{c.ciudad} · {c.direccion}</div>
                            <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '4px' }}>Archivado el {fechaArchivado}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: dias <= 7 ? '#B83232' : '#C07A2E' }}>{dias}</div>
                            <div style={{ fontSize: '11px', color: dias <= 7 ? '#B83232' : '#C07A2E', fontWeight: 500 }}>{dias === 1 ? 'dia restante' : 'dias restantes'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleRestaurar(c.id)} disabled={actionLoading}
                            style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                            Restaurar
                          </button>
                          <button onClick={() => setModalEliminar({ id: c.id, nombre: c.nombre, paso: 1 })}
                            style={{ padding: '10px 20px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>
                            Eliminar permanentemente
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ═══ SECTION 5: Recent Activity ═══ */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Actividad Reciente
              </h2>
              {!data?.actividad || data.actividad.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#5E6B62', fontSize: '14px' }}>Sin actividad reciente</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.actividad.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                      backgroundColor: i % 2 === 0 ? '#FAFBFA' : 'white', borderRadius: '8px',
                      fontFamily: "'Inter', sans-serif", fontSize: '13px',
                    }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#0D1117' }}>{a.desc}</span>
                        {a.condominio && <span style={{ color: '#5E6B62', marginLeft: '6px' }}>· {a.condominio}</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: '#5E6B62', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.tiempo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ MODAL ARCHIVAR ═══ */}
      {modalArchivar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Archivar condominio</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', lineHeight: '1.6', margin: '0 0 8px' }}>
              ¿Estás segura de archivar <strong style={{ color: '#0D1117' }}>{modalArchivar.nombre}</strong>?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', lineHeight: '1.5', margin: '0 0 24px' }}>
              Todos los datos se conservan. Tienes 30 dias para restaurarlo si fue un error.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalArchivar(null)}
                style={{ padding: '12px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleArchivar} disabled={actionLoading}
                style={{ padding: '12px 20px', backgroundColor: '#C07A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                {actionLoading ? 'Archivando...' : 'Si, archivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ELIMINAR — PASO 1 ═══ */}
      {modalEliminar?.paso === 1 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#FFF5F5', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>ATENCION: Accion IRREVERSIBLE</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 8px' }}>
              Se eliminaran todos los accesos a <strong style={{ color: '#0D1117' }}>{modalEliminar.nombre}</strong>.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '0 0 24px' }}>
              Propietarios, pagos, historial contable y documentos quedaran permanentemente inaccesibles.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalEliminar(null); setConfirmText('') }}
                style={{ padding: '12px 20px', backgroundColor: 'white', color: '#5E6B62', border: '1px solid #E0E0E0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={() => setModalEliminar({ ...modalEliminar, paso: 2 })}
                style={{ padding: '12px 20px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ELIMINAR — PASO 2 ═══ */}
      {modalEliminar?.paso === 2 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>Confirmar eliminacion</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', lineHeight: '1.6', margin: '0 0 16px' }}>
              Para confirmar, escribe el nombre exacto del condominio:
            </p>
            <div style={{ backgroundColor: '#F4F7F5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>
              {modalEliminar.nombre}
            </div>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Escribe el nombre aqui..."
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", marginBottom: '20px' }}
              onFocus={e => e.target.style.borderColor = '#B83232'} onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalEliminar(null); setConfirmText('') }}
                style={{ padding: '12px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={confirmText !== modalEliminar.nombre || actionLoading}
                style={{
                  padding: '12px 20px', backgroundColor: confirmText === modalEliminar.nombre ? '#B83232' : '#C8D4CB',
                  color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                  cursor: confirmText === modalEliminar.nombre && !actionLoading ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s',
                }}>
                {actionLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`
  return date.toLocaleDateString('es-BO')
}
