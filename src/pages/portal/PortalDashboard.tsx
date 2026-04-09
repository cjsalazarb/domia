import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function PortalDashboard() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      <div style={{
        background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)',
        padding: '20px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>
            DOM<span style={{ opacity: 0.9 }}>IA</span>
          </span>
          <span style={{ marginLeft: '12px', fontSize: '13px', opacity: 0.8 }}>Portal Residente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button
            onClick={() => { signOut(); navigate('/login') }}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
          Hola, {profile?.nombre} 👋
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Bienvenido a tu portal de residente
        </p>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          padding: '24px',
          color: '#5E6B62',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          Módulo en construcción — próximamente recibos, pagos y solicitudes
        </div>
      </div>
    </div>
  )
}
