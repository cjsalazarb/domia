import { useAuthStore } from '@/stores/authStore'

export default function SinAcceso() {
  const { profile } = useAuthStore()

  const getRedirect = () => {
    if (!profile) return '/login'
    switch (profile.rol) {
      case 'super_admin': return '/admin'
      case 'admin_condominio': return `/admin/condominio/${profile.condominio_id}/residentes`
      case 'guardia': return '/turno'
      default: return '/portal'
    }
  }

  const rolLabel: Record<string, string> = {
    super_admin: 'Panel Admin',
    admin_condominio: 'Panel Admin',
    propietario: 'Portal Residente',
    inquilino: 'Portal Residente',
    guardia: 'Panel Guardia',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F4F7F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 48px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
          Sin acceso
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          No tienes permisos para ver esta página.
        </p>
        <a
          href={getRedirect()}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#1A7A4A',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Ir a {profile ? rolLabel[profile.rol] || 'inicio' : 'Login'} →
        </a>
      </div>
    </div>
  )
}
