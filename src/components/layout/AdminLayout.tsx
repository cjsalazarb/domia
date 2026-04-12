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

  // For super_admin without explicit condominioId, fetch the first condominio
  const { data: primerCondominio } = useQuery({
    queryKey: ['primer-condominio'],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('id').eq('estado', 'activo').order('nombre').limit(1).single()
      return data?.id || null
    },
    enabled: isSuper && !condominioId,
  })

  const cid = condominioId || profile?.condominio_id || primerCondominio || ''

  const condoLinks: NavItem[] = cid ? [
    { path: `/admin/condominio/${cid}/residentes`, label: 'Residentes', icon: '👥' },
    { path: `/admin/condominio/${cid}/financiero`, label: 'Financiero', icon: '💰' },
    { path: `/admin/condominio/${cid}/mantenimiento`, label: 'Mantenimiento', icon: '🔧' },
    { path: `/admin/condominio/${cid}/reservas`, label: 'Reservas', icon: '📅' },
    { path: `/admin/condominio/${cid}/comunicaciones`, label: 'Comunicaciones', icon: '📢' },
    { path: `/admin/condominio/${cid}/guardias`, label: 'Guardias', icon: '🛡️' },
  ] : []

  const navItems: NavItem[] = [
    ...(isSuper ? [
      { path: '/admin', label: 'Dashboard', icon: '📊' },
      { path: '/admin/condominios', label: 'Condominios', icon: '🏢' },
    ] : []),
    ...condoLinks,
  ]

  const isActive = (path: string) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))

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
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }} className="lg:hidden" />}

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#0D1117', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white', cursor: 'pointer' }} onClick={() => { navigate('/admin'); setSidebarOpen(false) }}>
              DOM<span style={{ color: '#0D9E6E' }}>IA</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{isSuper ? 'Super Admin' : 'Administrador'}</div>
          </div>

          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
            {navItems.map(item => {
              const active = isActive(item.path)
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '10px', border: 'none',
                    backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent', color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: active ? 600 : 400, textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span>{item.label}
                </button>
              )
            })}
          </nav>

          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{profile?.nombre} {profile?.apellido}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{profile?.email}</div>
            <button onClick={() => { signOut(); navigate('/login') }}
              style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Cerrar sesión
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
          <div key={location.pathname} className="admin-content" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>{children}</div>
        </div>
      </div>
    </>
  )
}
