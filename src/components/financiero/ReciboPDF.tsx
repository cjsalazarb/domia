import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Nunito',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTQ3j6zbXWjgevT5.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTo3j6zbXWjgevT5.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdQQ3j6zbXWjgevT5.woff2', fontWeight: 800 },
  ],
})

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 500 },
  ],
})

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10, color: '#0D1117' },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1A7A4A' },
  headerLeft: {},
  condoName: { fontFamily: 'Nunito', fontSize: 18, fontWeight: 800, color: '#1A7A4A' },
  condoAddress: { fontSize: 9, color: '#5E6B62', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  domiaLogo: { fontFamily: 'Nunito', fontSize: 14, fontWeight: 800 },
  domiaGreen: { color: '#1A7A4A' },
  // Title
  title: { fontFamily: 'Nunito', fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 4, color: '#0D1117', textTransform: 'uppercase', letterSpacing: 1 },
  periodo: { fontFamily: 'Inter', fontSize: 11, textAlign: 'center', color: '#5E6B62', marginBottom: 20 },
  // Info grid
  infoRow: { flexDirection: 'row', marginBottom: 16, gap: 20 },
  infoBlock: { flex: 1, backgroundColor: '#F4F7F5', borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 8, fontWeight: 500, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontFamily: 'Nunito', fontSize: 11, fontWeight: 700, color: '#0D1117' },
  infoSub: { fontSize: 9, color: '#5E6B62', marginTop: 2 },
  // Table
  table: { marginTop: 8, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A7A4A', borderRadius: 6, padding: 8, marginBottom: 4 },
  tableHeaderText: { color: 'white', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableRowAlt: { backgroundColor: '#FAFBFA' },
  tableConcept: { flex: 3, fontSize: 10, color: '#0D1117' },
  tableMonto: { flex: 1, fontSize: 10, textAlign: 'right', color: '#0D1117' },
  tableTotal: { flexDirection: 'row', padding: 10, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4 },
  tableTotalLabel: { flex: 3, fontFamily: 'Nunito', fontSize: 12, fontWeight: 700, color: '#1A7A4A' },
  tableTotalMonto: { flex: 1, fontFamily: 'Nunito', fontSize: 14, fontWeight: 800, textAlign: 'right', color: '#1A7A4A' },
  // Estado
  estadoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgePagado: { backgroundColor: '#E8F4F0', color: '#1A7A4A' },
  badgeVencido: { backgroundColor: '#FCEAEA', color: '#B83232' },
  badgeEmitido: { backgroundColor: '#F0F0F0', color: '#5E6B62' },
  vencimiento: { fontSize: 9, color: '#5E6B62' },
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#5E6B62' },
})

interface ReciboPDFProps {
  condominio: { nombre: string; direccion?: string; ciudad?: string }
  unidad: { numero: string; tipo: string }
  residente: { nombre: string; apellido: string }
  periodo: string // ISO date string
  monto_base: number
  monto_recargo: number
  monto_total: number
  estado: 'emitido' | 'pagado' | 'vencido' | 'anulado'
  fecha_vencimiento: string
}

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatPeriodo(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${meses[d.getMonth()]} ${d.getFullYear()}`
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatBs(n: number) {
  return `Bs. ${n.toFixed(2)}`
}

function badgeStyle(estado: string) {
  if (estado === 'pagado') return { ...s.badge, ...s.badgePagado }
  if (estado === 'vencido') return { ...s.badge, ...s.badgeVencido }
  return { ...s.badge, ...s.badgeEmitido }
}

function estadoLabel(estado: string) {
  const map: Record<string, string> = { emitido: 'Emitido', pagado: 'Pagado', vencido: 'Vencido', anulado: 'Anulado' }
  return map[estado] || estado
}

export default function ReciboPDF(props: ReciboPDFProps) {
  const { condominio, unidad, residente, periodo, monto_base, monto_recargo, monto_total, estado, fecha_vencimiento } = props

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.condoName}>{condominio.nombre}</Text>
            {condominio.direccion && <Text style={s.condoAddress}>{condominio.direccion}</Text>}
            {condominio.ciudad && <Text style={s.condoAddress}>{condominio.ciudad}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.domiaLogo}>
              DOM<Text style={s.domiaGreen}>IA</Text>
            </Text>
            <Text style={{ fontSize: 7, color: '#5E6B62', marginTop: 2 }}>Sistema de Administración</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>Recibo de Cuota de Mantenimiento</Text>
        <Text style={s.periodo}>Período: {formatPeriodo(periodo)}</Text>

        {/* Info */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{residente.nombre} {residente.apellido}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Unidad</Text>
            <Text style={s.infoValue}>{unidad.numero}</Text>
            <Text style={s.infoSub}>{unidad.tipo}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderText, flex: 3 }}>Concepto</Text>
            <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'right' }}>Monto</Text>
          </View>

          <View style={s.tableRow}>
            <Text style={s.tableConcept}>Cuota de mantenimiento — {formatPeriodo(periodo)}</Text>
            <Text style={s.tableMonto}>{formatBs(monto_base)}</Text>
          </View>

          {monto_recargo > 0 && (
            <View style={{ ...s.tableRow, ...s.tableRowAlt }}>
              <Text style={{ ...s.tableConcept, color: '#B83232' }}>Recargo por mora</Text>
              <Text style={{ ...s.tableMonto, color: '#B83232' }}>{formatBs(monto_recargo)}</Text>
            </View>
          )}

          <View style={s.tableTotal}>
            <Text style={s.tableTotalLabel}>TOTAL A PAGAR</Text>
            <Text style={s.tableTotalMonto}>{formatBs(monto_total)}</Text>
          </View>
        </View>

        {/* Estado + Vencimiento */}
        <View style={s.estadoRow}>
          <View>
            <Text style={s.vencimiento}>Fecha de vencimiento: {formatDate(fecha_vencimiento)}</Text>
          </View>
          <Text style={badgeStyle(estado)}>{estadoLabel(estado)}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA — Sistema de Administración de Condominios · Bolivia</Text>
          <Text style={s.footerText}>Generado: {new Date().toLocaleDateString('es-BO')}</Text>
        </View>
      </Page>
    </Document>
  )
}
