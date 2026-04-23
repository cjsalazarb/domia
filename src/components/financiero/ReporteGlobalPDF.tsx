import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1117' },
  coverCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverTitle: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: '#1A7A4A', marginBottom: 8 },
  coverSub: { fontFamily: 'Helvetica', fontSize: 14, color: '#5E6B62', marginBottom: 4 },
  coverPeriodo: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#0D1117', marginTop: 20, marginBottom: 4 },
  coverLine: { width: 60, height: 3, backgroundColor: '#1A7A4A', borderRadius: 2, marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#1A7A4A', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A7A4A', borderRadius: 6, padding: 8, marginBottom: 4 },
  thText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableRowAlt: { backgroundColor: '#FAFBFA' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4, marginBottom: 20 },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1A7A4A' },
  totalMonto: { fontFamily: 'Helvetica-Bold', fontSize: 13, textAlign: 'right', color: '#1A7A4A' },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#F4F7F5', borderRadius: 10, padding: 14, alignItems: 'center' },
  kpiLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontFamily: 'Helvetica-Bold', fontSize: 16 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#5E6B62' },
})

function formatBs(n: number) { return `Bs. ${n.toFixed(2)}` }

interface IngresoCondo { id: string; nombre: string; unidades: number; cobrado: number; pendiente: number; cobranza: number }
interface GastoCondo { id: string; nombre: string; limpieza?: number; mantenimiento?: number; personal?: number; servicios?: number; otros?: number; total: number }
interface Deudor { nombre: string; condominio: string; deuda: number; meses: number }

interface Props {
  periodo: string
  totalIngresos: number
  totalGastos: number
  superavit: number
  ingresosPorCondo: IngresoCondo[]
  gastosPorCondo: GastoCondo[]
  top10: Deudor[]
  totalMorosos: number
  totalPendienteMora: number
  deuda1a30: number
  deuda31a60: number
  deuda60plus: number
}

