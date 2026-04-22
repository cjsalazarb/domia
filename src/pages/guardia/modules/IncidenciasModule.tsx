import { useState, useCallback } from 'react'
import { useIncidentes } from '@/hooks/useGuardias'
import { supabase } from '@/lib/supabase'
import CamaraCapture from '@/components/guardia/CamaraCapture'

interface Props {
  turnoId: string
  guardiaId: string
  condominioId: string
}

const TIPOS_INCIDENTE = [
  { key: 'robo_hurto', label: 'Robo/Hurto', icon: '🚨' },
  { key: 'vandalismo', label: 'Vandalismo', icon: '💥' },
  { key: 'pelea_altercado', label: 'Pelea/Altercado', icon: '⚠️' },
  { key: 'emergencia_medica', label: 'Emergencia Medica', icon: '🏥' },
  { key: 'incendio', label: 'Incendio', icon: '🔥' },
  { key: 'inundacion', label: 'Inundacion', icon: '💧' },
  { key: 'visita_no_autorizada', label: 'Visita no autorizada', icon: '🚷' },
  { key: 'otro', label: 'Otro', icon: '📝' },
]

const URGENCIAS = [
  { key: 'normal', label: 'Normal', color: '#5E6B62', bg: '#F4F7F5' },
  { key: 'urgente', label: 'Urgente', color: '#E65100', bg: '#FFF3E0' },
  { key: 'emergencia', label: 'Emergencia', color: '#B83232', bg: '#FCEAEA' },
]

