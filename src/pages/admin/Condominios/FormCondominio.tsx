import { useState, useEffect } from 'react'
import type { Condominio } from '@/hooks/useCondominios'

interface Props {
  condominio?: Condominio | null
  onSave: (data: Partial<Condominio>) => void
  onCancel: () => void
  saving: boolean
}

const CIUDADES = ['Santa Cruz de la Sierra', 'La Paz', 'Cochabamba', 'Sucre', 'Tarija', 'Oruro', 'Potosí', 'Trinidad', 'Cobija']
const DEPTOS = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Chuquisaca', 'Tarija', 'Oruro', 'Potosí', 'Beni', 'Pando']

export default function FormCondominio({ condominio, onSave, onCancel, saving }: Props) {
  const [nombre, setNombre] = useState(''); const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('Santa Cruz de la Sierra'); const [departamento, setDepartamento] = useState('Santa Cruz')
  const [nit, setNit] = useState(''); const [telefono, setTelefono] = useState(''); const [email, setEmail] = useState('')
  const [recargo, setRecargo] = useState('2'); const [notas, setNotas] = useState('')

  useEffect(() => {
    if (condominio) {
      setNombre(condominio.nombre); setDireccion(condominio.direccion); setCiudad(condominio.ciudad)
      setDepartamento(condominio.departamento); setNit(condominio.nit || ''); setTelefono(condominio.telefono || '')
      setEmail(condominio.email_contacto || ''); setRecargo(String(condominio.recargo_mora_porcentaje)); setNotas(condominio.notas || '')
    }
  }, [condominio])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ nombre, direccion, ciudad, departamento, nit: nit || undefined, telefono: telefono || undefined, email_contacto: email || undefined, recargo_mora_porcentaje: parseFloat(recargo) || 2, notas: notas || undefined } as Partial<Condominio>)
  }

  const iS = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }
  const lS = { display: 'block' as const, fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>{condominio ? 'Editar Condominio' : 'Nuevo Condominio'}</h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '24px' }}>{condominio ? 'Modifica los datos' : 'Registra un nuevo condominio en el sistema'}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}><label style={lS}>Nombre del condominio *</label><input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Residencial Los Pinos" style={iS} onFocus={e => e.target.style.borderColor = '#1A7A4A'} onBlur={e => e.target.style.borderColor = '#C8D4CB'} /></div>
        <div style={{ marginBottom: '16px' }}><label style={lS}>Dirección completa *</label><input value={direccion} onChange={e => setDireccion(e.target.value)} required placeholder="Ej: Av. Banzer 3er Anillo" style={iS} onFocus={e => e.target.style.borderColor = '#1A7A4A'} onBlur={e => e.target.style.borderColor = '#C8D4CB'} /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div><label style={lS}>Ciudad *</label><select value={ciudad} onChange={e => setCiudad(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}>{CIUDADES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={lS}>Departamento *</label><select value={departamento} onChange={e => setDepartamento(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}>{DEPTOS.map(d => <option key={d}>{d}</option>)}</select></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div><label style={lS}>NIT</label><input value={nit} onChange={e => setNit(e.target.value)} placeholder="Opcional" style={iS} /></div>
          <div><label style={lS}>Teléfono</label><input value={telefono} onChange={e => setTelefono(e.target.value)} style={iS} /></div>
          <div><label style={lS}>Email contacto</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={iS} /></div>
        </div>

        <div style={{ marginBottom: '16px' }}><label style={lS}>Recargo por mora (%)</label><input type="number" value={recargo} onChange={e => setRecargo(e.target.value)} step="0.5" min="0" max="20" style={{ ...iS, maxWidth: '120px' }} /></div>
        <div style={{ marginBottom: '24px' }}><label style={lS}>Notas</label><textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} style={{ ...iS, resize: 'vertical' }} /></div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving || !nombre || !direccion} style={{ flex: 1, padding: '14px', backgroundColor: saving ? '#5E6B62' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Guardando...' : condominio ? 'Guardar cambios' : 'Crear condominio'}</button>
          <button type="button" onClick={onCancel} style={{ padding: '14px 24px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