export default function ReporteGlobalPDF({
  periodo, totalIngresos, totalGastos, superavit,
  ingresosPorCondo, gastosPorCondo, top10,
  totalMorosos, totalPendienteMora,
  deuda1a30, deuda31a60, deuda60plus,
}: Props) {
  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={s.page}>
        <View style={s.coverCenter}>
          <Text style={s.coverTitle}>DOMIA</Text>
          <Text style={s.coverSub}>Sistema de Administracion de Condominios</Text>
          <View style={s.coverLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 16, color: '#0D1117', textTransform: 'uppercase', letterSpacing: 2 }}>
            Reporte Financiero Global
          </Text>
          <Text style={s.coverPeriodo}>{periodo}</Text>
          <View style={s.coverLine} />
          <Text style={{ fontSize: 10, color: '#5E6B62', marginTop: 20 }}>
            Reporte Ejecutivo Consolidado
          </Text>
          <Text style={{ fontSize: 9, color: '#5E6B62', marginTop: 4 }}>
            Generado: {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Reporte Global</Text>
          <Text style={s.footerText}>Confidencial</Text>
        </View>
      </Page>

      {/* Executive summary */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Resumen Ejecutivo</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Ingresos</Text>
            <Text style={{ ...s.kpiValue, color: '#1A7A4A' }}>{formatBs(totalIngresos)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Gastos</Text>
            <Text style={{ ...s.kpiValue, color: '#B83232' }}>{formatBs(totalGastos)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>{superavit >= 0 ? 'Superávit' : 'Déficit'}</Text>
            <Text style={{ ...s.kpiValue, color: superavit >= 0 ? '#1A7A4A' : '#B83232' }}>{formatBs(superavit)}</Text>
          </View>
        </View>

        {totalPendienteMora > 0 && (
          <View style={{ backgroundColor: '#FCEAEA', borderRadius: 8, padding: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#B83232' }}>Morosidad global ({totalMorosos} unidades)</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#B83232' }}>{formatBs(totalPendienteMora)}</Text>
          </View>
        )}

        {/* Income by condo */}
        <Text style={{ ...s.sectionTitle, marginTop: 8 }}>Ingresos por Condominio</Text>
        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 2 }}>Condominio</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>Unidades</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Cobrado</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Pendiente</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>% Cobranza</Text>
        </View>
        {ingresosPorCondo.map((c, i) => (
          <View key={c.id} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
            <Text style={{ flex: 2, fontSize: 10 }}>{c.nombre}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'center' }}>{c.unidades}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: '#1A7A4A' }}>{formatBs(c.cobrado)}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: c.pendiente > 0 ? '#B83232' : '#5E6B62' }}>{formatBs(c.pendiente)}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 3 }}>TOTAL</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(ingresosPorCondo.reduce((s, c) => s + c.cobrado, 0))}</Text>
          <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 11, textAlign: 'right', color: '#B83232' }}>{formatBs(ingresosPorCondo.reduce((s, c) => s + c.pendiente, 0))}</Text>
          <Text style={{ flex: 1 }} />
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Reporte Global - {periodo}</Text>
          <Text style={s.footerText}>Pag. 2</Text>
        </View>
      </Page>

      {/* Expenses by condo */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Gastos por Condominio</Text>
        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 2 }}>Condominio</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Limpieza</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Mant.</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Personal</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Otros</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Total</Text>
        </View>
        {gastosPorCondo.map((c, i) => (
          <View key={c.id} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
            <Text style={{ flex: 2, fontSize: 10 }}>{c.nombre}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(c.limpieza || 0)}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(c.mantenimiento || 0)}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(c.personal || 0)}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs((c.servicios || 0) + (c.otros || 0))}</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#B83232' }}>{formatBs(c.total)}</Text>
          </View>
        ))}
        <View style={{ ...s.totalRow, backgroundColor: '#FCEAEA' }}>
          <Text style={{ ...s.totalLabel, flex: 6, color: '#B83232' }}>TOTAL GASTOS</Text>
          <Text style={{ ...s.totalMonto, flex: 1, color: '#B83232' }}>{formatBs(gastosPorCondo.reduce((s, c) => s + c.total, 0))}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Reporte Global - {periodo}</Text>
          <Text style={s.footerText}>Pag. 3</Text>
        </View>
      </Page>

      {/* Delinquency */}
      {(top10.length > 0 || totalPendienteMora > 0) && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Morosidad Global</Text>

          <View style={s.kpiRow}>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Unidades morosas</Text>
              <Text style={{ ...s.kpiValue, color: '#B83232' }}>{totalMorosos}</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Total pendiente</Text>
              <Text style={{ ...s.kpiValue, color: '#B83232' }}>{formatBs(totalPendienteMora)}</Text>
            </View>
          </View>

          {/* Aging */}
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0D1117', marginBottom: 8 }}>Antigüedad de deuda</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: '#FEF9EC', borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#C07A2E', marginBottom: 4 }}>1-30 DIAS</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#C07A2E' }}>{formatBs(deuda1a30)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FCEAEA', borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#B83232', marginBottom: 4 }}>31-60 DIAS</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#B83232' }}>{formatBs(deuda31a60)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FCEAEA', borderRadius: 8, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#B83232', marginBottom: 4 }}>+60 DIAS</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#B83232' }}>{formatBs(deuda60plus)}</Text>
            </View>
          </View>

          {top10.length > 0 && (
            <>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0D1117', marginBottom: 8 }}>Top 10 Deudores</Text>
              <View style={{ ...s.tableHeader, backgroundColor: '#B83232' }}>
                <Text style={{ ...s.thText, flex: 0.5 }}>#</Text>
                <Text style={{ ...s.thText, flex: 2 }}>Residente</Text>
                <Text style={{ ...s.thText, flex: 1.5 }}>Condominio</Text>
                <Text style={{ ...s.thText, flex: 0.5, textAlign: 'center' }}>Meses</Text>
                <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Deuda</Text>
              </View>
              {top10.map((d, i) => (
                <View key={i} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
                  <Text style={{ flex: 0.5, fontSize: 10 }}>{i + 1}</Text>
                  <Text style={{ flex: 2, fontSize: 10 }}>{d.nombre}</Text>
                  <Text style={{ flex: 1.5, fontSize: 10, color: '#5E6B62' }}>{d.condominio}</Text>
                  <Text style={{ flex: 0.5, fontSize: 10, textAlign: 'center' }}>{d.meses}</Text>
                  <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#B83232' }}>{formatBs(d.deuda)}</Text>
                </View>
              ))}
            </>
          )}

          <View style={s.footer} fixed>
            <Text style={s.footerText}>DOMIA - Reporte Global - {periodo}</Text>
            <Text style={s.footerText}>Pag. 4</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
