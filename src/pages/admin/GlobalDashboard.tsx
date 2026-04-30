import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAlertasAdmin } from '@/hooks/useAlertasAdmin'

const TIPO_ALERTA: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  ayuda: { label: 'Necesito ayuda', icon: '\uD83C\uDD98', color: '#EA580C', bg: '#FFF7ED' },
  paquete: { label: 'Paquete', icon: '\uD83D\uDCE6', color: '#2563EB', bg: '#EFF6FF' },
  ruido: { label: 'Ruido', icon: '\uD83D\uDD0A', color: '#CA8A04', bg: '#FEFCE8' },
  emergencia: { label: 'EMERGENCIA', icon: '\uD83D\uDEA8', color: '#DC2626', bg: '#FEF2F2' },
}

function tiempoRelativo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`
  return `hace ${Math.floor(mins / 1440)}d`
}

export default function GlobalDashboard() {
  const { profile, signOut } = useAuthStore()
  const { alertas: alertasAdmin, pendientes: alertasPendientes, emergenciasPendientes, marcarAtendida } = useAlertasAdmin()

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
        actividad: actividad.slice(0, 10),
      }
    },
  })

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
              { label: 'Dashboard', path: '/dashboard', icon: '🏠', badge: alertasPendientes },
              { label: 'Condominios', path: '/admin', icon: '🏢' },
              { label: 'Clientes', path: '/admin/clientes', icon: '👥' },
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
                  {'badge' in item && (item as any).badge > 0 && (
                    <span style={{ backgroundColor: '#DC2626', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                      {(item as any).badge}
                    </span>
                  )}
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
            {/* ═══ EMERGENCIA BANNER ═══ */}
            {emergenciasPendientes.length > 0 && (
              <div style={{ backgroundColor: '#FEF2F2', border: '2px solid #DC2626', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
                {emergenciasPendientes.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: e === emergenciasPendientes[emergenciasPendientes.length - 1] ? 0 : '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{'\uD83D\uDEA8'}</span>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>
                          EMERGENCIA — Unidad {(e.unidades as any)?.numero || '?'} en {(e.condominios as any)?.nombre || '?'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#DC2626' }}>{(e.residentes as any)?.nombre} {(e.residentes as any)?.apellido} · {tiempoRelativo(e.created_at)}</div>
                      </div>
                    </div>
                    <button onClick={() => marcarAtendida.mutate(e.id)} disabled={marcarAtendida.isPending}
                      style={{ padding: '8px 16px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                      Marcar atendida
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ ALERTAS DE RESIDENTES ═══ */}
            {alertasPendientes > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Alertas de Residentes</h2>
                  <span style={{ backgroundColor: '#DC2626', color: 'white', borderRadius: '12px', padding: '4px 12px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{alertasPendientes}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {alertasAdmin.filter(a => !a.atendida).map(a => {
                    const t = TIPO_ALERTA[a.tipo] || { label: a.tipo, icon: '?', color: '#5E6B62', bg: '#F0F0F0' }
                    return (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: t.bg, borderRadius: '12px', borderLeft: `4px solid ${t.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <span style={{ fontSize: '20px' }}>{t.icon}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: t.color }}>{t.label}</div>
                            <div style={{ fontSize: '12px', color: '#5E6B62' }}>
                              {(a.condominios as any)?.nombre} · Unidad {(a.unidades as any)?.numero || '?'} · {(a.residentes as any)?.nombre} {(a.residentes as any)?.apellido} · {tiempoRelativo(a.created_at)}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => marcarAtendida.mutate(a.id)} disabled={marcarAtendida.isPending}
                          style={{ padding: '6px 14px', backgroundColor: 'white', color: t.color, border: `1px solid ${t.color}`, borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                          Atendido
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
