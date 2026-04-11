import { useState, useEffect } from 'react'
import type { Turno } from '@/hooks/useGuardias'

interface Props {
  turno: Turno | null
  isLoading: boolean
  historial: Turno[]
  onIniciar: (turnoId: string) => void
  onFinalizar: (turnoId: string) => void
  iniciando: boolean
  finalizando: boolean
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

function Timer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const start = new Date(since).getTime()
    const tick = () => {
      const diff = Date.now() - start
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [since])

  return <span>{elapsed}</span>
}

export default function MiTurno({ turno, isLoading, historial, onIniciar, onFinalizar, iniciando, finalizando }: Props) {
  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '60px 24px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando turno...</div>
  }

  return (
    <div>
      {/* Current shift */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 24px', marginBottom: '20px', textAlign: 'center' }}>
        {!turno ? (
          /* No shift today */
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
              Sin turno programado
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62' }}>
              No tienes un turno asignado para hoy.
            </p>
          </div>
        ) : turno.estado === 'programado' ? (
          /* Shift scheduled — show start button */
          <div>
            <div style={{ fontSize: '14px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", marginBottom: '8px' }}>
              Turno programado · {turno.hora_programada_inicio?.slice(0,5)} — {turno.hora_programada_fin?.slice(0,5)}
            </div>
            <button
              onClick={() => onIniciar(turno.id)}
              disabled={iniciando}
              style={{
                width: '100%',
                maxWidth: '280px',
                padding: '24px',
                backgroundColor: iniciando ? '#5E6B62' : '#1A7A4A',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '20px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: iniciando ? 'not-allowed' : 'pointer',
                marginTop: '12px',
                boxShadow: '0 4px 16px rgba(26,122,74,0.3)',
              }}
            >
              {iniciando ? 'Iniciando...' : '▶ Iniciar Turno'}
            </button>
          </div>
        ) : turno.estado === 'activo' ? (
          /* Shift active — timer + end */
          <div>
            <div style={{ display: 'inline-block', backgroundColor: '#E8F4F0', padding: '6px 16px', borderRadius: '20px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#1A7A4A', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>● Turno activo desde las {formatTime(turno.hora_real_inicio)}</span>
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '56px', fontWeight: 800, color: '#1A7A4A', letterSpacing: '-2px', lineHeight: 1 }}>
              <Timer since={turno.hora_real_inicio!} />
            </div>
            <div style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", marginTop: '8px' }}>
              Programado: {turno.hora_programada_inicio?.slice(0,5)} — {turno.hora_programada_fin?.slice(0,5)}
            </div>
            <button onClick={() => onFinalizar(turno.id)} disabled={finalizando}
              style={{ width: '100%', maxWidth: '280px', padding: '20px', backgroundColor: finalizando ? '#5E6B62' : '#B83232', color: 'white', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: finalizando ? 'not-allowed' : 'pointer', marginTop: '24px', boxShadow: '0 4px 16px rgba(184,50,50,0.3)' }}>
              {finalizando ? 'Finalizando...' : '⏹ Finalizar Turno'}
            </button>
          </div>
        ) : turno.estado === 'completado' ? (
          /* Shift completed — summary */
          <div>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#1A7A4A', margin: '0 0 8px' }}>Turno completado</h2>
            <div style={{ backgroundColor: '#E8F4F0', borderRadius: '16px', padding: '20px', display: 'inline-block', marginBottom: '12px' }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '36px', fontWeight: 800, color: '#1A7A4A' }}>
                {turno.horas_trabajadas ? `${Math.floor(Number(turno.horas_trabajadas))}h ${Math.round((Number(turno.horas_trabajadas) % 1) * 60)}m` : '—'}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62', marginTop: '4px' }}>trabajadas hoy</div>
            </div>
            <div style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>
              {formatTime(turno.hora_real_inicio)} — {formatTime(turno.hora_real_fin)}
            </div>
          </div>
        ) : null}
      </div>

      {/* History */}
      {historial.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Últimos turnos</h3>
          {historial.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F0', fontFamily: "'Inter', sans-serif" }}>
              <div>
                <div style={{ fontSize: '13px', color: '#0D1117', fontWeight: 600 }}>{t.fecha}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>{formatTime(t.hora_real_inicio)} — {formatTime(t.hora_real_fin)}</div>
              </div>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px', color: '#1A7A4A' }}>
                {t.horas_trabajadas ? `${Number(t.horas_trabajadas).toFixed(1)}h` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
