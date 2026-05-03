import { useState, useEffect, useCallback } from 'react'
import { useMiTurno } from '@/hooks/useGuardias'
import { useMarcaciones } from '@/hooks/useMarcaciones'
import CamaraCapture from '@/components/guardia/CamaraCapture'

interface Props {
  guardiaId: string
  condominioId: string
}

const TURNO_LABELS: Record<string, string> = {
  manana: 'Manana',
  tarde: 'Tarde',
  noche: 'Noche',
}

function formatTime(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

function LiveTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    const start = new Date(since).getTime()
    const tick = () => {
      const diff = Math.max(0, Date.now() - start)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [since])

  return <span>{elapsed}</span>
}

export default function TurnoModule({ guardiaId, condominioId }: Props) {
  const { turnoActual, isLoading, iniciar, finalizar, historial } = useMiTurno(guardiaId)
  const { registrar } = useMarcaciones(guardiaId, condominioId)

  const [capturando, setCapturando] = useState(false)
  const [tipoMarcacion, setTipoMarcacion] = useState<'entrada' | 'salida'>('entrada')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<{ text: string; color: string } | null>(null)
  const [gpsWarning, setGpsWarning] = useState(false)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  const showMsg = useCallback((text: string, color: string) => {
    setMensaje({ text, color })
    setTimeout(() => setMensaje(null), 4000)
  }, [])

  const handleBotonEntrada = () => {
    setTipoMarcacion('entrada')
    setCapturando(true)
  }

  const handleBotonSalida = () => {
    setTipoMarcacion('salida')
    setCapturando(true)
  }

  const handleCapture = async (blob: Blob) => {
    setCapturando(false)
    setProcesando(true)
    setGpsWarning(false)
    setSelfiePreview(null)

    // Create preview URL from blob
    const previewUrl = URL.createObjectURL(blob)

    let latitud: number | undefined
    let longitud: number | undefined

    // GPS non-blocking — fail fast, never block the flow
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('GPS timeout')), 5000)
        navigator.geolocation.getCurrentPosition(
          (p) => { clearTimeout(timer); resolve(p) },
          (e) => { clearTimeout(timer); reject(e) },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        )
      })
      latitud = pos.coords.latitude
      longitud = pos.coords.longitude
    } catch {
      setGpsWarning(true)
      // Continue with null coords — don't block entry
    }

    try {
      if (tipoMarcacion === 'entrada' && turnoActual) {
        await iniciar.mutateAsync(turnoActual.id)
        await registrar.mutateAsync({
          tipo: 'entrada',
          foto: blob,
          latitud,
          longitud,
          turno_id: turnoActual.id,
        })
        setSelfiePreview(previewUrl)
        showMsg('Entrada registrada correctamente', '#1A7A4A')
      } else if (tipoMarcacion === 'salida' && turnoActual) {
        await finalizar.mutateAsync(turnoActual.id)
        await registrar.mutateAsync({
          tipo: 'salida',
          foto: blob,
          latitud,
          longitud,
          turno_id: turnoActual.id,
        })
        setSelfiePreview(previewUrl)
        showMsg('Salida registrada correctamente', '#1A7A4A')
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error al registrar marcación'
      showMsg(errMsg, '#B83232')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  if (capturando) {
    return <CamaraCapture facing="user" onCapture={handleCapture} onCancel={() => setCapturando(false)} />
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", fontSize: 16 }}>
        Cargando turno...
      </div>
    )
  }

  const esActivo = turnoActual?.estado === 'activo'
  const esProgramado = turnoActual?.estado === 'programado'
  const historialSlice = historial.slice(0, 5)

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* GPS warning banner */}
      {gpsWarning && (
        <div
          style={{
            backgroundColor: '#FFF3E0',
            border: '1px solid #FFB74D',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: '#E65100',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Parece que no estas en el condominio</span>
        </div>
      )}

      {/* Success / error message with selfie preview */}
      {mensaje && (
        <div
          style={{
            backgroundColor: mensaje.color === '#1A7A4A' ? '#E8F4F0' : '#FCEAEA',
            borderLeft: `3px solid ${mensaje.color}`,
            borderRadius: 12,
            padding: '16px',
            marginBottom: 16,
            fontSize: 14,
            color: mensaje.color,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          }}
        >
          <div>{mensaje.color === '#1A7A4A' ? '\u2713 ' : ''}{mensaje.text}</div>
          {selfiePreview && mensaje.color === '#1A7A4A' && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <img
                src={selfiePreview}
                alt="Selfie de marcación"
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', border: '2px solid #1A7A4A' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Processing overlay */}
      {procesando && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '48px 24px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1s linear infinite' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#5E6B62' }}>
            Registrando {tipoMarcacion}...
          </p>
        </div>
      )}

      {/* Main turno card */}
      {!procesando && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '32px 24px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {!turnoActual || (!esProgramado && !esActivo) ? (
            /* No turno */
            <div>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C8D4CB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0D1B2A',
                  margin: '0 0 8px',
                }}
              >
                Sin turno activo
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#5E6B62', margin: 0 }}>
                No tienes un turno asignado para hoy.
              </p>
            </div>
          ) : esProgramado ? (
            /* Programado: show MARCAR ENTRADA */
            <div>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#F4F7F5',
                  padding: '6px 16px',
                  borderRadius: 20,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: '#5E6B62',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Turno {TURNO_LABELS[turnoActual.tipo] || turnoActual.tipo} &middot;{' '}
                  {turnoActual.hora_programada_inicio?.slice(0, 5)} &mdash;{' '}
                  {turnoActual.hora_programada_fin?.slice(0, 5)}
                </span>
              </div>

              <button
                onClick={handleBotonEntrada}
                disabled={iniciar.isPending}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: 320,
                  minHeight: 64,
                  padding: '20px 24px',
                  margin: '0 auto',
                  backgroundColor: iniciar.isPending ? '#5E6B62' : '#1A7A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 20,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: iniciar.isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(26,122,74,0.3)',
                  letterSpacing: 0.5,
                }}
              >
                MARCAR ENTRADA
              </button>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: '#5E6B62',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Se tomara una selfie y ubicacion GPS
              </p>
            </div>
          ) : esActivo ? (
            /* Activo: timer + MARCAR SALIDA */
            <div>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#E8F4F0',
                  padding: '6px 16px',
                  borderRadius: 20,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: '#1A7A4A',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  ● Turno activo desde las {formatTime(turnoActual.hora_real_inicio)}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 56,
                  fontWeight: 800,
                  color: '#1A7A4A',
                  letterSpacing: -2,
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                <LiveTimer since={turnoActual.hora_real_inicio!} />
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#5E6B62',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: 24,
                }}
              >
                Programado: {turnoActual.hora_programada_inicio?.slice(0, 5)} &mdash;{' '}
                {turnoActual.hora_programada_fin?.slice(0, 5)}
              </div>

              <button
                onClick={handleBotonSalida}
                disabled={finalizar.isPending}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: 320,
                  minHeight: 64,
                  padding: '20px 24px',
                  margin: '0 auto',
                  backgroundColor: finalizar.isPending ? '#5E6B62' : '#B83232',
                  color: 'white',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 20,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: finalizar.isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(184,50,50,0.3)',
                  letterSpacing: 0.5,
                }}
              >
                MARCAR SALIDA
              </button>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: '#5E6B62',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Se tomara una selfie y ubicacion GPS
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Historial section */}
      {historialSlice.length > 0 && (
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
            Ultimos turnos
          </h3>
          {historialSlice.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #F0F0F0',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: '#0D1B2A', fontWeight: 600 }}>{t.fecha}</div>
                <div style={{ fontSize: 12, color: '#5E6B62', marginTop: 2 }}>
                  {TURNO_LABELS[t.tipo] || t.tipo} &middot; {formatTime(t.hora_real_inicio)} &mdash;{' '}
                  {formatTime(t.hora_real_fin)}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: '#1A7A4A',
                  backgroundColor: '#E8F4F0',
                  padding: '4px 10px',
                  borderRadius: 10,
                }}
              >
                {t.horas_trabajadas ? `${Number(t.horas_trabajadas).toFixed(1)}h` : '--'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
