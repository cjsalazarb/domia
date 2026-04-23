import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function RoleRedirect() {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800 }}>
            <span style={{ color: '#0D1117' }}>DOM</span>
            <span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
          <p style={{ color: '#5E6B62', fontSize: '14px', marginTop: '8px' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!profile) return <Navigate to="/login" replace />

  switch (profile.rol) {
    case 'super_admin':
      return <Navigate to="/dashboard" replace />
    case 'admin_condominio':
      return <Navigate to={`/admin/condominio/${profile.condominio_id}/dashboard`} replace />
    case 'propietario':
    case 'inquilino':
      return <Navigate to="/portal" replace />
    case 'guardia':
      return <Navigate to="/guardia" replace />
    default:
      return <Navigate to="/login" replace />
  }
}
