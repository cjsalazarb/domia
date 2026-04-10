import { useState } from 'react'
import { useGuardias } from '@/hooks/useGuardias'

interface Props { condominioId: string }

export default function RegistroGuardias({ condominioId }: Props) {
  const { guardias, isLoading, crear, actualizar } = useGuardias(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [ci, setCi] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [habilitacion, setHabilitacion] = useState('')

  const handleSave = async () => {
    await crear.mutateAsync({ nombre, apellido, ci, telefono: telefono || undefined, empresa: empresa || undefined, habilitacion_dgsc: habilitacion || undefined } as any)
    setNombre(''); setApellido(''); setCi(''); setTelefono(''); setEmpresa(''); setHabilitacion(''); setShowForm(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Guardias</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{guardias.length} guardia{guardias.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
          {showForm ? 'Cancelar' : '+ Nuevo guardia'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Apellido *</label><input value={apellido} onChange={e => setApellido(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>CI *</label><input value={ci} onChange={e => setCi(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Empresa</label><input value={empresa} onChange={e => setEmpresa(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>N° Habilitación DGSC</label>
            <input value={habilitacion} onChange={e => setHabilitacion(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={handleSave} disabled={!nombre || !apellido || !ci || crear.isPending} style={{
            padding: '10px 24px', backgroundColor: (!nombre || !apellido || !ci) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!nombre || !apellido || !ci) ? 'not-allowed' : 'pointer',
          }}>{crear.isPending ? 'Guardando...' : 'Registrar guardia'}</button>
        </div>
      )}

      {guardias.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay guardias registrados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {guardias.map(g => (
            <div key={g.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px 20px', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>{g.nombre} {g.apellido}</div>
                <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>CI: {g.ci}{g.empresa ? ` · ${g.empresa}` : ''}{g.telefono ? ` · ${g.telefono}` : ''}</div>
                {g.habilitacion_dgsc && <div style={{ fontSize: '11px', color: '#0D4A8F', marginTop: '2px' }}>DGSC: {g.habilitacion_dgsc}</div>}
              </div>
              <button onClick={() => actualizar.mutate({ id: g.id, updates: { activo: !g.activo } })} style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, border: 'none', cursor: 'pointer',
                backgroundColor: g.activo ? '#E8F4F0' : '#F0F0F0', color: g.activo ? '#1A7A4A' : '#5E6B62',
              }}>{g.activo ? 'Activo' : 'Inactivo'}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
