import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Residente } from '@/hooks/useResidentes'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  moroso: { bg: '#FCEAEA', text: '#B83232', label: 'Moroso' },
  inactivo: { bg: '#F0F0F0', text: '#5E6B62', label: 'Inactivo' },
}

const TIPO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  propietario: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Propietario' },
  inquilino: { bg: '#F5ECFF', text: '#7B1AC8', label: 'Inquilino' },
}

const PAGO_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pagado: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Al dia' },
  vencido: { bg: '#FCEAEA', text: '#B83232', label: 'Moroso' },
  emitido: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  sin_recibo: { bg: '#F0F0F0', text: '#5E6B62', label: 'Sin recibo' },
}

type FiltroPago = 'todos' | 'al_dia' | 'pendiente' | 'morosos'

interface Props {
  residentes: Residente[]
  condominioId: string
  onNuevo: () => void
  onImportar: () => void
  onDetalle: (id: string) => void
  onEditar: (id: string) => void
  onRegistrarPago?: (id: string) => void
}

export default function ListaResidentes({ residentes, condominioId, onNuevo, onImportar, onDetalle, onEditar: _onEditar, onRegistrarPago }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('todos')

  // Fetch recibos for current period to determine payment status
  const { data: recibosData = [] } = useQuery({
    queryKey: ['recibos-lista', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recibos')
        .select('residente_id, estado')
        .eq('condominio_id', condominioId)
      if (error) throw error
      return data || []
    },
    enabled: !!condominioId,
  })

  // Build a map: residente_id -> payment status
  const pagoStatusMap = new Map<string, string>()
  for (const recibo of recibosData) {
    const current = pagoStatusMap.get(recibo.residente_id)
    // Priority: vencido > emitido > pagado
    if (!current) {
      pagoStatusMap.set(recibo.residente_id, recibo.estado)
    } else if (recibo.estado === 'vencido') {
      pagoStatusMap.set(recibo.residente_id, 'vencido')
    } else if (recibo.estado === 'emitido' && current !== 'vencido') {
      pagoStatusMap.set(recibo.residente_id, 'emitido')
    }
    // pagado doesn't override anything
  }

  const getPaymentStatus = (residenteId: string): string => {
    return pagoStatusMap.get(residenteId) || 'sin_recibo'
  }

  const filtrados = residentes.filter(r => {
    const matchBusqueda = `${r.nombre} ${r.apellido} ${r.email || ''} ${r.ci || ''} ${r.unidades?.numero || ''}`.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado

    let matchPago = true
    if (filtroPago === 'morosos') {
      matchPago = getPaymentStatus(r.id) === 'vencido'
    } else if (filtroPago === 'al_dia') {
      matchPago = getPaymentStatus(r.id) === 'pagado'
    } else if (filtroPago === 'pendiente') {
      matchPago = getPaymentStatus(r.id) === 'emitido'
    }

    return matchBusqueda && matchTipo && matchEstado && matchPago
  })

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    backgroundColor: active ? '#1A7A4A' : '#F4F7F5',
    color: active ? 'white' : '#5E6B62',
    transition: 'background-color 0.15s, color 0.15s',
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Residentes
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
            {residentes.length} residente{residentes.length !== 1 ? 's' : ''} registrado{residentes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onImportar}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0D4A8F',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#1060B0'}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#0D4A8F'}
          >
            Importar Excel
          </button>
          <button
            onClick={onNuevo}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1A7A4A',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E'}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A'}
          >
            + Nuevo residente
          </button>
        </div>
      </div>

      {/* Filter buttons row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => { setFiltroPago('todos'); setFiltroTipo('todos') }} style={filterBtnStyle(filtroPago === 'todos' && filtroTipo === 'todos')}>
          Todos
        </button>
        <button onClick={() => { setFiltroPago('al_dia'); setFiltroTipo('todos') }} style={filterBtnStyle(filtroPago === 'al_dia')}>
          Al dia
        </button>
        <button onClick={() => { setFiltroPago('pendiente'); setFiltroTipo('todos') }} style={filterBtnStyle(filtroPago === 'pendiente')}>
          Pendiente
        </button>
        <button onClick={() => { setFiltroPago('morosos'); setFiltroTipo('todos') }} style={filterBtnStyle(filtroPago === 'morosos')}>
          Moroso
        </button>
      </div>

      {/* Search + estado filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, CI, unidad o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            border: '1px solid #C8D4CB',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            color: '#0D1117',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#1A7A4A'}
          onBlur={e => e.target.style.borderColor = '#C8D4CB'}
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white' }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="moroso">Morosos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Table */}
      {filtrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
          {residentes.length === 0 ? 'No hay residentes registrados' : 'No se encontraron resultados'}
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr',
            padding: '12px 20px',
            backgroundColor: '#F4F7F5',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            color: '#5E6B62',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Nombre</span>
            <span>Tipo</span>
            <span>Unidad</span>
            <span>Estado</span>
            <span>Pago</span>
            <span>Contacto</span>
            <span style={{ textAlign: 'center' }}>Acciones</span>
          </div>

          {filtrados.map((r, i) => {
            const tipo = TIPO_STYLE[r.tipo] || TIPO_STYLE.propietario
            const estado = ESTADO_STYLE[r.estado] || ESTADO_STYLE.activo
            const pagoStatus = getPaymentStatus(r.id)
            const pago = PAGO_STATUS[pagoStatus] || PAGO_STATUS.sin_recibo
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 0.7fr 1fr 0.8fr',
                  padding: '14px 20px',
                  alignItems: 'center',
                  borderBottom: i < filtrados.length - 1 ? '1px solid #F0F0F0' : 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                }}
              >
                <span>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>
                    {r.nombre} {r.apellido}
                  </div>
                  {r.ci && <div style={{ fontSize: '11px', color: '#5E6B62' }}>CI: {r.ci}</div>}
                </span>
                <span>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: tipo.bg, color: tipo.text }}>
                    {tipo.label}
                  </span>
                </span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>
                  {r.unidades?.numero || '\u2014'}
                </span>
                <span>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: estado.bg, color: estado.text }}>
                    {estado.label}
                  </span>
                </span>
                <span>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: pago.bg, color: pago.text }}>
                    {pago.label}
                  </span>
                </span>
                <span style={{ fontSize: '12px', color: '#5E6B62' }}>
                  {r.email && <div>{r.email}</div>}
                  {r.telefono && <div>{r.telefono}</div>}
                </span>
                <span style={{ textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onDetalle(r.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    Ver
                  </button>
                  {onRegistrarPago && (pagoStatus === 'emitido' || pagoStatus === 'vencido') && (
                    <button
                      onClick={() => onRegistrarPago(r.id)}
                      style={{ padding: '5px 10px', backgroundColor: '#FEF9EC', color: '#C07A2E', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                    >
                      Registrar pago
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
