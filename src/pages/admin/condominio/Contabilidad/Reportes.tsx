import { useState } from 'react'
import { useSaldosCuentas } from '@/hooks/useContabilidad'

type Reporte = 'balance' | 'resultados' | 'sumas' | 'mayor' | 'flujo'

const reporteLabels: Record<Reporte, string> = {
  balance: 'Balance General',
  resultados: 'Estado de Resultados',
  sumas: 'Balance de Sumas y Saldos',
  mayor: 'Libro Mayor',
  flujo: 'Flujo de Caja',
}

function formatBs(n: number) {
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Reportes({ condominioId }: { condominioId: string }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const [hasta, setHasta] = useState(hoy)
  const [reporte, setReporte] = useState<Reporte>('balance')
  const { saldos, isLoading } = useSaldosCuentas(condominioId, hasta)

  const inputStyle = { padding: '8px 12px', border: '1px solid #D4D4D4', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif" } as const

  // Detectar cuentas hoja: una cuenta es hoja si ninguna otra cuenta empieza con su codigo + '.'
  const codigos = saldos.map(s => s.codigo)
  const isLeaf = (codigo: string) => !codigos.some(c => c.startsWith(codigo + '.'))

  const activos = saldos.filter(s => s.tipo === 'activo' && s.nivel >= 2)
  const pasivos = saldos.filter(s => s.tipo === 'pasivo' && s.nivel >= 2)
  const patrimonio = saldos.filter(s => s.tipo === 'patrimonio' && s.nivel >= 2)
  const ingresos = saldos.filter(s => s.tipo === 'ingreso' && s.nivel >= 2)
  const gastos = saldos.filter(s => s.tipo === 'gasto' && s.nivel >= 2)

  const totalActivos = activos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.saldo, 0)
  const totalPasivos = pasivos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.saldo, 0)
  const totalIngresos = ingresos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.saldo, 0)
  const totalGastos = gastos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.saldo, 0)
  const resultado = totalIngresos - totalGastos

  // Patrimonio: la cuenta 3.2 (Superávit/Déficit) se calcula dinámicamente
  const totalPatrimonio = patrimonio
    .filter(s => isLeaf(s.codigo))
    .reduce((a, s) => a + (s.codigo === '3.2' ? resultado : s.saldo), 0)

  const todosConMov = saldos.filter(s => s.nivel >= 2 && (s.debe > 0 || s.haber > 0))
  const totalDebeSumas = todosConMov.reduce((a, s) => a + s.debe, 0)
  const totalHaberSumas = todosConMov.reduce((a, s) => a + s.haber, 0)

  function renderTabla(titulo: string, items: typeof saldos, totalLabel: string, total: number, colorTotal: string) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', fontFamily: "'Nunito', sans-serif", textTransform: 'uppercase' }}>{titulo}</h3>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8F4F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {items.map(s => {
                const leaf = isLeaf(s.codigo)
                const displaySaldo = s.codigo === '3.2' ? resultado : s.saldo
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: '#5E6B62', width: '60px' }}>{s.codigo}</td>
                    <td style={{ padding: '8px 16px', paddingLeft: leaf ? '32px' : '16px', fontWeight: leaf ? 400 : 700 }}>{s.nombre}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: leaf ? 400 : 700, width: '140px' }}>
                      {leaf ? `Bs. ${formatBs(displaySaldo)}` : ''}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ backgroundColor: '#F4F7F5', fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: '10px 16px', color: colorTotal }}>{totalLabel}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: colorTotal, fontSize: '15px' }}>Bs. {formatBs(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Reportes Contables</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#5E6B62' }}>Corte al</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Selector de reporte */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(Object.keys(reporteLabels) as Reporte[]).map(r => (
          <button key={r} onClick={() => setReporte(r)}
            style={{
              padding: '6px 14px', border: reporte === r ? '2px solid #0D9E6E' : '1px solid #D4D4D4', cursor: 'pointer',
              borderRadius: '20px', fontSize: '12px', fontWeight: reporte === r ? 700 : 400, fontFamily: "'Inter', sans-serif",
              backgroundColor: reporte === r ? '#E8F4F0' : 'white', color: reporte === r ? '#0D9E6E' : '#5E6B62',
            }}>
            {reporteLabels[r]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#5E6B62' }}>Calculando saldos...</p>
      ) : (
        <>
          {/* Balance General */}
          {reporte === 'balance' && (
            <div>
              {renderTabla('Activo', activos, 'TOTAL ACTIVO', totalActivos, '#0D9E6E')}
              {renderTabla('Pasivo', pasivos, 'TOTAL PASIVO', totalPasivos, '#E85D04')}
              {renderTabla('Patrimonio', patrimonio, 'TOTAL PATRIMONIO', totalPatrimonio, '#0D4A8F')}

              <div style={{ backgroundColor: '#0D1117', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>PASIVO + PATRIMONIO</span>
                <span style={{ color: '#0D9E6E', fontWeight: 700, fontSize: '18px' }}>Bs. {formatBs(totalPasivos + totalPatrimonio)}</span>
              </div>
              {Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) > 0.01 && (
                <div style={{ backgroundColor: '#FFF3CD', borderRadius: '8px', padding: '10px 16px', marginTop: '8px', fontSize: '12px', color: '#856404' }}>
                  Descuadre: Bs. {formatBs(Math.abs(totalActivos - (totalPasivos + totalPatrimonio)))}
                </div>
              )}
            </div>
          )}

          {/* Estado de Resultados */}
          {reporte === 'resultados' && (
            <div>
              {renderTabla('Ingresos', ingresos, 'TOTAL INGRESOS', totalIngresos, '#2D6A4F')}
              {renderTabla('Gastos', gastos, 'TOTAL GASTOS', totalGastos, '#D62828')}

              <div style={{ backgroundColor: resultado >= 0 ? '#0D9E6E' : '#D62828', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{resultado >= 0 ? 'SUPERAVIT' : 'DEFICIT'} DEL PERIODO</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>Bs. {formatBs(Math.abs(resultado))}</span>
              </div>
            </div>
          )}

          {/* Balance de Sumas y Saldos */}
          {reporte === 'sumas' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8F4F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F4F7F5' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px' }}>Codigo</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px' }}>Cuenta</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px' }}>Debe</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px' }}>Haber</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {todosConMov.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                      <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: '#5E6B62' }}>{s.codigo}</td>
                      <td style={{ padding: '8px 16px' }}>{s.nombre}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right' }}>{formatBs(s.debe)}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right' }}>{formatBs(s.haber)}</td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: s.saldo >= 0 ? '#0D9E6E' : '#D62828' }}>
                        {formatBs(s.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0D1117' }}>
                    <td colSpan={2} style={{ padding: '10px 16px', color: 'white', fontWeight: 700 }}>TOTALES</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0D9E6E', fontWeight: 700 }}>{formatBs(totalDebeSumas)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0D9E6E', fontWeight: 700 }}>{formatBs(totalHaberSumas)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: Math.abs(totalDebeSumas - totalHaberSumas) < 0.01 ? '#0D9E6E' : '#D62828', fontWeight: 700 }}>
                      {Math.abs(totalDebeSumas - totalHaberSumas) < 0.01 ? 'CUADRA' : `Dif: ${formatBs(totalDebeSumas - totalHaberSumas)}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Libro Mayor */}
          {reporte === 'mayor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {saldos.filter(s => s.nivel === 3 && (s.debe > 0 || s.haber > 0)).map(s => (
                <div key={s.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8F4F0', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', color: '#5E6B62', marginRight: '8px' }}>{s.codigo}</span>
                      <span style={{ fontWeight: 700, color: '#0D1117' }}>{s.nombre}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: s.saldo >= 0 ? '#0D9E6E' : '#D62828' }}>
                      Bs. {formatBs(s.saldo)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#5E6B62' }}>
                    <span>Debitos: Bs. {formatBs(s.debe)}</span>
                    <span>Creditos: Bs. {formatBs(s.haber)}</span>
                  </div>
                </div>
              ))}
              {saldos.filter(s => s.nivel === 3 && (s.debe > 0 || s.haber > 0)).length === 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #E8F4F0' }}>
                  <p style={{ color: '#5E6B62' }}>No hay movimientos en el periodo.</p>
                </div>
              )}
            </div>
          )}

          {/* Flujo de Caja */}
          {reporte === 'flujo' && (() => {
            const caja = saldos.find(s => s.codigo === '1.1.1')
            const banco = saldos.find(s => s.codigo === '1.1.2')
            const entradasCaja = caja?.debe || 0
            const entradasBanco = banco?.debe || 0
            const salidasCaja = caja?.haber || 0
            const salidasBanco = banco?.haber || 0
            // Egresos comprometidos: gastos registrados contra CxP (débito de cuentas 5.x)
            const egresosGastos = gastos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.debe, 0)
            const totalEntradas = entradasCaja + entradasBanco
            const totalSalidas = salidasCaja + salidasBanco + egresosGastos
            const saldoDisponible = (caja?.saldo || 0) + (banco?.saldo || 0)
            return (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total Ingresos', valor: totalEntradas, color: '#0D9E6E' },
                    { label: 'Total Egresos', valor: totalSalidas, color: '#D62828' },
                    { label: 'Saldo Disponible', valor: saldoDisponible, color: '#0D1117' },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, minWidth: '150px', backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E8F4F0' }}>
                      <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>{k.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: k.color }}>Bs. {formatBs(k.valor)}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>Detalle de Ingresos</h3>
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8F4F0', overflow: 'hidden', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F4F7F5' }}>
                        <td style={{ padding: '10px 16px' }}>Cobros en efectivo (Caja)</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0D9E6E', fontWeight: 600 }}>Bs. {formatBs(entradasCaja)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #F4F7F5' }}>
                        <td style={{ padding: '10px 16px' }}>Cobros por transferencia/QR (Banco)</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0D9E6E', fontWeight: 600 }}>Bs. {formatBs(entradasBanco)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#F4F7F5', fontWeight: 700 }}>
                        <td style={{ padding: '10px 16px' }}>TOTAL INGRESOS</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0D9E6E', fontSize: '15px' }}>Bs. {formatBs(totalEntradas)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0D1117', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>Detalle de Egresos</h3>
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E8F4F0', overflow: 'hidden', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      {salidasCaja > 0 && (
                        <tr style={{ borderBottom: '1px solid #F4F7F5' }}>
                          <td style={{ padding: '10px 16px' }}>Pagos en efectivo (Caja)</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontWeight: 600 }}>Bs. {formatBs(salidasCaja)}</td>
                        </tr>
                      )}
                      {salidasBanco > 0 && (
                        <tr style={{ borderBottom: '1px solid #F4F7F5' }}>
                          <td style={{ padding: '10px 16px' }}>Pagos bancarios</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontWeight: 600 }}>Bs. {formatBs(salidasBanco)}</td>
                        </tr>
                      )}
                      {gastos.filter(s => isLeaf(s.codigo) && s.debe > 0).map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                          <td style={{ padding: '10px 16px' }}>{s.nombre}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontWeight: 600 }}>Bs. {formatBs(s.debe)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#F4F7F5', fontWeight: 700 }}>
                        <td style={{ padding: '10px 16px' }}>TOTAL EGRESOS</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontSize: '15px' }}>Bs. {formatBs(totalSalidas)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div style={{ backgroundColor: '#0D1117', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>SALDO DISPONIBLE (Caja + Banco)</span>
                  <span style={{ color: '#0D9E6E', fontWeight: 700, fontSize: '18px' }}>Bs. {formatBs(saldoDisponible)}</span>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
