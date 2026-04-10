import { useState } from 'react'
import { useGuardias, useTurnos } from '@/hooks/useGuardias'

const TIPO_TURNO = [
  { key: 'manana', label: 'Mañana', hora: '06:00 — 14:00', color: '#C07A2E', bg: '#FEF9EC' },
  { key: 'tarde', label: 'Tarde', hora: '14:00 — 22:00', color: '#0D4A8F', bg: '#EBF4FF' },
  { key: 'noche', label: 'Noche', hora: '22:00 — 06:00', color: '#7B1AC8', bg: '#F5ECFF' },
]

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  programado: { bg: '#F0F0F0', text: '#5E6B62', label: 'Programado' },
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'En turno' },
  completado: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Completado' },
  ausente: { bg: '#FCEAEA', text: '#B83232', label: 'Ausente' },
}

interface Props { condominioId: string }

export default function GestionTurnos({ condominioId }: Props) {
  const { guardias } = useGuardias(condominioId)
  const { turnos, isLoading, crearTurno } = useTurnos(condominioId)
  const [guardiaId, setGuardiaId] = useState('')
  const [tipo, setTipo] = useState('manana')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const handleAsignar = async () => {
    if (!guardiaId || !fecha) return
    await crearTurno.mutateAsync({ guardia_id: guardiaId, tipo, fecha })
    setGuardiaId('')
  }

  const inputStyle = { padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white', outline: 'none' }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Gestión de Turnos</h2>

      {/* Assign form */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '12px' }}>Asignar turno</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <select value={guardiaId} onChange={e => setGuardiaId(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px' }}>
            <option value="">Guardia...</option>
            {guardias.filter(g => g.activo).map(g => <option key={g.id} value={g.id}>{g.nombre} {g.apellido}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
            {TIPO_TURNO.map(t => <option key={t.key} value={t.key}>{t.label} ({t.hora})</option>)}
          </select>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
          <button onClick={handleAsignar} disabled={!guardiaId || crearTurno.isPending} style={{
            padding: '10px 18px', backgroundColor: !guardiaId ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: !guardiaId ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}>{crearTurno.isPending ? '...' : 'Asignar'}</button>
        </div>
      </div>

      {/* Turnos list */}
      {turnos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>No hay turnos registrados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {turnos.map(t => {
            const tipoInfo = TIPO_TURNO.find(tt => tt.key === t.tipo) || TIPO_TURNO[0]
            const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE.programado
            return (
              <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '14px 20px', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117', fontSize: '14px' }}>
                    {(t.guardias as { nombre: string; apellido: string } | null)?.nombre} {(t.guardias as { nombre: string; apellido: string } | null)?.apellido}
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#5E6B62' }}>{t.fecha}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: tipoInfo.bg, color: tipoInfo.color }}>{tipoInfo.label}</span>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                  {t.horas_trabajadas && <span style={{ fontSize: '11px', color: '#1A7A4A', fontWeight: 600 }}>{Number(t.horas_trabajadas).toFixed(1)}h</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
