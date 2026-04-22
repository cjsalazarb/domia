import { useState, useRef } from 'react'
import { useGastos } from '@/hooks/useGastos'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useProveedores } from '@/hooks/useMantenimientos'

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
  const { gastos, isLoading, crear, pagarGasto, totalMes } = useGastos(condominioId, mesFilter)
  const { proveedores } = useProveedores(condominioId)
  const [catFilter, setCatFilter] = useState('todas')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [desc, setDesc] = useState(''); const [cat, setCat] = useState('otro'); const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy.toISOString().split('T')[0]); const [provNombre, setProvNombre] = useState('')
  const [recurrente, setRecurrente] = useState(false); const [notas, setNotas] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Modal pago proveedor
  const [pagoGasto, setPagoGasto] = useState<{ id: string; descripcion: string; proveedor: string; pendiente: number } | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoFecha, setPagoFecha] = useState(hoy.toISOString().split('T')[0])
  const [pagoMetodo, setPagoMetodo] = useState<'efectivo' | 'transferencia' | 'cheque'>('transferencia')
  const [pagoError, setPagoError] = useState('')

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

  function abrirModalPago(g: typeof gastos[0]) {
    const pendiente = Number(g.monto) - Number(g.monto_pagado || 0)
    setPagoGasto({ id: g.id, descripcion: g.descripcion, proveedor: g.proveedor_nombre || 'Sin proveedor', pendiente })
    setPagoMonto(pendiente.toFixed(2))
    setPagoFecha(hoy.toISOString().split('T')[0])
    setPagoMetodo('transferencia')
    setPagoError('')
  }

  async function handlePagar() {
    if (!pagoGasto) return
    const montoNum = parseFloat(pagoMonto)
    if (!montoNum || montoNum <= 0) { setPagoError('El monto debe ser mayor a 0'); return }
    if (montoNum > pagoGasto.pendiente + 0.01) { setPagoError(`El monto no puede superar el pendiente (Bs. ${pagoGasto.pendiente.toFixed(2)})`); return }
    setPagoError('')
    pagarGasto.mutate({
      gastoId: pagoGasto.id,
      monto: montoNum,
      metodo: pagoMetodo,
      fecha: pagoFecha,
      descripcionGasto: pagoGasto.descripcion,
      proveedorNombre: pagoGasto.proveedor,
    }, {
      onSuccess: () => setPagoGasto(null),
      onError: (e) => setPagoError(e instanceof Error ? e.message : 'Error al registrar pago'),
    })
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

      {/* Modal pago proveedor */}
      {pagoGasto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>Pagar a Proveedor</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62', margin: '0 0 16px' }}>
              {pagoGasto.proveedor} — {pagoGasto.descripcion}
            </p>

            {pagoError && (
              <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
                {pagoError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
                Monto a pagar (pendiente: Bs. {pagoGasto.pendiente.toFixed(2)})
              </label>
              <input type="number" step="0.01" min="0.01" max={pagoGasto.pendiente} value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
                style={{ ...iS, fontSize: '16px', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>Fecha de pago</label>
              <input type="date" value={pagoFecha} onChange={e => setPagoFecha(e.target.value)} style={iS} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>Metodo de pago</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {([
                  { value: 'efectivo' as const, label: 'Efectivo', sub: 'Cuenta 1.1.1 Caja' },
                  { value: 'transferencia' as const, label: 'Transferencia / QR', sub: 'Cuenta 1.1.2 Banco' },
                  { value: 'cheque' as const, label: 'Cheque', sub: 'Cuenta 1.1.2 Banco' },
                ]).map(m => (
                  <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#0D1117', padding: '6px 10px', borderRadius: '8px', backgroundColor: pagoMetodo === m.value ? '#E8F4F0' : 'transparent' }}>
                    <input type="radio" name="metodo-pago" checked={pagoMetodo === m.value} onChange={() => setPagoMetodo(m.value)} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: '10px', color: '#5E6B62' }}>{m.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPagoGasto(null)}
                style={{ padding: '8px 16px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handlePagar} disabled={pagarGasto.isPending}
                style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {pagarGasto.isPending ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtrados.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay gastos registrados para este período</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr 0.7fr 0.7fr 0.9fr 0.6fr 0.7fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Fecha</span><span>Descripción</span><span>Categoría</span><span style={{ textAlign: 'right' }}>Monto</span><span>Proveedor</span><span style={{ textAlign: 'center' }}>Estado</span><span style={{ textAlign: 'center' }}>Accion</span>
          </div>
          {filtrados.map((g, i) => {
            const catInfo = CAT_MAP[g.categoria] || { label: g.categoria, icon: '📦' }
            const pendiente = Number(g.monto) - Number(g.monto_pagado || 0)
            const pagado = pendiente < 0.01
            return (
              <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr 0.7fr 0.7fr 0.9fr 0.6fr 0.7fr', padding: '12px 20px', alignItems: 'center', borderBottom: i < filtrados.length - 1 ? '1px solid #F0F0F0' : 'none', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                <span style={{ color: '#5E6B62', fontSize: '12px' }}>{new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-BO')}</span>
                <span style={{ color: '#0D1117' }}>
                  {g.descripcion}
                  {g.recurrente && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#F5ECFF', color: '#7B1AC8', padding: '1px 6px', borderRadius: '4px' }}>Recurrente</span>}
                </span>
                <span style={{ fontSize: '12px' }}>{catInfo.icon} {catInfo.label}</span>
                <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#B83232' }}>Bs. {Number(g.monto).toFixed(2)}</span>
                <span style={{ color: '#5E6B62', fontSize: '12px' }}>{g.proveedor_nombre || '—'}</span>
                <span style={{ textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                    backgroundColor: pagado ? '#E8F4F0' : '#FEF9EC',
                    color: pagado ? '#1A7A4A' : '#C07A2E',
                  }}>
                    {pagado ? 'Pagado' : 'Pendiente'}
                  </span>
                </span>
                <span style={{ textAlign: 'center' }}>
                  {!pagado && (
                    <button onClick={() => abrirModalPago(g)}
                      style={{ padding: '4px 10px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                      Pagar
                    </button>
                  )}
                </span>
              </div>
            )
          })}
          {/* Total row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr 0.7fr 0.7fr 0.9fr 0.6fr 0.7fr', padding: '14px 20px', backgroundColor: '#FCEAEA', fontFamily: "'Inter', sans-serif" }}>
            <span /><span /><span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#B83232', fontSize: '13px' }}>TOTAL</span>
            <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#B83232', fontSize: '15px' }}>Bs. {totalMes.toFixed(2)}</span>
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  )
}
