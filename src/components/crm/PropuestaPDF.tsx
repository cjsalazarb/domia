import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import altrionLogo from '@/assets/altrion-logo.jpg'
import fotoAdmin from '@/assets/foto-administradora.jpg'

/* ─── colores ALTRION ─── */
const C = {
  navy: '#0B1D3A',
  gold: '#C5A55A',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  midGray: '#8C8C8C',
  darkText: '#1A1A1A',
}

const s = StyleSheet.create({
  /* ── Portada ── */
  coverPage: { backgroundColor: C.navy, position: 'relative' },
  coverTop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60 },
  coverLogo: { width: 180, marginBottom: 30 },
  coverLine: { width: 60, height: 2, backgroundColor: C.gold, marginBottom: 24 },
  coverTitle: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: C.white, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  coverSubtitle: { fontFamily: 'Helvetica', fontSize: 14, color: C.gold, textAlign: 'center', letterSpacing: 1 },
  coverBottom: { paddingHorizontal: 60, paddingBottom: 50 },
  coverInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  coverLabel: { fontFamily: 'Helvetica', fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  coverValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white },
  coverDivider: { height: 1, backgroundColor: C.gold, opacity: 0.3, marginBottom: 20, marginTop: 10 },

  /* ── Carta de presentacion ── */
  cartaPage: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: C.darkText },
  cartaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  cartaLogo: { width: 100 },
  cartaDate: { fontSize: 10, color: C.midGray, textAlign: 'right' },
  cartaLine: { height: 2, backgroundColor: C.gold, marginBottom: 30 },
  cartaSaludo: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginBottom: 16, color: C.navy },
  cartaParagraph: { fontSize: 11, lineHeight: 1.7, marginBottom: 14, color: C.darkText },
  cartaFirmaBlock: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 30, gap: 16 },
  cartaFoto: { width: 70, height: 70, borderRadius: 35 },
  cartaFirmaTexto: { justifyContent: 'flex-end' },
  cartaFirmaName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy },
  cartaFirmaCargo: { fontSize: 9, color: C.midGray, marginTop: 2 },

  /* ── Propuesta economica ── */
  econPage: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: C.darkText },
  econHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  econLogo: { width: 80 },
  econTitle: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  econSubtitle: { fontSize: 10, color: C.midGray, marginBottom: 20 },
  econDivider: { height: 2, backgroundColor: C.gold, marginBottom: 24 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8, gap: 12 },
  infoBlock: { flex: 1, backgroundColor: C.lightGray, borderRadius: 6, padding: 10 },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.midGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.darkText },
  tableHeader: { flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, padding: 8, marginBottom: 3 },
  tableHeaderText: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableRowAlt: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', backgroundColor: '#FAFAFA' },
  tableTotal: { flexDirection: 'row', padding: 12, backgroundColor: C.navy, borderRadius: 4, marginTop: 4 },
  tableTotalLabel: { flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 13, color: C.gold },
  tableTotalMonto: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 16, textAlign: 'right', color: C.gold },
  notesBox: { marginTop: 16, backgroundColor: C.lightGray, borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: C.gold },

  /* ── Footer compartido ── */
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#D4D4D4', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.midGray },
})

