import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Residente, CreateResidenteInput } from '@/hooks/useResidentes'

interface Props {
  condominioId: string
  residente?: Residente | null  // null = create mode
  propietarios: Residente[]
  onSave: (input: CreateResidenteInput) => void
  onCancel: () => void
  saving: boolean
  error?: string
}

export default function FormResidente({ condominioId, residente, propietarios, onSave, onCancel, saving, error }: Props) {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState<'propietario' | 'inquilino'>(residente?.tipo || 'propietario')
  const [nombre, setNombre] = useState(residente?.nombre || '')
  const [apellido, setApellido] = useState(residente?.apellido || '')
  const [ci, setCi] = useState(residente?.ci || '')
  const [telefono, setTelefono] = useState(residente?.telefono || '')
  const [email, setEmail] = useState(residente?.email || '')
  const [unidadId, setUnidadId] = useState(residente?.unidad_id || '')
  const [propietarioId, setPropietarioId] = useState(residente?.propietario_id || '')
  const [fechaInicio, setFechaInicio] = useState(residente?.fecha_inicio || '')
  const [fechaFin, setFechaFin] = useState(residente?.fecha_fin || '')
  const [notas, setNotas] = useState(residente?.notas || '')

  // Fetch unidades + residentes activos para filtrar disponibilidad
  const { data: unidades } = useQuery({
    queryKey: ['unidades', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, numero, tipo')
        .eq('condominio_id', condominioId)
        .eq('activa', true)
        .order('numero')
      if (error) throw error
      return data
    },
  })

  const { data: unidadesConPropietario = [] } = useQuery({
    queryKey: ['unidades-con-propietario', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residentes')
        .select('unidad_id')
        .eq('condominio_id', condominioId)
        .eq('tipo', 'propietario')
        .neq('estado', 'inactivo')
      if (error) throw error
      return (data || []).map(r => r.unidad_id)
    },
  })

  const unidadesFiltradas = (unidades || []).filter(u => {
    // In edit mode, always show the current unit
    if (residente && u.id === residente.unidad_id) return true
    if (tipo === 'propietario') {
      // Show only units WITHOUT an active owner
      return !unidadesConPropietario.includes(u.id)
    } else {
      // Inquilino: show only units WITH an active owner
      return unidadesConPropietario.includes(u.id)
    }
  })

  useEffect(() => {
    if (residente) {
      setTipo(residente.tipo)
      setNombre(residente.nombre)
      setApellido(residente.apellido)
      setCi(residente.ci || '')
      setTelefono(residente.telefono || '')
      setEmail(residente.email || '')
      setUnidadId(residente.unidad_id)
      setPropietarioId(residente.propietario_id || '')
      setFechaInicio(residente.fecha_inicio || '')
      setFechaFin(residente.fecha_fin || '')
      setNotas(residente.notas || '')
    }
  }, [residente])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      tipo,
      nombre,
      apellido,
      ci: ci || undefined,
      telefono: telefono || undefined,
      email: email || undefined,
      unidad_id: unidadId,
      propietario_id: tipo === 'inquilino' ? propietarioId || undefined : undefined,
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: tipo === 'inquilino' ? fechaFin || undefined : undefined,
      notas: notas || undefined,
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #C8D4CB',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0D1117',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '13px',
    fontWeight: 500,
    color: '#0D1117',
    marginBottom: '6px',
    fontFamily: "'Inter', sans-serif",
  }

  // Show "no units" message when creating (not editing) and no units available
  const isCreating = !residente
  const noUnitsAvailable = isCreating && unidades !== undefined && unidadesFiltradas.length === 0

  if (noUnitsAvailable) {
    const msg = tipo === 'propietario'
      ? 'No hay unidades disponibles para asignar. Todas las unidades ya tienen un propietario asignado.'
      : 'No hay unidades con propietario asignado. Primero registra un propietario para poder agregar un inquilino.'

    return (
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Nuevo Residente
        </h2>

        {/* Tipo selector so user can switch */}
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['propietario', 'inquilino'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: tipo === t ? '2px solid #1A7A4A' : '1px solid #C8D4CB', backgroundColor: tipo === t ? '#E8F4F0' : 'white', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: tipo === t ? '#1A7A4A' : '#5E6B62' }}>
                {t === 'propietario' ? '🏠 Propietario' : '📋 Inquilino'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFF8E1', borderLeft: '4px solid #C07A2E', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117', marginBottom: '8px' }}>
            Sin unidades disponibles
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', margin: 0, lineHeight: '1.5' }}>
            {msg}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate(`/admin/condominios`)}
            style={{ flex: 1, padding: '14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            Configurar unidades →
          </button>
          <button type="button" onClick={onCancel}
            style={{ padding: '14px 24px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
        {residente ? 'Editar Residente' : 'Nuevo Residente'}
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '24px' }}>
        {residente ? 'Modifica los datos del residente' : 'Registra un nuevo propietario o inquilino'}
      </p>

      <form onSubmit={handleSubmit}>
        {/* Tipo */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Tipo de residente</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['propietario', 'inquilino'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: tipo === t ? '2px solid #1A7A4A' : '1px solid #C8D4CB',
                  backgroundColor: tipo === t ? '#E8F4F0' : 'white',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: tipo === t ? '#1A7A4A' : '#5E6B62',
                }}
              >
                {t === 'propietario' ? '🏠 Propietario' : '📋 Inquilino'}
              </button>
            ))}
          </div>
        </div>

        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>
          <div>
            <label style={labelStyle}>Apellido *</label>
            <input value={apellido} onChange={e => setApellido(e.target.value)} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>
        </div>

        {/* CI + Telefono */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>CI (Cédula)</label>
            <input value={ci} onChange={e => setCi(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
            placeholder="Se creará cuenta de acceso al portal"
            onFocus={e => e.target.style.borderColor = '#1A7A4A'}
            onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
        </div>

        {/* Unidad */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Unidad *</label>
          <select value={unidadId} onChange={e => setUnidadId(e.target.value)} required
            style={{ ...inputStyle, backgroundColor: 'white' }}>
            <option value="">— Seleccionar unidad —</option>
            {unidadesFiltradas.map(u => (
              <option key={u.id} value={u.id}>{u.numero} ({u.tipo})</option>
            ))}
          </select>
        </div>

        {/* Inquilino extras */}
        {tipo === 'inquilino' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Propietario vinculado</label>
              <select value={propietarioId} onChange={e => setPropietarioId(e.target.value)}
                style={{ ...inputStyle, backgroundColor: 'white' }}>
                <option value="">— Seleccionar propietario —</option>
                {propietarios.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Fecha inicio contrato</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha fin contrato</label>
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </>
        )}

        {/* Notas */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Notas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#1A7A4A'}
            onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#B83232', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: saving ? '#5E6B62' : '#1A7A4A',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : residente ? 'Guardar cambios' : 'Crear residente'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '14px 24px',
              backgroundColor: '#F4F7F5',
              color: '#5E6B62',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
