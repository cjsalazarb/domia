import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useGuardias } from '@/hooks/useGuardias'

interface Props { condominioId: string }

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function RegistroGuardias({ condominioId }: Props) {
  const { guardias, isLoading, crear, actualizar, eliminar } = useGuardias(condominioId)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [ci, setCi] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Credentials modal
  const [credenciales, setCredenciales] = useState<{ codigo: string; pin: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
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
  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<any>(null)


  const handleSave = async () => {
    if (!pin || pin.length !== 6) {
      setError('El PIN debe tener 6 dígitos')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El email no tiene un formato válido')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Get next GRD code
      const { data: codeData } = await supabase.rpc('generate_grd_code')
      const codigoGuardia = codeData || 'GRD-001'

      // Hash the PIN
      const pinHash = await hashPin(pin)

      const guardia = await crear.mutateAsync({
        nombre, apellido, ci,
        telefono: telefono || undefined,
        codigo_guardia: codigoGuardia,
        pin_acceso: pinHash,
      } as any)

      if (guardia?.id) {
        // Show credentials modal
        setCredenciales({ codigo: codigoGuardia, pin })
      }

      setNombre(''); setApellido(''); setCi(''); setTelefono(''); setEmail(''); setPin('')
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

  const confirmDeleteGuardia = async () => {
    if (!confirmDelete) return
    try {
      await eliminar.mutateAsync(confirmDelete.id)
      setConfirmDelete(null)
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar guardia')
      setConfirmDelete(null)
    }
  }

  const handleCopiar = () => {
    if (!credenciales) return
    navigator.clipboard.writeText(`Código: ${credenciales.codigo} | PIN: ${credenciales.pin}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleImprimir = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !credenciales) return
    printWindow.document.write(`
      <html><head><title>Credenciales Guardia</title>
      <style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#1a1a2e}
      .card{background:#1a1a2e;padding:48px;border-radius:16px;text-align:center;color:white;border:2px solid #333}
      .code{font-size:48px;font-weight:bold;color:#ff4444;margin:16px 0;letter-spacing:4px}
      .pin{font-size:56px;font-weight:bold;color:white;margin:16px 0;letter-spacing:8px}
      .label{font-size:14px;color:#888;text-transform:uppercase;letter-spacing:2px}
      .msg{font-size:13px;color:#aaa;margin-top:24px;max-width:320px;margin-left:auto;margin-right:auto;line-height:1.5}</style></head>
      <body><div class="card">
      <div class="label">Código de Guardia</div><div class="code">${credenciales.codigo}</div>
      <div class="label">PIN de Acceso</div><div class="pin">${credenciales.pin}</div>
      <div class="msg">Entrega este código al guardia. Lo necesita para ingresar al portal desde la tablet.</div>
      </div></body></html>
    `)
    printWindow.document.close()
    printWindow.print()
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
        <button onClick={() => { setShowForm(!showForm); setError('') }} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
          {showForm ? 'Cancelar' : '+ Nuevo guardia'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Apellido *</label><input value={apellido} onChange={e => setApellido(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>CI *</label><input value={ci} onChange={e => setCi(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>PIN de acceso (6 dígitos) *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={pin}
                  onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setPin(e.target.value) }}
                  style={{ ...inputStyle, flex: 1, letterSpacing: '4px', fontWeight: 700, fontSize: '18px' }}
                  placeholder="000000"
                  maxLength={6}
                />
                <button onClick={() => setPin(generatePin())} type="button" style={{ padding: '10px 14px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>Generar</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email (opcional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="correo@ejemplo.com" />
              <p style={{ fontSize: '11px', color: '#5E6B62', margin: '4px 0 0' }}>Solo si necesita acceso por email (legacy).</p>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={!nombre || !apellido || !ci || !pin || pin.length !== 6 || saving} style={{
            padding: '10px 24px', backgroundColor: (!nombre || !apellido || !ci || !pin || pin.length !== 6 || saving) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!nombre || !apellido || !ci || !pin || pin.length !== 6 || saving) ? 'not-allowed' : 'pointer',
          }}>{saving ? 'Creando guardia...' : 'Registrar guardia'}</button>
        </div>
      )}

      {guardias.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay guardias registrados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {guardias.map(g => (
            <div key={g.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px 20px', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>
                  {g.nombre} {g.apellido}
                  {g.codigo_guardia && <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 600, color: '#B83232', backgroundColor: '#FCEAEA', padding: '2px 8px', borderRadius: '6px' }}>{g.codigo_guardia}</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>CI: {g.ci}{g.empresa ? ` · ${g.empresa}` : ''}{g.telefono ? ` · ${g.telefono}` : ''}</div>
                {g.pin_acceso && <div style={{ fontSize: '11px', color: '#1A7A4A', marginTop: '2px' }}>PIN configurado</div>}
                {g.user_id && !g.pin_acceso && <div style={{ fontSize: '11px', color: '#0D4A8F', marginTop: '2px' }}>Acceso por email (legacy)</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={() => openEdit(g)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#EBF4FF', color: '#0D4A8F', fontFamily: "'Inter', sans-serif" }}>Editar</button>
                <button onClick={() => handleToggleActivo(g)} style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  backgroundColor: g.activo ? '#E8F4F0' : '#F0F0F0', color: g.activo ? '#1A7A4A' : '#5E6B62',
                }}>{g.activo ? 'Activo' : 'Inactivo'}</button>
                <button onClick={() => setConfirmDelete(g)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: '#FCEAEA', color: '#B83232', fontFamily: "'Inter', sans-serif" }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credentials Modal */}
      {credenciales && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1a1a2e', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'Inter', sans-serif" }}>Código de Guardia</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: '#ff4444', marginTop: '8px', letterSpacing: '4px', fontFamily: "'Nunito', sans-serif" }}>{credenciales.codigo}</div>
            <div style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '24px', fontFamily: "'Inter', sans-serif" }}>PIN de Acceso</div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', marginTop: '8px', letterSpacing: '8px', fontFamily: "'Nunito', sans-serif" }}>{credenciales.pin}</div>
            <p style={{ fontSize: '13px', color: '#aaa', marginTop: '24px', lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
              Entrega este código al guardia. Lo necesita para ingresar al portal desde la tablet.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px', justifyContent: 'center' }}>
              <button onClick={handleImprimir} style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Imprimir</button>
              <button onClick={handleCopiar} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{copiado ? 'Copiado!' : 'Copiar'}</button>
              <button onClick={() => setCredenciales(null)} style={{ padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cerrar</button>
            </div>
          </div>
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
                <div><label style={labelStyle}>Teléfono</label><input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Empresa</label><input value={editEmpresa} onChange={e => setEditEmpresa(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>N° Habilitacion DGSC</label><input value={editHabilitacion} onChange={e => setEditHabilitacion(e.target.value)} style={inputStyle} /></div>
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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirmDelete(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>Eliminar guardia</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿Estas segura de que quieres eliminar al guardia <strong>{confirmDelete.nombre} {confirmDelete.apellido}</strong>?
              {confirmDelete.user_id && ' Se eliminara su cuenta de acceso al portal.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={confirmDeleteGuardia} style={{ padding: '8px 18px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
