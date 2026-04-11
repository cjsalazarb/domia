import { useState } from 'react'
import { useGastos } from '@/hooks/useGastos'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useProveedores } from '@/hooks/useMantenimientos'
import { useRef } from 'react'

const CATEGORIAS = [
  { key: 'agua', label: 'Agua', icon: '💧' },
  { key: 'luz', label: 'Luz', icon: '💡' },
  { key: 'gas', label: 'Gas', icon: '🔥' },
  { key: 'personal', label: 'Personal', icon: '👷' },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
  { key: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { key: 'administracion', label: 'Administración', icon: '📋' },
  { key: 'seguridad', label: 'Seguridad', icon: '🛡️' },
  { key: 'reparacion', label: 'Reparación', icon: '🔨' },
  { key: 'otro', label: 'Otro', icon: '📦' },
]

const CAT_MAP: Record<string, { label: string; icon: string }> = {}
CATEGORIAS.forEach(c => { CAT_MAP[c.key] = { label: c.label, icon: c.icon } })

interface Props { condominioId: string }

export default function Gastos({ condominioId }: Props) {
  const { user } = useAuthStore()
  const hoy = new Date()
  const [mesFilter, setMesFilter] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`)
  const { gastos, isLoading, crear, totalMes } = useGastos(condominioId, mesFilter)
  const { proveedores } = useProveedores(condominioId)
  const [catFilter, setCatFilter] = useState('todas')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [desc, setDesc] = useState(''); const [cat, setCat] = useState('otro'); const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy.toISOString().split('T')[0]); const [provNombre, setProvNombre] = useState('')
  const [recurrente, setRecurrente] = useState(false); const [notas, setNotas] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtrados = catFilter === 'todas' ? gastos : gastos.filter(g => g.categoria === catFilter)

  const handleSave = async () => {
    let factura_url: string | undefined
    if (file) {
      const path = `facturas/${condominioId}/${Date.now()}_${file.name}`
      await supabase.storage.from('comprobantes').upload(path, file)
      const { data } = supabase.storage.from('comprobantes').getPublicUrl(path)
      factura_url = data.publicUrl
    }
    await crear.mutateAsync({ descripcion: desc, categoria: cat, monto: parseFloat(monto), fecha, proveedor_nombre: provNombre || undefined, factura_url, recurrente, notas: notas || undefined, registrado_por: user?.id })
    setDesc(''); setMonto(''); setProvNombre(''); setNotas(''); setFile(null); setRecurrente(false); setShowForm(false)
  }

  const iS = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando gastos...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Gastos del Condominio</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* KPI total */}
          <div style={{ backgroundColor: '#FCEAEA', borderRadius: '12px', padding: '10px 16px', textAlign: 'right' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#B83232', textTransform: 'uppercase' }}>Total egresos</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#B83232' }}>Bs. {totalMes.toFixed(2)}</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            {showForm ? 'Cancelar' : '+ Registrar gasto'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Descripción *</label><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Factura de agua marzo" style={iS} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Categoría *</label>
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}>
                {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Monto (Bs.) *</label><input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={iS} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Fecha *</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={iS} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Proveedor</label>
              <select value={provNombre} onChange={e => setProvNombre(e.target.value)} style={{ ...iS, backgroundColor: 'white' }}>
                <option value="">— Seleccionar o dejar vacío —</option>
                {proveedores.filter((p: any) => p.activo).map((p: any) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#0D1117', cursor: 'pointer' }}>
              <input type="checkbox" checked={recurrente} onChange={e => setRecurrente(e.target.checked)} /> Gasto recurrente mensual
            </label>
            <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: '1px dashed #C8D4CB', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {file ? `📎 ${file.name}` : '📎 Adjuntar factura'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} style={{ display: 'none' }} />
          </div>
          <div style={{ marginBottom: '16px' }}><input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas (opcional)" style={iS} /></div>
          <button onClick={handleSave} disabled={!desc || !monto || crear.isPending} style={{
            padding: '10px 24px', backgroundColor: (!desc || !monto) ? '#C8D4CB' : '#1A7A4A', color: 'white', border: 'none',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: (!desc || !monto) ? 'not-allowed' : 'pointer',
          }}>{crear.isPending ? 'Guardando...' : 'Registrar gasto'}</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)} style={{ ...iS, width: '160px' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...iS, width: '160px', backgroundColor: 'white' }}>
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay gastos registrados para este período</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 0.8fr 0.8fr 1fr 0.6fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Fecha</span><span>Descripción</span><span>Categoría</span><span style={{ textAlign: 'right' }}>Monto</span><span>Proveedor</span><span style={{ textAlign: 'center' }}>Factura</span>
          </div>
          {filtrados.map((g, i) => {
            const catInfo = CAT_MAP[g.categoria] || { label: g.categoria, icon: '📦' }
            return (
              <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 0.8fr 0.8fr 1fr 0.6fr', padding: '12px 20px', alignItems: 'center', borderBottom: i < filtrados.length - 1 ? '1px solid #F0F0F0' : 'none', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                <span style={{ color: '#5E6B62', fontSize: '12px' }}>{new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-BO')}</span>
                <span style={{ color: '#0D1117' }}>
                  {g.descripcion}
                  {g.recurrente && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#F5ECFF', color: '#7B1AC8', padding: '1px 6px', borderRadius: '4px' }}>Recurrente</span>}
                </span>
                <span style={{ fontSize: '12px' }}>{catInfo.icon} {catInfo.label}</span>
                <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#B83232' }}>Bs. {Number(g.monto).toFixed(2)}</span>
                <span style={{ color: '#5E6B62', fontSize: '12px' }}>{g.proveedor_nombre || '—'}</span>
                <span style={{ textAlign: 'center' }}>
                  {g.factura_url ? <a href={g.factura_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#1A7A4A', textDecoration: 'none', fontWeight: 600 }}>Ver</a> : <span style={{ color: '#C8D4CB' }}>—</span>}
                </span>
              </div>
            )
          })}
          {/* Total row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 0.8fr 0.8fr 1fr 0.6fr', padding: '14px 20px', backgroundColor: '#FCEAEA', fontFamily: "'Inter', sans-serif" }}>
            <span /><span /><span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#B83232', fontSize: '13px' }}>TOTAL</span>
            <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#B83232', fontSize: '15px' }}>Bs. {totalMes.toFixed(2)}</span>
            <span /><span />
          </div>
        </div>
      )}
    </div>
  )
}
