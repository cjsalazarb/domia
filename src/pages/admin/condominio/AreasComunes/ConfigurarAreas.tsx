import { useState } from 'react'
import { useAreasComunes } from '@/hooks/useReservas'

interface Props { condominioId: string }

export default function ConfigurarAreas({ condominioId }: Props) {
  const { areas, isLoading, crear, actualizar } = useAreasComunes(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [horarioInicio, setHorarioInicio] = useState('08:00')
  const [horarioFin, setHorarioFin] = useState('22:00')
  const [tarifa, setTarifa] = useState('')
  const [requiereAprobacion, setRequiereAprobacion] = useState(true)
  const [tiempoMax, setTiempoMax] = useState('4')

  const handleSave = async () => {
    await crear.mutateAsync({
      nombre,
      capacidad: parseInt(capacidad) || null,
      horario_inicio: horarioInicio,
      horario_fin: horarioFin,
      tarifa: parseFloat(tarifa) || null,
      requiere_aprobacion: requiereAprobacion,
      tiempo_max_horas: parseInt(tiempoMax) || 4,
      activa: true,
    })
    setNombre(''); setCapacidad(''); setTarifa(''); setShowForm(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Áreas Comunes</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{areas.length} área{areas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
          {showForm ? 'Cancelar' : '+ Nueva área'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Salón de Eventos" style={inputStyle} /></div>
            <div><label style={labelStyle}>Capacidad</label><input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} placeholder="Personas" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Hora inicio</label><input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Hora fin</label><input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Tarifa (Bs.)</label><input type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} placeholder="0 = gratis" style={inputStyle} /></div>
            <div><label style={labelStyle}>Máx. horas</label><input type="number" value={tiempoMax} onChange={e => setTiempoMax(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#0D1117', cursor: 'pointer' }}>
              <input type="checkbox" checked={requiereAprobacion} onChange={e => setRequiereAprobacion(e.target.checked)} />
              Requiere aprobación del administrador
            </label>
          </div>
          <button onClick={handleSave} disabled={!nombre || crear.isPending} style={{
            padding: '10px 24px', backgroundColor: !nombre ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: !nombre ? 'not-allowed' : 'pointer',
          }}>{crear.isPending ? 'Guardando...' : 'Guardar área'}</button>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {areas.map(a => (
          <div key={a.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{a.nombre}</div>
              <button onClick={() => actualizar.mutate({ id: a.id, updates: { activa: !a.activa } })} style={{
                padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, border: 'none', cursor: 'pointer',
                backgroundColor: a.activa ? '#E8F4F0' : '#F0F0F0', color: a.activa ? '#1A7A4A' : '#5E6B62',
              }}>{a.activa ? 'Activa' : 'Inactiva'}</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
              {a.capacidad && <span style={{ backgroundColor: '#F4F7F5', padding: '3px 8px', borderRadius: '4px', color: '#5E6B62' }}>Cap. {a.capacidad}</span>}
              {a.horario_inicio && <span style={{ backgroundColor: '#F4F7F5', padding: '3px 8px', borderRadius: '4px', color: '#5E6B62' }}>{a.horario_inicio?.slice(0,5)} — {a.horario_fin?.slice(0,5)}</span>}
              <span style={{ backgroundColor: a.tarifa && a.tarifa > 0 ? '#FEF9EC' : '#E8F4F0', padding: '3px 8px', borderRadius: '4px', color: a.tarifa && a.tarifa > 0 ? '#C07A2E' : '#1A7A4A' }}>
                {a.tarifa && a.tarifa > 0 ? `Bs. ${Number(a.tarifa).toFixed(2)}` : 'Gratis'}
              </span>
              <span style={{ backgroundColor: a.requiere_aprobacion ? '#F5ECFF' : '#E8F4F0', padding: '3px 8px', borderRadius: '4px', color: a.requiere_aprobacion ? '#7B1AC8' : '#1A7A4A' }}>
                {a.requiere_aprobacion ? 'Requiere aprobación' : 'Automática'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