interface Props {
  propuesta: {
    numero_propuesta?: string | null
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
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
  return new Date(d).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PropuestaPDF({ propuesta: p }: Props) {
  const ajustePisos = (p.num_pisos - 5) * 100
  const dptosExtra = Math.max(0, p.num_departamentos - 20)
  const ajusteDptos = Math.floor(dptosExtra / 10) * 50
  const visitasExtra = Math.max(0, p.visitas_semanales - 2)
  const ajusteVisitas = visitasExtra * 150
  const fecha = formatDate(p.created_at)

  return (
    <Document>
      {/* ════════ PAGINA 1: PORTADA ════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          <Image src={altrionLogo} style={s.coverLogo} />
          <View style={s.coverLine} />
          <Text style={s.coverTitle}>Propuesta Comercial</Text>
          <Text style={s.coverSubtitle}>Administracion Integral de Condominios</Text>
        </View>
        <View style={s.coverBottom}>
          <View style={s.coverDivider} />
          <View style={s.coverInfoRow}>
            <View>
              <Text style={s.coverLabel}>Preparada para</Text>
              <Text style={s.coverValue}>{p.nombre_prospecto}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.coverLabel}>Condominio</Text>
              <Text style={s.coverValue}>{p.nombre_condominio}</Text>
            </View>
          </View>
          <View style={{ ...s.coverInfoRow, marginTop: 8 }}>
            <View>
              <Text style={s.coverLabel}>Fecha</Text>
              <Text style={s.coverValue}>{fecha}</Text>
            </View>
            {p.numero_propuesta && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.coverLabel}>Referencia</Text>
                <Text style={s.coverValue}>{p.numero_propuesta}</Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* ════════ PAGINA 2: CARTA DE PRESENTACION ════════ */}
      <Page size="A4" style={s.cartaPage}>
        <View style={s.cartaHeader}>
          <Image src={altrionLogo} style={s.cartaLogo} />
          <Text style={s.cartaDate}>{fecha}</Text>
        </View>
        <View style={s.cartaLine} />

        <Text style={s.cartaSaludo}>Estimado/a {p.nombre_prospecto},</Text>

        <Text style={s.cartaParagraph}>
          Es un placer dirigirnos a usted para presentarle nuestra propuesta de servicios de administracion integral para el condominio {p.nombre_condominio}. En ALTRION, nos especializamos en brindar soluciones profesionales que garantizan la tranquilidad y el bienestar de los copropietarios.
        </Text>

        <Text style={s.cartaParagraph}>
          Nuestra experiencia en la administracion de condominios nos permite ofrecer un servicio completo que incluye gestion financiera transparente, mantenimiento preventivo y correctivo, atencion personalizada a propietarios y cumplimiento normativo vigente.
        </Text>

        <Text style={s.cartaParagraph}>
          Utilizamos tecnologia de vanguardia a traves de nuestra plataforma DOMIA, que permite a los copropietarios acceder en tiempo real a la informacion financiera, reportar incidencias y mantenerse informados sobre todas las actividades del condominio.
        </Text>

        <Text style={s.cartaParagraph}>
          En las siguientes paginas encontrara el detalle de nuestra propuesta economica, adaptada a las caracteristicas especificas de {p.nombre_condominio}. Quedamos a su entera disposicion para resolver cualquier consulta.
        </Text>

        <Text style={{ ...s.cartaParagraph, marginTop: 10 }}>Atentamente,</Text>

        <View style={s.cartaFirmaBlock}>
          <Image src={fotoAdmin} style={s.cartaFoto} />
          <View style={s.cartaFirmaTexto}>
            <Text style={s.cartaFirmaName}>Maria Fernanda Salazar</Text>
            <Text style={s.cartaFirmaCargo}>Gerente de Administracion</Text>
            <Text style={s.cartaFirmaCargo}>ALTRION S.R.L.</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — Administracion de Condominios</Text>
          <Text style={s.footerText}>Pagina 2</Text>
        </View>
      </Page>

      {/* ════════ PAGINA 3: PROPUESTA ECONOMICA ════════ */}
      <Page size="A4" style={s.econPage}>
        <View style={s.econHeader}>
          <View>
            <Text style={s.econTitle}>Propuesta Economica</Text>
            <Text style={s.econSubtitle}>{p.nombre_condominio} — {p.numero_propuesta || 'Borrador'}</Text>
          </View>
          <Image src={altrionLogo} style={s.econLogo} />
        </View>
        <View style={s.econDivider} />

        {/* Datos del condominio */}
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
            <Text style={s.infoLabel}>Telefono / Email</Text>
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
            <View style={s.tableRowAlt}>
              <Text style={{ flex: 3, fontSize: 10 }}>Ajuste pisos ({p.num_pisos} pisos, {ajustePisos > 0 ? '+' : ''}{ajustePisos / 100} x Bs. 100)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{ajustePisos > 0 ? '+' : ''}{formatBs(ajustePisos)}</Text>
            </View>
          )}
          {ajusteDptos > 0 && (
            <View style={s.tableRow}>
              <Text style={{ flex: 3, fontSize: 10 }}>Ajuste departamentos ({p.num_departamentos} dptos, +{Math.floor(dptosExtra / 10)} x Bs. 50)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>+{formatBs(ajusteDptos)}</Text>
            </View>
          )}
          {ajusteVisitas > 0 && (
            <View style={s.tableRowAlt}>
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
            <Text style={{ ...s.infoLabel, marginBottom: 4 }}>Observaciones</Text>
            <Text style={{ fontSize: 10, color: C.darkText, lineHeight: 1.5 }}>{p.notas}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — Propuesta Confidencial{p.numero_propuesta ? ` | ${p.numero_propuesta}` : ''}</Text>
          <Text style={s.footerText}>Pagina 3</Text>
        </View>
      </Page>
    </Document>
  )
}
