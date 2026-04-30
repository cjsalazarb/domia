import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { alertas, pendientes, emergenciasPendientes, marcarAtendida } = useAlertasAdmin()

  // Global KPIs across ALL condominios
  const { data: global } = useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: async () => {
      const [condosRes, residentesRes, recibosRes, pagosRes, mttoRes, guardiasRes, turnosRes, reservasRes] = await Promise.all([
        supabase.from('condominios').select('id, nombre, direccion, ciudad, estado').eq('estado', 'activo'),
        supabase.from('residentes').select('id, condominio_id, estado'),
        supabase.from('recibos').select('id, condominio_id, estado, monto_total'),
        supabase.from('pagos').select('id, condominio_id, monto').not('confirmado_por', 'is', null),
        supabase.from('mantenimientos').select('id, condominio_id, estado').in('estado', ['pendiente', 'asignado', 'en_proceso']),
        supabase.from('guardias').select('id, condominio_id').eq('activo', true),
        supabase.from('turnos').select('id, condominio_id').eq('estado', 'activo'),
        supabase.from('reservas').select('id, condominio_id').eq('estado', 'pendiente'),
      ])

      const condos = condosRes.data || []
      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const pagos = pagosRes.data || []
      const mtto = mttoRes.data || []
      const guardias = guardiasRes.data || []
      const turnos = turnosRes.data || []
      const reservas = reservasRes.data || []

      const totalRecaudado = pagos.reduce((s, p) => s + Number(p.monto), 0)
      const totalPendiente = recibos.filter(r => r.estado !== 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
      const morosos = residentes.filter(r => r.estado === 'moroso').length
      const recibosVencidos = recibos.filter(r => r.estado === 'vencido')

      // Per-condominio stats
      const condoStats = condos.map(c => {
        const cRecibos = recibos.filter(r => r.condominio_id === c.id)
        const cPagados = cRecibos.filter(r => r.estado === 'pagado').length
        const cTotal = cRecibos.length
        const cobranza = cTotal > 0 ? Math.round((cPagados / cTotal) * 100) : 0
        const cMorosos = residentes.filter(r => r.condominio_id === c.id && r.estado === 'moroso').length
        const cMtto = mtto.filter(m => m.condominio_id === c.id).length
        const cGuardias = turnos.filter(t => t.condominio_id === c.id).length
        const cResidentes = residentes.filter(r => r.condominio_id === c.id).length
        return { ...c, cobranza, morosos: cMorosos, ticketsPendientes: cMtto, guardiasEnTurno: cGuardias, residentes: cResidentes }
      })

      return {
        totalCondominios: condos.length,
        totalResidentes: residentes.length,
        totalRecaudado,
        totalPendiente,
        morosos,
        totalGuardias: guardias.length,
        guardiasEnTurno: turnos.length,
        ticketsPendientes: mtto.length,
        reservasPendientes: reservas.length,
        recibosVencidos: recibosVencidos.length,
        condoStats,
      }
    },
  })

  const kpi = (label: string, value: string | number, color: string, sub?: string) => (
    <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', marginTop: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  return (
    <AdminLayout title="Dashboard">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>Dashboard Global</h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>Vista consolidada de todos los condominios</p>
      </div>

      {/* Emergency banner */}
      {emergenciasPendientes.length > 0 && (
        <div style={{ backgroundColor: '#FEF2F2', border: '2px solid #DC2626', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{'\uD83D\uDEA8'}</span>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                EMERGENCIA — {emergenciasPendientes.length === 1
                  ? `Unidad ${(emergenciasPendientes[0].unidades as any)?.numero || '?'} en ${(emergenciasPendientes[0].condominios as any)?.nombre || '?'}`
                  : `${emergenciasPendientes.length} emergencias activas`
                }
              </div>
              <div style={{ fontSize: '12px', color: '#DC2626' }}>{tiempoRelativo(emergenciasPendientes[0].created_at)}</div>
            </div>
          </div>
          {emergenciasPendientes.length === 1 && (
            <button onClick={() => marcarAtendida.mutate(emergenciasPendientes[0].id)}
              disabled={marcarAtendida.isPending}
              style={{ padding: '8px 16px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              Marcar atendida
            </button>
          )}
        </div>
      )}

      {/* Global KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {kpi('Condominios', global?.totalCondominios || 0, '#1A7A4A', 'activos')}
        {kpi('Residentes', global?.totalResidentes || 0, '#0D4A8F', 'en el sistema')}
        {kpi('Recaudado', `Bs. ${(global?.totalRecaudado || 0).toFixed(0)}`, '#1A7A4A', 'este período')}
        {kpi('Pendiente', `Bs. ${(global?.totalPendiente || 0).toFixed(0)}`, '#B83232', `${global?.morosos || 0} moroso${(global?.morosos || 0) !== 1 ? 's' : ''}`)}
        {kpi('Guardias', global?.totalGuardias || 0, '#7B1AC8', `${global?.guardiasEnTurno || 0} en turno`)}
        {kpi('Tickets', global?.ticketsPendientes || 0, '#C07A2E', 'pendientes')}
      </div>

      {/* Alertas de residentes */}
      {pendientes > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
              Alertas de Residentes
            </h2>
            <span style={{ backgroundColor: '#DC2626', color: 'white', borderRadius: '12px', padding: '4px 12px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {pendientes}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alertas.filter(a => !a.atendida).map(a => {
              const t = TIPO_ALERTA[a.tipo] || { label: a.tipo, icon: '?', color: '#5E6B62', bg: '#F0F0F0' }
              const resName = `${(a.residentes as any)?.nombre || ''} ${(a.residentes as any)?.apellido || ''}`.trim()
              const unidad = (a.unidades as any)?.numero || '?'
              const condo = (a.condominios as any)?.nombre || '?'
              return (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
                  backgroundColor: t.bg, borderRadius: '12px', borderLeft: `4px solid ${t.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '20px' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: t.color }}>{t.label}</div>
                      <div style={{ fontSize: '12px', color: '#5E6B62' }}>{condo} · Unidad {unidad} · {resName} · {tiempoRelativo(a.created_at)}</div>
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

      {/* Condominios list */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Mis Condominios</h2>
          <button onClick={() => navigate('/admin/condominios')} style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            + Nuevo condominio
          </button>
        </div>

        {!global?.condoStats?.length ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏢</div>
            <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '16px' }}>No hay condominios registrados</p>
            <button onClick={() => navigate('/admin/condominios')} style={{ padding: '12px 24px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
              Crear primer condominio →
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {global!.condoStats.map(c => (
              <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
                {/* Name + badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '17px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>{c.ciudad} · {c.residentes} residentes</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 500, backgroundColor: '#E8F4F0', color: '#1A7A4A' }}>Activo</span>
                </div>

                {/* Cobranza bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5E6B62', marginBottom: '4px' }}>
                    <span>Cobranza del mes</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#E8F4F0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.cobranza}%`, backgroundColor: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232', borderRadius: '100px', transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {c.morosos > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>⚠ {c.morosos} moroso{c.morosos !== 1 ? 's' : ''}</span>}
                  {c.ticketsPendientes > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FEF9EC', color: '#C07A2E', padding: '3px 8px', borderRadius: '6px' }}>🔧 {c.ticketsPendientes} ticket{c.ticketsPendientes !== 1 ? 's' : ''}</span>}
                  {c.guardiasEnTurno > 0 && <span style={{ fontSize: '11px', backgroundColor: '#F5ECFF', color: '#7B1AC8', padding: '3px 8px', borderRadius: '6px' }}>🛡 {c.guardiasEnTurno} en turno</span>}
                  {c.morosos === 0 && c.ticketsPendientes === 0 && <span style={{ fontSize: '11px', backgroundColor: '#E8F4F0', color: '#1A7A4A', padding: '3px 8px', borderRadius: '6px' }}>✓ Todo al día</span>}
                </div>

                {/* Action */}
                <button onClick={() => navigate(`/admin/condominio/${c.id}/residentes`)} style={{
                  width: '100%', padding: '10px', backgroundColor: '#F4F7F5', color: '#1A7A4A', border: 'none',
                  borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }} onMouseEnter={e => (e.currentTarget).style.backgroundColor = '#E8F4F0'}
                   onMouseLeave={e => (e.currentTarget).style.backgroundColor = '#F4F7F5'}>
                  Administrar →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Alertas del Sistema</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(global?.recibosVencidos || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#FCEAEA', borderRadius: '10px', borderLeft: '3px solid #B83232' }}>
              <span style={{ fontSize: '16px' }}>💸</span>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#B83232' }}>{global!.recibosVencidos} recibo{global!.recibosVencidos !== 1 ? 's' : ''} vencido{global!.recibosVencidos !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>Recibos sin pago pasada la fecha de vencimiento</div>
              </div>
            </div>
          )}
          {(global?.reservasPendientes || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#FEF9EC', borderRadius: '10px', borderLeft: '3px solid #C07A2E' }}>
              <span style={{ fontSize: '16px' }}>📅</span>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#C07A2E' }}>{global!.reservasPendientes} reserva{global!.reservasPendientes !== 1 ? 's' : ''} pendiente{global!.reservasPendientes !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>Solicitudes de áreas comunes por aprobar</div>
              </div>
            </div>
          )}
          {(global?.ticketsPendientes || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#EBF4FF', borderRadius: '10px', borderLeft: '3px solid #0D4A8F' }}>
              <span style={{ fontSize: '16px' }}>🔧</span>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#0D4A8F' }}>{global!.ticketsPendientes} ticket{global!.ticketsPendientes !== 1 ? 's' : ''} de mantenimiento</div>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>Solicitudes pendientes o en proceso</div>
              </div>
            </div>
          )}
          {!global?.recibosVencidos && !global?.reservasPendientes && !global?.ticketsPendientes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#E8F4F0', borderRadius: '10px', borderLeft: '3px solid #1A7A4A' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', fontWeight: 600 }}>Sin alertas — todo en orden</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
