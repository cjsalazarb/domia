import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1A7A4A' },
  condoName: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: '#1A7A4A' },
  condoSub: { fontSize: 9, color: '#5E6B62', marginTop: 2 },
  domiaLogo: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  domiaGreen: { color: '#1A7A4A' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 16, textAlign: 'center', marginBottom: 4, color: '#0D1117', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 11, textAlign: 'center', color: '#5E6B62', marginBottom: 24 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#1A7A4A', marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', marginBottom: 12, gap: 16 },
  infoBlock: { flex: 1, backgroundColor: '#F4F7F5', borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0D1117' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A7A4A', borderRadius: 6, padding: 8, marginBottom: 4 },
  tableHeaderText: { color: 'white', fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableTotal: { flexDirection: 'row', padding: 12, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4 },
  tableTotalLabel: { flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1A7A4A' },
  tableTotalMonto: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 16, textAlign: 'right', color: '#1A7A4A' },
  notesBox: { marginTop: 16, backgroundColor: '#F4F7F5', borderRadius: 8, padding: 14 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#5E6B62' },
})

interface Props {
  propuesta: {
    nombre_prospecto: string
    telefono?: string
    email?: string
    nombre_condominio: string
    direccion?: string
    ciudad?: string
    num_pisos: number
    num_departamentos: number
    visitas_semanales: number
    precio_calculado: number
    precio_final: number
    notas?: string
    created_at?: string
  }
}

function formatBs(n: number) {
  return `Bs. ${n.toFixed(2)}`
}

export default function PropuestaPDF({ propuesta: p }: Props) {
  const ajustePisos = (p.num_pisos - 5) * 100
  const dptosExtra = Math.max(0, p.num_departamentos - 20)
  const ajusteDptos = Math.floor(dptosExtra / 10) * 50
  const visitasExtra = Math.max(0, p.visitas_semanales - 2)
  const ajusteVisitas = visitasExtra * 150

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.condoName}>DOMIA</Text>
            <Text style={s.condoSub}>Sistema de Administracion de Condominios</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.domiaLogo}>DOM<Text style={s.domiaGreen}>IA</Text></Text>
            <Text style={{ fontSize: 7, color: '#5E6B62', marginTop: 2 }}>Propuesta Comercial</Text>
          </View>
        </View>

        <Text style={s.title}>Propuesta de Servicio</Text>
        <Text style={s.subtitle}>Preparada para {p.nombre_prospecto}</Text>

        {/* Datos del prospecto */}
        <Text style={s.sectionTitle}>Datos del Condominio</Text>
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Condominio</Text>
            <Text style={s.infoValue}>{p.nombre_condominio}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Contacto</Text>
            <Text style={s.infoValue}>{p.nombre_prospecto}</Text>
          </View>
        </View>
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Ubicacion</Text>
            <Text style={s.infoValue}>{[p.direccion, p.ciudad].filter(Boolean).join(', ') || '—'}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Contacto</Text>
            <Text style={s.infoValue}>{[p.telefono, p.email].filter(Boolean).join(' / ') || '—'}</Text>
          </View>
        </View>

        {/* Parametros */}
        <Text style={s.sectionTitle}>Parametros del Servicio</Text>
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Pisos</Text>
            <Text style={s.infoValue}>{p.num_pisos}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Departamentos</Text>
            <Text style={s.infoValue}>{p.num_departamentos}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Visitas / Semana</Text>
            <Text style={s.infoValue}>{p.visitas_semanales}</Text>
          </View>
        </View>

        {/* Desglose de precio */}
        <Text style={s.sectionTitle}>Desglose de Precio Mensual</Text>
        <View style={{ marginBottom: 16 }}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderText, flex: 3 }}>Concepto</Text>
            <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'right' }}>Monto</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={{ flex: 3, fontSize: 10 }}>Tarifa base (5 pisos, 20 dptos, 2 visitas)</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(1200)}</Text>
          </View>
          {ajustePisos !== 0 && (
            <View style={{ ...s.tableRow, backgroundColor: '#FAFBFA' }}>
              <Text style={{ flex: 3, fontSize: 10 }}>Ajuste pisos ({p.num_pisos} pisos, {ajustePisos > 0 ? '+' : ''}{ajustePisos / 100} x Bs. 100)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: ajustePisos > 0 ? '#0D1117' : '#1A7A4A' }}>{ajustePisos > 0 ? '+' : ''}{formatBs(ajustePisos)}</Text>
            </View>
          )}
          {ajusteDptos > 0 && (
            <View style={s.tableRow}>
              <Text style={{ flex: 3, fontSize: 10 }}>Ajuste departamentos ({p.num_departamentos} dptos, +{Math.floor(dptosExtra / 10)} x Bs. 50)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>+{formatBs(ajusteDptos)}</Text>
            </View>
          )}
          {ajusteVisitas > 0 && (
            <View style={{ ...s.tableRow, backgroundColor: '#FAFBFA' }}>
              <Text style={{ flex: 3, fontSize: 10 }}>Visitas adicionales ({p.visitas_semanales} visitas, +{visitasExtra} x Bs. 150)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>+{formatBs(ajusteVisitas)}</Text>
            </View>
          )}
          <View style={s.tableTotal}>
            <Text style={s.tableTotalLabel}>PRECIO MENSUAL</Text>
            <Text style={s.tableTotalMonto}>{formatBs(p.precio_final)}</Text>
          </View>
        </View>

        {/* Notas */}
        {p.notas && (
          <View style={s.notesBox}>
            <Text style={{ ...s.infoLabel, marginBottom: 6 }}>Observaciones</Text>
            <Text style={{ fontSize: 10, color: '#0D1117', lineHeight: 1.5 }}>{p.notas}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA - Propuesta Comercial Confidencial</Text>
          <Text style={s.footerText}>Generado: {new Date().toLocaleDateString('es-BO')}</Text>
        </View>
      </Page>
    </Document>
  )
}
