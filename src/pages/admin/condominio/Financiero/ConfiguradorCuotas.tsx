import { useState, useEffect } from 'react'
import { useCuotas } from '@/hooks/useCuotas'

const TIPOS_UNIDAD = [
  { key: 'apartamento', label: 'Apartamento', icon: '🏢' },
  { key: 'local_comercial', label: 'Local Comercial', icon: '🏪' },
  { key: 'parqueo', label: 'Parqueo', icon: '🚗' },
  { key: 'bodega', label: 'Bodega', icon: '📦' },
]

interface Props {
  condominioId: string
}

export default function ConfiguradorCuotas({ condominioId }: Props) {
  const { cuotasActuales, cuotas, isLoading, upsertCuota } = useCuotas(condominioId)
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [historialTipo, setHistorialTipo] = useState<string | null>(null)

  useEffect(() => {
    const initial: Record<string, string> = {}
    TIPOS_UNIDAD.forEach(t => {
      initial[t.key] = cuotasActuales[t.key]?.monto?.toString() || ''
    })
    setMontos(initial)
  }, [cuotasActuales])

  const handleSave = async (tipoUnidad: string) => {
    const monto = parseFloat(montos[tipoUnidad])
    if (isNaN(monto) || monto <= 0) return

    setSaving(tipoUnidad)
    setSuccess(null)
    try {
      await upsertCuota.mutateAsync({ tipo_unidad: tipoUnidad, monto })
      setSuccess(tipoUnidad)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      // error handled by mutation
    }
    setSaving(null)
  }

  const historial = historialTipo
    ? cuotas.filter(c => c.tipo_unidad === historialTipo).slice(0, 10)
    : []

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>
        Cargando cuotas...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
          Configurar Cuotas Mensuales
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
          Define el monto mensual por tipo de unidad (en Bolivianos)
        </p>
      </div>

      {/* Grid de tipos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {TIPOS_UNIDAD.map(tipo => (
          <div
            key={tipo.key}
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '24px',
              border: success === tipo.key ? '2px solid #1A7A4A' : '1px solid rgba(200,212,203,0.3)',
              transition: 'border-color 0.3s',
            }}
          >
            {/* Tipo header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>{tipo.icon}</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                {tipo.label}
              </span>
            </div>

            {/* Input monto */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#5E6B62', marginBottom: '6px' }}>
                Monto mensual (Bs.)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montos[tipo.key] || ''}
                  onChange={e => setMontos(prev => ({ ...prev, [tipo.key]: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid #C8D4CB',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    color: '#0D1117',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1A7A4A'}
                  onBlur={e => e.target.style.borderColor = '#C8D4CB'}
                />
                <button
                  onClick={() => handleSave(tipo.key)}
                  disabled={saving === tipo.key || !montos[tipo.key]}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: saving === tipo.key ? '#5E6B62' : '#1A7A4A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: saving === tipo.key ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (saving !== tipo.key) (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E' }}
                  onMouseLeave={e => { if (saving !== tipo.key) (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A' }}
                >
                  {saving === tipo.key ? '...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Success feedback */}
            {success === tipo.key && (
              <div style={{
                backgroundColor: '#E8F4F0',
                borderLeft: '3px solid #1A7A4A',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                color: '#1A7A4A',
                marginBottom: '8px',
              }}>
                Cuota actualizada correctamente
              </div>
            )}

            {/* Current cuota info */}
            {cuotasActuales[tipo.key] && (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62' }}>
                Vigente desde: {new Date(cuotasActuales[tipo.key].vigente_desde).toLocaleDateString('es-BO')}
              </div>
            )}

            {/* Historial link */}
            <button
              onClick={() => setHistorialTipo(historialTipo === tipo.key ? null : tipo.key)}
              style={{
                marginTop: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#1A7A4A',
                padding: 0,
              }}
            >
              {historialTipo === tipo.key ? '▾ Ocultar historial' : '▸ Ver historial'}
            </button>

            {/* Historial inline */}
            {historialTipo === tipo.key && historial.length > 0 && (
              <div style={{
                marginTop: '12px',
                backgroundColor: '#F4F7F5',
                borderRadius: '10px',
                padding: '12px',
              }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Historial de cambios
                </div>
                {historial.map(h => (
                  <div key={h.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(200,212,203,0.3)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                  }}>
                    <span style={{ color: '#0D1117', fontWeight: 600, fontFamily: "'Nunito', sans-serif" }}>
                      Bs. {Number(h.monto).toFixed(2)}
                    </span>
                    <span style={{ color: '#5E6B62' }}>
                      {new Date(h.vigente_desde).toLocaleDateString('es-BO')}
                    </span>
                  </div>
                ))}
                {historial.length === 0 && (
                  <div style={{ color: '#5E6B62', fontSize: '12px' }}>Sin historial</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
