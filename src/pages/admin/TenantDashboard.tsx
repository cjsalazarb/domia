import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useMiTenant } from '@/hooks/useTenants'
import TrialBanner from '@/components/TrialBanner'
import type { Tenant } from '@/hooks/useTenants'

function SuscripcionBanner({ tenant }: { tenant: Tenant }) {
  const ahora = new Date()
  const proximoCobro = tenant.proximo_cobro ? new Date(tenant.proximo_cobro) : null
  const diasParaCobro = proximoCobro ? Math.ceil((proximoCobro.getTime() - ahora.getTime()) / 86400000) : null

  // During trial: show info about upcoming payment
  if (tenant.estado === 'trial' && tenant.trial_hasta) {
    const trialVence = new Date(tenant.trial_hasta)
    const diasTrial = Math.max(0, Math.ceil((trialVence.getTime() - ahora.getTime()) / 86400000))
    if (diasTrial <= 0) {
      return (
        <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#B83232', fontFamily: "'Inter', sans-serif" }}>
            Tu prueba vencio. Activa tu suscripcion para continuar usando DOMIA.
          </span>
          <a href="/tenant/suscripcion" style={{ padding: '8px 16px', backgroundColor: '#B83232', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
            Pagar Bs. {Number(tenant.monto_mensual).toFixed(0)} ahora
          </a>
        </div>
      )
    }
    // TrialBanner already handles days <= 10, so only show payment info for early trial
    if (diasTrial > 10) {
      return (
        <div style={{ backgroundColor: '#EBF4FF', borderLeft: '3px solid #0D4A8F', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#0D4A8F', fontFamily: "'Inter', sans-serif" }}>
          Prueba gratuita activa — vence el {trialVence.toLocaleDateString('es-BO', { day: '2-digit', month: 'long' })}. Tu proximo pago sera de <strong>Bs. {Number(tenant.monto_mensual).toFixed(0)}</strong> el {proximoCobro?.toLocaleDateString('es-BO', { day: '2-digit', month: 'long' }) || '-'}.
        </div>
      )
    }
    return null // TrialBanner handles this range
  }

  // Active tenant: show reminder 3 days before cobro
  if (tenant.estado === 'activo' && diasParaCobro !== null && diasParaCobro <= 3 && diasParaCobro >= 0) {
    return (
      <div style={{ backgroundColor: '#EBF4FF', borderLeft: '3px solid #0D4A8F', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#0D4A8F', fontFamily: "'Inter', sans-serif" }}>
          Tu proximo pago de <strong>Bs. {Number(tenant.monto_mensual).toFixed(0)}</strong> vence el {proximoCobro!.toLocaleDateString('es-BO', { day: '2-digit', month: 'long' })}. Recuerda tener listo tu comprobante.
        </span>
        <a href="/tenant/suscripcion" style={{ padding: '6px 14px', backgroundColor: '#0D4A8F', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
          Ver instrucciones de pago
        </a>
      </div>
    )
  }

  return null
}

export default function TenantDashboard() {
  const { profile, signOut } = useAuthStore()
  const { data: tenant } = useMiTenant(profile?.tenant_id || null)

  const { data: condoStats, isLoading } = useQuery({
    queryKey: ['tenant-condominios-stats', profile?.tenant_id],
    queryFn: async () => {
      const [condosRes, residentesRes, recibosRes, mttoRes, unidadesRes] = await Promise.all([
        supabase.from('condominios').select('*').in('estado', ['activo', 'en_configuracion']).order('nombre'),
        supabase.from('residentes').select('id, condominio_id, estado'),
        supabase.from('recibos').select('id, condominio_id, estado'),
        supabase.from('mantenimientos').select('id, condominio_id, estado').in('estado', ['pendiente', 'asignado', 'en_proceso']),
        supabase.from('unidades').select('id, condominio_id').eq('activa', true),
      ])

      const condos = condosRes.data || []
      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const mtto = mttoRes.data || []
      const unidades = unidadesRes.data || []

      return condos.map(c => {
        const cRecibos = recibos.filter(r => r.condominio_id === c.id)
        const cPagados = cRecibos.filter(r => r.estado === 'pagado').length
        const cTotal = cRecibos.length
        const cobranza = cTotal > 0 ? Math.round((cPagados / cTotal) * 100) : 0
        const cMorosos = recibos.filter(r => r.condominio_id === c.id && (r.estado === 'emitido' || r.estado === 'vencido')).length
        const cMtto = mtto.filter(m => m.condominio_id === c.id).length
        const cUnidades = unidades.filter(u => u.condominio_id === c.id).length
        const cResidentes = residentes.filter(r => r.condominio_id === c.id).length
        return { ...c, cobranza, morosos: cMorosos, ticketsPendientes: cMtto, totalUnidades: cUnidades, residentes: cResidentes }
      })
    },
    enabled: !!profile?.tenant_id,
  })

  const condos = condoStats || []

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
              { label: 'Dashboard', path: '/tenant', icon: '🏠' },
              { label: 'Suscripcion', path: '/tenant/suscripcion', icon: '💳' },
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
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
            {tenant && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{tenant.nombre}</div>}
          </div>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <TrialBanner tenant={tenant} />
        {tenant && <SuscripcionBanner tenant={tenant} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              Mis Condominios
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
              {tenant?.nombre || ''} · {condos.length} condominio{condos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {profile?.rol === 'super_admin' && (
            <a href="/admin/condominios" style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none', whiteSpace: 'nowrap' }}>
              + Nuevo condominio
            </a>
          )}
        </div>

        {/* KPIs */}
        {condos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Condominios', value: condos.length, color: '#0D1117' },
              { label: 'Unidades', value: condos.reduce((s, c) => s + c.totalUnidades, 0), color: '#0D1117' },
              { label: 'Residentes', value: condos.reduce((s, c) => s + c.residentes, 0), color: '#0D1117' },
            ].map((kpi, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{kpi.label}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        )}

        {isLoading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62', fontSize: '14px' }}>Cargando...</div>}

        {!isLoading && condos.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <p style={{ color: '#5E6B62', fontSize: '15px', marginBottom: '20px' }}>
              {profile?.rol === 'super_admin' ? 'Aun no tienes condominios' : 'Tu condominio esta siendo configurado'}
            </p>
            {profile?.rol === 'super_admin' && (
              <a href="/admin/condominios" style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: '#1A7A4A', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none' }}>
                Crear primer condominio
              </a>
            )}
          </div>
        )}

        {!isLoading && condos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {condos.map(c => (
              <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '3px' }}>{c.ciudad} {c.direccion ? `· ${c.direccion}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.totalUnidades}</div>
                    <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Unidades</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#E8F4F0' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.residentes}</div>
                    <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Residentes</div>
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5E6B62', marginBottom: '4px' }}>
                    <span>Cobranza del mes</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#E8F4F0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.cobranza}%`, backgroundColor: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232', borderRadius: '100px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {c.morosos > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{c.morosos} pendiente{c.morosos !== 1 ? 's' : ''}</span>}
                  {c.ticketsPendientes > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FEF9EC', color: '#C07A2E', padding: '3px 8px', borderRadius: '6px' }}>{c.ticketsPendientes} ticket{c.ticketsPendientes !== 1 ? 's' : ''}</span>}
                  {c.morosos === 0 && c.ticketsPendientes === 0 && <span style={{ fontSize: '11px', backgroundColor: '#E8F4F0', color: '#1A7A4A', padding: '3px 8px', borderRadius: '6px' }}>Todo al dia</span>}
                </div>
                <a href={`/admin/condominio/${c.id}/dashboard`}
                  style={{ display: 'block', padding: '12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textAlign: 'center', textDecoration: 'none' }}>
                  Entrar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
