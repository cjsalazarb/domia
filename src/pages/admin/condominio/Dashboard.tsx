import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/layout/AdminLayout'

export default function CondominioDashboard() {
  const { id } = useParams()

  const { data } = useQuery({
    queryKey: ['condominio-dashboard', id],
    queryFn: async () => {
      const [condoRes, unidadesRes, residentesRes, recibosRes, pagosRes, mttoRes, guardiasRes, reservasRes] = await Promise.all([
        supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', id!).single(),
        supabase.from('unidades').select('id').eq('condominio_id', id!).eq('activa', true),
        supabase.from('residentes').select('id, estado').eq('condominio_id', id!),
        supabase.from('recibos').select('id, estado, monto_total').eq('condominio_id', id!),
        supabase.from('pagos').select('id, monto').eq('condominio_id', id!).not('confirmado_por', 'is', null),
        supabase.from('mantenimientos').select('id, estado').eq('condominio_id', id!),
        supabase.from('turnos').select('id').eq('condominio_id', id!).eq('estado', 'activo'),
        supabase.from('reservas').select('id').eq('condominio_id', id!).eq('estado', 'pendiente'),
      ])

      const recibos = recibosRes.data || []
      const pagos = pagosRes.data || []
      const mtto = mttoRes.data || []
      const totalRecaudado = pagos.reduce((s, p) => s + Number(p.monto), 0)
      const totalPendiente = recibos.filter(r => r.estado !== 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
      const recibosVencidos = recibos.filter(r => r.estado === 'vencido').length
      const ticketsPendientes = mtto.filter(m => ['pendiente', 'asignado', 'en_proceso'].includes(m.estado)).length
      const ticketsResueltos = mtto.filter(m => m.estado === 'resuelto').length

      return {
        condominio: condoRes.data,
        totalUnidades: (unidadesRes.data || []).length,
        totalResidentes: (residentesRes.data || []).length,
        totalRecaudado,
        totalPendiente,
        recibosVencidos,
        ticketsPendientes,
        ticketsResueltos,
        guardiasEnTurno: (guardiasRes.data || []).length,
        reservasPendientes: (reservasRes.data || []).length,
      }
    },
    enabled: !!id,
  })

  if (!id) return null

  const kpi = (label: string, value: string | number, color: string, sub?: string) => (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', marginTop: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  return (
    <AdminLayout title="Dashboard" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          {data?.condominio?.nombre || 'Dashboard'}
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          {data?.condominio?.ciudad}{data?.condominio?.direccion ? ` · ${data.condominio.direccion}` : ''}
        </p>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {kpi('Unidades', data?.totalUnidades || 0, '#0D4A8F', 'activas')}
          {kpi('Residentes', data?.totalResidentes || 0, '#1A7A4A', 'registrados')}
          {kpi('Recaudado', `Bs. ${(data?.totalRecaudado || 0).toFixed(0)}`, '#1A7A4A', 'confirmado')}
          {kpi('Pendiente', `Bs. ${(data?.totalPendiente || 0).toFixed(0)}`, '#B83232', `${data?.recibosVencidos || 0} vencido${(data?.recibosVencidos || 0) !== 1 ? 's' : ''}`)}
          {kpi('Mantenimiento', data?.ticketsPendientes || 0, '#C07A2E', `${data?.ticketsResueltos || 0} resuelto${(data?.ticketsResueltos || 0) !== 1 ? 's' : ''}`)}
          {kpi('Guardias', data?.guardiasEnTurno || 0, '#7B1AC8', 'en turno')}
        </div>

        {/* Quick actions */}
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Accesos rapidos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Residentes', icon: '👥', path: `/admin/condominio/${id}/residentes`, color: '#0D4A8F' },
            { label: 'Financiero', icon: '💰', path: `/admin/condominio/${id}/financiero`, color: '#1A7A4A' },
            { label: 'Mantenimiento', icon: '🔧', path: `/admin/condominio/${id}/mantenimiento`, color: '#C07A2E' },
            { label: 'Reservas', icon: '📅', path: `/admin/condominio/${id}/reservas`, color: '#7B1AC8' },
            { label: 'Comunicaciones', icon: '📢', path: `/admin/condominio/${id}/comunicaciones`, color: '#0D4A8F' },
            { label: 'Guardias', icon: '🛡️', path: `/admin/condominio/${id}/guardias`, color: '#5E6B62' },
            { label: 'Configurar', icon: '⚙️', path: `/admin/condominio/${id}/configurar`, color: '#0D1117' },
          ].map(item => (
            <a key={item.path} href={item.path}
              style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'box-shadow 0.2s', borderLeft: `4px solid ${item.color}` }}>
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>{item.label}</span>
            </a>
          ))}
        </div>

        {/* Alerts */}
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Alertas</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(data?.recibosVencidos || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#FCEAEA', borderRadius: '10px', borderLeft: '3px solid #B83232' }}>
              <span style={{ fontSize: '16px' }}>💸</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#B83232' }}>{data!.recibosVencidos} recibo{data!.recibosVencidos !== 1 ? 's' : ''} vencido{data!.recibosVencidos !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>Pendientes de cobro</div>
              </div>
            </div>
          )}
          {(data?.reservasPendientes || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#FEF9EC', borderRadius: '10px', borderLeft: '3px solid #C07A2E' }}>
              <span style={{ fontSize: '16px' }}>📅</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#C07A2E' }}>{data!.reservasPendientes} reserva{data!.reservasPendientes !== 1 ? 's' : ''} por aprobar</div>
              </div>
            </div>
          )}
          {(data?.ticketsPendientes || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#EBF4FF', borderRadius: '10px', borderLeft: '3px solid #0D4A8F' }}>
              <span style={{ fontSize: '16px' }}>🔧</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0D4A8F' }}>{data!.ticketsPendientes} ticket{data!.ticketsPendientes !== 1 ? 's' : ''} pendiente{data!.ticketsPendientes !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
          {!data?.recibosVencidos && !data?.reservasPendientes && !data?.ticketsPendientes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#E8F4F0', borderRadius: '10px', borderLeft: '3px solid #1A7A4A' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <div style={{ fontSize: '13px', color: '#1A7A4A', fontWeight: 600 }}>Sin alertas — todo en orden</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
