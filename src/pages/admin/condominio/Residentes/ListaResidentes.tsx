import { useState } from 'react'
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

interface Props {
  residentes: Residente[]
  onNuevo: () => void
  onDetalle: (id: string) => void
  onEditar: (id: string) => void
}

export default function ListaResidentes({ residentes, onNuevo, onDetalle, onEditar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const filtrados = residentes.filter(r => {
    const matchBusqueda = `${r.nombre} ${r.apellido} ${r.email || ''}`.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    return matchBusqueda && matchTipo && matchEstado
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
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
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white' }}
        >
          <option value="todos">Todos los tipos</option>
          <option value="propietario">Propietarios</option>
          <option value="inquilino">Inquilinos</option>
        </select>
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
            gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 1.2fr 0.8fr',
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
            <span>Contacto</span>
            <span style={{ textAlign: 'center' }}>Acciones</span>
          </div>

          {filtrados.map((r, i) => {
            const tipo = TIPO_STYLE[r.tipo] || TIPO_STYLE.propietario
            const estado = ESTADO_STYLE[r.estado] || ESTADO_STYLE.activo
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 1.2fr 0.8fr',
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
                  {r.unidades?.numero || '—'}
                </span>
                <span>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: estado.bg, color: estado.text }}>
                    {estado.label}
                  </span>
                </span>
                <span style={{ fontSize: '12px', color: '#5E6B62' }}>
                  {r.email && <div>{r.email}</div>}
                  {r.telefono && <div>{r.telefono}</div>}
                </span>
                <span style={{ textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    onClick={() => onDetalle(r.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => onEditar(r.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    Editar
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
