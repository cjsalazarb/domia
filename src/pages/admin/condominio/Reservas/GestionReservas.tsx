import { useState, useMemo } from 'react'
import { useReservas } from '@/hooks/useReservas'
import { useAuthStore } from '@/stores/authStore'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  aprobada: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Aprobada' },
  rechazada: { bg: '#FCEAEA', text: '#B83232', label: 'Rechazada' },
  cancelada: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelada' },
}

interface Props { condominioId: string }

const AREA_COLORS = ['#1A7A4A', '#0D4A8F', '#C07A2E', '#7B1AC8', '#B83232', '#2E8B8B']

export default function GestionReservas({ condominioId }: Props) {
  const { user } = useAuthStore()
  const { reservas, isLoading, aprobar, rechazar } = useReservas(condominioId)
  const [filtro, setFiltro] = useState<string>('pendiente')
  const [rechazandoId, setRechazandoId] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista')
  const [calMes, setCalMes] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const filtradas = filtro === 'todos' ? reservas : reservas.filter(r => r.estado === filtro)

  // Calendar data
  const areaColorMap = useMemo(() => {
    const map = new Map<string, string>()
    const areaNames = [...new Set(reservas.map(r => (r.areas_comunes as { nombre: string } | null)?.nombre || ''))]
    areaNames.forEach((name, i) => map.set(name, AREA_COLORS[i % AREA_COLORS.length]))
    return map
  }, [reservas])

  const reservasPorFecha = useMemo(() => {
    const map = new Map<string, typeof reservas>()
    for (const r of reservas.filter(r => r.estado === 'pendiente' || r.estado === 'aprobada')) {
      const list = map.get(r.fecha) || []
      list.push(r)
      map.set(r.fecha, list)
    }
    return map
  }, [reservas])

  const diasMes = useMemo(() => {
    const { year, month } = calMes
    const first = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0).getDate()
    const startDow = first.getDay()
    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay; d++) days.push(d)
    return days
  }, [calMes])

  const reservasDelDia = diaSeleccionado ? (reservasPorFecha.get(diaSeleccionado) || []) : []

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Gestion de Reservas</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{reservas.filter(r => r.estado === 'pendiente').length} pendiente{reservas.filter(r => r.estado === 'pendiente').length !== 1 ? 's' : ''} de aprobacion</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F0F0F0', borderRadius: '10px', padding: '3px' }}>
          <button onClick={() => setVista('lista')} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600,
            fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            backgroundColor: vista === 'lista' ? 'white' : 'transparent', color: vista === 'lista' ? '#0D1117' : '#5E6B62',
            boxShadow: vista === 'lista' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>Lista</button>
          <button onClick={() => setVista('calendario')} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600,
            fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            backgroundColor: vista === 'calendario' ? 'white' : 'transparent', color: vista === 'calendario' ? '#0D1117' : '#5E6B62',
            boxShadow: vista === 'calendario' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>Calendario</button>
        </div>
      </div>

      {/* Calendar view */}
      {vista === 'calendario' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => setCalMes(p => { const d = new Date(p.year, p.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#1A7A4A', padding: '4px 10px' }}>‹</button>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '17px', fontWeight: 700, color: '#0D1117' }}>
                {new Date(calMes.year, calMes.month).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCalMes(p => { const d = new Date(p.year, p.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#1A7A4A', padding: '4px 10px' }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '6px' }}>
              {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                <span key={d} style={{ fontSize: '11px', fontWeight: 600, color: '#5E6B62', fontFamily: "'Inter', sans-serif", padding: '6px 0' }}>{d}</span>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {diasMes.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />
                const dateStr = `${calMes.year}-${String(calMes.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const diaReservas = reservasPorFecha.get(dateStr) || []
                const isSelected = diaSeleccionado === dateStr
                const todayStr = new Date().toISOString().split('T')[0]
                const isToday = dateStr === todayStr

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDiaSeleccionado(isSelected ? null : dateStr)}
                    style={{
                      minHeight: '56px', borderRadius: '10px', border: isToday ? '2px solid #1A7A4A' : isSelected ? '2px solid #0D4A8F' : '1px solid #F0F0F0',
                      backgroundColor: isSelected ? '#EBF4FF' : 'white',
                      cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: isToday ? 700 : 500, color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>{day}</span>
                    {diaReservas.length > 0 && (
                      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {diaReservas.slice(0, 3).map((r, idx) => {
                          const areaName = (r.areas_comunes as { nombre: string } | null)?.nombre || ''
                          return (
                            <span key={idx} style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              backgroundColor: areaColorMap.get(areaName) || '#5E6B62',
                            }} />
                          )
                        })}
                        {diaReservas.length > 3 && (
                          <span style={{ fontSize: '8px', color: '#5E6B62' }}>+{diaReservas.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Area color legend */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
              {[...areaColorMap.entries()].map(([name, color]) => (
                <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Detail for selected day */}
          {diaSeleccionado && (
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', marginTop: '12px' }}>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
                {new Date(diaSeleccionado + 'T12:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {reservasDelDia.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#5E6B62', margin: 0 }}>Sin reservas este dia</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reservasDelDia.map(r => {
                    const est = ESTADO_STYLE[r.estado] || ESTADO_STYLE.pendiente
                    const areaName = (r.areas_comunes as { nombre: string } | null)?.nombre || ''
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#F4F7F5', borderRadius: '10px', borderLeft: `3px solid ${areaColorMap.get(areaName) || '#5E6B62'}` }}>
                        <div>
                          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117' }}>{areaName}</div>
                          <div style={{ fontSize: '12px', color: '#5E6B62' }}>
                            {r.hora_inicio?.slice(0, 5)} — {r.hora_fin?.slice(0, 5)} ·{' '}
                            {(r.residentes as { nombre: string; apellido: string } | null)?.nombre} {(r.residentes as { nombre: string; apellido: string } | null)?.apellido}
                          </div>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {vista === 'lista' && (
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['pendiente', 'aprobada', 'rechazada', 'todos'].map(e => (
          <button key={e} onClick={() => setFiltro(e)} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px',
            fontWeight: filtro === e ? 600 : 400, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            backgroundColor: filtro === e ? '#1A7A4A' : '#F0F0F0', color: filtro === e ? 'white' : '#5E6B62',
          }}>{e === 'todos' ? 'Todas' : ESTADO_STYLE[e]?.label || e}</button>
        ))}
      </div>
      )}

      {vista === 'lista' && (filtradas.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay reservas</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtradas.map(r => {
            const est = ESTADO_STYLE[r.estado] || ESTADO_STYLE.pendiente
            return (
              <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                      {(r.areas_comunes as { nombre: string } | null)?.nombre || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                      {(r.residentes as { nombre: string; apellido: string } | null)?.nombre} {(r.residentes as { nombre: string; apellido: string } | null)?.apellido}
                      {' · Unidad '}{(r.unidades as { numero: string } | null)?.numero}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#0D1117', fontWeight: 600 }}>{r.fecha}</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#5E6B62' }}>{r.hora_inicio?.slice(0,5)} — {r.hora_fin?.slice(0,5)}</span>
                  {r.cobro && Number(r.cobro) > 0 && <span style={{ fontSize: '12px', backgroundColor: '#FEF9EC', padding: '4px 8px', borderRadius: '4px', color: '#C07A2E' }}>Bs. {Number(r.cobro).toFixed(2)}</span>}
                  {r.motivo && <span style={{ fontSize: '12px', color: '#5E6B62' }}>"{r.motivo}"</span>}
                </div>

                {r.estado === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => aprobar.mutate({ id: r.id, aprobado_por: user!.id })}
                      disabled={aprobar.isPending}
                      style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ✓ Aprobar
                    </button>
                    <button onClick={() => setRechazandoId(rechazandoId === r.id ? null : r.id)}
                      style={{ padding: '8px 16px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ✕ Rechazar
                    </button>
                  </div>
                )}

                {rechazandoId === r.id && (
                  <div style={{ marginTop: '12px', backgroundColor: '#FCEAEA', borderRadius: '10px', padding: '14px' }}>
                    <input type="text" value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo de rechazo..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #B83232', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                    <button onClick={() => { rechazar.mutate({ id: r.id, motivo_rechazo: motivoRechazo }); setRechazandoId(null); setMotivoRechazo('') }}
                      disabled={!motivoRechazo} style={{ padding: '6px 14px', backgroundColor: !motivoRechazo ? '#C8D4CB' : '#B83232', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: !motivoRechazo ? 'not-allowed' : 'pointer' }}>
                      Confirmar rechazo
                    </button>
                  </div>
                )}

                {r.motivo_rechazo && (
                  <div style={{ marginTop: '8px', backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#B83232' }}>
                    Rechazado: {r.motivo_rechazo}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
