import { useState } from 'react'
import { useAlertasGuardia } from '@/hooks/useAlertasGuardia'

interface Props { condominioId: string; guardiaId: string }

const TIPOS_ALERTA: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  ayuda: { label: 'Ayuda', color: '#EA580C', bg: '#FFF7ED' },
  paquete: { label: 'Paquete', color: '#2563EB', bg: '#EFF6FF' },
  ruido: { label: 'Ruido', color: '#CA8A04', bg: '#FEFCE8' },
  emergencia: { label: 'Emergencia', color: '#DC2626', bg: '#FEF2F2', pulse: true },
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export default function AlertasModule({ condominioId, guardiaId }: Props) {
  const { alertas, isLoading, pendientes, marcarAtendida } = useAlertasGuardia(condominioId)
  const [atendiendo, setAtendiendo] = useState<string | null>(null)

  const handleAtender = async (alertaId: string) => {
    setAtendiendo(alertaId)
    await marcarAtendida.mutateAsync({ alertaId, guardiaId })
    setAtendiendo(null)
  }

  const getTipo = (tipo: string) => TIPOS_ALERTA[tipo] || { label: tipo, color: '#6B7280', bg: '#F3F4F6' }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontSize: '16px' }}>Cargando...</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1B2A', margin: 0 }}>Alertas</h2>
        {pendientes > 0 && (
          <span style={{
            backgroundColor: '#DC2626', color: 'white', borderRadius: '20px',
            padding: '4px 12px', fontSize: '14px', fontWeight: 700, minWidth: '28px', textAlign: 'center',
          }}>{pendientes}</span>
        )}
      </div>

      {/* Alertas list */}
      {alertas.map(a => {
        const tipo = getTipo(a.tipo)
        const isPending = !a.atendida
        const isThisAtendiendo = atendiendo === a.id

        return (
          <div key={a.id} style={{
            backgroundColor: isPending ? 'white' : '#F9FAFB',
            borderRadius: '16px', padding: '16px', marginBottom: '12px',
            boxShadow: isPending ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
            borderLeft: isPending ? '4px solid #1A7A4A' : '4px solid transparent',
            opacity: isPending ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: isPending ? '#0D1B2A' : '#9CA3AF' }}>
                  {a.residentes?.nombre} {a.residentes?.apellido}
                </div>
                <div style={{ fontSize: '13px', color: '#5E6B62', marginTop: '2px' }}>
                  Unidad {a.unidades?.numero || '—'}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#5E6B62', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                {tiempoRelativo(a.created_at)}
              </div>
            </div>

            {/* Tipo badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: a.mensaje ? '8px' : '0' }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                backgroundColor: tipo.bg, color: tipo.color, fontSize: '12px', fontWeight: 700,
                animation: tipo.pulse && isPending ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}>{tipo.label}</span>
              {!isPending && (
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Atendida</span>
              )}
            </div>

            {/* Mensaje */}
            {a.mensaje && (
              <div style={{ fontSize: '14px', color: isPending ? '#374151' : '#9CA3AF', marginTop: '6px', lineHeight: '1.4' }}>
                {a.mensaje}
              </div>
            )}

            {/* Atender button */}
            {isPending && (
              <button onClick={() => handleAtender(a.id)} disabled={isThisAtendiendo} style={{
                marginTop: '12px', width: '100%', padding: '12px', backgroundColor: '#1A7A4A', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
                fontFamily: "'Nunito', sans-serif", cursor: 'pointer', minHeight: '48px',
              }}>{isThisAtendiendo ? 'Marcando...' : 'Atendido'}</button>
            )}
          </div>
        )
      })}

      {alertas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5E6B62', fontSize: '14px' }}>No hay alertas</div>
      )}

      {/* Pulse animation via style tag */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
