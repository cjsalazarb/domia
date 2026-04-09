import { useState } from 'react'
import { useMantenimientos, useProveedores } from '@/hooks/useMantenimientos'

const ESTADOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente', bg: '#FEF9EC', text: '#C07A2E' },
  { key: 'asignado', label: 'Asignado', bg: '#EBF4FF', text: '#0D4A8F' },
  { key: 'en_proceso', label: 'En proceso', bg: '#F5ECFF', text: '#7B1AC8' },
  { key: 'resuelto', label: 'Resuelto', bg: '#E8F4F0', text: '#1A7A4A' },
  { key: 'cancelado', label: 'Cancelado', bg: '#F0F0F0', text: '#5E6B62' },
]

const PRIORIDAD_STYLE: Record<string, { bg: string; text: string }> = {
  baja: { bg: '#E8F4F0', text: '#1A7A4A' },
  media: { bg: '#FEF9EC', text: '#C07A2E' },
  alta: { bg: '#FCEAEA', text: '#B83232' },
  urgente: { bg: '#FCEAEA', text: '#B83232' },
}

interface Props { condominioId: string }

export default function GestionTickets({ condominioId }: Props) {
  const { tickets, isLoading, actualizar } = useMantenimientos(condominioId)
  const { proveedores } = useProveedores(condominioId)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [costo, setCosto] = useState('')
  const [notasRes, setNotasRes] = useState('')

  const filtrados = filtroEstado === 'todos' ? tickets : tickets.filter(t => t.estado === filtroEstado)

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando tickets...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Tickets de Mantenimiento</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {ESTADOS.map(e => (
          <button key={e.key} onClick={() => setFiltroEstado(e.key)} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px',
            fontWeight: filtroEstado === e.key ? 600 : 400, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            backgroundColor: filtroEstado === e.key ? '#1A7A4A' : '#F0F0F0', color: filtroEstado === e.key ? 'white' : '#5E6B62',
          }}>{e.label}</button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay tickets</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrados.map(t => {
            const est = ESTADOS.find(e => e.key === t.estado) || ESTADOS[1]
            const prio = PRIORIDAD_STYLE[t.prioridad] || PRIORIDAD_STYLE.media
            const isExpanded = expandedId === t.id

            return (
              <div key={t.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{t.titulo}</div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '4px' }}>
                      {t.unidades ? `Unidad ${(t.unidades as { numero: string }).numero}` : t.area_comun || '—'}
                      {' · '}Solicitado por: {(t.profiles as { nombre: string; apellido: string } | null)?.nombre || '—'} {(t.profiles as { nombre: string; apellido: string } | null)?.apellido || ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: prio.bg, color: prio.text, textTransform: 'capitalize' }}>{t.prioridad}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: (est as typeof ESTADOS[1]).bg, color: (est as typeof ESTADOS[1]).text }}>{est.label}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #F0F0F0', paddingTop: '16px' }}>
                    <p style={{ fontSize: '13px', color: '#0D1117', lineHeight: 1.6, marginBottom: '16px' }}>{t.descripcion}</p>

                    {t.foto_url && (
                      <div style={{ marginBottom: '16px' }}>
                        <img src={t.foto_url} alt="Foto" style={{ maxWidth: '200px', borderRadius: '10px' }} />
                      </div>
                    )}

                    <div style={{ fontSize: '11px', color: '#5E6B62', marginBottom: '16px' }}>
                      Creado: {new Date(t.created_at).toLocaleDateString('es-BO')}
                      {t.proveedores && <> · Proveedor: {(t.proveedores as { nombre: string }).nombre}</>}
                      {t.costo && <> · Costo: Bs. {Number(t.costo).toFixed(2)}</>}
                    </div>

                    {/* Actions */}
                    {t.estado !== 'resuelto' && t.estado !== 'cancelado' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px' }}>
                        {/* Assign provider */}
                        {t.estado === 'pendiente' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) actualizar.mutate({ id: t.id, asignado_a: e.target.value, estado: 'asignado' })
                              }}
                              style={{ flex: 1, padding: '8px 12px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif", backgroundColor: 'white' }}
                            >
                              <option value="">Asignar proveedor...</option>
                              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.rubro}</option>)}
                            </select>
                          </div>
                        )}

                        {/* Change status */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {t.estado === 'asignado' && (
                            <button onClick={() => actualizar.mutate({ id: t.id, estado: 'en_proceso' })}
                              style={{ padding: '6px 14px', backgroundColor: '#7B1AC8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              → En proceso
                            </button>
                          )}
                          {(t.estado === 'en_proceso' || t.estado === 'asignado') && (
                            <>
                              <input type="number" placeholder="Costo Bs." value={costo} onChange={e => setCosto(e.target.value)}
                                style={{ width: '100px', padding: '6px 10px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif" }} />
                              <input type="text" placeholder="Notas resolución" value={notasRes} onChange={e => setNotasRes(e.target.value)}
                                style={{ flex: 1, minWidth: '120px', padding: '6px 10px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif" }} />
                              <button onClick={() => { actualizar.mutate({ id: t.id, estado: 'resuelto', costo: parseFloat(costo) || 0, notas_resolucion: notasRes }); setCosto(''); setNotasRes('') }}
                                style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                ✓ Resolver
                              </button>
                            </>
                          )}
                          <button onClick={() => actualizar.mutate({ id: t.id, estado: 'cancelado' })}
                            style={{ padding: '6px 14px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {t.notas_resolucion && (
                      <div style={{ marginTop: '12px', backgroundColor: '#E8F4F0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1A7A4A' }}>
                        <strong>Resolución:</strong> {t.notas_resolucion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
