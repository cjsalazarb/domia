import { useState } from 'react'
import { useProveedores } from '@/hooks/useMantenimientos'

interface Props { condominioId: string }

export default function Proveedores({ condominioId }: Props) {
  const { proveedores, isLoading, crear, actualizar } = useProveedores(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rubro, setRubro] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [contacto, setContacto] = useState('')

  const handleSave = async () => {
    await crear.mutateAsync({ nombre, rubro, telefono: telefono || undefined, email: email || undefined, contacto_nombre: contacto || undefined })
    setNombre(''); setRubro(''); setTelefono(''); setEmail(''); setContacto('')
    setShowForm(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none',
    boxSizing: 'border-box' as const,
  }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Proveedores</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
        }}>{showForm ? 'Cancelar' : '+ Nuevo proveedor'}</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Nombre *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Rubro *</label>
              <input value={rubro} onChange={e => setRubro(e.target.value)} placeholder="Ej: Plomería, Electricidad" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Contacto</label>
              <input value={contacto} onChange={e => setContacto(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button onClick={handleSave} disabled={!nombre || !rubro || crear.isPending} style={{
            padding: '10px 24px', backgroundColor: (!nombre || !rubro) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!nombre || !rubro) ? 'not-allowed' : 'pointer',
          }}>{crear.isPending ? 'Guardando...' : 'Guardar proveedor'}</button>
        </div>
      )}

      {/* List */}
      {proveedores.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay proveedores registrados</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.6fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Nombre</span><span>Rubro</span><span>Teléfono</span><span>Email</span><span style={{ textAlign: 'center' }}>Estado</span>
          </div>
          {proveedores.map((p: any, i: number) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.6fr', padding: '14px 20px', alignItems: 'center', borderBottom: i < proveedores.length - 1 ? '1px solid #F0F0F0' : 'none', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{p.nombre}</span>
              <span style={{ color: '#5E6B62' }}>{p.rubro}</span>
              <span style={{ color: '#5E6B62' }}>{p.telefono || '—'}</span>
              <span style={{ color: '#5E6B62', fontSize: '12px' }}>{p.email || '—'}</span>
              <span style={{ textAlign: 'center' }}>
                <button onClick={() => actualizar.mutate({ id: p.id, updates: { activo: !p.activo } })} style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, border: 'none', cursor: 'pointer',
                  backgroundColor: p.activo ? '#E8F4F0' : '#F0F0F0', color: p.activo ? '#1A7A4A' : '#5E6B62',
                }}>{p.activo ? 'Activo' : 'Inactivo'}</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
