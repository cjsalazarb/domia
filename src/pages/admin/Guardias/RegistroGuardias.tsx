import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useGuardias } from '@/hooks/useGuardias'
import { crearUsuarioResidente } from '@/lib/crearUsuarioResidente'

interface Props { condominioId: string }

export default function RegistroGuardias({ condominioId }: Props) {
  const { guardias, isLoading, crear, actualizar } = useGuardias(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [ci, setCi] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [habilitacion, setHabilitacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [resultado, setResultado] = useState<{ email: string; emailSent: boolean } | null>(null)
  const [error, setError] = useState('')

  const { data: condominio } = useQuery({
    queryKey: ['condominio-nombre', condominioId],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre').eq('id', condominioId).single()
      return data as { nombre: string } | null
    },
    enabled: !!condominioId,
  })

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setResultado(null)
    try {
      const guardia = await crear.mutateAsync({ nombre, apellido, ci, telefono: telefono || undefined, email: email || undefined, empresa: empresa || undefined, habilitacion_dgsc: habilitacion || undefined } as any)

      // If email provided, create user account
      if (email && guardia?.id) {
        const result = await crearUsuarioResidente({
          email,
          nombre,
          apellido,
          tipo: 'guardia' as any,
          condominio_id: condominioId,
          condominio_nombre: condominio?.nombre || '',
          residente_id: '', // not a residente
          guardia_id: guardia.id,
        } as any)

        if (result.success) {
          setResultado({ email, emailSent: result.email_sent || false })
        } else {
          setError(`Guardia creado, pero no se pudo crear usuario: ${result.error}`)
          setSaving(false)
          return
        }
      }

      setNombre(''); setApellido(''); setCi(''); setTelefono(''); setEmail(''); setEmpresa(''); setHabilitacion('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear guardia')
    }
    setSaving(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      {/* Success toast */}
      {resultado && (
        <div style={{ backgroundColor: '#E8F4F0', border: '1px solid #1A7A4A30', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A' }}>
            Usuario creado para <strong>{resultado.email}</strong>
            {resultado.emailSent ? ' — email de bienvenida enviado' : ' — email no enviado (verificar Resend)'}
          </div>
          <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A7A4A', fontSize: '16px', padding: '0 4px' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Guardias</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{guardias.length} guardia{guardias.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); setResultado(null) }} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="correo@ejemplo.com" />
              <p style={{ fontSize: '11px', color: '#5E6B62', margin: '4px 0 0' }}>Se creará cuenta de acceso al portal guardia y se enviarán credenciales.</p>
            </div>
            <div>
              <label style={labelStyle}>N° Habilitación DGSC</label>
              <input value={habilitacion} onChange={e => setHabilitacion(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={!nombre || !apellido || !ci || saving} style={{
            padding: '10px 24px', backgroundColor: (!nombre || !apellido || !ci || saving) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!nombre || !apellido || !ci || saving) ? 'not-allowed' : 'pointer',
          }}>{saving ? 'Creando guardia y usuario...' : 'Registrar guardia'}</button>
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
                {g.user_id && <div style={{ fontSize: '11px', color: '#1A7A4A', marginTop: '2px' }}>Con acceso al portal</div>}
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
