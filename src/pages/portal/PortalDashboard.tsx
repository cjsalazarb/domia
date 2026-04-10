import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export default function PortalDashboard() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['portal-stats', user?.id],
    queryFn: async () => {
      const { data: residente } = await supabase.from('residentes').select('id, unidad_id, unidades(numero)').eq('user_id', user!.id).eq('estado', 'activo').single()
      if (!residente) return null

      const [recibos, mantenimientos, reservas] = await Promise.all([
        supabase.from('recibos').select('id, estado, monto_total').eq('residente_id', residente.id).in('estado', ['emitido', 'vencido']),
        supabase.from('mantenimientos').select('id, estado').eq('solicitado_por', user!.id).in('estado', ['pendiente', 'asignado', 'en_proceso']),
        supabase.from('reservas').select('id, estado').eq('residente_id', residente.id).eq('estado', 'pendiente'),
      ])

      const deuda = (recibos.data || []).reduce((s, r) => s + Number(r.monto_total), 0)
      return {
        unidad: (residente.unidades as any)?.numero || '—',
        recibosPendientes: recibos.data?.length || 0,
        deuda,
        mttoActivos: mantenimientos.data?.length || 0,
        reservasPendientes: reservas.data?.length || 0,
      }
    },
    enabled: !!user,
  })

  const acciones = [
    { label: 'Pagar cuota', icon: '💳', path: '/portal/pagar', desc: 'Sube tu comprobante' },
    { label: 'Mantenimiento', icon: '🔧', path: '/portal/mantenimiento', desc: 'Solicita reparaciones' },
    { label: 'Reservas', icon: '📅', path: '/portal/reservas', desc: 'Áreas comunes' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)',
        padding: '24px 20px 32px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800 }}>DOM<span style={{ opacity: 0.9 }}>IA</span></span>
          <button onClick={() => { signOut(); navigate('/login') }} style={{ padding: '5px 12px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Salir</button>
        </div>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>
          Hola, {profile?.nombre} 👋
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.8 }}>
          Unidad {stats?.unidad || '...'} · Portal Residente
        </p>
      </div>

      <div style={{ padding: '0 20px 24px', maxWidth: '500px', margin: '0 auto', marginTop: '-16px' }}>
        {/* Deuda card */}
        {stats && stats.deuda > 0 && (
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '4px solid #B83232',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#B83232', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deuda pendiente</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '26px', fontWeight: 800, color: '#B83232', marginTop: '2px' }}>
                Bs. {stats.deuda.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#5E6B62' }}>{stats.recibosPendientes} recibo{stats.recibosPendientes !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => navigate('/portal/pagar')} style={{
              padding: '10px 18px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
            }}>Pagar →</button>
          </div>
        )}

        {/* KPIs mini */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D4A8F' }}>{stats?.mttoActivos || 0}</div>
            <div style={{ fontSize: '11px', color: '#5E6B62' }}>Solicitudes activas</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#C07A2E' }}>{stats?.reservasPendientes || 0}</div>
            <div style={{ fontSize: '11px', color: '#5E6B62' }}>Reservas pendientes</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {acciones.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', backgroundColor: 'white',
              borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left', transition: 'transform 0.1s',
            }}>
              <span style={{ fontSize: '28px' }}>{a.icon}</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>{a.label}</div>
                <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>{a.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#C8D4CB', fontSize: '18px' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
