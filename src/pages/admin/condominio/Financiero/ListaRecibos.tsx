import { useState } from 'react'
import { useRecibos } from '@/hooks/useRecibos'
import type { Recibo } from '@/hooks/useRecibos'
import { pdf } from '@react-pdf/renderer'
import ReciboPDF from '@/components/financiero/ReciboPDF'

interface Props {
  condominioId: string
  condominioNombre: string
  condominioDir?: string
  condomionioCiudad?: string
}

const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  pagado: { bg: '#E8F4F0', text: '#1A7A4A' },
  vencido: { bg: '#FCEAEA', text: '#B83232' },
  emitido: { bg: '#F0F0F0', text: '#5E6B62' },
  anulado: { bg: '#F0F0F0', text: '#999' },
}

const ESTADO_LABEL: Record<string, string> = {
  emitido: 'Emitido', pagado: 'Pagado', vencido: 'Vencido', anulado: 'Anulado',
}

function formatPeriodo(iso: string) {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const d = new Date(iso + 'T00:00:00')
  return `${meses[d.getMonth()]} ${d.getFullYear()}`
}


export default function ListaRecibos({ condominioId, condominioNombre, condominioDir, condomionioCiudad }: Props) {
  const { recibos, isLoading } = useRecibos(condominioId)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [generando, setGenerando] = useState<string | null>(null)

  const filtrados = filtroEstado === 'todos'
    ? recibos
    : recibos.filter(r => r.estado === filtroEstado)

  const handleVerPDF = async (recibo: Recibo) => {
    setGenerando(recibo.id)
    try {
      const blob = await pdf(
        <ReciboPDF
          condominio={{ nombre: condominioNombre, direccion: condominioDir, ciudad: condomionioCiudad }}
          unidad={{ numero: recibo.unidades?.numero || '', tipo: recibo.unidades?.tipo || '' }}
          residente={{ nombre: recibo.residentes?.nombre || '', apellido: recibo.residentes?.apellido || '' }}
          periodo={recibo.periodo}
          monto_base={recibo.monto_base}
          monto_recargo={recibo.monto_recargo}
          monto_total={recibo.monto_total}
          estado={recibo.estado}
          fecha_vencimiento={recibo.fecha_vencimiento}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generando PDF:', err)
    }
    setGenerando(null)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>
        Cargando recibos...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Recibos
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
            {recibos.length} recibo{recibos.length !== 1 ? 's' : ''} encontrado{recibos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtro estado */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['todos', 'emitido', 'pagado', 'vencido'].map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: filtroEstado === est ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                backgroundColor: filtroEstado === est ? '#1A7A4A' : '#F0F0F0',
                color: filtroEstado === est ? 'white' : '#5E6B62',
                transition: 'all 0.2s',
              }}
            >
              {est === 'todos' ? 'Todos' : ESTADO_LABEL[est]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtrados.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          padding: '40px',
          textAlign: 'center',
          color: '#5E6B62',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
        }}>
          No hay recibos{filtroEstado !== 'todos' ? ` con estado "${ESTADO_LABEL[filtroEstado]}"` : ''}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 1fr 0.8fr',
            padding: '12px 20px',
            backgroundColor: '#F4F7F5',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            color: '#5E6B62',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Unidad</span>
            <span>Residente</span>
            <span>Período</span>
            <span style={{ textAlign: 'right' }}>Monto</span>
            <span style={{ textAlign: 'center' }}>Estado</span>
            <span style={{ textAlign: 'center' }}>PDF</span>
          </div>

          {/* Rows */}
          {filtrados.map((recibo, i) => (
            <div
              key={recibo.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 1fr 0.8fr',
                padding: '14px 20px',
                alignItems: 'center',
                borderBottom: i < filtrados.length - 1 ? '1px solid #F0F0F0' : 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
              }}
            >
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>
                {recibo.unidades?.numero || '—'}
              </span>
              <span style={{ color: '#0D1117' }}>
                {recibo.residentes?.nombre} {recibo.residentes?.apellido}
              </span>
              <span style={{ color: '#5E6B62' }}>
                {formatPeriodo(recibo.periodo)}
              </span>
              <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>
                Bs. {Number(recibo.monto_total).toFixed(2)}
              </span>
              <span style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: ESTADO_COLORS[recibo.estado]?.bg || '#F0F0F0',
                  color: ESTADO_COLORS[recibo.estado]?.text || '#5E6B62',
                }}>
                  {ESTADO_LABEL[recibo.estado] || recibo.estado}
                </span>
              </span>
              <span style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleVerPDF(recibo)}
                  disabled={generando === recibo.id}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: generando === recibo.id ? '#5E6B62' : '#1A7A4A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: generando === recibo.id ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => { if (generando !== recibo.id) (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E' }}
                  onMouseLeave={e => { if (generando !== recibo.id) (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A' }}
                >
                  {generando === recibo.id ? '...' : 'Ver PDF'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
