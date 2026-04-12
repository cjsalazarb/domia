import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface NavItem { path: string; label: string; icon: string }
interface Props { children: React.ReactNode; condominioId?: string; title?: string }

export default function AdminLayout({ children, condominioId, title }: Props) {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isSuper = profile?.rol === 'super_admin'

  // Fetch condominio name for sidebar header
  const { data: condominioNombre } = useQuery({
    queryKey: ['condo-nombre', condominioId],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre').eq('id', condominioId!).single()
      return data?.nombre || 'Condominio'
    },
    enabled: !!condominioId,
  })

  const operacionItems: NavItem[] = condominioId ? [
    { path: `/admin/condominio/${condominioId}/dashboard`, label: 'Dashboard', icon: '📊' },
    { path: `/admin/condominio/${condominioId}/residentes`, label: 'Residentes', icon: '👥' },
    { path: `/admin/condominio/${condominioId}/financiero`, label: 'Financiero', icon: '💰' },
    { path: `/admin/condominio/${condominioId}/mantenimiento`, label: 'Mantenimiento', icon: '🔧' },
    { path: `/admin/condominio/${condominioId}/reservas`, label: 'Reservas', icon: '📅' },
    { path: `/admin/condominio/${condominioId}/comunicaciones`, label: 'Comunicaciones', icon: '📢' },
    { path: `/admin/condominio/${condominioId}/guardias`, label: 'Guardias', icon: '🛡️' },
  ] : []

  const configItems: NavItem[] = condominioId ? [
    { path: `/admin/condominio/${condominioId}/configurar`, label: 'Configurar', icon: '⚙️' },
  ] : []

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <style>{`
        .admin-sidebar { position: fixed; left: -260px; top: 0; bottom: 0; width: 250px; z-index: 50; transition: left 0.3s ease; }
        .admin-sidebar.open { left: 0; }
        .admin-main { margin-left: 0; }
        @media (min-width: 1024px) {
          .admin-sidebar { position: sticky; top: 0; left: 0 !important; height: 100vh; flex-shrink: 0; align-self: flex-start; overflow-y: auto; }
          .admin-main { margin-left: 0; }
          .admin-hamburger { display: none !important; }
        }
        .admin-content table { display: block; overflow-x: auto; }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", display: 'flex' }}>
        {/* Overlay */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }} />}

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#0D1117', display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <a href="/admin" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
              DOM<span style={{ color: '#0D9E6E' }}>IA</span>
            </a>
          </div>

          {/* Back to condominios + condominio name */}
          {condominioId && (
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {isSuper && (
                <a href="/admin"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '8px', transition: 'color 0.15s' }}>
                  ← Mis condominios
                </a>
              )}
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D9E6E', lineHeight: '1.3' }}>
                {condominioNombre || '...'}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            {operacionItems.map(item => {
              const active = isActive(item.path)
              return (
                <a key={item.path} href={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', textDecoration: 'none',
                    backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent', color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: active ? 600 : 400, width: '100%', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span>{item.label}
                </a>
              )
            })}

            {configItems.length > 0 && (
              <>
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />
                {configItems.map(item => {
                  const active = isActive(item.path)
                  return (
                    <a key={item.path} href={item.path}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', textDecoration: 'none',
                        backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent', color: active ? '#0D9E6E' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: active ? 600 : 400, width: '100%', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span>{item.label}
                    </a>
                  )
                })}
              </>
            )}
          </nav>

          {/* User */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{profile?.nombre} {profile?.apellido}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{profile?.email}</div>
            <button onClick={() => { signOut(); navigate('/login') }}
              style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Cerrar sesion
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="admin-main" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid #E8F4F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px', color: '#0D1117' }}>☰</button>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{title || 'DOMIA'}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#5E6B62' }}>{profile?.nombre}</span>
          </div>
          <div className="admin-content" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>{children}</div>
        </div>
      </div>
    </>
  )
}
