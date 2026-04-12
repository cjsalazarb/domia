import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1A7A4A' },
  condoName: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#1A7A4A' },
  condoSub: { fontSize: 9, color: '#5E6B62', marginTop: 2 },
  domiaLogo: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  domiaGreen: { color: '#1A7A4A' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 14, textAlign: 'center', marginBottom: 4, color: '#0D1117', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontFamily: 'Helvetica', fontSize: 11, textAlign: 'center', color: '#5E6B62', marginBottom: 20 },
  infoRow: { flexDirection: 'row', marginBottom: 16, gap: 20 },
  infoBlock: { flex: 1, backgroundColor: '#F4F7F5', borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0D1117' },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0D1117', marginBottom: 8, marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A7A4A', borderRadius: 6, padding: 8, marginBottom: 4 },
  thText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableRowAlt: { backgroundColor: '#FAFBFA' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4, marginBottom: 20 },
  totalLabel: { flex: 4, fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#1A7A4A' },
  totalMonto: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 14, textAlign: 'right', color: '#1A7A4A' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#5E6B62' },
})

interface ReciboRow {
  periodo: string
  monto_base: number
  monto_recargo: number
  monto_total: number
  estado: string
  fecha_vencimiento: string
}

interface Props {
  condominio: { nombre: string; direccion?: string; ciudad?: string }
  residente: { nombre: string; apellido: string; ci?: string }
  unidad: { numero: string; tipo: string }
  recibos: ReciboRow[]
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatPeriodo(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function formatBs(n: number) { return `Bs. ${n.toFixed(2)}` }

function estadoColor(e: string) {
  if (e === 'pagado') return { bg: '#E8F4F0', color: '#1A7A4A' }
  if (e === 'vencido') return { bg: '#FCEAEA', color: '#B83232' }
  return { bg: '#F0F0F0', color: '#5E6B62' }
}

function estadoLabel(e: string) {
  const m: Record<string, string> = { emitido: 'Emitido', pagado: 'Pagado', vencido: 'Vencido', anulado: 'Anulado' }
  return m[e] || e
}

export default function EstadoCuentaPDF({ condominio, residente, unidad, recibos }: Props) {
  const pendientes = recibos.filter(r => r.estado === 'emitido' || r.estado === 'vencido')
  const totalPendiente = pendientes.reduce((s, r) => s + Number(r.monto_total), 0)
  const totalPagado = recibos.filter(r => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto_total), 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.condoName}>{condominio.nombre}</Text>
            {condominio.direccion && <Text style={s.condoSub}>{condominio.direccion}</Text>}
            {condominio.ciudad && <Text style={s.condoSub}>{condominio.ciudad}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.domiaLogo}>DOM<Text style={s.domiaGreen}>IA</Text></Text>
            <Text style={{ fontSize: 7, color: '#5E6B62', marginTop: 2 }}>Sistema de Administracion</Text>
          </View>
        </View>

        <Text style={s.title}>Estado de Cuenta</Text>
        <Text style={s.subtitle}>Generado: {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{residente.nombre} {residente.apellido}</Text>
            {residente.ci && <Text style={{ fontSize: 9, color: '#5E6B62', marginTop: 2 }}>CI: {residente.ci}</Text>}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Unidad</Text>
            <Text style={s.infoValue}>{unidad.numero}</Text>
            <Text style={{ fontSize: 9, color: '#5E6B62', marginTop: 2 }}>{unidad.tipo}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Saldo Pendiente</Text>
            <Text style={{ ...s.infoValue, color: totalPendiente > 0 ? '#B83232' : '#1A7A4A', fontSize: 14 }}>
              {formatBs(totalPendiente)}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Detalle de Recibos</Text>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 1.5 }}>Periodo</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Base</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Recargo</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Total</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'center' }}>Estado</Text>
        </View>

        {recibos.map((r, i) => {
          const ec = estadoColor(r.estado)
          return (
            <View key={i} style={{ ...s.tableRow, ...(i % 2 === 1 ? s.tableRowAlt : {}) }}>
              <Text style={{ flex: 1.5, fontSize: 10, color: '#0D1117' }}>{formatPeriodo(r.periodo)}</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: '#0D1117' }}>{formatBs(Number(r.monto_base))}</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: Number(r.monto_recargo) > 0 ? '#B83232' : '#5E6B62' }}>
                {Number(r.monto_recargo) > 0 ? formatBs(Number(r.monto_recargo)) : '—'}
              </Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#0D1117' }}>{formatBs(Number(r.monto_total))}</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ ...s.badge, backgroundColor: ec.bg, color: ec.color }}>{estadoLabel(r.estado)}</Text>
              </View>
            </View>
          )
        })}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL PAGADO</Text>
          <Text style={{ ...s.totalMonto, color: '#1A7A4A' }}>{formatBs(totalPagado)}</Text>
        </View>

        {totalPendiente > 0 && (
          <View style={{ ...s.totalRow, backgroundColor: '#FCEAEA' }}>
            <Text style={{ ...s.totalLabel, color: '#B83232' }}>TOTAL PENDIENTE</Text>
            <Text style={{ ...s.totalMonto, color: '#B83232' }}>{formatBs(totalPendiente)}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Sistema de Administracion de Condominios</Text>
          <Text style={s.footerText}>Generado: {new Date().toLocaleDateString('es-BO')}</Text>
        </View>
      </Page>
    </Document>
  )
}
