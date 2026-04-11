import { useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useAreasComunes, useReservas } from '@/hooks/useReservas'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ReservaSlot { fecha: string; hora_inicio: string; hora_fin: string }

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  aprobada: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Aprobada' },
  rechazada: { bg: '#FCEAEA', text: '#B83232', label: 'Rechazada' },
  cancelada: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelada' },
}

export default function ReservarArea() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  // Get residente info first (needed for condominio_id fallback)
  const { data: residente } = useQuery({
    queryKey: ['mi-residente', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('residentes').select('id, unidad_id, condominio_id').eq('user_id', user!.id).eq('estado', 'activo').single()
      return data
    },
    enabled: !!user,
  })

  const condominioId = profile?.condominio_id || residente?.condominio_id || ''
  const { areas } = useAreasComunes(condominioId)
  const { crearReserva, reservas } = useReservas(condominioId)

  const [areaId, setAreaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [calMes, setCalMes] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })

  // Reservas del area seleccionada para el calendario
  const { data: reservasArea = [] } = useQuery({
    queryKey: ['reservas-area-cal', areaId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('reservas')
        .select('fecha, hora_inicio, hora_fin')
        .eq('area_id', areaId)
        .in('estado', ['pendiente', 'aprobada'])
        .gte('fecha', today)
        .order('fecha')
        .order('hora_inicio')
      if (error) throw error
      return data as ReservaSlot[]
    },
    enabled: !!areaId,
  })

  // Calendar helpers
  const reservasPorFecha = useMemo(() => {
    const map = new Map<string, ReservaSlot[]>()
    for (const r of reservasArea) {
      const list = map.get(r.fecha) || []
      list.push(r)
      map.set(r.fecha, list)
    }
    return map
  }, [reservasArea])

  const diasMes = useMemo(() => {
    const { year, month } = calMes
    const first = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0).getDate()
    const startDow = first.getDay() // 0=sun
    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay; d++) days.push(d)
    return days
  }, [calMes])

  const today = new Date().toISOString().split('T')[0]

  const areasActivas = areas.filter(a => a.activa)
  const areaSeleccionada = areas.find(a => a.id === areaId)
  const costoTotal = areaSeleccionada?.tarifa && areaSeleccionada.tarifa > 0 ? areaSeleccionada.tarifa : 0

  // My reservations
  const misReservas = reservas.filter(r => r.residente_id === residente?.id).slice(0, 10)

  const handleSubmit = async () => {
    if (!areaId || !fecha || !horaInicio || !horaFin || !residente) return
    setError('')
    setSuccess(false)

    try {
      await crearReserva.mutateAsync({
        area_id: areaId,
        unidad_id: residente.unidad_id,
        residente_id: residente.id,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        motivo: motivo || undefined,
        cobro: costoTotal,
        requiere_aprobacion: areaSeleccionada?.requiere_aprobacion ?? true,
      })
      setSuccess(true)
      setAreaId(''); setFecha(''); setHoraInicio(''); setHoraFin(''); setMotivo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reserva')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '20px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>DOM<span style={{ opacity: 0.9 }}>IA</span></span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Reservas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); navigate('/login') }} style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>← Volver al portal</button>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 24px' }}>Reservar Área Común</h1>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px', marginBottom: '24px' }}>
          {success && (
            <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1A7A4A', marginBottom: '16px' }}>
              {areaSeleccionada?.requiere_aprobacion ? 'Solicitud enviada — pendiente de aprobación' : 'Reserva confirmada automáticamente'}
            </div>
          )}

          {/* Area selector — cards dinámicas desde areas_comunes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px' }}>Selecciona un área *</label>
            {areasActivas.length === 0 ? (
              <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                <p style={{ fontSize: '14px', color: '#5E6B62', margin: 0 }}>No hay áreas comunes disponibles en tu condominio.</p>
                <p style={{ fontSize: '12px', color: '#5E6B62', marginTop: '4px' }}>Contacta al administrador para configurar las áreas.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {areasActivas.map(a => {
                  const selected = areaId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAreaId(selected ? '' : a.id)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: selected ? '2px solid #1A7A4A' : '1px solid #C8D4CB',
                        backgroundColor: selected ? '#E8F4F0' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>{a.nombre}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {a.horario_inicio && (
                            <span style={{ fontSize: '11px', color: '#5E6B62' }}>
                              {a.horario_inicio.slice(0,5)} — {a.horario_fin?.slice(0,5)}
                            </span>
                          )}
                          {a.capacidad && <span style={{ fontSize: '11px', color: '#5E6B62' }}>· Cap. {a.capacidad}</span>}
                          {a.tiempo_max_horas && <span style={{ fontSize: '11px', color: '#5E6B62' }}>· Máx. {a.tiempo_max_horas}h</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800,
                          color: a.tarifa && a.tarifa > 0 ? '#C07A2E' : '#1A7A4A',
                        }}>
                          {a.tarifa && a.tarifa > 0 ? `Bs. ${Number(a.tarifa).toFixed(2)}` : 'Gratis'}
                        </div>
                        {a.requiere_aprobacion && (
                          <span style={{ fontSize: '10px', color: '#7B1AC8' }}>Requiere aprobación</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Calendar */}
          {areaId && (
            <div style={{ marginBottom: '20px', backgroundColor: '#F4F7F5', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button type="button" onClick={() => setCalMes(p => {
                  const d = new Date(p.year, p.month - 1, 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#1A7A4A', padding: '4px 8px' }}>‹</button>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>
                  {new Date(calMes.year, calMes.month).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
                </span>
                <button type="button" onClick={() => setCalMes(p => {
                  const d = new Date(p.year, p.month + 1, 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#1A7A4A', padding: '4px 8px' }}>›</button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '4px' }}>
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                  <span key={d} style={{ fontSize: '10px', fontWeight: 600, color: '#5E6B62', fontFamily: "'Inter', sans-serif", padding: '4px 0' }}>{d}</span>
                ))}
              </div>

              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {diasMes.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />
                  const dateStr = `${calMes.year}-${String(calMes.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isPast = dateStr < today
                  const reservasDelDia = reservasPorFecha.get(dateStr) || []
                  const hasReservas = reservasDelDia.length > 0
                  const isSelected = fecha === dateStr

                  // Check if fully booked (simplified: if area has horario, check coverage)
                  let fullyBooked = false
                  if (hasReservas && areaSeleccionada?.horario_inicio && areaSeleccionada?.horario_fin) {
                    const totalHorasArea = parseInt(areaSeleccionada.horario_fin) - parseInt(areaSeleccionada.horario_inicio)
                    const horasReservadas = reservasDelDia.reduce((sum, r) => {
                      return sum + (parseInt(r.hora_fin) - parseInt(r.hora_inicio))
                    }, 0)
                    if (horasReservadas >= totalHorasArea) fullyBooked = true
                  }

                  const bgColor = isPast ? '#E8E8E8'
                    : isSelected ? '#1A7A4A'
                    : fullyBooked ? '#FCEAEA'
                    : hasReservas ? '#FFF8E1'
                    : 'white'
                  const textColor = isPast ? '#B0B0B0' : isSelected ? 'white' : fullyBooked ? '#B83232' : '#0D1117'

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isPast || fullyBooked}
                      onClick={() => setFecha(dateStr)}
                      style={{
                        width: '100%', aspectRatio: '1', borderRadius: '8px', border: 'none',
                        backgroundColor: bgColor, color: textColor,
                        fontSize: '13px', fontWeight: isSelected ? 700 : 500, fontFamily: "'Inter', sans-serif",
                        cursor: isPast || fullyBooked ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {day}
                      {hasReservas && !isSelected && !isPast && (
                        <span style={{
                          position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                          width: '4px', height: '4px', borderRadius: '50%',
                          backgroundColor: fullyBooked ? '#B83232' : '#C07A2E',
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '10px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #C8D4CB', display: 'inline-block' }} /> Disponible</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFF8E1', display: 'inline-block' }} /> Parcial</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FCEAEA', display: 'inline-block' }} /> Ocupado</span>
              </div>

              {/* Available slots for selected date */}
              {fecha && reservasPorFecha.get(fecha)?.length ? (
                <div style={{ marginTop: '12px', backgroundColor: 'white', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D1117', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
                    Horarios ocupados el {new Date(fecha + 'T12:00').toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}:
                  </div>
                  {reservasPorFecha.get(fecha)!.map((r, idx) => (
                    <span key={idx} style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
                      backgroundColor: '#FCEAEA', color: '#B83232', marginRight: '6px', marginBottom: '4px',
                    }}>
                      {r.hora_inicio.slice(0, 5)} — {r.hora_fin.slice(0, 5)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Date + Time */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Fecha *</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} min={new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Hora inicio *</label>
              <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Hora fin *</label>
              <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Motivo</label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Cumpleaños" style={inputStyle} />
          </div>

          {costoTotal > 0 && (
            <div style={{ backgroundColor: '#FEF9EC', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#C07A2E' }}>Costo</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: '#C07A2E' }}>Bs. {costoTotal.toFixed(2)}</span>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '16px' }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={!areaId || !fecha || !horaInicio || !horaFin || !residente || crearReserva.isPending}
            style={{
              width: '100%', padding: '14px', backgroundColor: (!areaId || !fecha || !horaInicio || !horaFin) ? '#C8D4CB' : '#1A7A4A',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
              cursor: (!areaId || !fecha || !horaInicio || !horaFin) ? 'not-allowed' : 'pointer',
            }}>
            {crearReserva.isPending ? 'Enviando...' : 'Reservar →'}
          </button>
        </div>

        {/* My reservations */}
        {misReservas.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Mis reservas</h3>
            {misReservas.map(r => {
              const est = ESTADO_STYLE[r.estado] || ESTADO_STYLE.pendiente
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>
                      {(r.areas_comunes as { nombre: string } | null)?.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5E6B62' }}>{r.fecha} · {r.hora_inicio?.slice(0,5)} — {r.hora_fin?.slice(0,5)}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
