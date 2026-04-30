import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const NAV_ITEMS = [
  { path: '/portal', icon: '\uD83C\uDFE0', label: 'Inicio' },
  { path: '/portal/recibos', icon: '\uD83D\uDCB0', label: 'Pagos' },
  { path: '/portal/reservas', icon: '\uD83D\uDCC5', label: 'Reservas' },
  { path: '/portal/mantenimiento', icon: '\u26A0\uFE0F', label: 'Incidencias' },
  { path: '/portal/comunicados', icon: '\uD83D\uDD14', label: 'Alertas' },
]

export default function PortalLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", paddingBottom: '70px' }}>
      {/* Header */}
      {title && (
        <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '20px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>DOM<span style={{ opacity: 0.9 }}>IA</span></span>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
            <button onClick={() => { signOut(); navigate('/login') }} style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Salir</button>
          </div>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', borderTop: '1px solid #E8F4F0',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 0 env(safe-area-inset-bottom, 6px)',
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
                color: active ? '#1A7A4A' : '#5E6B62',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, fontFamily: "'Inter', sans-serif" }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
