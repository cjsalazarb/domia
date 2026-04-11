import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  tipo: string
  leido: boolean
  created_at: string
}

export default function Comunicados() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: residente } = useQuery({
    queryKey: ['mi-residente', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('residentes').select('id, condominio_id').eq('user_id', user!.id).eq('estado', 'activo').single()
      return data
    },
    enabled: !!user,
  })

  const { data: notificaciones = [] } = useQuery({
    queryKey: ['mis-comunicados', residente?.condominio_id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('id, titulo, cuerpo, tipo, leido, created_at')
        .eq('condominio_id', residente!.condominio_id)
        .or(`destinatario_id.eq.${user!.id},destinatario_id.is.null`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Notificacion[]
    },
    enabled: !!residente && !!user,
  })

  const marcarLeido = useMutation({
    mutationFn: async (notifId: string) => {
      await supabase
        .from('notificaciones')
        .update({ leido: true, leido_at: new Date().toISOString() })
        .eq('id', notifId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-comunicados'] })
      queryClient.invalidateQueries({ queryKey: ['portal-no-leidos'] })
    },
  })

  const handleOpen = (notif: Notificacion) => {
    setSelectedId(selectedId === notif.id ? null : notif.id)
    if (!notif.leido) {
      marcarLeido.mutate(notif.id)
    }
  }

  const noLeidos = notificaciones.filter(n => !n.leido).length

  const formatFecha = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '20px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>DOM<span style={{ opacity: 0.9 }}>IA</span></span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Comunicados</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); navigate('/login') }} style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
          ← Volver al portal
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Comunicados
          </h1>
          {noLeidos > 0 && (
            <span style={{
              backgroundColor: '#0D4A8F', color: 'white', borderRadius: '12px', padding: '4px 12px',
              fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
            }}>
              {noLeidos} nuevo{noLeidos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {notificaciones.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '14px', color: '#5E6B62', margin: 0 }}>No hay comunicados todavia</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notificaciones.map(n => {
              const isOpen = selectedId === n.id
              return (
                <div
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderLeft: n.leido ? 'none' : '4px solid #0D4A8F',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: '15px',
                          fontWeight: n.leido ? 600 : 800,
                          color: '#0D1117',
                          margin: 0,
                        }}>
                          {n.titulo}
                        </h3>
                        {!n.leido && (
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: '#0D4A8F', display: 'inline-block', flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px', display: 'block' }}>
                        {formatFecha(n.created_at)}
                      </span>
                    </div>
                    <span style={{ fontSize: '16px', color: '#C8D4CB', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                  </div>

                  {isOpen && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #F0F0F0',
                      fontSize: '14px',
                      color: '#0D1117',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {n.cuerpo}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
