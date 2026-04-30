import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import PortalLayout from '@/components/layout/PortalLayout'

export default function MisDatos() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: residente } = useQuery({
    queryKey: ['mi-residente-datos', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('residentes')
        .select('id, nombre, apellido, ci, telefono, email, tipo, unidad_id, condominio_id, unidades(numero, tipo)')
        .eq('user_id', user!.id)
        .eq('estado', 'activo')
        .single()
      return data
    },
    enabled: !!user,
  })

  const [editando, setEditando] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const startEdit = () => {
    setTelefono(residente?.telefono || '')
    setEmail(residente?.email || '')
    setEditando(true)
    setSuccess(false)
    setError('')
  }

  const guardar = useMutation({
    mutationFn: async () => {
      const { error: resErr } = await supabase
        .from('residentes')
        .update({ telefono: telefono || null, email: email || null })
        .eq('id', residente!.id)

      if (resErr) throw new Error(resErr.message)

      if (user && email) {
        await supabase
          .from('profiles')
          .update({ telefono: telefono || null })
          .eq('id', user.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-residente-datos'] })
      setEditando(false)
      setSuccess(true)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block' as const, fontSize: '13px', fontWeight: 500, color: '#5E6B62', marginBottom: '4px', fontFamily: "'Inter', sans-serif",
  }

  const valorStyle = {
    fontSize: '15px', fontWeight: 600, color: '#0D1117', fontFamily: "'Inter', sans-serif",
  }

  return (
    <PortalLayout title="Mi Perfil">
      <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 24px' }}>
          Mis Datos
        </h1>

        {success && (
          <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1A7A4A', marginBottom: '16px' }}>
            Datos actualizados correctamente
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '28px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E8F4F0',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#1A7A4A',
            }}>
              {residente?.nombre?.charAt(0) || ''}{residente?.apellido?.charAt(0) || ''}
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', marginTop: '10px' }}>
              {residente?.nombre} {residente?.apellido}
            </div>
            <span style={{
              display: 'inline-block', marginTop: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              backgroundColor: residente?.tipo === 'propietario' ? '#EBF4FF' : '#F5ECFF',
              color: residente?.tipo === 'propietario' ? '#0D4A8F' : '#7B1AC8',
            }}>
              {residente?.tipo === 'propietario' ? 'Propietario' : 'Inquilino'}
            </span>
          </div>

          {/* Datos de solo lectura */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <span style={labelStyle}>Unidad</span>
              <span style={valorStyle}>{(residente?.unidades as any)?.numero || '—'} ({(residente?.unidades as any)?.tipo || ''})</span>
            </div>
            <div>
              <span style={labelStyle}>CI</span>
              <span style={valorStyle}>{residente?.ci || 'No registrado'}</span>
            </div>

            {/* Datos editables */}
            {editando ? (
              <>
                <div>
                  <label style={labelStyle}>Telefono</label>
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1A7A4A'}
                    onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1A7A4A'}
                    onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span style={labelStyle}>Telefono</span>
                  <span style={valorStyle}>{residente?.telefono || 'No registrado'}</span>
                </div>
                <div>
                  <span style={labelStyle}>Email</span>
                  <span style={valorStyle}>{residente?.email || 'No registrado'}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {editando ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => guardar.mutate()}
                disabled={guardar.isPending}
                style={{
                  flex: 1, padding: '12px', backgroundColor: guardar.isPending ? '#5E6B62' : '#1A7A4A', color: 'white',
                  border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                  cursor: guardar.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {guardar.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditando(false); setError('') }}
                style={{
                  padding: '12px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62',
                  border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#0D4A8F', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
              }}
            >
              Editar mis datos
            </button>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
