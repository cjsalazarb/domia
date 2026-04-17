import { useState } from 'react'
import { useLibroDiario, useAsientoManual, usePlanCuentas } from '@/hooks/useContabilidad'
import { useAuthStore } from '@/stores/authStore'

const refLabels: Record<string, string> = {
  recibo: 'Recibo',
  pago: 'Pago',
  gasto: 'Gasto',
  arqueo: 'Arqueo',
  manual: 'Manual',
}

const refColors: Record<string, string> = {
  recibo: '#0D4A8F',
  pago: '#0D9E6E',
  gasto: '#D62828',
  arqueo: '#E85D04',
  manual: '#5E6B62',
}

function formatBs(n: number) {
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function LibroDiario({ condominioId }: { condominioId: string }) {
  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const [desde, setDesde] = useState(`${mesActual}-01`)
  const [hasta, setHasta] = useState('')
  const { asientos, isLoading } = useLibroDiario(condominioId, desde, hasta || undefined)
  const { cuentas } = usePlanCuentas(condominioId)
  const { profile } = useAuthStore()

  const [showForm, setShowForm] = useState(false)
  const [formFecha, setFormFecha] = useState(hoy.toISOString().slice(0, 10))
  const [formDesc, setFormDesc] = useState('')
  const [formLineas, setFormLineas] = useState([
    { cuenta_id: '', debe: 0, haber: 0 },
    { cuenta_id: '', debe: 0, haber: 0 },
  ])

  const { crear } = useAsientoManual(condominioId)

  const cuentasNivel3 = cuentas.filter(c => c.nivel === 3)

  const totalDebe = formLineas.reduce((s, l) => s + l.debe, 0)
  const totalHaber = formLineas.reduce((s, l) => s + l.haber, 0)
  const cuadra = totalDebe > 0 && Math.abs(totalDebe - totalHaber) < 0.01

  function handleSubmit() {
    if (!cuadra || !formDesc.trim()) return
    const lineas = formLineas.filter(l => l.cuenta_id && (l.debe > 0 || l.haber > 0))
    crear.mutate({ fecha: formFecha, descripcion: formDesc, lineas, creado_por: profile?.id }, {
      onSuccess: () => { setShowForm(false); setFormDesc(''); setFormLineas([{ cuenta_id: '', debe: 0, haber: 0 }, { cuenta_id: '', debe: 0, haber: 0 }]) },
    })
  }

  const inputStyle = { padding: '8px 12px', border: '1px solid #D4D4D4', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif" } as const

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
          Libro Diario
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', color: '#5E6B62' }}>Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: '12px', color: '#5E6B62' }}>Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={inputStyle} />
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 16px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            + Asiento Manual
          </button>
        </div>
      </div>

      {/* Formulario asiento manual */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #E8F4F0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '12px', fontFamily: "'Nunito', sans-serif" }}>Nuevo Asiento Manual</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input type="date" value={formFecha} onChange={e => setFormFecha(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
            <input type="text" placeholder="Descripcion del asiento" value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F7F5' }}>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', fontWeight: 600, color: '#5E6B62' }}>Cuenta</th>
                <th style={{ textAlign: 'right', padding: '8px', fontSize: '11px', fontWeight: 600, color: '#5E6B62', width: '120px' }}>Debe</th>
                <th style={{ textAlign: 'right', padding: '8px', fontSize: '11px', fontWeight: 600, color: '#5E6B62', width: '120px' }}>Haber</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formLineas.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F4F7F5' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <select value={l.cuenta_id} onChange={e => { const nl = [...formLineas]; nl[i].cuenta_id = e.target.value; setFormLineas(nl) }}
                      style={{ ...inputStyle, width: '100%' }}>
                      <option value="">Seleccionar cuenta...</option>
                      {cuentasNivel3.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" step="0.01" min="0" value={l.debe || ''} onChange={e => { const nl = [...formLineas]; nl[i].debe = Number(e.target.value); nl[i].haber = 0; setFormLineas(nl) }}
                      style={{ ...inputStyle, width: '100%', textAlign: 'right' }} placeholder="0.00" />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input type="number" step="0.01" min="0" value={l.haber || ''} onChange={e => { const nl = [...formLineas]; nl[i].haber = Number(e.target.value); nl[i].debe = 0; setFormLineas(nl) }}
                      style={{ ...inputStyle, width: '100%', textAlign: 'right' }} placeholder="0.00" />
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    {formLineas.length > 2 && (
                      <button onClick={() => setFormLineas(formLineas.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D62828', fontSize: '16px' }}>x</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#F4F7F5', fontWeight: 700 }}>
                <td style={{ padding: '8px', textAlign: 'right' }}>TOTALES</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{formatBs(totalDebe)}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{formatBs(totalHaber)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setFormLineas([...formLineas, { cuenta_id: '', debe: 0, haber: 0 }])}
              style={{ padding: '6px 14px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              + Linea
            </button>
            <div style={{ flex: 1 }} />
            {!cuadra && totalDebe > 0 && (
              <span style={{ fontSize: '12px', color: '#D62828', fontWeight: 600 }}>
                Diferencia: Bs. {formatBs(Math.abs(totalDebe - totalHaber))}
              </span>
            )}
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={!cuadra || !formDesc.trim() || crear.isPending}
              style={{ padding: '8px 16px', backgroundColor: cuadra ? '#0D9E6E' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: cuadra ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif" }}>
              {crear.isPending ? 'Guardando...' : 'Guardar Asiento'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de asientos */}
      {isLoading ? (
        <p style={{ color: '#5E6B62' }}>Cargando asientos...</p>
      ) : asientos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #E8F4F0' }}>
          <p style={{ color: '#5E6B62', fontSize: '14px' }}>No hay asientos contables en el periodo seleccionado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {asientos.map(a => (
            <div key={a.id} style={{ backgroundColor: 'white', border: '1px solid #E8F4F0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FAFBFA', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0D1117', fontSize: '14px' }}>#{a.numero}</span>
                  <span style={{ fontSize: '12px', color: '#5E6B62' }}>{new Date(a.fecha).toLocaleDateString('es-BO')}</span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600, backgroundColor: `${refColors[a.referencia_tipo]}15`, color: refColors[a.referencia_tipo] }}>
                    {refLabels[a.referencia_tipo]}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>{a.descripcion}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8F4F0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '10px', textTransform: 'uppercase' }}>Cuenta</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>Debe</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>Haber</th>
                  </tr>
                </thead>
                <tbody>
                  {(a.detalles || []).map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#5E6B62', marginRight: '8px' }}>{(d as any).cuenta?.codigo}</span>
                        {(d as any).cuenta?.nombre}
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', color: Number(d.debe) > 0 ? '#0D1117' : '#ccc' }}>{formatBs(Number(d.debe))}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', color: Number(d.haber) > 0 ? '#0D1117' : '#ccc' }}>{formatBs(Number(d.haber))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
