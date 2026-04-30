import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import PortalLayout from '@/components/layout/PortalLayout'
import { templateEmergenciaResidente } from '@/lib/emailTemplates'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  tipo: string
  leido: boolean
  created_at: string
}

const TIPOS_ALERTA = [
  { key: 'ayuda', label: 'Necesito ayuda', icon: '\uD83C\uDD98', color: '#EA580C', bg: '#FFF7ED' },
  { key: 'paquete', label: 'Paquete', icon: '\uD83D\uDCE6', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'ruido', label: 'Ruido', icon: '\uD83D\uDD0A', color: '#CA8A04', bg: '#FEFCE8' },
  { key: 'emergencia', label: 'Emergencia', icon: '\uD83D\uDEA8', color: '#DC2626', bg: '#FEF2F2' },
]

export default function Comunicados() {
  const { user, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [alertaMsg, setAlertaMsg] = useState<{ text: string; color: string } | null>(null)
  const [alertaError, setAlertaError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { data: residente } = useQuery({
    queryKey: ['mi-residente', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('residentes').select('id, condominio_id, unidad_id').eq('user_id', user!.id).eq('estado', 'activo').single()
      return data
    },
    enabled: !!user,
  })

  // Fetch unidad number and condominio name for emergency email
  const { data: unidadInfo } = useQuery({
    queryKey: ['mi-unidad-info', residente?.unidad_id],
    queryFn: async () => {
      const { data } = await supabase.from('unidades').select('numero').eq('id', residente!.unidad_id).single()
      return data
    },
    enabled: !!residente?.unidad_id,
  })
  const { data: condoInfo } = useQuery({
    queryKey: ['mi-condo-info', residente?.condominio_id],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre, admin_id').eq('id', residente!.condominio_id).single()
      return data
    },
    enabled: !!residente?.condominio_id,
  })

  const enviarAlerta = useMutation({
    mutationFn: async (tipo: string) => {
      if (!residente) throw new Error('No se encontro tu perfil de residente. Contacta al administrador.')
      const { error } = await supabase.from('alertas_residentes').insert({
        condominio_id: residente.condominio_id,
        residente_id: residente.id,
        unidad_id: residente.unidad_id,
        tipo,
      })
      if (error) throw new Error(error.message)

      // Send emergency email to admin
      if (tipo === 'emergencia' && condoInfo?.admin_id) {
        const { data: adminProfile } = await supabase.from('profiles').select('email').eq('id', condoInfo.admin_id).single()
        if (adminProfile?.email) {
          const nombre = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim()
          const timestamp = new Date().toLocaleString('es-BO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          const emailHtml = templateEmergenciaResidente(nombre, unidadInfo?.numero || '?', condoInfo.nombre || '', timestamp)
          supabase.functions.invoke('notificar-reserva', {
            body: {
              tipo: 'emergencia',
              reservaId: 'emergencia',
              emailDestinatario: adminProfile.email,
              emailAsunto: `EMERGENCIA — Unidad ${unidadInfo?.numero || '?'} en ${condoInfo.nombre || ''}`,
              emailHtml,
            },
          }).catch(e => console.error('Error enviando email emergencia:', e))
        }
      }

      return tipo
    },
    onSuccess: (_data, tipo) => {
      queryClient.invalidateQueries({ queryKey: ['mis-alertas'] })
      setCooldown(30)
      setAlertaError('')
      if (tipo === 'emergencia') {
        setAlertaMsg({ text: 'Emergencia reportada — administrador y guardia notificados', color: '#DC2626' })
      } else {
        setAlertaMsg({ text: 'Alerta enviada al guardia de turno', color: '#1A7A4A' })
      }
      setTimeout(() => setAlertaMsg(null), 4000)
    },
    onError: (err) => {
      setAlertaError(err instanceof Error ? err.message : 'Error al enviar alerta')
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

  const handleOpen = useCallback((notif: Notificacion) => {
    setSelectedId(prev => prev === notif.id ? null : notif.id)
    if (!notif.leido) {
      marcarLeido.mutate(notif.id)
    }
  }, [marcarLeido])

  const noLeidos = notificaciones.filter(n => !n.leido).length

  const formatFecha = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function tiempoRelativo(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins} min`
    if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`
    return new Date(iso).toLocaleDateString('es-BO')
  }

  return (
    <PortalLayout title="Alertas">
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Llamar al guardia */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Llamar al guardia</h2>

          {alertaMsg && (
            <div style={{ backgroundColor: alertaMsg.color === '#DC2626' ? '#FEF2F2' : '#E8F4F0', borderLeft: `3px solid ${alertaMsg.color}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: alertaMsg.color, marginBottom: '12px', fontWeight: 600 }}>
              {alertaMsg.text}
            </div>
          )}
          {alertaError && (
            <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px' }}>
              {alertaError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {TIPOS_ALERTA.map(t => {
              const disabled = enviarAlerta.isPending || cooldown > 0
              return (
                <button key={t.key} onClick={() => { setAlertaError(''); enviarAlerta.mutate(t.key) }} disabled={disabled}
                  style={{
                    padding: '16px 12px', borderRadius: '14px', border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: disabled ? '#F0F0F0' : t.bg,
                    opacity: disabled ? 0.6 : 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  }}>
                  <span style={{ fontSize: '28px' }}>{t.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: disabled ? '#999' : t.color, fontFamily: "'Nunito', sans-serif" }}>{t.label}</span>
                  {cooldown > 0 && (
                    <span style={{ fontSize: '10px', color: '#999' }}>{cooldown}s</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Historial de alertas */}
          {misAlertas.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historial de alertas</div>
              {misAlertas.slice(0, 5).map(a => {
                const tipoInfo = TIPOS_ALERTA.find(ta => ta.key === a.tipo)
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8F8F8', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{tipoInfo?.icon || '?'}</span>
                      <span style={{ color: '#0D1117', fontWeight: 500 }}>{tipoInfo?.label || a.tipo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#5E6B62' }}>{tiempoRelativo(a.created_at)}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                        backgroundColor: a.atendida ? '#E8F4F0' : '#FEF9EC',
                        color: a.atendida ? '#1A7A4A' : '#C07A2E',
                      }}>
                        {a.atendida ? 'Atendida' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comunicados */}
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
