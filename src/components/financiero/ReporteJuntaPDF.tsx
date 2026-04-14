import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1117' },
  // Cover
  coverCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverTitle: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: '#1A7A4A', marginBottom: 8 },
  coverSub: { fontFamily: 'Helvetica', fontSize: 14, color: '#5E6B62', marginBottom: 4 },
  coverPeriodo: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#0D1117', marginTop: 20, marginBottom: 4 },
  coverLine: { width: 60, height: 3, backgroundColor: '#1A7A4A', borderRadius: 2, marginTop: 12, marginBottom: 12 },
  // Common
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#1A7A4A', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A7A4A', borderRadius: 6, padding: 8, marginBottom: 4 },
  thText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableRowAlt: { backgroundColor: '#FAFBFA' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4, marginBottom: 20 },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1A7A4A' },
  totalMonto: { fontFamily: 'Helvetica-Bold', fontSize: 13, textAlign: 'right', color: '#1A7A4A' },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#F4F7F5', borderRadius: 10, padding: 14, alignItems: 'center' },
  kpiLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontFamily: 'Helvetica-Bold', fontSize: 16 },
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#5E6B62' },
})

interface IngresoRow { unidad: string; residente: string; monto: number; estado: string }
interface EgresoRow { fecha: string; categoria: string; descripcion: string; monto: number; proveedor: string }
interface MorosoRow { residente: string; unidad: string; meses: number; deuda: number }

interface Props {
  condominio: { nombre: string; direccion?: string; ciudad?: string }
  periodo: string
  ingresos: IngresoRow[]
  egresos: EgresoRow[]
  morosos: MorosoRow[]
  analisisIA?: string
}

function formatBs(n: number) { return `Bs. ${n.toFixed(2)}` }

