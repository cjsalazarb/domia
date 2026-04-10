import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CONDO_ID = '11111111-1111-1111-1111-111111111111'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [condos, residentes, recibos, pagos, mantenimientos, guardias, turnos] = await Promise.all([
        supabase.from('condominios').select('id', { count: 'exact', head: true }),
        supabase.from('residentes').select('id, estado', { count: 'exact' }).eq('condominio_id', CONDO_ID),
        supabase.from('recibos').select('id, estado, monto_total').eq('condominio_id', CONDO_ID),
        supabase.from('pagos').select('id, monto').eq('condominio_id', CONDO_ID).not('confirmado_por', 'is', null),
        supabase.from('mantenimientos').select('id, estado').eq('condominio_id', CONDO_ID),
        supabase.from('guardias').select('id').eq('condominio_id', CONDO_ID).eq('activo', true),
        supabase.from('turnos').select('id, estado').eq('condominio_id', CONDO_ID),
      ])

      const totalResidentes = residentes.count || 0
      const morosos = (residentes.data || []).filter(r => r.estado === 'moroso').length
      const recibosData = recibos.data || []
      const totalRecibos = recibosData.length
      const recibosPagados = recibosData.filter(r => r.estado === 'pagado').length
      const recibosVencidos = recibosData.filter(r => r.estado === 'vencido').length
      const recibosEmitidos = recibosData.filter(r => r.estado === 'emitido').length
      const totalRecaudado = (pagos.data || []).reduce((s, p) => s + Number(p.monto), 0)
      const totalPendiente = recibosData.filter(r => r.estado !== 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
      const mttoData = mantenimientos.data || []
      const mttoPendientes = mttoData.filter(m => m.estado === 'pendiente').length
      const mttoEnProceso = mttoData.filter(m => ['asignado', 'en_proceso'].includes(m.estado)).length
      const mttoResueltos = mttoData.filter(m => m.estado === 'resuelto').length

      return {
        condominios: condos.count || 0,
        totalResidentes, morosos,
        totalRecibos, recibosPagados, recibosVencidos, recibosEmitidos,
        totalRecaudado, totalPendiente,
        mttoPendientes, mttoEnProceso, mttoResueltos, mttoTotal: mttoData.length,
        totalGuardias: guardias.data?.length || 0,
        turnosActivos: (turnos.data || []).filter(t => t.estado === 'activo').length,
      }
    },
  })

  const cobranzaData = stats ? [
    { name: 'Pagados', value: stats.recibosPagados, color: '#1A7A4A' },
    { name: 'Emitidos', value: stats.recibosEmitidos, color: '#C07A2E' },
    { name: 'Vencidos', value: stats.recibosVencidos, color: '#B83232' },
  ].filter(d => d.value > 0) : []

  const mttoData = stats ? [
    { name: 'Pendientes', value: stats.mttoPendientes, color: '#C07A2E' },
    { name: 'En proceso', value: stats.mttoEnProceso, color: '#7B1AC8' },
    { name: 'Resueltos', value: stats.mttoResueltos, color: '#1A7A4A' },
  ].filter(d => d.value > 0) : []

  const kpiStyle = (color: string) => ({
    backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    padding: '20px', borderLeft: `4px solid ${color}`,
  })

  return (
    <AdminLayout title="Dashboard">
      <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
        Dashboard
      </h1>
      <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
        Vista general del sistema DOMIA
      </p>

      {/* KPIs row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={kpiStyle('#1A7A4A')}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Residentes</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', marginTop: '4px' }}>{stats?.totalResidentes || 0}</div>
          {(stats?.morosos || 0) > 0 && <div style={{ fontSize: '11px', color: '#B83232', marginTop: '2px' }}>{stats?.morosos} moroso{stats?.morosos !== 1 ? 's' : ''}</div>}
        </div>

        <div style={kpiStyle('#1A7A4A')}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recaudado</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#1A7A4A', marginTop: '4px' }}>Bs. {(stats?.totalRecaudado || 0).toFixed(0)}</div>
          <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{stats?.recibosPagados || 0} recibos pagados</div>
        </div>

        <div style={kpiStyle('#B83232')}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#B83232', marginTop: '4px' }}>Bs. {(stats?.totalPendiente || 0).toFixed(0)}</div>
          <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{(stats?.recibosEmitidos || 0) + (stats?.recibosVencidos || 0)} recibos</div>
        </div>

        <div style={kpiStyle('#0D4A8F')}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mantenimiento</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D4A8F', marginTop: '4px' }}>{stats?.mttoPendientes || 0}</div>
          <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>tickets pendientes</div>
        </div>

        <div style={kpiStyle('#7B1AC8')}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guardias</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#7B1AC8', marginTop: '4px' }}>{stats?.totalGuardias || 0}</div>
          <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{stats?.turnosActivos || 0} en turno ahora</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Cobranza pie */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Estado de Cobranza</h3>
          {cobranzaData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '140px', height: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cobranzaData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {cobranzaData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cobranzaData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                    <span style={{ color: '#5E6B62' }}>{d.name}</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#5E6B62', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin datos</div>
          )}
        </div>

        {/* Mantenimiento bar */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Mantenimiento</h3>
          {mttoData.length > 0 ? (
            <div style={{ width: '100%', height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mttoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5E6B62' }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#5E6B62' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #C8D4CB', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {mttoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: '#5E6B62', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin datos</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Acceso rápido</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Residentes', icon: '👥', path: `/admin/condominio/${CONDO_ID}/residentes` },
            { label: 'Financiero', icon: '💰', path: `/admin/condominio/${CONDO_ID}/financiero` },
            { label: 'Mantenimiento', icon: '🔧', path: `/admin/condominio/${CONDO_ID}/mantenimiento` },
            { label: 'Reservas', icon: '📅', path: `/admin/condominio/${CONDO_ID}/reservas` },
            { label: 'Comunicaciones', icon: '📢', path: `/admin/condominio/${CONDO_ID}/comunicaciones` },
            { label: 'Guardias', icon: '🛡️', path: `/admin/condominio/${CONDO_ID}/guardias` },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px',
              border: '1px solid #E8F4F0', backgroundColor: 'white', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#0D1117',
              transition: 'all 0.15s', textAlign: 'left',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8F4F0' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white' }}
            >
              <span style={{ fontSize: '20px' }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
