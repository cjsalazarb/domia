import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

type Rol = 'super_admin' | 'tenant_admin' | 'admin_condominio' | 'propietario' | 'inquilino' | 'guardia'

interface Props {
  children: React.ReactNode
  rolesPermitidos: Rol[]
}

export function ProtectedRoute({ children, rolesPermitidos }: Props) {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()
  const [checkingPassword, setCheckingPassword] = useState(false)
  const [debeCambiar, setDebeCambiar] = useState<boolean | null>(null)
  const [tenantEstado, setTenantEstado] = useState<string | null>(null)
  const [checkingTenant, setCheckingTenant] = useState(false)

  const necesitaCheckPassword = profile?.rol === 'propietario' || profile?.rol === 'inquilino' || profile?.rol === 'guardia'
  const enCambiarPassword = location.pathname === '/cambiar-password'

  // Check tenant suspension for tenant_admin
  const esTenantAdmin = profile?.rol === 'tenant_admin'
  const rutasExentas = ['/tenant/suspendido', '/tenant/suscripcion', '/activar']
  const enRutaExenta = rutasExentas.includes(location.pathname)

  useEffect(() => {
    if (!user || !esTenantAdmin || !profile?.tenant_id || loading) return
    setCheckingTenant(true)
    ;(async () => {
      const { data } = await supabase
        .from('tenants')
        .select('estado')
        .eq('id', profile.tenant_id!)
        .single()
      setTenantEstado(data?.estado || null)
      setCheckingTenant(false)
    })()
  }, [user?.id, esTenantAdmin, profile?.tenant_id, loading])

  useEffect(() => {
    if (!user || !necesitaCheckPassword || loading) return

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
  }, [user?.id, necesitaCheckPassword, loading])

  if (loading || checkingPassword || checkingTenant) {
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

  // Guard: force password change for residents and guardias
  if (necesitaCheckPassword && debeCambiar && !enCambiarPassword) {
    return <Navigate to="/cambiar-password" replace />
  }

  // Guard: suspend tenant_admin if tenant is suspended/cancelled
  if (esTenantAdmin && !enRutaExenta && (tenantEstado === 'suspendido' || tenantEstado === 'cancelado')) {
    return <Navigate to="/tenant/suspendido" replace />
  }

  return <>{children}</>
}
