import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import PortalLayout from '@/components/layout/PortalLayout'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  tipo: string
  leido: boolean
  created_at: string
}

const TIPOS_ALERTA = [
  { key: 'ayuda', label: 'Necesito ayuda', icon: '🆘', color: '#EA580C', bg: '#FFF7ED' },
  { key: 'paquete', label: 'Paquete', icon: '📦', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'ruido', label: 'Ruido', icon: '🔊', color: '#CA8A04', bg: '#FEFCE8' },
  { key: 'emergencia', label: 'Emergencia', icon: '🚨', color: '#DC2626', bg: '#FEF2F2' },
]

export default function Comunicados() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [alertaEnviada, setAlertaEnviada] = useState(false)

  const { data: residente } = useQuery({
    queryKey: ['mi-residente', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('residentes').select('id, condominio_id, unidad_id').eq('user_id', user!.id).eq('estado', 'activo').single()
      return data
    },
    enabled: !!user,
  })

  // Alertas al guardia
  const enviarAlerta = useMutation({
    mutationFn: async (tipo: string) => {
      if (!residente) throw new Error('Sin residente')
      const { error } = await supabase.from('alertas_residentes').insert({
        condominio_id: residente.condominio_id,
        residente_id: residente.id,
        unidad_id: residente.unidad_id,
        tipo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-alertas'] })
      setAlertaEnviada(true)
      setTimeout(() => setAlertaEnviada(false), 3000)
    },
  })

  const { data: misAlertas = [] } = useQuery({
    queryKey: ['mis-alertas', residente?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('alertas_residentes')
        .select('id, tipo, atendida, created_at')
        .eq('residente_id', residente!.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: !!residente,
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
    <PortalLayout title="Comunicados">
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Llamar al guardia */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Llamar al guardia</h2>
          {alertaEnviada && (
            <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#1A7A4A', marginBottom: '12px' }}>
              Alerta enviada al guardia de turno
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {TIPOS_ALERTA.map(t => (
              <button key={t.key} onClick={() => enviarAlerta.mutate(t.key)} disabled={enviarAlerta.isPending}
                style={{
                  padding: '14px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  backgroundColor: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}>
                <span style={{ fontSize: '24px' }}>{t.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: t.color, fontFamily: "'Inter', sans-serif" }}>{t.label}</span>
              </button>
            ))}
          </div>
          {misAlertas.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#5E6B62', marginBottom: '6px', textTransform: 'uppercase' }}>Historial</div>
              {misAlertas.slice(0, 5).map(a => {
                const tipoInfo = TIPOS_ALERTA.find(t => t.key === a.tipo)
                const fecha = new Date(a.created_at)
                const mins = Math.floor((Date.now() - fecha.getTime()) / 60000)
                const tiempo = mins < 1 ? 'ahora' : mins < 60 ? `hace ${mins} min` : mins < 1440 ? `hace ${Math.floor(mins / 60)}h` : fecha.toLocaleDateString('es-BO')
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '12px' }}>
                    <span style={{ color: '#0D1117' }}>{tipoInfo?.icon} {tipoInfo?.label || a.tipo}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#5E6B62' }}>{tiempo}</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: a.atendida ? '#E8F4F0' : '#FEF9EC', color: a.atendida ? '#1A7A4A' : '#C07A2E' }}>
                        {a.atendida ? 'Atendida' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
    </PortalLayout>
  )
}
