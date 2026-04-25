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
  // Edit modal state
  const [editGuardia, setEditGuardia] = useState<any>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editApellido, setEditApellido] = useState('')
  const [editCi, setEditCi] = useState('')
  const [editEmpresa, setEditEmpresa] = useState('')
  const [editHabilitacion, setEditHabilitacion] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  // Deactivate confirmation
  const [confirmDeactivate, setConfirmDeactivate] = useState<any>(null)

  const { data: condominio } = useQuery({
    queryKey: ['condominio-nombre', condominioId],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre').eq('id', condominioId).single()
      return data as { nombre: string } | null
    },
    enabled: !!condominioId,
  })

  const handleSave = async () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    setSaving(true)
    setError('')
    setResultado(null)
    try {
      const guardia = await crear.mutateAsync({ nombre, apellido, ci, telefono: telefono || undefined, empresa: empresa || undefined, habilitacion_dgsc: habilitacion || undefined } as any)

      // If email provided, create user account
      if (email && guardia?.id) {
        const result = await crearUsuarioResidente({
          email,
          nombre,
          apellido,
          tipo: 'guardia',
          condominio_id: condominioId,
          condominio_nombre: condominio?.nombre || '',
          guardia_id: guardia.id,
        })

        if (result.success) {
          setResultado({ email, emailSent: result.email_sent || false })
        } else {
          setError(`Guardia creado, pero no se pudo crear usuario: ${result.error}`)
          return
        }
      }

      setNombre(''); setApellido(''); setCi(''); setTelefono(''); setEmail(''); setEmpresa(''); setHabilitacion('')
      setShowForm(false)
    } catch (err: any) {
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (g: any) => {
    setEditGuardia(g)
    setEditNombre(g.nombre)
    setEditApellido(g.apellido)
    setEditCi(g.ci)
    setEditEmpresa(g.empresa || '')
    setEditHabilitacion(g.habilitacion_dgsc || '')
    setEditTelefono(g.telefono || '')
    setEditEmail('')
    setError('')
  }

  const handleEditSave = async () => {
    if (!editGuardia) return
    setEditSaving(true)
    setError('')
    try {
      await actualizar.mutateAsync({
        id: editGuardia.id,
        updates: {
          nombre: editNombre,
          apellido: editApellido,
          ci: editCi,
          empresa: editEmpresa || null,
          habilitacion_dgsc: editHabilitacion || null,
          telefono: editTelefono || null,
        },
      })
      setEditGuardia(null)
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar guardia')
    } finally {
      setEditSaving(false)
    }
  }

  const handleToggleActivo = async (g: any) => {
    if (g.activo) {
      setConfirmDeactivate(g)
    } else {
      await actualizar.mutateAsync({ id: g.id, updates: { activo: true } })
    }
  }

  const confirmDeactivateGuardia = async () => {
    if (!confirmDeactivate) return
    await actualizar.mutateAsync({ id: confirmDeactivate.id, updates: { activo: false } })
    setConfirmDeactivate(null)
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
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={() => openEdit(g)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#EBF4FF', color: '#0D4A8F', fontFamily: "'Inter', sans-serif" }}>Editar</button>
                <button onClick={() => handleToggleActivo(g)} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  backgroundColor: g.activo ? '#E8F4F0' : '#F0F0F0', color: g.activo ? '#1A7A4A' : '#5E6B62',
                }}>{g.activo ? 'Activo' : 'Inactivo'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editGuardia && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditGuardia(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Editar Guardia</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Nombre *</label><input value={editNombre} onChange={e => setEditNombre(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Apellido *</label><input value={editApellido} onChange={e => setEditApellido(e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>CI *</label><input value={editCi} onChange={e => setEditCi(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Empresa</label><input value={editEmpresa} onChange={e => setEditEmpresa(e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>N° Habilitacion DGSC</label><input value={editHabilitacion} onChange={e => setEditHabilitacion(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Telefono</label><input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} style={inputStyle} /></div>
              </div>
            </div>
            {error && (
              <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginTop: '12px', fontFamily: "'Inter', sans-serif" }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setEditGuardia(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleEditSave} disabled={!editNombre || !editApellido || !editCi || editSaving} style={{ padding: '8px 18px', backgroundColor: (!editNombre || !editApellido || !editCi || editSaving) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: (!editNombre || !editApellido || !editCi || editSaving) ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif" }}>{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirmDeactivate(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>Desactivar guardia</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿Desactivar a <strong>{confirmDeactivate.nombre} {confirmDeactivate.apellido}</strong>? Ya no podra acceder a /guardia.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmDeactivate(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={confirmDeactivateGuardia} style={{ padding: '8px 18px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
