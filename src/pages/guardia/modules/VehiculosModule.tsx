import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useVehiculos } from '@/hooks/useVehiculos'

interface Props { condominioId: string; guardiaId: string }

const TIPOS = [
  { key: 'residente', label: 'Residente', color: '#1A7A4A', bg: '#E8F4F0' },
  { key: 'visitante', label: 'Visitante', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'proveedor', label: 'Proveedor', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'delivery', label: 'Delivery', color: '#EA580C', bg: '#FFF7ED' },
]

function tiempoDesde(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m`
  return `${Math.floor(hrs / 24)}d`
}

export default function VehiculosModule({ condominioId, guardiaId }: Props) {
  const { activos, isLoading, registrarEntrada, registrarSalida } = useVehiculos(condominioId, guardiaId)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [placaInput, setPlacaInput] = useState('')
  const [tipo, setTipo] = useState('')
  const [unidadId, setUnidadId] = useState('')

  const { data: unidades } = useQuery({
    queryKey: ['unidades-list', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('unidades').select('id, numero').eq('condominio_id', condominioId).order('numero')
      if (error) throw error
      return data as { id: string; numero: string }[]
    },
    enabled: !!condominioId,
  })

  const handleRegistrar = async () => {
    if (!placaInput.trim()) {
      setError('La placa es obligatoria')
      return
    }
    setError('')
    setSuccess('')
    try {
      await registrarEntrada.mutateAsync({
        placa: placaInput.trim().toUpperCase(),
        motivo: tipo || undefined,
        unidad_id: unidadId || undefined,
      })
      setPlacaInput(''); setTipo(''); setUnidadId('')
      setShowForm(false)
      setSuccess('Vehiculo registrado')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.message || 'Error al registrar vehiculo. Verifica permisos.')
    }
  }

  const handleSalida = async (id: string) => {
    await registrarSalida.mutateAsync(id)
    setConfirmId(null)
  }

  const getTipo = (motivo: string | null) => TIPOS.find(t => t.key === motivo) || { label: motivo || 'N/A', color: '#6B7280', bg: '#F3F4F6' }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px', border: '1px solid #C8D4CB', borderRadius: '12px',
    fontSize: '16px', color: '#0D1B2A', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontSize: '16px' }}>Cargando...</div>
  }

  return (
    <div style={{ paddingBottom: '100px' }}>
      {/* Error/Success toast */}
      {error && (
        <div style={{ backgroundColor: '#FEF2F2', borderLeft: '3px solid #DC2626', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', fontSize: '14px', color: '#DC2626', fontFamily: "'Inter', sans-serif" }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}
      {success && (
        <div style={{ backgroundColor: '#F0FDF4', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px', fontSize: '14px', color: '#1A7A4A', fontFamily: "'Inter', sans-serif" }}>
          {success}
        </div>
      )}
      {/* Counter */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A7A4A', fontFamily: "'Nunito', sans-serif" }}>{activos.length}</div>
        <div style={{ fontSize: '14px', color: '#5E6B62' }}>vehiculos dentro</div>
      </div>

      {/* Active vehicles list */}
      {activos.map(v => {
        const tipoInfo = getTipo(v.motivo || null)
        return (
          <div key={v.id} style={cardStyle} onClick={() => setConfirmId(v.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0D1B2A', fontFamily: "'Courier New', monospace", letterSpacing: '2px', marginBottom: '6px' }}>
                  {v.placa}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                    backgroundColor: tipoInfo.bg, color: tipoInfo.color, fontSize: '12px', fontWeight: 600,
                  }}>{tipoInfo.label}</span>
                  {v.conductor && <span style={{ fontSize: '13px', color: '#5E6B62' }}>{v.conductor}</span>}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#5E6B62', whiteSpace: 'nowrap' }}>{tiempoDesde(v.entrada_at)}</div>
            </div>
          </div>
        )
      })}

      {activos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5E6B62', fontSize: '14px' }}>No hay vehiculos registrados</div>
      )}

      {/* Confirm salida dialog */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0D1B2A', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>Registrar Salida?</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0D1B2A', fontFamily: "'Courier New', monospace", letterSpacing: '2px', marginBottom: '20px' }}>
              {activos.find(v => v.id === confirmId)?.placa}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmId(null)} style={{
                flex: 1, padding: '14px', border: '1px solid #C8D4CB', backgroundColor: 'white',
                borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', color: '#5E6B62', minHeight: '48px',
              }}>Cancelar</button>
              <button onClick={() => handleSalida(confirmId)} disabled={registrarSalida.isPending} style={{
                flex: 1, padding: '14px', border: 'none', backgroundColor: '#1A7A4A',
                borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', color: 'white', minHeight: '48px',
              }}>{registrarSalida.isPending ? 'Saliendo...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button onClick={() => setShowForm(true)} style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        padding: '14px 28px', backgroundColor: '#1A7A4A', color: 'white', border: 'none',
        borderRadius: '50px', fontSize: '16px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
        cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,122,74,0.4)', minHeight: '48px', zIndex: 100,
      }}>+ Registrar Vehiculo</button>

      {/* Form overlay */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#F4F7F5', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Registrar Vehiculo</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>

          <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              {/* Placa */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '6px' }}>Placa *</label>
              <input
                value={placaInput}
                onChange={e => setPlacaInput(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                style={{ ...inputStyle, marginBottom: '16px', fontFamily: "'Courier New', monospace", fontSize: '20px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}
              />

              {/* Tipo */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '8px' }}>Tipo</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {TIPOS.map(t => (
                  <button key={t.key} onClick={() => setTipo(t.key)} style={{
                    padding: '14px 8px', borderRadius: '12px', border: tipo === t.key ? `2px solid ${t.color}` : '1px solid #C8D4CB',
                    backgroundColor: tipo === t.key ? t.bg : 'white', cursor: 'pointer', textAlign: 'center',
                    fontSize: '14px', fontWeight: 600, color: tipo === t.key ? t.color : '#5E6B62', minHeight: '48px',
                    fontFamily: "'Inter', sans-serif",
                  }}>{t.label}</button>
                ))}
              </div>

              {/* Unidad */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '6px' }}>Unidad (opcional)</label>
              <select value={unidadId} onChange={e => setUnidadId(e.target.value)} style={{ ...inputStyle, marginBottom: '24px', backgroundColor: 'white' }}>
                <option value="">-- Seleccionar --</option>
                {(unidades || []).map(u => <option key={u.id} value={u.id}>{u.numero}</option>)}
              </select>

              {/* Error in form */}
              {error && (
                <div style={{ backgroundColor: '#FEF2F2', borderLeft: '3px solid #DC2626', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button onClick={handleRegistrar} disabled={!placaInput.trim() || registrarEntrada.isPending} style={{
                width: '100%', padding: '16px', backgroundColor: !placaInput.trim() ? '#C8D4CB' : '#1A7A4A', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                cursor: !placaInput.trim() ? 'not-allowed' : 'pointer', minHeight: '48px',
              }}>{registrarEntrada.isPending ? 'Registrando...' : 'Registrar Entrada'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
