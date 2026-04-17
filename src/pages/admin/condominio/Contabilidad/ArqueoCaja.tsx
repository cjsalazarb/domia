import { useState } from 'react'
import { useArqueos, useSaldosCuentas } from '@/hooks/useContabilidad'
import { useAuthStore } from '@/stores/authStore'

function formatBs(n: number) {
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const DENOMS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5]

export default function ArqueoCaja({ condominioId }: { condominioId: string }) {
  const { arqueos, isLoading, crear } = useArqueos(condominioId)
  const { saldos } = useSaldosCuentas(condominioId)
  const { profile } = useAuthStore()

  const saldoCaja = saldos.find(s => s.codigo === '1.1.1')?.saldo || 0

  const [showForm, setShowForm] = useState(false)
  const [responsable, setResponsable] = useState(profile ? `${profile.nombre} ${profile.apellido}` : '')
  const [cantidades, setCantidades] = useState<Record<number, number>>(Object.fromEntries(DENOMS.map(d => [d, 0])))
  const [cheques, setCheques] = useState(0)
  const [comprobantes, setComprobantes] = useState(0)
  const [notas, setNotas] = useState('')

  const totalContado = DENOMS.reduce((s, d) => s + d * (cantidades[d] || 0), 0)
  const totalArqueo = totalContado + cheques + comprobantes
  const diferencia = totalArqueo - saldoCaja

  function handleSubmit() {
    if (!responsable.trim()) return
    crear.mutate({
      responsable,
      saldo_libros: saldoCaja,
      total_contado: totalContado,
      cheques_cartera: cheques,
      comprobantes_pendientes: comprobantes,
      estado: Math.abs(diferencia) < 0.01 ? 'conforme' : 'con_diferencia',
      notas: notas || undefined,
      creado_por: profile?.id,
      denominaciones: DENOMS.map(d => ({ denominacion: d, cantidad: cantidades[d] || 0 })),
    }, {
      onSuccess: () => {
        setShowForm(false)
        setCantidades(Object.fromEntries(DENOMS.map(d => [d, 0])))
        setCheques(0)
        setComprobantes(0)
        setNotas('')
      },
    })
  }

  const inputStyle = { padding: '8px 12px', border: '1px solid #D4D4D4', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif" } as const

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Arqueo de Caja</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          + Nuevo Arqueo
        </button>
      </div>

      {/* KPI saldo caja */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E8F4F0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', fontWeight: 600 }}>Saldo Caja segun Libros</div>
          <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>Cuenta 1.1.1</div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#0D9E6E' }}>Bs. {formatBs(saldoCaja)}</div>
      </div>

      {/* Formulario nuevo arqueo */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #E8F4F0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '16px', fontFamily: "'Nunito', sans-serif" }}>Nuevo Arqueo de Caja</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', display: 'block', marginBottom: '4px' }}>Responsable del Arqueo</label>
            <input type="text" value={responsable} onChange={e => setResponsable(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
          </div>

          {/* Denominaciones */}
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', textTransform: 'uppercase' }}>Conteo de Efectivo</h4>
          <div style={{ backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '11px', color: '#5E6B62', fontWeight: 600 }}>Denominacion</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '11px', color: '#5E6B62', fontWeight: 600, width: '100px' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: '11px', color: '#5E6B62', fontWeight: 600, width: '120px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {DENOMS.map(d => (
                  <tr key={d} style={{ borderBottom: '1px solid #E8F4F0' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 500 }}>
                      {d >= 10 ? 'Billete' : 'Moneda'} Bs. {d % 1 === 0 ? d : d.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <input type="number" min="0" value={cantidades[d] || ''} onChange={e => setCantidades({ ...cantidades, [d]: parseInt(e.target.value) || 0 })}
                        style={{ ...inputStyle, width: '70px', textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                      Bs. {formatBs(d * (cantidades[d] || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: '8px', textAlign: 'right' }}>TOTAL EFECTIVO:</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#0D9E6E', fontSize: '15px' }}>Bs. {formatBs(totalContado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cheques y comprobantes */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', display: 'block', marginBottom: '4px' }}>Cheques en Cartera (Bs.)</label>
              <input type="number" step="0.01" min="0" value={cheques || ''} onChange={e => setCheques(Number(e.target.value))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} placeholder="0.00" />
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', display: 'block', marginBottom: '4px' }}>Comprobantes Pendientes (Bs.)</label>
              <input type="number" step="0.01" min="0" value={comprobantes || ''} onChange={e => setComprobantes(Number(e.target.value))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} placeholder="0.00" />
            </div>
          </div>

          {/* Resultado */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 600, marginBottom: '4px' }}>TOTAL ARQUEO</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>Bs. {formatBs(totalArqueo)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 600, marginBottom: '4px' }}>SALDO LIBROS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>Bs. {formatBs(saldoCaja)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: Math.abs(diferencia) < 0.01 ? '#E8F4F0' : '#FFF3CD', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 600, marginBottom: '4px' }}>DIFERENCIA</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: Math.abs(diferencia) < 0.01 ? '#0D9E6E' : '#D62828' }}>
                {Math.abs(diferencia) < 0.01 ? 'CONFORME' : `${diferencia > 0 ? '+' : ''}Bs. ${formatBs(diferencia)}`}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', display: 'block', marginBottom: '4px' }}>Observaciones</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Notas u observaciones del arqueo..." />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={!responsable.trim() || crear.isPending}
              style={{ padding: '8px 16px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {crear.isPending ? 'Guardando...' : 'Registrar Arqueo'}
            </button>
          </div>
        </div>
      )}

      {/* Historial de arqueos */}
      {isLoading ? (
        <p style={{ color: '#5E6B62' }}>Cargando arqueos...</p>
      ) : arqueos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #E8F4F0' }}>
          <p style={{ color: '#5E6B62', fontSize: '14px' }}>No hay arqueos de caja registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {arqueos.map(a => (
            <div key={a.id} style={{ backgroundColor: 'white', border: '1px solid #E8F4F0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#0D1117', marginRight: '12px' }}>
                    {new Date(a.fecha).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    backgroundColor: a.estado === 'conforme' ? '#E8F4F0' : '#FFF3CD',
                    color: a.estado === 'conforme' ? '#0D9E6E' : '#856404',
                  }}>
                    {a.estado === 'conforme' ? 'CONFORME' : 'CON DIFERENCIA'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#5E6B62' }}>Responsable: {a.responsable}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ color: '#5E6B62', marginBottom: '2px' }}>Saldo Libros</div>
                  <div style={{ fontWeight: 600 }}>Bs. {formatBs(Number(a.saldo_libros))}</div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ color: '#5E6B62', marginBottom: '2px' }}>Total Arqueo</div>
                  <div style={{ fontWeight: 600 }}>Bs. {formatBs(Number(a.total_arqueo))}</div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ color: '#5E6B62', marginBottom: '2px' }}>Diferencia</div>
                  <div style={{ fontWeight: 600, color: Math.abs(Number(a.diferencia)) < 0.01 ? '#0D9E6E' : '#D62828' }}>
                    Bs. {formatBs(Number(a.diferencia))}
                  </div>
                </div>
              </div>

              {a.notas && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#5E6B62', fontStyle: 'italic' }}>
                  {a.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