export default function ReporteJuntaPDF({ condominio, periodo, ingresos, egresos, morosos, analisisIA }: Props) {
  const totalIngresos = ingresos.filter(i => i.estado === 'pagado').reduce((s, i) => s + i.monto, 0)
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0)
  const balance = totalIngresos - totalEgresos
  const totalMorosidad = morosos.reduce((s, m) => s + m.deuda, 0)

  // Group egresos by category
  const egresosPorCat: Record<string, number> = {}
  for (const e of egresos) {
    egresosPorCat[e.categoria] = (egresosPorCat[e.categoria] || 0) + e.monto
  }

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={s.page}>
        <View style={s.coverCenter}>
          <Text style={s.coverTitle}>{condominio.nombre}</Text>
          {condominio.direccion && <Text style={s.coverSub}>{condominio.direccion}</Text>}
          {condominio.ciudad && <Text style={s.coverSub}>{condominio.ciudad}</Text>}
          <View style={s.coverLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#0D1117', textTransform: 'uppercase', letterSpacing: 2 }}>
            Reporte Financiero
          </Text>
          <Text style={s.coverPeriodo}>{periodo}</Text>
          <View style={s.coverLine} />
          <Text style={{ fontSize: 10, color: '#5E6B62', marginTop: 20 }}>
            Preparado para la Junta de Propietarios
          </Text>
          <Text style={{ fontSize: 9, color: '#5E6B62', marginTop: 4 }}>
            Generado: {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Sistema de Administracion de Condominios</Text>
          <Text style={s.footerText}>{condominio.nombre}</Text>
        </View>
      </Page>

      {/* Resumen page */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Resumen Financiero</Text>

        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Ingresos</Text>
            <Text style={{ ...s.kpiValue, color: '#1A7A4A' }}>{formatBs(totalIngresos)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Egresos</Text>
            <Text style={{ ...s.kpiValue, color: '#B83232' }}>{formatBs(totalEgresos)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Balance</Text>
            <Text style={{ ...s.kpiValue, color: balance >= 0 ? '#1A7A4A' : '#B83232' }}>{formatBs(balance)}</Text>
          </View>
        </View>

        {totalMorosidad > 0 && (
          <View style={{ backgroundColor: '#FCEAEA', borderRadius: 8, padding: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#B83232' }}>Morosidad total ({morosos.length} residente{morosos.length !== 1 ? 's' : ''})</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#B83232' }}>{formatBs(totalMorosidad)}</Text>
          </View>
        )}

        {/* Egresos por categoria */}
        <Text style={{ ...s.sectionTitle, marginTop: 8 }}>Egresos por Categoria</Text>
        {Object.entries(egresosPorCat).sort((a, b) => b[1] - a[1]).map(([cat, monto], i) => (
          <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: i % 2 === 0 ? '#FAFBFA' : 'white', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 10, color: '#0D1117' }}>{cat}</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0D1117' }}>{formatBs(monto)}</Text>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - {condominio.nombre} - {periodo}</Text>
          <Text style={s.footerText}>Pag. 2</Text>
        </View>
      </Page>

      {/* Ingresos detail */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Detalle de Ingresos</Text>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 1 }}>Unidad</Text>
          <Text style={{ ...s.thText, flex: 2 }}>Residente</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>Estado</Text>
        </View>

        {ingresos.map((r, i) => (
          <View key={i} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
            <Text style={{ flex: 1, fontSize: 10 }}>{r.unidad}</Text>
            <Text style={{ flex: 2, fontSize: 10 }}>{r.residente}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(r.monto)}</Text>
            <Text style={{ flex: 1, fontSize: 9, textAlign: 'center', color: r.estado === 'pagado' ? '#1A7A4A' : '#B83232' }}>
              {r.estado === 'pagado' ? 'Pagado' : r.estado === 'vencido' ? 'Vencido' : 'Emitido'}
            </Text>
          </View>
        ))}

        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 4 }}>TOTAL RECAUDADO</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(totalIngresos)}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - {condominio.nombre} - {periodo}</Text>
          <Text style={s.footerText}>Pag. 3</Text>
        </View>
      </Page>

      {/* Egresos detail */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Detalle de Egresos</Text>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 1 }}>Fecha</Text>
          <Text style={{ ...s.thText, flex: 1.5 }}>Categoria</Text>
          <Text style={{ ...s.thText, flex: 2 }}>Descripcion</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
        </View>

        {egresos.map((e, i) => (
          <View key={i} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
            <Text style={{ flex: 1, fontSize: 10 }}>{e.fecha}</Text>
            <Text style={{ flex: 1.5, fontSize: 10 }}>{e.categoria}</Text>
            <Text style={{ flex: 2, fontSize: 10 }}>{e.descripcion}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(e.monto)}</Text>
          </View>
        ))}

        <View style={{ ...s.totalRow, backgroundColor: '#FCEAEA' }}>
          <Text style={{ ...s.totalLabel, flex: 4, color: '#B83232' }}>TOTAL EGRESOS</Text>
          <Text style={{ ...s.totalMonto, flex: 1, color: '#B83232' }}>{formatBs(totalEgresos)}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - {condominio.nombre} - {periodo}</Text>
          <Text style={s.footerText}>Pag. 4</Text>
        </View>
      </Page>

      {/* Morosos */}
      {morosos.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Residentes Morosos</Text>

          <View style={s.tableHeader}>
            <Text style={{ ...s.thText, flex: 2 }}>Residente</Text>
            <Text style={{ ...s.thText, flex: 1 }}>Unidad</Text>
            <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>Meses</Text>
            <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Deuda</Text>
          </View>

          {morosos.map((m, i) => (
            <View key={i} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
              <Text style={{ flex: 2, fontSize: 10 }}>{m.residente}</Text>
              <Text style={{ flex: 1, fontSize: 10 }}>{m.unidad}</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'center' }}>{m.meses}</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: '#B83232', fontFamily: 'Helvetica-Bold' }}>{formatBs(m.deuda)}</Text>
            </View>
          ))}

          <View style={{ ...s.totalRow, backgroundColor: '#FCEAEA' }}>
            <Text style={{ ...s.totalLabel, flex: 4, color: '#B83232' }}>MOROSIDAD TOTAL</Text>
            <Text style={{ ...s.totalMonto, flex: 1, color: '#B83232' }}>{formatBs(totalMorosidad)}</Text>
          </View>

          <View style={s.footer} fixed>
            <Text style={s.footerText}>DOMIA - {condominio.nombre} - {periodo}</Text>
            <Text style={s.footerText}>Pag. 5</Text>
          </View>
        </Page>
      )}
      {/* Análisis IA */}
      {analisisIA && (
        <Page size="A4" style={s.page}>
          <View style={{ backgroundColor: '#E8F4F0', borderRadius: 10, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#1A7A4A' }}>Análisis Inteligente DOMIA</Text>
          </View>

          {analisisIA.split('\n').map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) return <View key={i} style={{ height: 8 }} />
            const isBold = trimmed.startsWith('**') || trimmed.startsWith('##') || trimmed.startsWith('#')
            const cleanLine = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')
            return (
              <Text key={i} style={{
                fontSize: isBold ? 11 : 10,
                fontFamily: isBold ? 'Helvetica-Bold' : 'Helvetica',
                color: isBold ? '#1A7A4A' : '#0D1117',
                lineHeight: 1.6,
                marginBottom: isBold ? 6 : 2,
              }}>
                {cleanLine}
              </Text>
            )
          })}

          <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10 }}>
            <Text style={{ fontSize: 8, color: '#5E6B62', fontStyle: 'italic' }}>
              Análisis generado por IA basado en datos reales del condominio — {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })} {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={s.footer} fixed>
            <Text style={s.footerText}>DOMIA - {condominio.nombre} - {periodo}</Text>
            <Text style={s.footerText}>Análisis IA</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
