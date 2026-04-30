import { useState } from 'react'
import { useAreasComunes, type AreaComun } from '@/hooks/useReservas'

interface Props { condominioId: string }

export default function ConfigurarAreas({ condominioId }: Props) {
  const { areas, isLoading, crear, actualizar } = useAreasComunes(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioFin, setHorarioFin] = useState('22:00')
  const [tarifa, setTarifa] = useState('')
  const [requiereAprobacion, setRequiereAprobacion] = useState(true)
  const [tiempoMax, setTiempoMax] = useState('4')
  // New fields
  const [montoGarantia, setMontoGarantia] = useState('')
  const [montoAlquiler, setMontoAlquiler] = useState('')
  const [condicionesUso, setCondicionesUso] = useState('')
  const [inventario, setInventario] = useState('')
  const [reglas, setReglas] = useState('')
  const [politicaGarantia, setPoliticaGarantia] = useState('')
  const [contactoEmergencia, setContactoEmergencia] = useState('')

  const resetForm = () => {
    setNombre(''); setCapacidad(''); setTarifa(''); setTiempoMax('4')
    setHorarioInicio('08:00'); setHorarioFin('22:00'); setRequiereAprobacion(true)
    setMontoGarantia(''); setMontoAlquiler('')
    setCondicionesUso(''); setInventario(''); setReglas('')
    setPoliticaGarantia(''); setContactoEmergencia('')
    setEditId(null); setShowForm(false)
  }

  const loadArea = (a: AreaComun) => {
    setEditId(a.id)
    setNombre(a.nombre)
    setCapacidad(a.capacidad?.toString() || '')
    setHorarioInicio(a.horario_inicio || '08:00')
    setHorarioFin(a.horario_fin || '22:00')
    setTarifa(a.tarifa?.toString() || '')
    setRequiereAprobacion(a.requiere_aprobacion)
    setTiempoMax(a.tiempo_max_horas?.toString() || '4')
    setMontoGarantia(a.monto_garantia?.toString() || '')
    setMontoAlquiler(a.monto_alquiler?.toString() || '')
    setCondicionesUso(a.condiciones_uso || '')
    setInventario(a.inventario || '')
    setReglas(a.reglas || '')
    setPoliticaGarantia(a.politica_garantia || '')
    setContactoEmergencia(a.contacto_emergencia || '')
    setShowForm(true)
  }

  const buildPayload = (): Partial<AreaComun> => ({
    nombre,
    capacidad: parseInt(capacidad) || null,
    horario_inicio: horarioInicio,
    horario_fin: horarioFin,
    tarifa: parseFloat(tarifa) || null,
    requiere_aprobacion: requiereAprobacion,
    tiempo_max_horas: parseInt(tiempoMax) || 4,
    activa: true,
    monto_garantia: parseFloat(montoGarantia) || 0,
    monto_alquiler: parseFloat(montoAlquiler) || 0,
    condiciones_uso: condicionesUso || null,
    inventario: inventario || null,
    reglas: reglas || null,
    politica_garantia: politicaGarantia || null,
    contacto_emergencia: contactoEmergencia || null,
  })

  const handleSave = async () => {
    if (editId) {
      await actualizar.mutateAsync({ id: editId, updates: buildPayload() })
    } else {
      await crear.mutateAsync(buildPayload())
    }
    resetForm()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
  }
  const textareaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical' as const, lineHeight: '1.5' }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }
  const sectionTitle = { fontSize: '13px', fontWeight: 700 as const, color: '#0D1117', fontFamily: "'Nunito', sans-serif", marginBottom: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E8F4F0' }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Areas Comunes</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{areas.length} area{areas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true) }} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
          {showForm ? 'Cancelar' : '+ Nueva area'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0D1117', fontFamily: "'Nunito', sans-serif", marginBottom: '16px' }}>
            {editId ? 'Editar area' : 'Nueva area comun'}
          </div>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Salon de Eventos" style={inputStyle} /></div>
            <div><label style={labelStyle}>Capacidad</label><input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} placeholder="Personas" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Hora inicio</label><input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Hora fin</label><input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Tarifa general (Bs.)</label><input type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} placeholder="0 = gratis" style={inputStyle} /></div>
            <div><label style={labelStyle}>Max. horas</label><input type="number" value={tiempoMax} onChange={e => setTiempoMax(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#0D1117', cursor: 'pointer' }}>
              <input type="checkbox" checked={requiereAprobacion} onChange={e => setRequiereAprobacion(e.target.checked)} />
              Requiere aprobacion del administrador
            </label>
          </div>

          {/* Tarifas */}
          <div style={sectionTitle}>Tarifas de reserva</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Garantia (Bs.)</label><input type="number" value={montoGarantia} onChange={e => setMontoGarantia(e.target.value)} placeholder="Se devuelve al finalizar" style={inputStyle} /></div>
            <div><label style={labelStyle}>Alquiler (Bs.)</label><input type="number" value={montoAlquiler} onChange={e => setMontoAlquiler(e.target.value)} placeholder="Costo de uso" style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '10px 14px', width: '100%' }}>
                <div style={{ fontSize: '11px', color: '#5E6B62' }}>Total a pagar</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>
                  Bs. {((parseFloat(montoGarantia) || 0) + (parseFloat(montoAlquiler) || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones */}
          <div style={sectionTitle}>Condiciones de uso y entrega</div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Condiciones de uso</label>
            <textarea value={condicionesUso} onChange={e => setCondicionesUso(e.target.value)} placeholder="Ej: Horario de uso estricto de 08:00 a 22:00. El area debe entregarse limpia." style={textareaStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Inventario del area</label>
            <textarea value={inventario} onChange={e => setInventario(e.target.value)} placeholder="Ej: 6 mesas, 24 sillas, 1 parrilla, 2 tomas de corriente" style={textareaStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Reglas de uso</label>
            <textarea value={reglas} onChange={e => setReglas(e.target.value)} placeholder="Ej: No se permite musica despues de las 22:00. No se permite el ingreso de mascotas." style={textareaStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Politica de devolucion de garantia</label>
              <textarea value={politicaGarantia} onChange={e => setPoliticaGarantia(e.target.value)} placeholder="Ej: La garantia se devuelve dentro de 5 dias habiles previa inspeccion del area." style={textareaStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contacto de emergencia</label>
              <input value={contactoEmergencia} onChange={e => setContactoEmergencia(e.target.value)} placeholder="Ej: Juan Perez — 71234567" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave} disabled={!nombre || crear.isPending || actualizar.isPending} style={{
              padding: '10px 24px', backgroundColor: !nombre ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: !nombre ? 'not-allowed' : 'pointer',
            }}>{crear.isPending || actualizar.isPending ? 'Guardando...' : (editId ? 'Actualizar area' : 'Guardar area')}</button>
            {editId && (
              <button onClick={resetForm} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: '#5E6B62', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {areas.map(a => {
          const total = (Number(a.monto_garantia) || 0) + (Number(a.monto_alquiler) || 0)
          return (
            <div key={a.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{a.nombre}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => loadArea(a)} style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, border: 'none', cursor: 'pointer',
                    backgroundColor: '#EBF4FF', color: '#0D4A8F',
                  }}>Editar</button>
                  <button onClick={() => actualizar.mutate({ id: a.id, updates: { activa: !a.activa } })} style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, border: 'none', cursor: 'pointer',
                    backgroundColor: a.activa ? '#E8F4F0' : '#F0F0F0', color: a.activa ? '#1A7A4A' : '#5E6B62',
                  }}>{a.activa ? 'Activa' : 'Inactiva'}</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', marginBottom: '10px' }}>
                {a.capacidad && <span style={{ backgroundColor: '#F4F7F5', padding: '3px 8px', borderRadius: '4px', color: '#5E6B62' }}>Cap. {a.capacidad}</span>}
                {a.horario_inicio && <span style={{ backgroundColor: '#F4F7F5', padding: '3px 8px', borderRadius: '4px', color: '#5E6B62' }}>{a.horario_inicio?.slice(0,5)} — {a.horario_fin?.slice(0,5)}</span>}
                <span style={{ backgroundColor: a.requiere_aprobacion ? '#F5ECFF' : '#E8F4F0', padding: '3px 8px', borderRadius: '4px', color: a.requiere_aprobacion ? '#7B1AC8' : '#1A7A4A' }}>
                  {a.requiere_aprobacion ? 'Requiere aprobacion' : 'Automatica'}
                </span>
              </div>

              {/* Tarifa breakdown */}
              {total > 0 ? (
                <div style={{ backgroundColor: '#FEF9EC', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: '#5E6B62' }}>Garantia</span>
                    <span style={{ color: '#C07A2E', fontWeight: 600 }}>Bs. {Number(a.monto_garantia || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#5E6B62' }}>Alquiler</span>
                    <span style={{ color: '#C07A2E', fontWeight: 600 }}>Bs. {Number(a.monto_alquiler || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8D6A0', paddingTop: '4px' }}>
                    <span style={{ color: '#0D1117', fontWeight: 700 }}>Total</span>
                    <span style={{ color: '#0D1117', fontWeight: 700 }}>Bs. {total.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12px', backgroundColor: '#E8F4F0', padding: '3px 8px', borderRadius: '4px', color: '#1A7A4A' }}>Gratis</span>
              )}

              {/* Conditions summary */}
              {(a.condiciones_uso || a.inventario || a.reglas) && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#5E6B62' }}>
                  {a.condiciones_uso && <div style={{ marginBottom: '2px' }}>Condiciones configuradas</div>}
                  {a.inventario && <div style={{ marginBottom: '2px' }}>Inventario configurado</div>}
                  {a.reglas && <div>Reglas configuradas</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
