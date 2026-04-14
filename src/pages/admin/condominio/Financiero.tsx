import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import { exportarExcel } from '@/lib/exportarReporte'
import ReporteJuntaPDF from '@/components/financiero/ReporteJuntaPDF'
import ListaRecibos from './Financiero/ListaRecibos'
import PagosPendientes from './Financiero/PagosPendientes'
import Morosos from './Financiero/Morosos'
import Balance from './Financiero/Balance'
import Gastos from './Financiero/Gastos'

export default function Financiero() {
  const { id } = useParams()

  // Fetch data for Excel/PDF export
  const { data: exportData } = useQuery({
    queryKey: ['export-data', id],
    queryFn: async () => {
      const [recibosRes, gastosRes, morososRes] = await Promise.all([
        supabase.from('recibos').select('periodo, monto_total, estado, unidades(numero), residentes(nombre, apellido)').eq('condominio_id', id!),
        supabase.from('gastos').select('fecha, categoria, descripcion, monto, proveedor_nombre').eq('condominio_id', id!),
        supabase.from('recibos').select('residente_id, periodo, monto_total, residentes(nombre, apellido), unidades(numero)').eq('condominio_id', id!).in('estado', ['emitido', 'vencido']),
      ])

      const ingresos = (recibosRes.data || []).map((r: any) => ({
        periodo: r.periodo,
        unidad: r.unidades?.numero || '—',
        residente: `${r.residentes?.nombre || ''} ${r.residentes?.apellido || ''}`.trim(),
        monto: Number(r.monto_total),
        estado: r.estado,
      }))

      const egresos = (gastosRes.data || []).map(g => ({
        fecha: g.fecha,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto: Number(g.monto),
        proveedor: g.proveedor_nombre || '—',
      }))

      // Group morosos
      const morosoMap: Record<string, { residente: string; unidad: string; meses: number; deuda: number }> = {}
      for (const r of (morososRes.data || []) as any[]) {
        const key = r.residente_id
        if (!morosoMap[key]) {
          morosoMap[key] = {
            residente: `${r.residentes?.nombre || ''} ${r.residentes?.apellido || ''}`.trim(),
            unidad: r.unidades?.numero || '—',
            meses: 0,
            deuda: 0,
          }
        }
        morosoMap[key].meses++
        morosoMap[key].deuda += Number(r.monto_total)
      }

      return { ingresos, egresos, morosos: Object.values(morosoMap) }
    },
    enabled: !!id,
  })

  const { data: condominioInfo } = useQuery({
    queryKey: ['condominio-info', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', id!).single()
      if (error) throw error
      return data as { nombre: string; direccion: string | null; ciudad: string | null }
    },
    enabled: !!id,
  })

  // KPI: month summary
  const mesActual = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const { data: kpiData } = useQuery({
    queryKey: ['financiero-kpi', id, mesActual],
    queryFn: async () => {
      const { data: recibos } = await supabase
        .from('recibos')
        .select('id, monto_total, estado, residente_id')
        .eq('condominio_id', id!)
        .like('periodo', `${mesActual}%`)

      const all = recibos || []
      const totalRecibos = all.length
      const pagados = all.filter(r => r.estado === 'pagado')
      const pendientes = all.filter(r => r.estado !== 'pagado')
      const vencidos = all.filter(r => r.estado === 'vencido')

      const recaudado = pagados.reduce((s, r) => s + Number(r.monto_total), 0)
      const pendiente = pendientes.reduce((s, r) => s + Number(r.monto_total), 0)
      const pctCobranza = totalRecibos > 0 ? Math.round((pagados.length / totalRecibos) * 100) : 0
      const morososCount = new Set(vencidos.map(r => r.residente_id)).size

      return { recaudado, pendiente, pctCobranza, morososCount }
    },
    enabled: !!id,
  })

  // Reporte Junta PDF state
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // IA Analysis state
  const [iaLoading, setIaLoading] = useState(false)
  const [iaAnalisis, setIaAnalisis] = useState<string | null>(null)
  const [iaError, setIaError] = useState<string | null>(null)

  if (!id) return null

  const condoNombre = condominioInfo?.nombre || 'Condominio'
  const condoDir = condominioInfo?.direccion || ''
  const condoCiudad = condominioInfo?.ciudad || ''

  const handleExportExcel = () => {
    if (!exportData) return
    exportarExcel(exportData.ingresos, exportData.egresos, exportData.morosos, condoNombre)
  }

  const handleReporteJunta = async () => {
    if (!exportData) return
    setPdfLoading(true)
    setPdfError(null)
    try {
      const now = new Date()
      const periodo = now.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
      const blob = await pdf(
        <ReporteJuntaPDF
          condominio={{ nombre: condoNombre, direccion: condoDir, ciudad: condoCiudad }}
          periodo={periodo}
          ingresos={exportData.ingresos}
          egresos={exportData.egresos}
          morosos={exportData.morosos}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Error generando Reporte Junta PDF:', err)
      setPdfError(err?.message || 'Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleAnalisisIA = async () => {
    if (!exportData || !kpiData) return
    setIaLoading(true)
    setIaError(null)
    setIaAnalisis(null)

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('API key de Anthropic no configurada (VITE_ANTHROPIC_API_KEY)')

      const totalIngresos = exportData.ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + i.monto, 0)
      const totalEgresos = exportData.egresos.reduce((s, e) => s + e.monto, 0)
      const balance = totalIngresos - totalEgresos
      const totalMorosidad = exportData.morosos.reduce((s, m) => s + m.deuda, 0)

      const egresosPorCat: Record<string, number> = {}
      for (const e of exportData.egresos) {
        egresosPorCat[e.categoria] = (egresosPorCat[e.categoria] || 0) + e.monto
      }

      const prompt = `Eres un analista financiero experto en administración de condominios en Bolivia. Analiza los siguientes datos financieros del condominio "${condoNombre}" y genera un reporte EN ESPAÑOL con las siguientes secciones:

DATOS DEL MES ACTUAL:
- Recaudado: Bs. ${kpiData.recaudado.toFixed(2)}
- Pendiente de cobro: Bs. ${kpiData.pendiente.toFixed(2)}
- % de cobranza: ${kpiData.pctCobranza}%
- Morosos: ${kpiData.morososCount} residentes
- Total ingresos confirmados: Bs. ${totalIngresos.toFixed(2)}
- Total egresos: Bs. ${totalEgresos.toFixed(2)}
- Balance: Bs. ${balance.toFixed(2)}
- Morosidad total acumulada: Bs. ${totalMorosidad.toFixed(2)}

EGRESOS POR CATEGORÍA:
${Object.entries(egresosPorCat).map(([cat, monto]) => `- ${cat}: Bs. ${monto.toFixed(2)}`).join('\n') || '- Sin egresos registrados'}

MOROSOS:
${exportData.morosos.map(m => `- ${m.residente} (${m.unidad}): ${m.meses} mes(es), Bs. ${m.deuda.toFixed(2)}`).join('\n') || '- Sin morosos'}

Genera el análisis con estas secciones exactas:
1. **Resumen Ejecutivo** (3-4 oraciones)
2. **Análisis de Cobranza** (buena/regular/mala y por qué)
3. **Análisis de Gastos** (si están dentro de lo normal)
4. **Situación de Morosos** (análisis y recomendación)
5. **Balance General** (superávit o déficit, tendencia)
6. **3 Acciones Recomendadas para el Próximo Mes**

Sé conciso, profesional y práctico. Usa lenguaje claro para una junta de propietarios.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`Error API (${response.status}): ${errBody}`)
      }

      const result = await response.json()
      const analisis = result.content?.[0]?.text || 'No se generó análisis'
      setIaAnalisis(analisis)

      // Auto-generate PDF with the analysis
      const now = new Date()
      const periodo = now.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
      const blob = await pdf(
        <ReporteJuntaPDF
          condominio={{ nombre: condoNombre, direccion: condoDir, ciudad: condoCiudad }}
          periodo={periodo}
          ingresos={exportData.ingresos}
          egresos={exportData.egresos}
          morosos={exportData.morosos}
          analisisIA={analisis}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Error análisis IA:', err)
      setIaError(err?.message || 'Error al generar el análisis. Intenta de nuevo.')
    } finally {
      setIaLoading(false)
    }
  }

  return (
    <AdminLayout title="Financiero" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Modulo Financiero
          </h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAnalisisIA}
              disabled={iaLoading || !exportData || !kpiData}
              style={{
                padding: '6px 14px',
                backgroundColor: iaLoading ? '#5E6B62' : '#7B1AC8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: iaLoading || !exportData ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                opacity: !exportData ? 0.5 : 1,
              }}
            >
              {iaLoading ? 'Analizando...' : 'Análisis IA + PDF'}
            </button>
            <button
              onClick={handleReporteJunta}
              disabled={pdfLoading || !exportData}
              style={{
                padding: '6px 14px',
                backgroundColor: pdfLoading ? '#5E6B62' : '#0D4A8F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: pdfLoading || !exportData ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                opacity: !exportData ? 0.5 : 1,
              }}
            >
              {pdfLoading ? 'Generando...' : 'Reporte Junta PDF'}
            </button>
            <button
              onClick={handleExportExcel}
              style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Excel
            </button>
          </div>
        </div>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Gestion de cuotas, recibos y pagos del condominio
        </p>

        {/* IA Analysis result */}
        {iaLoading && (
          <div style={{
            backgroundColor: '#F5ECFF', borderLeft: '3px solid #7B1AC8', borderRadius: '8px',
            padding: '16px', marginBottom: '16px', fontFamily: "'Inter', sans-serif",
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '20px', height: '20px', border: '3px solid #7B1AC8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', color: '#7B1AC8', fontWeight: 600 }}>Analizando datos financieros con IA...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {iaAnalisis && (
          <div style={{
            backgroundColor: '#E8F4F0', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '24px', marginBottom: '16px', borderLeft: '4px solid #1A7A4A',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1A7A4A', margin: 0 }}>
                Análisis Inteligente DOMIA
              </h3>
              <button onClick={() => setIaAnalisis(null)} style={{ background: 'none', border: 'none', color: '#5E6B62', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#0D1117', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {iaAnalisis}
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#5E6B62', fontStyle: 'italic', fontFamily: "'Inter', sans-serif" }}>
              Análisis generado por IA basado en datos reales del condominio
            </div>
          </div>
        )}

        {iaError && (
          <div style={{
            backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px',
            padding: '12px 14px', fontSize: '13px', color: '#B83232', marginBottom: '16px',
            fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{iaError}</span>
            <button onClick={() => setIaError(null)} style={{ background: 'none', border: 'none', color: '#B83232', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>✕</button>
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div style={{
            backgroundColor: '#FCEAEA',
            borderLeft: '3px solid #B83232',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#B83232',
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{pdfError}</span>
            <button onClick={() => setPdfError(null)} style={{ background: 'none', border: 'none', color: '#B83232', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>✕</button>
          </div>
        )}

        {/* Pagos pendientes de confirmacion */}
        <PagosPendientes condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Resumen del Mes - KPIs */}
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
            Resumen del Mes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {[
              { label: 'Recaudado', value: `Bs. ${(kpiData?.recaudado ?? 0).toFixed(2)}`, color: '#1A7A4A', bg: '#E8F4F0' },
              { label: 'Pendiente', value: `Bs. ${(kpiData?.pendiente ?? 0).toFixed(2)}`, color: '#C07A2E', bg: '#FEF9EC' },
              { label: '% Cobranza', value: `${kpiData?.pctCobranza ?? 0}%`, color: '#0D4A8F', bg: '#EBF4FF' },
              { label: 'Morosos', value: `${kpiData?.morososCount ?? 0}`, color: '#B83232', bg: '#FCEAEA' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                padding: '20px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62', marginBottom: '6px' }}>{kpi.label}</div>
                <div style={{
                  fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 700, color: kpi.color,
                  backgroundColor: kpi.bg, borderRadius: '10px', padding: '6px 12px', display: 'inline-block',
                }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Balance */}
        <Balance condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Morosos */}
        <Morosos
          condominioId={id}
          condominioNombre={condoNombre}
          condominioDir={condoDir}
          condomionioCiudad={condoCiudad}
        />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Gastos */}
        <Gastos condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Recibos */}
        <ListaRecibos
          condominioId={id}
          condominioNombre={condoNombre}
          condominioDir={condoDir}
          condomionioCiudad={condoCiudad}
        />
      </div>
    </AdminLayout>
  )
}
