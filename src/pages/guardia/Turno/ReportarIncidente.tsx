import { useState } from 'react'
import { useIncidentes } from '@/hooks/useGuardias'

const TIPOS_INCIDENTE = [
  { key: 'robo_hurto', label: 'Robo/Hurto', icon: '🚨' },
  { key: 'vandalismo', label: 'Vandalismo', icon: '💥' },
  { key: 'pelea_altercado', label: 'Pelea/Altercado', icon: '⚠️' },
  { key: 'emergencia_medica', label: 'Emergencia Médica', icon: '🏥' },
  { key: 'incendio', label: 'Incendio', icon: '🔥' },
  { key: 'inundacion', label: 'Inundación', icon: '💧' },
  { key: 'visita_no_autorizada', label: 'Visita no autorizada', icon: '🚷' },
  { key: 'otro', label: 'Otro', icon: '📝' },
]

interface Props { turnoId: string; guardiaId: string; condominioId: string }

export default function ReportarIncidente({ turnoId, guardiaId, condominioId }: Props) {
  const { incidentes, crear } = useIncidentes(turnoId, guardiaId, condominioId)
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [personas, setPersonas] = useState('')
  const [acciones, setAcciones] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!tipo || !descripcion) return
    await crear.mutateAsync({ tipo, descripcion, personas_involucradas: personas || undefined, acciones_tomadas: acciones || undefined })
    setTipo(''); setDescripcion(''); setPersonas(''); setAcciones('')
    setSuccess(true); setTimeout(() => setSuccess(false), 3000)
  }

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '15px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#B83232', margin: '0 0 16px' }}>🚨 Reportar Incidente</h3>

        {success && (
          <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#1A7A4A', marginBottom: '16px' }}>
            Incidente registrado
          </div>
        )}

        {/* Tipo selector — big buttons for mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {TIPOS_INCIDENTE.map(t => (
            <button key={t.key} onClick={() => setTipo(t.key)} style={{
              padding: '12px 8px', borderRadius: '12px', border: tipo === t.key ? '2px solid #B83232' : '1px solid #C8D4CB',
              backgroundColor: tipo === t.key ? '#FCEAEA' : 'white', cursor: 'pointer', textAlign: 'center', fontSize: '12px', fontFamily: "'Inter', sans-serif", color: tipo === t.key ? '#B83232' : '#5E6B62',
            }}>
              <div style={{ fontSize: '20px' }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="¿Qué pasó?" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <input value={personas} onChange={e => setPersonas(e.target.value)} placeholder="Personas involucradas (opcional)" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <input value={acciones} onChange={e => setAcciones(e.target.value)} placeholder="Acciones tomadas (opcional)" style={inputStyle} />
        </div>

        <button onClick={handleSubmit} disabled={!tipo || !descripcion || crear.isPending} style={{
          width: '100%', padding: '14px', backgroundColor: (!tipo || !descripcion) ? '#C8D4CB' : '#B83232', color: 'white', border: 'none',
          borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!tipo || !descripcion) ? 'not-allowed' : 'pointer',
        }}>{crear.isPending ? 'Registrando...' : 'Registrar incidente'}</button>
      </div>

      {/* Incidentes log */}
      {incidentes.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <h4 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Incidentes del turno ({incidentes.length})</h4>
          {incidentes.map(inc => {
            const tipoInfo = TIPOS_INCIDENTE.find(t => t.key === inc.tipo)
            return (
              <div key={inc.id} style={{ padding: '10px 0', borderBottom: '1px solid #F0F0F0', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117' }}>{tipoInfo?.icon} {tipoInfo?.label || inc.tipo}</span>
                  <span style={{ fontSize: '11px', color: '#5E6B62' }}>{new Date(inc.hora_incidente).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#5E6B62', margin: '4px 0 0' }}>{inc.descripcion}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
