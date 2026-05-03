import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Props { condominioId: string }

interface MarcacionRow {
  id: string
  tipo: 'entrada' | 'salida'
  foto_url: string | null
  latitud: number | null
  longitud: number | null
  created_at: string
  guardias: { nombre: string; apellido: string; codigo_guardia: string | null }
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

export default function Marcaciones({ condominioId }: Props) {
  const [filtroGuardia, setFiltroGuardia] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida'>('todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [detalle, setDetalle] = useState<MarcacionRow | null>(null)

  const { data: guardias } = useQuery({
    queryKey: ['guardias-list', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('guardias').select('id, nombre, apellido, codigo_guardia').eq('condominio_id', condominioId).order('nombre')
      if (error) throw error
      return data as { id: string; nombre: string; apellido: string; codigo_guardia: string | null }[]
    },
    enabled: !!condominioId,
  })

  const { data: marcaciones, isLoading } = useQuery({
    queryKey: ['marcaciones-admin', condominioId, filtroGuardia, filtroTipo, filtroFecha],
    queryFn: async () => {
      let q = supabase.from('marcaciones_guardia')
        .select('id, tipo, foto_url, latitud, longitud, created_at, guardias(nombre, apellido, codigo_guardia)')
        .eq('condominio_id', condominioId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filtroGuardia) q = q.eq('guardia_id', filtroGuardia)
      if (filtroTipo !== 'todos') q = q.eq('tipo', filtroTipo)
      if (filtroFecha) {
        q = q.gte('created_at', `${filtroFecha}T00:00:00`).lte('created_at', `${filtroFecha}T23:59:59`)
      }

      const { data, error } = await q
      if (error) throw error
      // Supabase returns joined table as object (single FK), cast safely
      return (data || []) as unknown as MarcacionRow[]
    },
    enabled: !!condominioId,
  })

  const labelStyle = { fontSize: '12px', fontWeight: 500 as const, color: '#5E6B62', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }
  const selectStyle = { padding: '8px 12px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '13px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none' }

  return (
    <div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>Marcaciones</h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '16px' }}>Registro de entradas y salidas con selfie y GPS</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={labelStyle}>Guardia</div>
          <select value={filtroGuardia} onChange={e => setFiltroGuardia(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>
            {(guardias || []).map(g => <option key={g.id} value={g.id}>{g.nombre} {g.apellido}</option>)}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Tipo</div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)} style={selectStyle}>
            <option value="todos">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </div>
        <div>
          <div style={labelStyle}>Fecha</div>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} style={selectStyle} />
        </div>
        {(filtroGuardia || filtroTipo !== 'todos' || filtroFecha) && (
          <button onClick={() => { setFiltroGuardia(''); setFiltroTipo('todos'); setFiltroFecha('') }} style={{ padding: '8px 12px', backgroundColor: '#F4F7F5', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#5E6B62', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Limpiar</button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontSize: '14px' }}>Cargando...</div>
      ) : !marcaciones || marcaciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontSize: '14px', backgroundColor: 'white', borderRadius: '16px' }}>No hay marcaciones registradas</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F7F5' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5E6B62' }}>Foto</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5E6B62' }}>Guardia</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5E6B62' }}>Tipo</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5E6B62' }}>Fecha y hora</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5E6B62' }}>GPS</th>
              </tr>
            </thead>
            <tbody>
              {marcaciones.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '10px 16px' }}>
                    {m.foto_url ? (
                      <img
                        src={m.foto_url}
                        alt="Selfie"
                        onClick={() => setDetalle(m)}
                        style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', cursor: 'pointer', border: '1px solid #C8D4CB' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8D4CB', fontSize: 18 }}>—</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0D1117' }}>{m.guardias?.nombre} {m.guardias?.apellido}</div>
                    {m.guardias?.codigo_guardia && <div style={{ fontSize: '11px', color: '#B83232', marginTop: 2 }}>{m.guardias.codigo_guardia}</div>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                      backgroundColor: m.tipo === 'entrada' ? '#E8F4F0' : '#FCEAEA',
                      color: m.tipo === 'entrada' ? '#1A7A4A' : '#B83232',
                    }}>{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#0D1117' }}>
                    <div>{formatFecha(m.created_at)}</div>
                    <div style={{ fontSize: '12px', color: '#5E6B62' }}>{formatHora(m.created_at)}</div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {m.latitud && m.longitud ? (
                      <a
                        href={`https://maps.google.com/?q=${m.latitud},${m.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0D4A8F', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                      >Ver ubicacion</a>
                    ) : (
                      <span style={{ color: '#C8D4CB', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detalle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setDetalle(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            {detalle.foto_url && (
              <img src={detalle.foto_url} alt="Selfie completa" style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '360px', objectFit: 'cover' }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>
                  {detalle.guardias?.nombre} {detalle.guardias?.apellido}
                </div>
                {detalle.guardias?.codigo_guardia && (
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#B83232', marginTop: '2px' }}>{detalle.guardias.codigo_guardia}</div>
                )}
              </div>
              <span style={{
                padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                backgroundColor: detalle.tipo === 'entrada' ? '#E8F4F0' : '#FCEAEA',
                color: detalle.tipo === 'entrada' ? '#1A7A4A' : '#B83232',
              }}>{detalle.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', marginBottom: '8px' }}>
              {formatFecha(detalle.created_at)} a las {formatHora(detalle.created_at)}
            </div>
            {detalle.latitud && detalle.longitud && (
              <a
                href={`https://maps.google.com/?q=${detalle.latitud},${detalle.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#EBF4FF', color: '#0D4A8F', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginTop: '4px' }}
              >Ver ubicacion en Google Maps</a>
            )}
            <button onClick={() => setDetalle(null)} style={{ display: 'block', width: '100%', marginTop: '16px', padding: '12px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
