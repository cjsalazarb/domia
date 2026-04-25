import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTenants, type Tenant } from '@/hooks/useTenants'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  trial: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Trial' },
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  suspendido: { bg: '#FEF9EC', text: '#C07A2E', label: 'Suspendido' },
  cancelado: { bg: '#FCEAEA', text: '#B83232', label: 'Cancelado' },
}

const PLAN_LABEL: Record<string, string> = {
  basico: 'Basico (≤20 uds)',
  mediano: 'Mediano (21-50)',
  grande: 'Grande (51-100)',
  corporativo: 'Corporativo (100+)',
}

export default function ClientesDomia() {
  const { profile, signOut } = useAuthStore()
  const { tenants, isLoading, actualizar } = useTenants()
  const [confirmAction, setConfirmAction] = useState<{ tenant: Tenant; action: string } | null>(null)

  const handleAction = async () => {
    if (!confirmAction) return
    const { tenant, action } = confirmAction
    await actualizar.mutateAsync({ id: tenant.id, updates: { estado: action } })
    setConfirmAction(null)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
            DOM<span style={{ color: '#0D9E6E' }}>IA</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
              { label: 'Condominios', path: '/admin', icon: '🏢' },
              { label: 'Clientes', path: '/admin/clientes', icon: '👥' },
              { label: 'Finanzas Global', path: '/finanzas-global', icon: '💰' },
            ].map(item => {
              const active = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400, backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent', color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)' }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
          Clientes DOMIA
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          {tenants.length} cliente{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}
        </p>

        {isLoading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62' }}>Cargando...</div>}

        {!isLoading && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr 0.6fr 0.6fr 0.7fr 1fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontSize: '10px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Empresa</span><span>Email</span><span>Plan</span><span>Estado</span><span>Unidades</span><span>Bs/mes</span><span></span>
            </div>
            {tenants.map((t, i) => {
              const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE.trial
              const trialDias = t.trial_hasta ? Math.max(0, Math.ceil((new Date(t.trial_hasta).getTime() - Date.now()) / 86400000)) : null
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr 0.6fr 0.6fr 0.7fr 1fr', padding: '14px 20px', fontSize: '13px', borderBottom: i < tenants.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{t.nombre}</div>
                    {t.telefono && <div style={{ fontSize: '11px', color: '#5E6B62' }}>{t.telefono}</div>}
                  </div>
                  <span style={{ color: '#5E6B62', fontSize: '12px' }}>{t.email}</span>
                  <span style={{ fontSize: '11px', color: '#5E6B62' }}>{PLAN_LABEL[t.plan] || t.plan}</span>
                  <div>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                    {t.estado === 'trial' && trialDias !== null && (
                      <div style={{ fontSize: '10px', color: trialDias <= 3 ? '#B83232' : '#5E6B62', marginTop: '2px' }}>{trialDias}d restantes</div>
                    )}
                  </div>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{t.total_unidades}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#1A7A4A' }}>Bs. {Number(t.monto_mensual).toFixed(0)}</span>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    {(t.estado === 'trial' || t.estado === 'suspendido') && (
                      <button onClick={() => setConfirmAction({ tenant: t, action: 'activo' })} style={{ padding: '3px 8px', backgroundColor: '#E8F4F0', color: '#1A7A4A', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Activar</button>
                    )}
                    {(t.estado === 'activo' || t.estado === 'trial') && (
                      <button onClick={() => setConfirmAction({ tenant: t, action: 'suspendido' })} style={{ padding: '3px 8px', backgroundColor: '#FEF9EC', color: '#C07A2E', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Suspender</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm action modal */}
      {confirmAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirmAction(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
              {confirmAction.action === 'activo' ? 'Activar' : 'Suspender'} cliente
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿{confirmAction.action === 'activo' ? 'Activar' : 'Suspender'} a <strong>{confirmAction.tenant.nombre}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleAction} style={{ padding: '8px 18px', backgroundColor: confirmAction.action === 'activo' ? '#1A7A4A' : '#C07A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                {confirmAction.action === 'activo' ? 'Activar' : 'Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
