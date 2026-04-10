import { useState } from 'react'
import { useNovedades } from '@/hooks/useGuardias'

interface Props { turnoId: string; guardiaId: string; condominioId: string }

export default function LibroNovedades({ turnoId, guardiaId, condominioId }: Props) {
  const { novedades, crear } = useNovedades(turnoId, guardiaId, condominioId)
  const [texto, setTexto] = useState('')

  const handleSubmit = async () => {
    if (!texto.trim()) return
    await crear.mutateAsync(texto.trim())
    setTexto('')
  }

  return (
    <div>
      {/* Input */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>📋 Libro de Novedades</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Registrar novedad..."
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            style={{
              flex: 1, padding: '14px 16px', border: '1px solid #C8D4CB', borderRadius: '12px',
              fontSize: '15px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!texto.trim() || crear.isPending}
            style={{
              padding: '14px 20px', backgroundColor: !texto.trim() ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
              borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
              cursor: !texto.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {crear.isPending ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Log */}
      {novedades.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <h4 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
            Novedades del turno ({novedades.length})
          </h4>
          {novedades.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F0F0F0', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ fontSize: '12px', color: '#1A7A4A', fontWeight: 600, fontFamily: "'Nunito', sans-serif", whiteSpace: 'nowrap', minWidth: '50px' }}>
                {new Date(n.hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '14px', color: '#0D1117' }}>{n.descripcion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
