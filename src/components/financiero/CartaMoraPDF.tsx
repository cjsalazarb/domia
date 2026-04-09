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
  page: { padding: 50, fontFamily: 'Inter', fontSize: 11, color: '#0D1117' },
  header: { marginBottom: 30, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1A7A4A' },
  condoName: { fontFamily: 'Nunito', fontSize: 18, fontWeight: 800, color: '#1A7A4A' },
  condoAddr: { fontSize: 9, color: '#5E6B62', marginTop: 2 },
  title: { fontFamily: 'Nunito', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, color: '#B83232' },
  date: { textAlign: 'right', fontSize: 10, color: '#5E6B62', marginBottom: 20 },
  para: { fontSize: 11, lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' },
  bold: { fontWeight: 500 },
  table: { marginTop: 16, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#B83232', borderRadius: 4, padding: 8 },
  tableHeaderText: { color: 'white', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#FCEAEA', borderRadius: 4, marginTop: 4 },
  totalLabel: { flex: 3, fontFamily: 'Nunito', fontSize: 12, fontWeight: 700, color: '#B83232' },
  totalMonto: { flex: 1, fontFamily: 'Nunito', fontSize: 14, fontWeight: 800, textAlign: 'right', color: '#B83232' },
  footer: { position: 'absolute', bottom: 40, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#C8D4CB', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#5E6B62', textAlign: 'center' },
})

interface Deuda {
  periodo: string
  monto: number
}

interface CartaMoraProps {
  condominio: { nombre: string; direccion?: string; ciudad?: string }
  residente: { nombre: string; apellido: string }
  unidad: string
  deudas: Deuda[]
  totalDeuda: number
}

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatPeriodo(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${meses[d.getMonth()]} ${d.getFullYear()}`
}

export default function CartaMoraPDF({ condominio, residente, unidad, deudas, totalDeuda }: CartaMoraProps) {
  const hoy = new Date()
  const fechaHoy = `${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.condoName}>{condominio.nombre}</Text>
          {condominio.direccion && <Text style={s.condoAddr}>{condominio.direccion}</Text>}
          {condominio.ciudad && <Text style={s.condoAddr}>{condominio.ciudad}</Text>}
        </View>

        <Text style={s.date}>{condominio.ciudad}, {fechaHoy}</Text>

        <Text style={s.title}>Carta de Mora</Text>

        <Text style={s.para}>
          Estimado/a <Text style={s.bold}>{residente.nombre} {residente.apellido}</Text>,
        </Text>

        <Text style={s.para}>
          Por medio de la presente, le comunicamos que a la fecha registra cuotas de mantenimiento
          pendientes de pago correspondientes a la Unidad <Text style={s.bold}>{unidad}</Text> del{' '}
          <Text style={s.bold}>{condominio.nombre}</Text>.
        </Text>

        <Text style={s.para}>
          A continuación el detalle de la deuda:
        </Text>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderText, flex: 3 }}>Período</Text>
            <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'right' }}>Monto</Text>
          </View>
          {deudas.map((d, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={{ flex: 3, fontSize: 10 }}>{formatPeriodo(d.periodo)}</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>Bs. {d.monto.toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL ADEUDADO</Text>
            <Text style={s.totalMonto}>Bs. {totalDeuda.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={s.para}>
          Le solicitamos regularizar su situación a la brevedad posible. De persistir la mora,
          la administración se reserva el derecho de aplicar las medidas establecidas en el
          reglamento interno del condominio.
        </Text>

        <Text style={s.para}>
          Atentamente,
        </Text>
        <Text style={{ ...s.para, fontFamily: 'Nunito', fontWeight: 700, marginTop: 24 }}>
          Administración
        </Text>
        <Text style={{ fontSize: 10, color: '#5E6B62' }}>
          {condominio.nombre}
        </Text>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>DOMIA — Sistema de Administración de Condominios · Bolivia · Generado: {fechaHoy}</Text>
        </View>
      </Page>
    </Document>
  )
}
