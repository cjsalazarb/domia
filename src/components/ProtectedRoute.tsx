import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

type Rol = 'super_admin' | 'admin_condominio' | 'propietario' | 'inquilino' | 'guardia'

interface Props {
  children: React.ReactNode
  rolesPermitidos: Rol[]
}

export function ProtectedRoute({ children, rolesPermitidos }: Props) {
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

  if (profile && !rolesPermitidos.includes(profile.rol)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <>{children}</>
}
