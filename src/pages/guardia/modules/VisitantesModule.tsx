import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useVisitantes } from '@/hooks/useVisitantes'

interface Props { condominioId: string; guardiaId: string }

const MOTIVOS = [
  { key: 'visita', label: 'Visita', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'delivery', label: 'Delivery', color: '#EA580C', bg: '#FFF7ED' },
  { key: 'servicio', label: 'Servicio', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'otro', label: 'Otro', color: '#6B7280', bg: '#F3F4F6' },
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

export default function VisitantesModule({ condominioId, guardiaId }: Props) {
  const { activos, isLoading, registrarIngreso, registrarSalida } = useVisitantes(condominioId, guardiaId)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Form state
  const [nombre, setNombre] = useState('')
  const [unidadId, setUnidadId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [placa, setPlaca] = useState('')

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
    if (!nombre.trim()) return
    await registrarIngreso.mutateAsync({
      nombre: nombre.trim(),
      unidad_id: unidadId || undefined,
      motivo: motivo || undefined,
      ci: placa ? `PLACA:${placa}` : undefined,
    })
    setNombre(''); setUnidadId(''); setMotivo(''); setPlaca('')
    setShowForm(false)
  }

  const handleSalida = async (id: string) => {
    await registrarSalida.mutateAsync(id)
    setConfirmId(null)
  }

  const motivoInfo = (m: string | null) => MOTIVOS.find(x => x.key === m) || MOTIVOS[3]

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
      {/* Counter */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A7A4A', fontFamily: "'Nunito', sans-serif" }}>{activos.length}</div>
        <div style={{ fontSize: '14px', color: '#5E6B62' }}>visitantes dentro</div>
      </div>

      {/* Active visitors list */}
      {activos.map(v => {
        const mi = motivoInfo(v.motivo)
        return (
          <div key={v.id} style={cardStyle} onClick={() => setConfirmId(v.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0D1B2A', marginBottom: '4px' }}>{v.nombre}</div>
                <div style={{ fontSize: '13px', color: '#5E6B62', marginBottom: '6px' }}>
                  {v.unidades?.numero ? `Unidad ${v.unidades.numero}` : 'Sin unidad'}
                </div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                  backgroundColor: mi.bg, color: mi.color, fontSize: '12px', fontWeight: 600,
                }}>{mi.label}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#5E6B62', whiteSpace: 'nowrap' }}>{tiempoDesde(v.ingreso_at)}</div>
            </div>
          </div>
        )
      })}

      {activos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5E6B62', fontSize: '14px' }}>No hay visitantes registrados</div>
      )}

      {/* Confirm salida dialog */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0D1B2A', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>Registrar Salida?</div>
            <div style={{ fontSize: '14px', color: '#5E6B62', marginBottom: '20px' }}>
              {activos.find(v => v.id === confirmId)?.nombre}
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
      }}>+ Nuevo Visitante</button>

      {/* Form overlay */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#F4F7F5', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Nuevo Visitante</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
          </div>

          <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              {/* Nombre */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '6px' }}>Nombre *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del visitante" style={{ ...inputStyle, marginBottom: '16px' }} />

              {/* Unidad */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '6px' }}>Unidad que visita</label>
              <select value={unidadId} onChange={e => setUnidadId(e.target.value)} style={{ ...inputStyle, marginBottom: '16px', backgroundColor: 'white' }}>
                <option value="">-- Seleccionar --</option>
                {(unidades || []).map(u => <option key={u.id} value={u.id}>{u.numero}</option>)}
              </select>

              {/* Motivo */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '8px' }}>Motivo</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {MOTIVOS.map(m => (
                  <button key={m.key} onClick={() => setMotivo(m.key)} style={{
                    padding: '14px 8px', borderRadius: '12px', border: motivo === m.key ? `2px solid ${m.color}` : '1px solid #C8D4CB',
                    backgroundColor: motivo === m.key ? m.bg : 'white', cursor: 'pointer', textAlign: 'center',
                    fontSize: '14px', fontWeight: 600, color: motivo === m.key ? m.color : '#5E6B62', minHeight: '48px',
                    fontFamily: "'Inter', sans-serif",
                  }}>{m.label}</button>
                ))}
              </div>

              {/* Placa */}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0D1B2A', marginBottom: '6px' }}>Placa vehiculo (opcional)</label>
              <input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC-1234" style={{ ...inputStyle, marginBottom: '24px', textTransform: 'uppercase' }} />

              {/* Submit */}
              <button onClick={handleRegistrar} disabled={!nombre.trim() || registrarIngreso.isPending} style={{
                width: '100%', padding: '16px', backgroundColor: !nombre.trim() ? '#C8D4CB' : '#1A7A4A', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                cursor: !nombre.trim() ? 'not-allowed' : 'pointer', minHeight: '48px',
              }}>{registrarIngreso.isPending ? 'Registrando...' : 'Registrar Ingreso'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
