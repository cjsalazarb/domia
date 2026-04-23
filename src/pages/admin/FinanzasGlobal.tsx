import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { pdf } from '@react-pdf/renderer'
import ReporteGlobalPDF from '@/components/financiero/ReporteGlobalPDF'
import { exportarExcelGlobal } from '@/lib/exportarReporteGlobal'

type Periodo = 'mes' | 'trimestre' | 'anio'
type SortKey = 'nombre' | 'unidades' | 'cobrado' | 'pendiente' | 'cobranza'
type SortDir = 'asc' | 'desc'

export default function FinanzasGlobal() {
  const { profile, signOut } = useAuthStore()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const hoy = new Date()

  function getPeriodoRange(p: Periodo): { desde: string; hasta: string; label: string } {
    const y = hoy.getFullYear()
    const m = hoy.getMonth()
    if (p === 'mes') {
      const desde = `${y}-${String(m + 1).padStart(2, '0')}-01`
      const hasta = new Date(y, m + 1, 0).toISOString().split('T')[0]
      return { desde, hasta, label: hoy.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }) }
    }
    if (p === 'trimestre') {
      const qStart = Math.floor(m / 3) * 3
      const desde = `${y}-${String(qStart + 1).padStart(2, '0')}-01`
      const hasta = new Date(y, qStart + 3, 0).toISOString().split('T')[0]
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      return { desde, hasta, label: `${meses[qStart]} - ${meses[qStart + 2]} ${y}` }
    }
    return { desde: `${y}-01-01`, hasta: `${y}-12-31`, label: `Año ${y}` }
  }

  const range = getPeriodoRange(periodo)

  const { data, isLoading } = useQuery({
    queryKey: ['finanzas-global-v1', periodo],
    queryFn: async () => {
      const [condosRes, recibosRes, pagosRes, gastosRes, unidadesRes] = await Promise.all([
        supabase.from('condominios').select('id, nombre, ciudad, direccion').eq('estado', 'activo').order('nombre'),
        supabase.from('recibos').select('id, condominio_id, estado, monto_total, periodo, residente_id, unidad_id'),
        supabase.from('pagos').select('id, condominio_id, monto, fecha_pago, residente_id, recibo_id').not('confirmado_por', 'is', null),
        supabase.from('gastos').select('id, condominio_id, monto, fecha, categoria'),
        supabase.from('unidades').select('id, condominio_id, numero').eq('activa', true),
      ])

      const condos = condosRes.data || []
      const recibos = recibosRes.data || []
      const pagos = pagosRes.data || []
      const gastos = gastosRes.data || []
      const unidades = unidadesRes.data || []

      // Filter by period
      const recibosP = recibos.filter(r => r.periodo && r.periodo >= range.desde.slice(0, 7) && r.periodo <= range.hasta.slice(0, 7))
      const pagosP = pagos.filter((p: any) => p.fecha_pago && p.fecha_pago >= range.desde && p.fecha_pago <= range.hasta)
      const gastosP = gastos.filter(g => g.fecha && g.fecha >= range.desde && g.fecha <= range.hasta)

      // ─── SUB 1: Executive summary ───
      const totalIngresos = pagosP.reduce((s: number, p: any) => s + Number(p.monto), 0)
      const totalGastos = gastosP.reduce((s, g) => s + Number(g.monto), 0)
      const superavit = totalIngresos - totalGastos

      // Chart: last 12 months
      const chartData: Array<{ mes: string; ingresos: number; gastos: number }> = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const periodoKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const mesLabel = d.toLocaleDateString('es-BO', { month: 'short' })
        const ingMes = pagos.filter((p: any) => p.fecha_pago?.startsWith(periodoKey)).reduce((s: number, p: any) => s + Number(p.monto), 0)
        const gasMes = gastos.filter(g => g.fecha?.startsWith(periodoKey)).reduce((s, g) => s + Number(g.monto), 0)
        chartData.push({ mes: mesLabel, ingresos: ingMes, gastos: gasMes })
      }

      // ─── SUB 2: Income by condominium ───
      const ingresosPorCondo = condos.map(c => {
        const cUnidades = unidades.filter(u => u.condominio_id === c.id).length
        const cRecibos = recibosP.filter(r => r.condominio_id === c.id)
        const cEmitido = cRecibos.reduce((s, r) => s + Number(r.monto_total), 0)
        const cPagado = cRecibos.filter(r => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)
        const cPendiente = cEmitido - cPagado
        const cCobranza = cEmitido > 0 ? Math.min(100, Math.round((cPagado / cEmitido) * 100)) : 0
        return { id: c.id, nombre: c.nombre, unidades: cUnidades, cobrado: cPagado, pendiente: cPendiente, cobranza: cCobranza }
      })

      // ─── SUB 3: Expenses by condominium ───
      const categorias = ['limpieza', 'mantenimiento', 'personal', 'servicios', 'otros']
      const gastosPorCondo = condos.map(c => {
        const cGastos = gastosP.filter(g => g.condominio_id === c.id)
        const byCategoria: Record<string, number> = {}
        for (const cat of categorias) byCategoria[cat] = 0
        for (const g of cGastos) {
          const cat = categorias.includes(g.categoria) ? g.categoria : 'otros'
          byCategoria[cat] += Number(g.monto)
        }
        const total = cGastos.reduce((s, g) => s + Number(g.monto), 0)
        return { id: c.id, nombre: c.nombre, ...byCategoria, total }
      })

      // ─── SUB 4: Global delinquency ───
      const recibosVencidos = recibos.filter(r => r.estado === 'vencido')
      const totalMorosos = new Set(recibosVencidos.map(r => r.residente_id)).size
      const totalPendienteMora = recibosVencidos.reduce((s, r) => s + Number(r.monto_total), 0)

      // Top 10 debtors — need resident names
      const deudaPorResidente: Record<string, { residenteId: string; condominio_id: string; deuda: number; meses: number }> = {}
      for (const r of recibosVencidos) {
        const key = r.residente_id || r.unidad_id || r.id
        if (!deudaPorResidente[key]) deudaPorResidente[key] = { residenteId: r.residente_id, condominio_id: r.condominio_id, deuda: 0, meses: 0 }
        deudaPorResidente[key].deuda += Number(r.monto_total)
        deudaPorResidente[key].meses += 1
      }
      const top10Deudores = Object.values(deudaPorResidente).sort((a, b) => b.deuda - a.deuda).slice(0, 10)

      // Fetch names for top10
      const residenteIds = top10Deudores.map(d => d.residenteId).filter(Boolean)
      let residenteNames: Record<string, string> = {}
      if (residenteIds.length > 0) {
        const { data: resData } = await supabase.from('residentes').select('id, nombre, apellido, unidad_id, unidades(numero)').in('id', residenteIds)
        for (const r of (resData || []) as any[]) {
          residenteNames[r.id] = `${r.nombre} ${r.apellido} (${(r.unidades as any)?.numero || '—'})`
        }
      }

      const top10 = top10Deudores.map(d => ({
        nombre: residenteNames[d.residenteId] || 'Sin residente',
        condominio: condos.find(c => c.id === d.condominio_id)?.nombre || '',
        deuda: d.deuda,
        meses: d.meses,
      }))

      // Debt aging
      const ahora = Date.now()
      let deuda1a30 = 0, deuda31a60 = 0, deuda60plus = 0
      for (const r of recibosVencidos) {
        const periodoDate = new Date(r.periodo + '-01')
        const diasVencido = Math.floor((ahora - periodoDate.getTime()) / 86400000)
        const monto = Number(r.monto_total)
        if (diasVencido <= 30) deuda1a30 += monto
        else if (diasVencido <= 60) deuda31a60 += monto
        else deuda60plus += monto
      }

      return {
        totalIngresos, totalGastos, superavit, chartData,
        ingresosPorCondo, gastosPorCondo,
        totalMorosos, totalPendienteMora, top10,
        deuda1a30, deuda31a60, deuda60plus,
        condos,
      }
    },
  })

  // Sorting
  const ingresosSorted = useMemo(() => {
    if (!data) return []
    const arr = [...data.ingresosPorCondo]
    arr.sort((a, b) => {
      const valA = a[sortKey as keyof typeof a]
      const valB = b[sortKey as keyof typeof b]
      if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA)
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })
    return arr
  }, [data, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  async function handleExportPdf() {
    if (!data) return
    setExportingPdf(true)
    try {
      const blob = await pdf(
        <ReporteGlobalPDF
          periodo={range.label}
          totalIngresos={data.totalIngresos}
          totalGastos={data.totalGastos}
          superavit={data.superavit}
          ingresosPorCondo={data.ingresosPorCondo}
          gastosPorCondo={data.gastosPorCondo}
          top10={data.top10}
          totalMorosos={data.totalMorosos}
          totalPendienteMora={data.totalPendienteMora}
          deuda1a30={data.deuda1a30}
          deuda31a60={data.deuda31a60}
          deuda60plus={data.deuda60plus}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte_Global_DOMIA_${range.label.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportingPdf(false)
    }
  }

  function handleExportExcel() {
    if (!data) return
    setExportingExcel(true)
    try {
      exportarExcelGlobal(data.ingresosPorCondo, data.gastosPorCondo, data.top10, range.label)
    } finally {
      setExportingExcel(false)
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
    color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif", cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
            DOM<span style={{ color: '#0D9E6E' }}>IA</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
              { label: 'Condominios', path: '/admin', icon: '🏢' },
              { label: 'Finanzas Global', path: '/finanzas-global', icon: '💰' },
            ].map(item => {
              const active = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400,
                    backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent',
                    color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)', transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              Finanzas Global
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>Consolidado financiero de todos los condominios</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{ display: 'flex', backgroundColor: '#E8F4F0', borderRadius: '10px', padding: '3px' }}>
              {([
                { key: 'mes' as Periodo, label: 'Mes' },
                { key: 'trimestre' as Periodo, label: 'Trimestre' },
                { key: 'anio' as Periodo, label: 'Año' },
              ]).map(p => (
                <button key={p.key} onClick={() => setPeriodo(p.key)}
                  style={{
                    padding: '7px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: periodo === p.key ? 'white' : 'transparent',
                    boxShadow: periodo === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600,
                    color: periodo === p.key ? '#0D1117' : '#5E6B62', transition: 'all 0.2s',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
            {/* Export buttons */}
            <button onClick={handleExportPdf} disabled={exportingPdf || !data}
              style={{
                padding: '8px 16px', backgroundColor: '#B83232', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                cursor: exportingPdf ? 'not-allowed' : 'pointer', opacity: exportingPdf ? 0.6 : 1,
              }}>
              {exportingPdf ? 'Generando...' : 'Exportar PDF'}
            </button>
            <button onClick={handleExportExcel} disabled={exportingExcel || !data}
              style={{
                padding: '8px 16px', backgroundColor: '#0D4A8F', color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                cursor: exportingExcel ? 'not-allowed' : 'pointer', opacity: exportingExcel ? 0.6 : 1,
              }}>
              {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62', fontSize: '14px' }}>Cargando datos financieros...</div>
        )}

        {!isLoading && data && (
          <>
            {/* ═══ SUB 1: Executive Summary ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Ingresos consolidados</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#1A7A4A' }}>Bs. {data.totalIngresos.toFixed(0)}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{range.label}</div>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Gastos consolidados</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#B83232' }}>Bs. {data.totalGastos.toFixed(0)}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{range.label}</div>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{data.superavit >= 0 ? 'Superávit' : 'Déficit'} global</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: data.superavit >= 0 ? '#1A7A4A' : '#B83232' }}>Bs. {data.superavit.toFixed(0)}</div>
                <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{range.label}</div>
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Ingresos vs Gastos — Últimos 12 meses
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#5E6B62', fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5E6B62', fontFamily: "'Inter', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `Bs.${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`Bs. ${Number(value).toFixed(0)}`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                  />
                  <Legend formatter={(value: string) => value === 'ingresos' ? 'Ingresos' : 'Gastos'} />
                  <Bar dataKey="ingresos" fill="#1A7A4A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="#B83232" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ═══ SUB 2: Income by Condominium ═══ */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Ingresos por Condominio — {range.label}
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1A7A4A', borderRadius: '8px' }}>
                      <th style={thStyle} onClick={() => toggleSort('nombre')}>Condominio {sortIcon('nombre')}</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => toggleSort('unidades')}>Unidades {sortIcon('unidades')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('cobrado')}>Cobrado {sortIcon('cobrado')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('pendiente')}>Pendiente {sortIcon('pendiente')}</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => toggleSort('cobranza')}>% Cobranza {sortIcon('cobranza')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosSorted.map((c, i) => (
                      <tr key={c.id} style={{ backgroundColor: i % 2 === 1 ? '#FAFBFA' : 'white', borderBottom: '1px solid #E8F4F0' }}>
                        <td style={tdStyle}>{c.nombre}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{c.unidades}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#1A7A4A' }}>Bs. {c.cobrado.toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: c.pendiente > 0 ? '#B83232' : '#5E6B62' }}>Bs. {c.pendiente.toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                            backgroundColor: c.cobranza >= 80 ? '#E8F4F0' : c.cobranza >= 50 ? '#FEF9EC' : '#FCEAEA',
                            color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232',
                          }}>
                            {c.cobranza}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#E8F4F0' }}>
                      <td style={{ ...tdStyle, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>TOTAL</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{ingresosSorted.reduce((s, c) => s + c.unidades, 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1A7A4A', fontFamily: "'Nunito', sans-serif" }}>Bs. {ingresosSorted.reduce((s, c) => s + c.cobrado, 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#B83232', fontFamily: "'Nunito', sans-serif" }}>Bs. {ingresosSorted.reduce((s, c) => s + c.pendiente, 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ═══ SUB 3: Expenses by Condominium ═══ */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Gastos por Condominio — {range.label}
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1A7A4A' }}>
                      <th style={thStyle}>Condominio</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Limpieza</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Mantenimiento</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Personal</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Otros</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gastosPorCondo.map((c: any, i: number) => (
                      <tr key={c.id} style={{ backgroundColor: i % 2 === 1 ? '#FAFBFA' : 'white', borderBottom: '1px solid #E8F4F0' }}>
                        <td style={tdStyle}>{c.nombre}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>Bs. {(c.limpieza || 0).toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>Bs. {(c.mantenimiento || 0).toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>Bs. {(c.personal || 0).toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>Bs. {((c.servicios || 0) + (c.otros || 0)).toFixed(0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#B83232' }}>Bs. {c.total.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#FCEAEA' }}>
                      <td style={{ ...tdStyle, fontWeight: 700, fontFamily: "'Nunito', sans-serif", color: '#B83232' }}>TOTAL</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Bs. {data.gastosPorCondo.reduce((s: number, c: any) => s + (c.limpieza || 0), 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Bs. {data.gastosPorCondo.reduce((s: number, c: any) => s + (c.mantenimiento || 0), 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Bs. {data.gastosPorCondo.reduce((s: number, c: any) => s + (c.personal || 0), 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>Bs. {data.gastosPorCondo.reduce((s: number, c: any) => s + (c.servicios || 0) + (c.otros || 0), 0).toFixed(0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#B83232', fontFamily: "'Nunito', sans-serif" }}>Bs. {data.totalGastos.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ═══ SUB 4: Global Delinquency ═══ */}
            <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
                Morosidad Global
              </h2>

              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', backgroundColor: '#FCEAEA', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Unidades morosas</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#B83232' }}>{data.totalMorosos}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#FCEAEA', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total pendiente</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#B83232' }}>Bs. {data.totalPendienteMora.toFixed(0)}</div>
                </div>
              </div>

              {/* Debt aging */}
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Antigüedad de deuda</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '14px', backgroundColor: '#FEF9EC', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#C07A2E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>1-30 dias</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: '#C07A2E' }}>Bs. {data.deuda1a30.toFixed(0)}</div>
                </div>
                <div style={{ padding: '14px', backgroundColor: '#FCEAEA', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#B83232', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>31-60 dias</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: '#B83232' }}>Bs. {data.deuda31a60.toFixed(0)}</div>
                </div>
                <div style={{ padding: '14px', backgroundColor: '#FCEAEA', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#B83232', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>+60 dias</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: '#B83232' }}>Bs. {data.deuda60plus.toFixed(0)}</div>
                </div>
              </div>

              {/* Top 10 debtors */}
              {data.top10.length > 0 && (
                <>
                  <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>Top 10 deudores</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#B83232' }}>
                          <th style={{ ...thStyle, color: 'white' }}>#</th>
                          <th style={{ ...thStyle, color: 'white' }}>Residente</th>
                          <th style={{ ...thStyle, color: 'white' }}>Condominio</th>
                          <th style={{ ...thStyle, textAlign: 'center', color: 'white' }}>Meses</th>
                          <th style={{ ...thStyle, textAlign: 'right', color: 'white' }}>Deuda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top10.map((d, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#FAFBFA' : 'white', borderBottom: '1px solid #E8F4F0' }}>
                            <td style={tdStyle}>{i + 1}</td>
                            <td style={tdStyle}>{d.nombre}</td>
                            <td style={{ ...tdStyle, color: '#5E6B62' }}>{d.condominio}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{d.meses}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#B83232' }}>Bs. {d.deuda.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
