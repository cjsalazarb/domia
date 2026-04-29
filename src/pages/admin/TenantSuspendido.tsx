import { useAuthStore } from '@/stores/authStore'
import { useMiTenant } from '@/hooks/useTenants'

export default function TenantSuspendido() {
  const { profile, signOut } = useAuthStore()
  const { data: tenant } = useMiTenant(profile?.tenant_id || null)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '440px', padding: '32px' }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '36px', fontWeight: 800, marginBottom: '24px' }}>
          <span style={{ color: '#0D1117' }}>DOM</span>
          <span style={{ color: '#1A7A4A' }}>IA</span>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#B83232', margin: '0 0 8px' }}>
            {tenant?.estado === 'cancelado' ? 'Cuenta cancelada' : 'Acceso suspendido'}
          </h2>
          <p style={{ fontSize: '14px', color: '#5E6B62', lineHeight: 1.6, margin: '0 0 20px' }}>
            {tenant?.estado === 'cancelado'
              ? 'Tu cuenta ha sido cancelada por falta de pago prolongada. Contacta soporte para reactivarla.'
              : 'Tu acceso esta suspendido por falta de pago. Regulariza tu pago para continuar usando DOMIA.'
            }
          </p>

          {tenant && (
            <div style={{ backgroundColor: '#FCEAEA', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#B83232', fontWeight: 600, marginBottom: '4px' }}>Monto pendiente</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#B83232' }}>
                Bs. {Number(tenant.monto_mensual).toFixed(0)}
              </div>
            </div>
          )}

          {tenant?.estado !== 'cancelado' && (
            <a href="/tenant/suscripcion"
              style={{ display: 'block', padding: '14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none', marginBottom: '12px' }}>
              Pagar ahora
            </a>
          )}

          <div style={{ fontSize: '12px', color: '#5E6B62', marginBottom: '16px' }}>
            Soporte: <a href="mailto:admin@altrion.bo" style={{ color: '#1A7A4A', textDecoration: 'none', fontWeight: 600 }}>admin@altrion.bo</a>
          </div>

          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  )
}
