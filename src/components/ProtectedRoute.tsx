import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

type Rol = 'super_admin' | 'admin_condominio' | 'propietario' | 'inquilino' | 'guardia'

interface Props {
  children: React.ReactNode
  rolesPermitidos: Rol[]
}

export function ProtectedRoute({ children, rolesPermitidos }: Props) {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [debeCambiar, setDebeCambiar] = useState<boolean | null>(null)

  const esResidente = profile?.rol === 'propietario' || profile?.rol === 'inquilino'
  const enCambiarPassword = location.pathname === '/cambiar-password'

  useEffect(() => {
    if (!user || !esResidente || loading) return

    setCheckingPassword(true)
    ;(async () => {
      const { data } = await supabase
        .from('residentes_auth')
        .select('debe_cambiar_password')
        .eq('user_id', user.id)
        .single()
      setDebeCambiar(data?.debe_cambiar_password ?? false)
      setCheckingPassword(false)
    })()
  }, [user?.id, esResidente, loading])

  if (loading || checkingPassword) {
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

  // Guard: force password change for residents
  if (esResidente && debeCambiar && !enCambiarPassword) {
    return <Navigate to="/cambiar-password" replace />
  }

  return <>{children}</>
}
