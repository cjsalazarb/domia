import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSaldosCuentas, useMesesConDatos } from '@/hooks/useContabilidad'
import {
  exportarBalanceGeneral,
  exportarEstadoResultados,
  exportarSumasSaldos,
  exportarLibroMayor,
  exportarFlujoCaja,
  exportarReporteContablePDF,
} from '@/lib/exportarReporteContable'

type Reporte = 'balance' | 'resultados' | 'sumas' | 'mayor' | 'flujo'

const reporteLabels: Record<Reporte, string> = {
  balance: 'Balance General',
  resultados: 'Estado de Resultados',
  sumas: 'Balance de Sumas y Saldos',
  mayor: 'Libro Mayor',
  flujo: 'Flujo de Caja',
}

const MESES_LABEL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatBs(n: number) {
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function primerDiaMes(ym: string) { return `${ym}-01` }
function ultimoDiaMes(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`
}

function mesActualYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatYM(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MESES_LABEL[m - 1]} ${y}`
}

export default function Reportes({ condominioId }: { condominioId: string }) {
  const ahora = mesActualYM()
  const [mesDesde, setMesDesde] = useState(ahora)
  const [mesHasta, setMesHasta] = useState(ahora)
  const [reporte, setReporte] = useState<Reporte>('balance')
  const [exportando, setExportando] = useState(false)

  const desde = primerDiaMes(mesDesde)
  const hasta = ultimoDiaMes(mesHasta)

  const { saldos, isLoading } = useSaldosCuentas(condominioId, hasta, desde)
  const { mesesConDatos } = useMesesConDatos(condominioId)

  const { data: condominioNombre } = useQuery({
    queryKey: ['condo-nombre-reporte', condominioId],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre').eq('id', condominioId).single()
      return data?.nombre || 'Condominio'
    },
    enabled: !!condominioId,
  })

  // Build dropdown options from months with data + current month
  const opcionesMeses = useMemo(() => {
    const set = new Set(mesesConDatos)
    set.add(ahora)
    return [...set].sort()
  }, [mesesConDatos, ahora])

  // Period label for display
  const periodoLabel = mesDesde === mesHasta
    ? formatYM(mesDesde)
    : `${formatYM(mesDesde)} — ${formatYM(mesHasta)}`

  // Quick period setters
  function setMesActual() { setMesDesde(ahora); setMesHasta(ahora) }
  function setTrimestre() {
    const d = new Date()
    d.setMonth(d.getMonth() - 2)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setMesDesde(ym); setMesHasta(ahora)
  }
  function setAnio() {
    const y = new Date().getFullYear()
    setMesDesde(`${y}-01`); setMesHasta(ahora)
  }

  const selectStyle = { padding: '6px 10px', border: '1px solid #D4D4D4', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white' } as const

  // ── Derived data ──
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

  const totalPatrimonio = patrimonio
    .filter(s => isLeaf(s.codigo))
    .reduce((a, s) => a + (s.codigo === '3.2' ? resultado : s.saldo), 0)

  const todosConMov = saldos.filter(s => s.nivel >= 2 && (s.debe > 0 || s.haber > 0))
  const totalDebeSumas = todosConMov.reduce((a, s) => a + s.debe, 0)
  const totalHaberSumas = todosConMov.reduce((a, s) => a + s.haber, 0)

  const caja = saldos.find(s => s.codigo === '1.1.1')
  const banco = saldos.find(s => s.codigo === '1.1.2')
  const entradasCaja = caja?.debe || 0
  const entradasBanco = banco?.debe || 0
  const salidasCaja = caja?.haber || 0
  const salidasBanco = banco?.haber || 0
  const egresosGastos = gastos.filter(s => isLeaf(s.codigo)).reduce((a, s) => a + s.debe, 0)
  const totalEntradas = entradasCaja + entradasBanco
  const totalSalidasCalc = salidasCaja + salidasBanco + egresosGastos
  const saldoDisponible = (caja?.saldo || 0) + (banco?.saldo || 0)
  const gastosDetalle = gastos.filter(s => isLeaf(s.codigo) && s.debe > 0)

  const datos = {
    condominioNombre: condominioNombre || 'Condominio',
    hasta,
    desde,
    saldos,
    isLeaf,
    resultado,
    totalActivos, totalPasivos, totalPatrimonio,
    totalIngresos, totalGastos,
    todosConMov, totalDebeSumas, totalHaberSumas,
    entradasCaja, entradasBanco, salidasCaja, salidasBanco,
    egresosGastos, totalEntradas, totalSalidas: totalSalidasCalc,
    saldoDisponible, gastosDetalle,
  }

  const exportFn: Record<Reporte, (d: typeof datos) => Promise<void>> = {
    balance: exportarBalanceGeneral,
    resultados: exportarEstadoResultados,
    sumas: exportarSumasSaldos,
    mayor: exportarLibroMayor,
    flujo: exportarFlujoCaja,
  }

  async function handleExportPDF(tipo: Reporte) {
    setExportando(true)
    try { await exportFn[tipo](datos) } catch (e) { console.error('Error exportando PDF:', e) } finally { setExportando(false) }
  }

  async function handleExportCompleto() {
    setExportando(true)
    try { await exportarReporteContablePDF(datos) } catch (e) { console.error(e) } finally { setExportando(false) }
  }

  function PdfBtn({ tipo }: { tipo: Reporte }) {
    return (
      <button onClick={() => handleExportPDF(tipo)} disabled={exportando || isLoading || saldos.length === 0}
        style={{
          padding: '6px 14px', backgroundColor: exportando ? '#ccc' : '#1D9E75', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          cursor: exportando ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
        {exportando ? 'Generando...' : '\u2B07 PDF'}
      </button>
    )
  }

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

  const quickBtnStyle = (active: boolean) => ({
    padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 as const,
    fontFamily: "'Inter', sans-serif", cursor: 'pointer' as const, border: 'none',
    backgroundColor: active ? '#0D9E6E' : '#F0F0F0', color: active ? 'white' : '#5E6B62',
  })

  const isMesActual = mesDesde === ahora && mesHasta === ahora
  const d3 = new Date(); d3.setMonth(d3.getMonth() - 2)
  const trimestreDesde = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}`
  const isTrimestre = mesDesde === trimestreDesde && mesHasta === ahora
  const isAnio = mesDesde === `${new Date().getFullYear()}-01` && mesHasta === ahora

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Reportes Contables</h2>
        <button onClick={handleExportCompleto} disabled={exportando || isLoading || saldos.length === 0}
          style={{
            padding: '8px 16px', backgroundColor: exportando ? '#ccc' : '#0D1117', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            cursor: exportando ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
            display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
          }}>
          {exportando ? 'Generando...' : '\u2B07 Reporte Completo'}
        </button>
      </div>

      {/* Period selector */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8F4F0', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Quick buttons */}
        <button onClick={setMesActual} style={quickBtnStyle(isMesActual)}>Mes actual</button>
        <button onClick={setTrimestre} style={quickBtnStyle(isTrimestre)}>Trimestre</button>
        <button onClick={setAnio} style={quickBtnStyle(isAnio)}>Anio</button>

        <span style={{ width: '1px', height: '24px', backgroundColor: '#E8F4F0', margin: '0 4px' }} />

        {/* Desde */}
        <label style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 600 }}>Desde</label>
        <select value={mesDesde} onChange={e => { setMesDesde(e.target.value); if (e.target.value > mesHasta) setMesHasta(e.target.value) }} style={selectStyle}>
          {opcionesMeses.map(ym => (
            <option key={ym} value={ym}>{formatYM(ym)}</option>
          ))}
        </select>

        {/* Hasta */}
        <label style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 600 }}>Hasta</label>
        <select value={mesHasta} onChange={e => { setMesHasta(e.target.value); if (e.target.value < mesDesde) setMesDesde(e.target.value) }} style={selectStyle}>
          {opcionesMeses.map(ym => (
            <option key={ym} value={ym} disabled={ym < mesDesde}>{formatYM(ym)}</option>
          ))}
        </select>

        <span style={{ width: '1px', height: '24px', backgroundColor: '#E8F4F0', margin: '0 4px' }} />

        {/* Period display */}
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D1117', fontFamily: "'Nunito', sans-serif" }}>{periodoLabel}</span>
      </div>

      {/* Tab selector */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Balance General</h3>
                <PdfBtn tipo="balance" />
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Estado de Resultados</h3>
                <PdfBtn tipo="resultados" />
              </div>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Balance de Sumas y Saldos</h3>
                <PdfBtn tipo="sumas" />
              </div>
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
            </div>
          )}

          {/* Libro Mayor */}
          {reporte === 'mayor' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Libro Mayor</h3>
                <PdfBtn tipo="mayor" />
              </div>
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
            </div>
          )}

          {/* Flujo de Caja */}
          {reporte === 'flujo' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Flujo de Caja</h3>
                <PdfBtn tipo="flujo" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Ingresos', valor: totalEntradas, color: '#0D9E6E' },
                  { label: 'Total Egresos', valor: totalSalidasCalc, color: '#D62828' },
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
                    {gastosDetalle.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                        <td style={{ padding: '10px 16px' }}>{s.nombre}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontWeight: 600 }}>Bs. {formatBs(s.debe)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#F4F7F5', fontWeight: 700 }}>
                      <td style={{ padding: '10px 16px' }}>TOTAL EGRESOS</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#D62828', fontSize: '15px' }}>Bs. {formatBs(totalSalidasCalc)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ backgroundColor: '#0D1117', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>SALDO DISPONIBLE (Caja + Banco)</span>
                <span style={{ color: '#0D9E6E', fontWeight: 700, fontSize: '18px' }}>Bs. {formatBs(saldoDisponible)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
