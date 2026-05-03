import { useRef, useEffect, useCallback, useState } from 'react'

interface CamaraCaptureProps {
  onCapture: (blob: Blob) => void
  onCancel: () => void
  facing?: 'user' | 'environment'
}

export default function CamaraCapture({ onCapture, onCancel, facing = 'environment' }: CamaraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true)
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No se encontró una cámara en este dispositivo')
        } else {
          setCameraError('Error al acceder a la cámara: ' + (err.message || err.name))
        }
      }
    }

    start()

    return () => {
      cancelled = true
      stopStream()
    }
  }, [facing, stopStream])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          stopStream()
          onCapture(blob)
        }
      },
      'image/jpeg',
      0.85,
    )
  }, [onCapture, stopStream])

  const handleCancel = useCallback(() => {
    stopStream()
    onCancel()
  }, [onCancel, stopStream])

  // Permission denied or error screen
  if (permissionDenied || cameraError) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center',
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <p style={{ color: 'white', fontSize: 18, fontWeight: 700, fontFamily: "'Nunito', sans-serif", marginBottom: 8 }}>
          {permissionDenied ? 'Cámara bloqueada' : 'Error de cámara'}
        </p>
        <p style={{ color: '#aaa', fontSize: 14, fontFamily: "'Inter', sans-serif", lineHeight: 1.5, maxWidth: 300 }}>
          {permissionDenied
            ? 'Por favor permite el acceso a la cámara para continuar. Revisa los permisos en la configuración de tu navegador.'
            : cameraError}
        </p>
        <button onClick={handleCancel} style={{
          marginTop: 24, padding: '14px 32px', backgroundColor: '#333', color: 'white',
          border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}>Volver</button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Cancel button */}
      <button
        onClick={handleCancel}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 201,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
        aria-label="Cancelar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Capture button */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <button
          onClick={handleCapture}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#FFFFFF',
            border: '4px solid rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.1s',
          }}
          onPointerDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)')}
          onPointerUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          aria-label="Capturar foto"
        />
      </div>
    </div>
  )
}
