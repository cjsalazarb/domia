import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEdificios, useUnidades, useDocumentos } from '@/hooks/useCondominios'
import { useAreasComunes } from '@/hooks/useReservas'
import { useCuotas } from '@/hooks/useCuotas'
import ImportarResidentes from '@/pages/admin/condominio/Residentes/ImportarResidentes'

type Tab = 'edificios' | 'unidades' | 'areas' | 'documentos' | 'config'

interface Props { condominioId: string; onBack: () => void }

const iS = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }
const lS = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }
const TIPOS = ['apartamento', 'local_comercial', 'parqueo', 'bodega', 'casa']

function TabEdificios({ condominioId }: { condominioId: string }) {
  const { edificios, crear } = useEdificios(condominioId)
  const [show, setShow] = useState(false); const [n, setN] = useState(''); const [p, setP] = useState('1')
  const save = async () => { await crear.mutateAsync({ nombre: n, numero_pisos: parseInt(p) || 1 }); setN(''); setP('1'); setShow(false) }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Edificios / Torres</h3>
        <button onClick={() => setShow(!show)} style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{show ? 'Cancelar' : '+ Agregar'}</button>
      </div>
      {show && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={n} onChange={e => setN(e.target.value)} placeholder="Nombre (Ej: Torre A)" style={{ ...iS, flex: 1, minWidth: '150px' }} />
          <input type="number" value={p} onChange={e => setP(e.target.value)} placeholder="Pisos" min="1" style={{ ...iS, width: '80px' }} />
          <button onClick={save} disabled={!n} style={{ padding: '10px 18px', backgroundColor: !n ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: !n ? 'not-allowed' : 'pointer' }}>Guardar</button>
        </div>
      )}
      {edificios.length === 0 ? <div style={{ color: '#5E6B62', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin edificios</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {edificios.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F4F7F5', borderRadius: '10px' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{e.nombre}</span>
              <span style={{ fontSize: '12px', color: '#5E6B62' }}>{e.numero_pisos} piso{e.numero_pisos !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabUnidades({ condominioId }: { condominioId: string }) {
  const { unidades, crear, eliminar } = useUnidades(condominioId)
  const { edificios } = useEdificios(condominioId)
  const [show, setShow] = useState(false); const [edId, setEdId] = useState(''); const [num, setNum] = useState('')
  const [piso, setPiso] = useState(''); const [tipo, setTipo] = useState('apartamento'); const [area, setArea] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: condoNombre } = useQuery({
    queryKey: ['condo-nombre-tab', condominioId],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre').eq('id', condominioId).single()
      return data?.nombre || ''
    },
    enabled: !!condominioId,
  })

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      await crear.mutateAsync({ edificio_id: edId, numero: num, piso: piso ? parseInt(piso) : undefined, tipo, area_m2: area ? parseFloat(area) : undefined })
      setNum(''); setPiso(''); setArea('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar unidad')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta unidad?')) return
    try { await eliminar.mutateAsync(id) } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  if (showImport) {
    return (
      <ImportarResidentes
        condominioId={condominioId}
        condominioNombre={condoNombre || ''}
        onBack={() => setShowImport(false)}
        onComplete={() => setShowImport(false)}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Unidades ({unidades.length})</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowImport(true)} style={{ padding: '6px 14px', backgroundColor: '#0D4A8F', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Importar Excel</button>
          <button onClick={() => { setShow(!show); setError('') }} style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{show ? 'Cancelar' : '+ Agregar'}</button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
          {error}
        </div>
      )}

      {show && (
        <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr 1fr 0.7fr', gap: '8px', marginBottom: '12px' }}>
            <div><label style={lS}>Edificio *</label><select value={edId} onChange={e => setEdId(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}><option value="">— Seleccionar —</option>{edificios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
            <div><label style={lS}>Numero *</label><input value={num} onChange={e => setNum(e.target.value)} placeholder="Ej: 101" style={iS} /></div>
            <div><label style={lS}>Piso</label><input type="number" value={piso} onChange={e => setPiso(e.target.value)} placeholder="1" style={iS} /></div>
            <div><label style={lS}>Tipo</label><select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}>{TIPOS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div><label style={lS}>m²</label><input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="80" style={iS} /></div>
          </div>
          <button onClick={save} disabled={!edId || !num || saving} style={{
            padding: '8px 20px', backgroundColor: (!edId || !num || saving) ? '#C8D4CB' : '#1A7A4A', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
            cursor: (!edId || !num || saving) ? 'not-allowed' : 'pointer',
          }}>{saving ? 'Guardando...' : 'Agregar unidad'}</button>
          {edificios.length === 0 && <p style={{ fontSize: '12px', color: '#C07A2E', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }}>Primero crea un edificio en la tab "Edificios"</p>}
        </div>
      )}

      {unidades.length === 0 ? <div style={{ color: '#5E6B62', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin unidades</div> : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E8F4F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr 0.8fr 0.6fr 0.5fr', padding: '10px 16px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Numero</span><span>Edificio</span><span>Piso</span><span>Tipo</span><span>m²</span><span></span>
          </div>
          {unidades.map((u, i) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr 0.8fr 0.6fr 0.5fr', padding: '10px 16px', fontSize: '13px', borderBottom: i < unidades.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{u.numero}</span>
              <span style={{ color: '#5E6B62' }}>{(u.edificios as { nombre: string } | null)?.nombre || '—'}</span>
              <span style={{ color: '#5E6B62' }}>{u.piso || '—'}</span>
              <span style={{ color: '#5E6B62', textTransform: 'capitalize' }}>{u.tipo.replace('_', ' ')}</span>
              <span style={{ color: '#5E6B62' }}>{u.area_m2 || '—'}</span>
              <button onClick={() => handleDelete(u.id)} style={{ padding: '3px 8px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabAreas({ condominioId }: { condominioId: string }) {
  const { areas, crear, eliminar } = useAreasComunes(condominioId)
  const [show, setShow] = useState(false)
  const [n, setN] = useState(''); const [cap, setCap] = useState(''); const [tar, setTar] = useState('')
  const [hInicio, setHInicio] = useState(''); const [hFin, setHFin] = useState('')
  const [reqAprobacion, setReqAprobacion] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      await crear.mutateAsync({
        nombre: n,
        capacidad: cap ? parseInt(cap) : null,
        tarifa: tar ? parseFloat(tar) : null,
        horario_inicio: hInicio || null,
        horario_fin: hFin || null,
        requiere_aprobacion: reqAprobacion,
        activa: true,
      } as any)
      setN(''); setCap(''); setTar(''); setHInicio(''); setHFin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar area')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta area comun?')) return
    try { await eliminar.mutateAsync(id) } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar — puede tener reservas asociadas')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Areas Comunes ({areas.length})</h3>
        <button onClick={() => { setShow(!show); setError('') }} style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{show ? 'Cancelar' : '+ Agregar'}</button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
          {error}
        </div>
      )}

      {show && (
        <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.6fr', gap: '8px', marginBottom: '10px' }}>
            <div><label style={lS}>Nombre *</label><input value={n} onChange={e => setN(e.target.value)} placeholder="Ej: Salon de Eventos" style={iS} /></div>
            <div><label style={lS}>Capacidad</label><input type="number" value={cap} onChange={e => setCap(e.target.value)} placeholder="50" style={iS} /></div>
            <div><label style={lS}>Tarifa (Bs.)</label><input type="number" value={tar} onChange={e => setTar(e.target.value)} placeholder="0 = gratis" style={iS} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div><label style={lS}>Horario inicio</label><input type="time" value={hInicio} onChange={e => setHInicio(e.target.value)} style={iS} /></div>
            <div><label style={lS}>Horario fin</label><input type="time" value={hFin} onChange={e => setHFin(e.target.value)} style={iS} /></div>
            <div><label style={lS}>Aprobacion</label>
              <select value={reqAprobacion ? 'si' : 'no'} onChange={e => setReqAprobacion(e.target.value === 'si')} style={{ ...iS, backgroundColor: 'white' }}>
                <option value="si">Requiere</option>
                <option value="no">Automatica</option>
              </select>
            </div>
          </div>
          <button onClick={save} disabled={!n || saving} style={{
            padding: '8px 20px', backgroundColor: (!n || saving) ? '#C8D4CB' : '#1A7A4A', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
            cursor: (!n || saving) ? 'not-allowed' : 'pointer',
          }}>{saving ? 'Guardando...' : 'Guardar area'}</button>
        </div>
      )}

      {areas.length === 0 ? <div style={{ color: '#5E6B62', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin areas comunes</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {areas.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#F4F7F5', borderRadius: '12px', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117', fontSize: '14px' }}>{a.nombre}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {a.horario_inicio && (
                    <span style={{ fontSize: '11px', color: '#5E6B62' }}>{a.horario_inicio.slice(0, 5)} — {a.horario_fin?.slice(0, 5)}</span>
                  )}
                  {a.capacidad && <span style={{ fontSize: '11px', color: '#5E6B62' }}>Cap. {a.capacidad}</span>}
                  {a.requiere_aprobacion && <span style={{ fontSize: '10px', color: '#7B1AC8' }}>Req. aprobacion</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, backgroundColor: a.tarifa && Number(a.tarifa) > 0 ? '#FEF9EC' : '#E8F4F0', color: a.tarifa && Number(a.tarifa) > 0 ? '#C07A2E' : '#1A7A4A' }}>
                  {a.tarifa && Number(a.tarifa) > 0 ? `Bs. ${Number(a.tarifa).toFixed(0)}` : 'Gratis'}
                </span>
                <button onClick={() => handleDelete(a.id)} style={{ padding: '4px 10px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabDocumentos({ condominioId }: { condominioId: string }) {
  const { documentos, subir } = useDocumentos(condominioId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [nombre, setNombre] = useState(''); const [tipo, setTipo] = useState('reglamento')
  const handleFile = async (f: File) => { await subir.mutateAsync({ nombre: nombre || f.name, tipo, file: f }); setNombre('') }
  return (
    <div>
      <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Documentos</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del documento" style={{ ...iS, flex: 1, minWidth: '150px' }} />
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...iS, width: '140px', backgroundColor: 'white' }}>
          <option value="reglamento">Reglamento</option><option value="acta">Acta</option><option value="plano">Plano</option><option value="contrato">Contrato</option><option value="otro">Otro</option>
        </select>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 18px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{subir.isPending ? '...' : '📎 Subir'}</button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} style={{ display: 'none' }} />
      </div>
      {documentos.length === 0 ? <div style={{ color: '#5E6B62', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin documentos</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {documentos.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F4F7F5', borderRadius: '10px', alignItems: 'center' }}>
              <div><span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117', fontSize: '14px' }}>{d.nombre}</span><span style={{ fontSize: '11px', color: '#5E6B62', marginLeft: '8px', textTransform: 'capitalize' }}>{d.tipo}</span></div>
              <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1A7A4A', textDecoration: 'none', fontWeight: 600 }}>Descargar →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabConfig({ condominioId }: { condominioId: string }) {
  const { cuotasActuales } = useCuotas(condominioId)
  return (
    <div>
      <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Cuotas actuales</h3>
      {Object.keys(cuotasActuales).length === 0 ? <div style={{ color: '#5E6B62', fontSize: '13px', padding: '20px', textAlign: 'center' }}>Sin cuotas configuradas. Ve al módulo Financiero para configurar.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(cuotasActuales).map(([tipo, cuota]) => (
            <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F4F7F5', borderRadius: '10px', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", color: '#0D1117', textTransform: 'capitalize' }}>{tipo.replace('_', ' ')}</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#1A7A4A' }}>Bs. {Number(cuota.monto).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConfigurarCondominio({ condominioId, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('edificios')
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'edificios', label: 'Edificios', icon: '🏢' },
    { key: 'unidades', label: 'Unidades', icon: '🏠' },
    { key: 'areas', label: 'Áreas', icon: '📅' },
    { key: 'documentos', label: 'Documentos', icon: '📄' },
    { key: 'config', label: 'Cuotas', icon: '💰' },
  ]

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>← Volver a condominios</button>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 20px' }}>Configurar Condominio</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontFamily: "'Inter', sans-serif",
            fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
            backgroundColor: tab === t.key ? '#1A7A4A' : '#F4F7F5', color: tab === t.key ? 'white' : '#5E6B62',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        {tab === 'edificios' && <TabEdificios condominioId={condominioId} />}
        {tab === 'unidades' && <TabUnidades condominioId={condominioId} />}
        {tab === 'areas' && <TabAreas condominioId={condominioId} />}
        {tab === 'documentos' && <TabDocumentos condominioId={condominioId} />}
        {tab === 'config' && <TabConfig condominioId={condominioId} />}
      </div>
    </div>
  )
}
