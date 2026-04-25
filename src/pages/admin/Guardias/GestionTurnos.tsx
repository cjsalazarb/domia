import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function GestionTurnos({ condominioId }: Props) {
  const { guardias } = useGuardias(condominioId)
  const { turnos, isLoading, crearTurno, crearTurnosBatch, eliminarTurno } = useTurnos(condominioId)
  const [guardiaId, setGuardiaId] = useState('')
  const [tipo, setTipo] = useState('manana')
  const [fechaInicio, setFechaInicio] = useState(formatLocalDate(new Date()))
  const [fechaFin, setFechaFin] = useState(formatLocalDate(new Date()))
  const [formError, setFormError] = useState('')
  const [asignando, setAsignando] = useState(false)
  // Conflict modal state
  const [conflicto, setConflicto] = useState<{ fechasConflicto: string[]; fechasLibres: string[]; todasFechas: string[]; guardiaNombre: string } | null>(null)
  // Delete turno confirmation
  const [confirmDeleteTurno, setConfirmDeleteTurno] = useState<any>(null)

  // Weekly summary data — use local dates (Bolivia UTC-4)
  const semana = useMemo(() => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
    const dias: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      dias.push(formatLocalDate(d))
    }
    return dias
  }, [])

  const turnosSemana = useMemo(() => {
    const map = new Map<string, Map<string, string>>() // guardiaId -> fecha -> tipo
    for (const t of turnos) {
      if (semana.includes(t.fecha)) {
        if (!map.has(t.guardia_id)) map.set(t.guardia_id, new Map())
        map.get(t.guardia_id)!.set(t.fecha, t.tipo)
      }
    }
    return map
  }, [turnos, semana])

  const guardiasActivos = guardias.filter(g => g.activo)

  // Incidentes recientes
  const { data: incidentes } = useQuery({
    queryKey: ['incidentes-recientes', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes')
        .select('*, guardias(nombre, apellido)')
        .eq('condominio_id', condominioId)
        .order('hora_incidente', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as Array<{
        id: string; tipo: string; descripcion: string; hora_incidente: string; created_at: string;
        guardias: { nombre: string; apellido: string } | null
      }>
    },
    enabled: !!condominioId,
  })

  function generarRangoFechas(inicio: string, fin: string): string[] {
    const fechas: string[] = []
    const d = new Date(inicio + 'T12:00')
    const end = new Date(fin + 'T12:00')
    while (d <= end) {
      fechas.push(formatLocalDate(d))
      d.setDate(d.getDate() + 1)
    }
    return fechas
  }

  const handleAsignar = async () => {
    if (!guardiaId || !fechaInicio || !fechaFin) return
    setFormError('')

    // Validation 1: fin >= inicio
    if (fechaFin < fechaInicio) {
      setFormError('La fecha fin debe ser posterior a la fecha inicio')
      return
    }

    // Validation 2: max 31 days
    const dias = generarRangoFechas(fechaInicio, fechaFin)
    if (dias.length > 31) {
      setFormError('El rango maximo es de 31 dias')
      return
    }

    // Check conflicts
    const turnosGuardia = turnos.filter(t => t.guardia_id === guardiaId)
    const fechasOcupadas = new Set(turnosGuardia.map(t => t.fecha))
    const fechasConflicto = dias.filter(d => fechasOcupadas.has(d))
    const fechasLibres = dias.filter(d => !fechasOcupadas.has(d))

    if (fechasConflicto.length > 0) {
      const g = guardias.find(g => g.id === guardiaId)
      setConflicto({
        fechasConflicto,
        fechasLibres,
        todasFechas: dias,
        guardiaNombre: g ? `${g.nombre} ${g.apellido}` : '',
      })
      return
    }

    // No conflicts — insert all
    setAsignando(true)
    try {
      if (dias.length === 1) {
        await crearTurno.mutateAsync({ guardia_id: guardiaId, tipo, fecha: dias[0] })
      } else {
        await crearTurnosBatch.mutateAsync({ guardia_id: guardiaId, tipo, fechas: dias })
      }
      setGuardiaId('')
    } catch (err: any) {
      setFormError(err?.message || 'Error al asignar turnos')
    } finally {
      setAsignando(false)
    }
  }

  const handleConflictoSobreescribir = async () => {
    if (!conflicto) return
    setAsignando(true)
    setConflicto(null)
    try {
      await crearTurnosBatch.mutateAsync({
        guardia_id: guardiaId, tipo,
        fechas: conflicto.todasFechas,
        sobreescribir: conflicto.fechasConflicto,
      })
      setGuardiaId('')
    } catch (err: any) {
      setFormError(err?.message || 'Error al asignar turnos')
    } finally {
      setAsignando(false)
    }
  }

  const handleConflictoSaltar = async () => {
    if (!conflicto) return
    setConflicto(null)
    if (conflicto.fechasLibres.length === 0) return
    setAsignando(true)
    try {
      if (conflicto.fechasLibres.length === 1) {
        await crearTurno.mutateAsync({ guardia_id: guardiaId, tipo, fecha: conflicto.fechasLibres[0] })
      } else {
        await crearTurnosBatch.mutateAsync({ guardia_id: guardiaId, tipo, fechas: conflicto.fechasLibres })
      }
      setGuardiaId('')
    } catch (err: any) {
      setFormError(err?.message || 'Error al asignar turnos')
    } finally {
      setAsignando(false)
    }
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
          <select value={guardiaId} onChange={e => { setGuardiaId(e.target.value); setFormError('') }} style={{ ...inputStyle, flex: 1, minWidth: '150px' }}>
            <option value="">Guardia...</option>
            {guardias.filter(g => g.activo).map(g => <option key={g.id} value={g.id}>{g.nombre} {g.apellido}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
            {TIPO_TURNO.map(t => <option key={t.key} value={t.key}>{t.label} ({t.hora})</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>Desde</span>
            <input type="date" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setFormError('') }} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>Hasta</span>
            <input type="date" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setFormError('') }} style={inputStyle} />
          </div>
          <button onClick={handleAsignar} disabled={!guardiaId || asignando} style={{
            padding: '10px 18px', backgroundColor: (!guardiaId || asignando) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!guardiaId || asignando) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}>{asignando ? 'Asignando...' : 'Asignar'}</button>
        </div>
        {formError && (
          <div style={{ marginTop: '10px', backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#B83232', fontFamily: "'Inter', sans-serif" }}>
            {formError}
          </div>
        )}
      </div>

      {/* Conflict modal */}
      {conflicto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConflicto(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#C07A2E', margin: '0 0 12px' }}>Turnos existentes</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 8px', lineHeight: 1.5 }}>
              <strong>{conflicto.guardiaNombre}</strong> ya tiene turno en:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {conflicto.fechasConflicto.map(f => {
                const d = new Date(f + 'T12:00')
                return (
                  <span key={f} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: '#FEF9EC', color: '#C07A2E', fontFamily: "'Inter', sans-serif" }}>
                    {d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })}
                  </span>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleConflictoSobreescribir} style={{ padding: '10px 18px', backgroundColor: '#C07A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Sobreescribir</button>
              <button onClick={handleConflictoSaltar} disabled={conflicto.fechasLibres.length === 0} style={{ padding: '10px 18px', backgroundColor: conflicto.fechasLibres.length === 0 ? '#C8D4CB' : '#0D4A8F', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: conflicto.fechasLibres.length === 0 ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                Saltar ese{conflicto.fechasConflicto.length !== 1 ? 's' : ''} dia{conflicto.fechasConflicto.length !== 1 ? 's' : ''}{conflicto.fechasLibres.length > 0 ? ` (asignar ${conflicto.fechasLibres.length} restante${conflicto.fechasLibres.length !== 1 ? 's' : ''})` : ' (no quedan dias libres)'}
              </button>
              <button onClick={() => setConflicto(null)} style={{ padding: '10px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly summary */}
      {guardiasActivos.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', marginBottom: '20px', overflow: 'auto' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '12px' }}>Vista semanal</div>
          <div style={{ minWidth: '600px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(7, 1fr)', gap: '1px', backgroundColor: '#F0F0F0', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ backgroundColor: '#F4F7F5', padding: '8px 12px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62' }}>Guardia</div>
              {semana.map(d => {
                const date = new Date(d + 'T12:00')
                const isToday = d === formatLocalDate(new Date())
                return (
                  <div key={d} style={{ backgroundColor: isToday ? '#E8F4F0' : '#F4F7F5', padding: '8px 4px', textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, color: isToday ? '#1A7A4A' : '#5E6B62' }}>
                    {date.toLocaleDateString('es-BO', { weekday: 'short' }).toUpperCase()}
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isToday ? '#1A7A4A' : '#0D1117', marginTop: '2px' }}>{date.getDate()}</div>
                  </div>
                )
              })}

              {/* Rows */}
              {guardiasActivos.map(g => (
                <>
                  <div key={`name-${g.id}`} style={{ backgroundColor: 'white', padding: '10px 12px', fontFamily: "'Nunito', sans-serif", fontSize: '13px', fontWeight: 700, color: '#0D1117', display: 'flex', alignItems: 'center' }}>
                    {g.nombre} {g.apellido}
                  </div>
                  {semana.map(d => {
                    const turnoTipo = turnosSemana.get(g.id)?.get(d)
                    const tipoInfo = turnoTipo ? TIPO_TURNO.find(tt => tt.key === turnoTipo) : null
                    return (
                      <div key={`${g.id}-${d}`} style={{ backgroundColor: 'white', padding: '8px 4px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tipoInfo ? (
                          <span style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, backgroundColor: tipoInfo.bg, color: tipoInfo.color, fontFamily: "'Inter', sans-serif" }}>
                            {tipoInfo.label}
                          </span>
                        ) : (
                          <span style={{ color: '#C8D4CB', fontSize: '12px' }}>—</span>
                        )}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  <button onClick={() => setConfirmDeleteTurno(t)} style={{ padding: '3px 8px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete turno confirmation modal */}
      {confirmDeleteTurno && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirmDeleteTurno(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>Eliminar turno</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿Eliminar el turno de <strong>{(confirmDeleteTurno.guardias as any)?.nombre} {(confirmDeleteTurno.guardias as any)?.apellido}</strong> del <strong>{confirmDeleteTurno.fecha}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmDeleteTurno(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={async () => { await eliminarTurno.mutateAsync(confirmDeleteTurno.id); setConfirmDeleteTurno(null) }} style={{ padding: '8px 18px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Incidentes Recientes */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Incidentes Recientes</h3>
        {!incidentes || incidentes.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '30px', textAlign: 'center', color: '#5E6B62', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
            No hay incidentes registrados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {incidentes.map(inc => {
              const fechaInc = new Date(inc.hora_incidente)
              return (
                <div key={inc.id} style={{
                  backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  padding: '14px 20px', fontFamily: "'Inter', sans-serif", borderLeft: '3px solid #B83232',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                        fontWeight: 600, backgroundColor: '#FCEAEA', color: '#B83232', marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}>
                        {inc.tipo}
                      </span>
                      <div style={{ fontSize: '13px', color: '#0D1117', lineHeight: 1.5 }}>
                        {inc.descripcion}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D1117' }}>
                        {fechaInc.toLocaleDateString('es-BO')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#5E6B62' }}>
                        {fechaInc.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '6px' }}>
                    Reportado por: <span style={{ fontWeight: 600, color: '#0D1117' }}>
                      {inc.guardias?.nombre} {inc.guardias?.apellido}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
