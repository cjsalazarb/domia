import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
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
          <span style={{ marginLeft: '12px', fontSize: '13px', opacity: 0.8 }}>Panel Admin</span>
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
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
          Dashboard Super Admin
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Gestiona todos los condominios del sistema
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
          Módulo en construcción — próximamente CRUD de condominios
        </div>
      </div>
    </div>
  )
}