export default function IncidenciasModule({ turnoId, guardiaId, condominioId }: Props) {
  const { incidentes, crear } = useIncidentes(turnoId, guardiaId, condominioId)

  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [urgencia, setUrgencia] = useState('normal')
  const [fotos, setFotos] = useState<Blob[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])
  const [capturandoFoto, setCapturandoFoto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(false)

  const resetForm = useCallback(() => {
    setTipo('')
    setDescripcion('')
    setUrgencia('normal')
    setFotos([])
    fotoPreviews.forEach((u) => URL.revokeObjectURL(u))
    setFotoPreviews([])
  }, [fotoPreviews])

  const handleFotoCapture = (blob: Blob) => {
    setCapturandoFoto(false)
    if (fotos.length >= 3) return
    setFotos((prev) => [...prev, blob])
    setFotoPreviews((prev) => [...prev, URL.createObjectURL(blob)])
  }

  const removeFoto = (index: number) => {
    URL.revokeObjectURL(fotoPreviews[index])
    setFotos((prev) => prev.filter((_, i) => i !== index))
    setFotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!tipo || !descripcion.trim()) return
    setEnviando(true)

    try {
      // Upload photos
      const fotosUrls: string[] = []
      for (const foto of fotos) {
        const timestamp = Date.now() + Math.random().toString(36).slice(2, 6)
        const path = `incidentes/${timestamp}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from('comprobantes')
          .upload(path, foto, { contentType: 'image/jpeg' })
        if (uploadErr) {
          console.error('Upload error:', uploadErr)
          continue
        }
        const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
        fotosUrls.push(urlData.publicUrl)
      }

      await crear.mutateAsync({
        tipo,
        descripcion: descripcion.trim(),
        acciones_tomadas: urgencia !== 'normal' ? `Urgencia: ${urgencia}` : undefined,
        foto_url: fotosUrls.length > 0 ? fotosUrls.join(',') : undefined,
      })

      resetForm()
      setShowForm(false)
      setConfirmacion(true)
      setTimeout(() => setConfirmacion(false), 3000)
    } catch (err) {
      console.error('Error creating incident:', err)
    } finally {
      setEnviando(false)
    }
  }

  if (capturandoFoto) {
    return (
      <CamaraCapture
        facing="environment"
        onCapture={handleFotoCapture}
        onCancel={() => setCapturandoFoto(false)}
      />
    )
  }

  const canSubmit = tipo && descripcion.trim().length > 0 && !enviando

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Confirmation banner */}
      {confirmacion && (
        <div
          style={{
            backgroundColor: '#E8F4F0',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#1A7A4A',
              margin: 0,
            }}
          >
            Reporte enviado
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#5E6B62', margin: '4px 0 0' }}>
            El administrador ha sido notificado
          </p>
        </div>
      )}

      {/* Report button (when form is closed) */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            minHeight: 56,
            padding: '16px 24px',
            backgroundColor: '#B83232',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(184,50,50,0.25)',
            marginBottom: 20,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          REPORTAR INCIDENCIA
        </button>
      )}

      {/* Form overlay */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '92vh',
              backgroundColor: '#F4F7F5',
              borderRadius: '24px 24px 0 0',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                padding: '20px 20px 16px',
                borderBottom: '1px solid #F0F0F0',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#B83232',
                  margin: 0,
                }}
              >
                Reportar Incidencia
              </h3>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#F4F7F5',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Cerrar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5E6B62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Tipo selector */}
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0D1B2A',
                  marginBottom: 8,
                }}
              >
                Tipo de incidente
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {TIPOS_INCIDENTE.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTipo(t.key)}
                    style={{
                      minHeight: 48,
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: tipo === t.key ? '2px solid #B83232' : '1px solid #C8D4CB',
                      backgroundColor: tipo === t.key ? '#FCEAEA' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: 12,
                      fontFamily: "'Inter', sans-serif",
                      color: tipo === t.key ? '#B83232' : '#5E6B62',
                      fontWeight: tipo === t.key ? 700 : 400,
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 2 }}>{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Descripcion */}
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0D1B2A',
                  marginBottom: 8,
                }}
              >
                Descripcion
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Describe lo que paso..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #C8D4CB',
                  borderRadius: 10,
                  fontSize: 16,
                  color: '#0D1B2A',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  marginBottom: 20,
                }}
              />

              {/* Urgencia */}
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0D1B2A',
                  marginBottom: 8,
                }}
              >
                Urgencia
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {URGENCIAS.map((u) => {
                  const selected = urgencia === u.key
                  const isEmergencia = u.key === 'emergencia' && selected
                  return (
                    <button
                      key={u.key}
                      onClick={() => setUrgencia(u.key)}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        padding: '10px 8px',
                        borderRadius: 12,
                        border: selected ? `2px solid ${u.color}` : '1px solid #C8D4CB',
                        backgroundColor: selected ? u.bg : 'white',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selected ? 700 : 500,
                        fontFamily: "'Inter', sans-serif",
                        color: selected ? u.color : '#5E6B62',
                        animation: isEmergencia ? 'pulse-border 1.5s ease-in-out infinite' : 'none',
                      }}
                    >
                      {u.label}
                    </button>
                  )
                })}
              </div>

              {/* Fotos */}
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0D1B2A',
                  marginBottom: 8,
                }}
              >
                Fotos ({fotos.length}/3)
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {fotoPreviews.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid #C8D4CB',
                      }}
                    />
                    <button
                      onClick={() => removeFoto(i)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#B83232',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      aria-label="Quitar foto"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                {fotos.length < 3 && (
                  <button
                    onClick={() => setCapturandoFoto(true)}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10,
                      border: '2px dashed #C8D4CB',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      color: '#5E6B62',
                      fontSize: 11,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5E6B62" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Foto
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  minHeight: 52,
                  padding: '14px 24px',
                  backgroundColor: canSubmit ? '#B83232' : '#C8D4CB',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 17,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  boxShadow: canSubmit ? '0 4px 16px rgba(184,50,50,0.25)' : 'none',
                  marginBottom: 20,
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident list */}
      {incidentes.length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#0D1B2A',
              margin: '0 0 12px',
            }}
          >
            Incidentes del turno ({incidentes.length})
          </h3>
          {incidentes.map((inc) => {
            const tipoInfo = TIPOS_INCIDENTE.find((t) => t.key === inc.tipo)
            // Derive urgency from acciones_tomadas field (where we store it)
            const urgenciaStr = inc.acciones_tomadas?.includes('urgente')
              ? 'urgente'
              : inc.acciones_tomadas?.includes('emergencia')
                ? 'emergencia'
                : 'normal'
            const urgInfo = URGENCIAS.find((u) => u.key === urgenciaStr) || URGENCIAS[0]

            return (
              <div
                key={inc.id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid #F0F0F0',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 22 }}>{tipoInfo?.icon || '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1B2A' }}>
                        {tipoInfo?.label || inc.tipo}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: '#5E6B62',
                          margin: '2px 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 200,
                        }}
                      >
                        {inc.descripcion}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#5E6B62',
                      }}
                    >
                      {new Date(inc.hora_incidente).toLocaleTimeString('es-BO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {urgenciaStr !== 'normal' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: urgInfo.color,
                          backgroundColor: urgInfo.bg,
                          padding: '2px 8px',
                          borderRadius: 8,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {urgInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {incidentes.length === 0 && !showForm && !confirmacion && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            color: '#5E6B62',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C8D4CB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 12 15 16 10" />
          </svg>
          <p style={{ margin: 0 }}>Sin incidentes en este turno</p>
        </div>
      )}

      {/* Pulse animation for emergency button */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(184, 50, 50, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(184, 50, 50, 0); }
        }
      `}</style>
    </div>
  )
}
