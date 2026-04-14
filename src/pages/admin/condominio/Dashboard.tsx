import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/layout/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function CondominioDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()

  const hoy = new Date()
  const fechaHoy = hoy.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const { data } = useQuery({
    queryKey: ['condominio-dashboard-v2', id],
    queryFn: async () => {
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`

      const [condoRes, residentesRes, recibosRes, pagosConfirmados, pagosSinConfirmar, mttoRes, turnosRes, reservasRes, gastosRes, notifRes] = await Promise.all([
        supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', id!).single(),
        supabase.from('residentes').select('id, estado, tipo').eq('condominio_id', id!).eq('estado', 'activo'),
        supabase.from('recibos').select('id, estado, monto_total, residente_id, periodo').eq('condominio_id', id!),
        supabase.from('pagos').select('id, monto, created_at, residente_id, recibo_id').eq('condominio_id', id!).not('confirmado_por', 'is', null),
        supabase.from('pagos').select('id').eq('condominio_id', id!).is('confirmado_por', null),
        supabase.from('mantenimientos').select('id, estado, prioridad, titulo, created_at').eq('condominio_id', id!),
        supabase.from('turnos').select('id, estado, tipo, hora_programada_inicio, guardias(nombre, apellido)').eq('condominio_id', id!).eq('fecha', hoy.toISOString().split('T')[0]),
        supabase.from('reservas').select('id, estado, fecha, areas_comunes(nombre), residentes(nombre, apellido)').eq('condominio_id', id!).eq('estado', 'pendiente'),
        supabase.from('gastos').select('id, monto, categoria, fecha').eq('condominio_id', id!),
        supabase.from('notificaciones').select('id, titulo, created_at').eq('condominio_id', id!).eq('tipo', 'aviso_general').order('created_at', { ascending: false }).limit(5),
      ])

      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const pagos = pagosConfirmados.data || []
      const sinConfirmar = pagosSinConfirmar.data || []
      const mtto = mttoRes.data || []
      const turnos = turnosRes.data || []
      const reservas = reservasRes.data || []
      const gastos = gastosRes.data || []
      const notifs = notifRes.data || []

      // KPIs del mes actual
      const recibosMes = recibos.filter(r => r.periodo?.startsWith(mesActual))
      const totalEmitido = recibosMes.reduce((s, r) => s + Number(r.monto_total), 0)

      // Ingresos reales = SUM de pagos confirmados del mes (no de recibos)
      const pagosMesActual = pagos.filter((p: any) => p.created_at?.startsWith(mesActual))
      const recaudadoMes = pagosMesActual.reduce((s: number, p: any) => s + Number(p.monto), 0)
      const pctCobranza = totalEmitido > 0 ? Math.round((recaudadoMes / totalEmitido) * 100) : 0

      // Residentes por estado de pago — categorías mutuamente excluyentes
      // Moroso = tiene >= 1 recibo vencido (misma fuente que la alerta)
      const residenteIdsMorosos = new Set(recibos.filter(r => r.estado === 'vencido').map(r => r.residente_id))
      // Con pago este mes (y no moroso) = al día
      const residenteIdsConPago = new Set(pagosMesActual.map((p: any) => p.residente_id))
      // Pendiente = recibo emitido este mes, no moroso, no pagó
      const residenteIdsPendientes = new Set(recibosMes.filter(r => r.estado === 'emitido').map(r => r.residente_id))

      const morosos = residentes.filter(r => residenteIdsMorosos.has(r.id)).length
      const alDia = residentes.filter(r => residenteIdsConPago.has(r.id) && !residenteIdsMorosos.has(r.id)).length
      const pendientes = residentes.filter(r => residenteIdsPendientes.has(r.id) && !residenteIdsMorosos.has(r.id) && !residenteIdsConPago.has(r.id)).length
      const sinRecibo = residentes.length - morosos - alDia - pendientes

      // Mantenimiento
      const ticketsAbiertos = mtto.filter(m => ['pendiente', 'asignado', 'en_proceso'].includes(m.estado)).length
      const ticketsUrgentes = mtto.filter(m => m.prioridad === 'urgente' && m.estado === 'pendiente').length
      const ticketsSinAsignar = mtto.filter(m => m.prioridad === 'urgente' && m.estado === 'pendiente').length

      // Guardias
      const enTurno = turnos.filter((t: any) => t.estado === 'activo')
      const proximoTurno = turnos.find((t: any) => t.estado === 'programado')

      // Recibos vencidos
      const recibosVencidos = recibos.filter(r => r.estado === 'vencido').length

      // Gastos del mes
      const gastosMes = gastos.filter(g => g.fecha?.startsWith(mesActual))
      const totalEgresos = gastosMes.reduce((s, g) => s + Number(g.monto), 0)
      const balance = recaudadoMes - totalEgresos
      const fondoReserva = Math.round(recaudadoMes * 0.1)

      // Gráfica últimos 6 meses
      const chartData: Array<{ mes: string; recaudado: number; pendiente: number }> = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const mesLabel = d.toLocaleDateString('es-BO', { month: 'short' })
        const recMes = recibos.filter(r => r.periodo?.startsWith(periodo))
        // Recaudado real = SUM de pagos confirmados del mes
        const pagosDelMes = pagos.filter((p: any) => p.created_at?.startsWith(periodo))
        const recaudadoMesChart = pagosDelMes.reduce((s: number, p: any) => s + Number(p.monto), 0)
        const pendientesMesChart = recMes.filter(r => r.estado !== 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
        chartData.push({ mes: mesLabel, recaudado: recaudadoMesChart, pendiente: pendientesMesChart })
      }

      // Actividad reciente (últimos 10 eventos)
      const actividad: Array<{ icon: string; desc: string; quien: string; tiempo: string; ts: number }> = []

      // Pagos confirmados recientes
      for (const p of (pagos as any[]).slice(0, 5)) {
        actividad.push({
          icon: '💰',
          desc: `Pago confirmado — Bs. ${Number(p.monto).toFixed(0)}`,
          quien: '',
          tiempo: timeAgo(new Date(p.created_at)),
          ts: new Date(p.created_at).getTime(),
        })
      }

      // Tickets recientes
      for (const m of (mtto as any[]).slice(0, 5)) {
        const estLabel = m.estado === 'resuelto' ? 'resuelto' : m.estado === 'pendiente' ? 'abierto' : m.estado
        actividad.push({
          icon: '🔧',
          desc: `Ticket ${estLabel}: ${m.titulo}`,
          quien: '',
          tiempo: timeAgo(new Date(m.created_at)),
          ts: new Date(m.created_at).getTime(),
        })
      }

      // Reservas pendientes
      for (const r of (reservas as any[]).slice(0, 3)) {
        actividad.push({
          icon: '📅',
          desc: `Reserva pendiente: ${r.areas_comunes?.nombre || '—'}`,
          quien: `${r.residentes?.nombre || ''} ${r.residentes?.apellido || ''}`.trim(),
          tiempo: timeAgo(new Date(r.fecha + 'T12:00')),
          ts: new Date(r.fecha + 'T12:00').getTime(),
        })
      }

      // Notificaciones enviadas
      for (const n of notifs) {
        actividad.push({
          icon: '📢',
          desc: `Aviso enviado: ${n.titulo}`,
          quien: '',
          tiempo: timeAgo(new Date(n.created_at)),
          ts: new Date(n.created_at).getTime(),
        })
      }

      actividad.sort((a, b) => b.ts - a.ts)

      return {
        condominio: condoRes.data,
        totalEmitido,
        recaudadoMes,
        pctCobranza,
        totalResidentes: residentes.length,
        alDia,
        morosos,
        pendientes,
        sinRecibo,
        ticketsAbiertos,
        ticketsUrgentes,
        ticketsSinAsignar,
        reservasPendientes: reservas.length,
        enTurno: enTurno as any[],
        proximoTurno: proximoTurno as any,
        sinConfirmar: sinConfirmar.length,
        recibosVencidos,
        totalEgresos,
        balance,
        fondoReserva,
        chartData,
        actividad: actividad.slice(0, 10),
      }
    },
    enabled: !!id,
  })

  if (!id) return null

  const alertas: Array<{ color: string; bg: string; border: string; icon: string; text: string; path: string; btn: string }> = []

  if ((data?.sinConfirmar || 0) > 0) {
    alertas.push({ color: '#B83232', bg: '#FCEAEA', border: '#B83232', icon: '🔴', text: `${data!.sinConfirmar} comprobante${data!.sinConfirmar !== 1 ? 's' : ''} de pago sin confirmar`, path: `/admin/condominio/${id}/financiero`, btn: 'Revisar →' })
  }
  if ((data?.ticketsUrgentes || 0) > 0) {
    alertas.push({ color: '#C07A2E', bg: '#FEF9EC', border: '#C07A2E', icon: '🟡', text: `${data!.ticketsUrgentes} ticket${data!.ticketsUrgentes !== 1 ? 's' : ''} urgente${data!.ticketsUrgentes !== 1 ? 's' : ''} sin asignar`, path: `/admin/condominio/${id}/mantenimiento`, btn: 'Asignar →' })
  }
  if ((data?.reservasPendientes || 0) > 0) {
    alertas.push({ color: '#C07A2E', bg: '#FEF9EC', border: '#C07A2E', icon: '🟡', text: `${data!.reservasPendientes} reserva${data!.reservasPendientes !== 1 ? 's' : ''} pendiente${data!.reservasPendientes !== 1 ? 's' : ''} de aprobación`, path: `/admin/condominio/${id}/reservas`, btn: 'Aprobar →' })
  }
  if ((data?.recibosVencidos || 0) > 0) {
    alertas.push({ color: '#B83232', bg: '#FCEAEA', border: '#B83232', icon: '🔴', text: `${data!.recibosVencidos} recibo${data!.recibosVencidos !== 1 ? 's' : ''} vencido${data!.recibosVencidos !== 1 ? 's' : ''} sin pago`, path: `/admin/condominio/${id}/financiero`, btn: 'Ver morosos →' })
  }

  return (
    <AdminLayout title="Dashboard" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              {data?.condominio?.nombre || 'Dashboard'}
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
              {data?.condominio?.ciudad}{data?.condominio?.direccion ? ` · ${data.condominio.direccion}` : ''}
              {' · '}{fechaHoy}
            </p>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px',
            backgroundColor: '#E8F4F0', color: '#1A7A4A',
            fontSize: '12px', fontWeight: 700, fontFamily: "'Inter', sans-serif",
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1A7A4A', display: 'inline-block' }} />
            En operación
          </span>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {/* Cobranza */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>Cobranza del mes</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#1A7A4A', marginTop: '4px' }}>
              {data?.pctCobranza || 0}%
            </div>
            <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
              Bs. {(data?.recaudadoMes || 0).toFixed(0)} de Bs. {(data?.totalEmitido || 0).toFixed(0)}
            </div>
            <div style={{ marginTop: '8px', backgroundColor: '#F0F0F0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${data?.pctCobranza || 0}%`, height: '100%', backgroundColor: '#1A7A4A', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Residentes */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>Residentes</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D1117', marginTop: '4px' }}>
              {data?.totalResidentes || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
              {data?.alDia || 0} al día · {data?.morosos || 0} moroso{(data?.morosos || 0) !== 1 ? 's' : ''} · {data?.pendientes || 0} pend.{(data?.sinRecibo || 0) > 0 ? ` · ${data!.sinRecibo} s/recibo` : ''}
            </div>
          </div>

          {/* Mantenimiento */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>Mantenimiento</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: data?.ticketsUrgentes ? '#B83232' : '#C07A2E', marginTop: '4px' }}>
              {data?.ticketsAbiertos || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
              ticket{(data?.ticketsAbiertos || 0) !== 1 ? 's' : ''} abierto{(data?.ticketsAbiertos || 0) !== 1 ? 's' : ''} · {data?.ticketsUrgentes || 0} urgente{(data?.ticketsUrgentes || 0) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Reservas */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>Reservas</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#7B1AC8', marginTop: '4px' }}>
              {data?.reservasPendientes || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
              pendiente{(data?.reservasPendientes || 0) !== 1 ? 's' : ''} de aprobación
            </div>
          </div>

          {/* Guardias */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>Guardias</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D4A8F', marginTop: '4px' }}>
              {data?.enTurno?.length || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
              en turno ahora
              {data?.proximoTurno && ` · próximo: ${data.proximoTurno.hora_programada_inicio?.slice(0, 5)}`}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div style={{ marginBottom: '24px' }}>
          {alertas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alertas.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', backgroundColor: a.bg, borderRadius: '12px',
                  borderLeft: `3px solid ${a.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px' }}>{a.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: a.color, fontFamily: "'Inter', sans-serif" }}>{a.text}</span>
                  </div>
                  <button onClick={() => navigate(a.path)} style={{
                    padding: '6px 14px', backgroundColor: 'white', color: a.color, border: `1px solid ${a.border}`,
                    borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                  }}>{a.btn}</button>
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

        {/* Layout 2 columnas: gráfica + resumen financiero */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Gráfica */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
              Cobranza — Últimos 6 meses
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.chartData || []} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#5E6B62', fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5E6B62', fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `Bs.${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
                  formatter={(value: any, name: any) => [`Bs. ${Number(value).toFixed(0)}`, name === 'recaudado' ? 'Recaudado' : 'Pendiente']}
                />
                <Bar dataKey="recaudado" fill="#1A7A4A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendiente" fill="#FCEAEA" stroke="#B83232" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resumen financiero */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
              Resumen del Mes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Ingresos</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#1A7A4A', fontSize: '15px' }}>Bs. {(data?.recaudadoMes || 0).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Egresos</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#B83232', fontSize: '15px' }}>Bs. {(data?.totalEgresos || 0).toFixed(0)}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#0D1117', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Balance</span>
                <span style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '17px',
                  color: (data?.balance || 0) >= 0 ? '#1A7A4A' : '#B83232',
                  backgroundColor: (data?.balance || 0) >= 0 ? '#E8F4F0' : '#FCEAEA',
                  padding: '4px 12px', borderRadius: '8px',
                }}>
                  Bs. {(data?.balance || 0).toFixed(0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Fondo reserva (10%)</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D4A8F', fontSize: '13px' }}>Bs. {(data?.fondoReserva || 0).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
            Actividad Reciente
          </h2>
          {!data?.actividad || data.actividad.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#5E6B62', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
              Sin actividad reciente
            </div>
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
                    {a.quien && <span style={{ color: '#5E6B62', marginLeft: '6px' }}>· {a.quien}</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: '#5E6B62', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.tiempo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
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
