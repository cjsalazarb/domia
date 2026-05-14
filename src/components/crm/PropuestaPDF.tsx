import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import altrionLogo from '@/assets/altrion-logo.jpg'
import RobotoRegular from '@/assets/fonts/Roboto-Regular.ttf'
import RobotoBold from '@/assets/fonts/Roboto-Bold.ttf'
import RobotoItalic from '@/assets/fonts/Roboto-Italic.ttf'

/* ─── Roboto local — sin dependencia de CDN, soporte completo de latinos ─── */
Font.register({
  family: 'Roboto',
  fonts: [
    { src: RobotoRegular, fontWeight: 'normal' },
    { src: RobotoBold, fontWeight: 'bold' },
    { src: RobotoItalic, fontStyle: 'italic' },
  ],
})

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
  coverPage: { backgroundColor: '#0D1B2E', position: 'relative' },
  coverTop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60 },
  coverLogo: { width: 180, marginBottom: 30 },
  coverLine: { width: 60, height: 2, backgroundColor: C.gold, marginBottom: 24 },
  coverTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 28, color: C.white, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  coverSubtitle: { fontFamily: 'Roboto', fontSize: 14, color: C.gold, textAlign: 'center', letterSpacing: 1 },
  coverBottom: { paddingHorizontal: 60, paddingBottom: 50 },
  coverInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  coverLabel: { fontFamily: 'Roboto', fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  coverValue: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.white },
  coverDivider: { height: 1, backgroundColor: C.gold, opacity: 0.3, marginBottom: 20, marginTop: 10 },

  /* ── Páginas interiores ── */
  innerPage: { padding: 50, fontFamily: 'Roboto', fontSize: 10, color: C.darkText },
  innerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  innerLogo: { width: 80 },
  innerHeaderTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 9, color: C.midGray, textTransform: 'uppercase', letterSpacing: 1 },
  innerDivider: { height: 2, backgroundColor: C.gold, marginBottom: 20 },
  pageTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 18, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  pageSubtitle: { fontSize: 10, color: C.midGray, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  paragraph: { fontSize: 10, lineHeight: 1.7, marginBottom: 10, color: C.darkText },
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingLeft: 8 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 4, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.6, color: C.darkText },

  /* ── Misión/Visión/Valores ── */
  mvvCard: { backgroundColor: C.lightGray, borderRadius: 8, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: C.gold },
  mvvTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 12, color: C.navy, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  mvvText: { fontSize: 10, lineHeight: 1.7, color: C.darkText },
  valorItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  valorNumber: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 16, color: C.gold, marginRight: 10, width: 20 },
  valorContent: { flex: 1 },
  valorName: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 10, color: C.navy, marginBottom: 2 },
  valorDesc: { fontSize: 9, color: C.midGray, lineHeight: 1.5 },

  /* ── Alcance / Tareas ── */
  alcanceCard: { backgroundColor: C.white, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  alcanceNum: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 20, color: C.gold, marginBottom: 4 },
  alcanceTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.navy, marginBottom: 6 },
  alcanceDesc: { fontSize: 9, lineHeight: 1.6, color: C.darkText },
  tareaRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tareaRowAlt: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', backgroundColor: '#FAFAFA' },
  highlightBox: { backgroundColor: C.navy, borderRadius: 6, padding: 14, marginTop: 12 },
  highlightText: { fontSize: 10, color: C.gold, lineHeight: 1.6 },
  highlightBold: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.white, marginBottom: 4 },

  /* ── Beneficios ── */
  beneficioCard: { flexDirection: 'row', marginBottom: 10, backgroundColor: C.lightGray, borderRadius: 8, padding: 12, alignItems: 'flex-start' },
  beneficioIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  beneficioIconText: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 12, color: C.gold },
  beneficioContent: { flex: 1 },
  beneficioTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 10, color: C.navy, marginBottom: 3 },
  beneficioDesc: { fontSize: 9, lineHeight: 1.5, color: C.darkText },

  /* ── Capturas DOMIA ── */
  capturaCard: { backgroundColor: C.lightGray, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  capturaTitle: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.navy, marginBottom: 4 },
  capturaDesc: { fontSize: 9, lineHeight: 1.5, color: C.midGray },
  capturaGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  screenshotWrap: { marginBottom: 22, borderWidth: 0.5, borderColor: '#DEDEDE' },
  screenshotImg: { width: '100%' },
  screenshotCaption: { fontSize: 8, color: C.midGray, textAlign: 'center', paddingVertical: 5, backgroundColor: C.lightGray },

  /* ── Propuesta económica ── */
  infoRow: { flexDirection: 'row', marginBottom: 8, gap: 12 },
  infoBlock: { flex: 1, backgroundColor: C.lightGray, borderRadius: 6, padding: 10 },
  infoLabel: { fontSize: 7, fontFamily: 'Roboto', fontWeight: 700, color: C.midGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.darkText },
  tableHeader: { flexDirection: 'row', backgroundColor: C.navy, borderRadius: 4, padding: 8, marginBottom: 3 },
  tableHeaderText: { color: C.white, fontSize: 8, fontFamily: 'Roboto', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tableRowAlt: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', backgroundColor: '#FAFAFA' },
  tableTotal: { flexDirection: 'row', padding: 12, backgroundColor: C.navy, borderRadius: 4, marginTop: 4 },
  tableTotalLabel: { flex: 3, fontFamily: 'Roboto', fontWeight: 700, fontSize: 13, color: C.gold },
  tableTotalMonto: { flex: 1, fontFamily: 'Roboto', fontWeight: 700, fontSize: 16, textAlign: 'right', color: C.gold },
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
    horas_visita?: number
    precio_calculado: number
    precio_final: number
    notas?: string
    created_at?: string
    administradora_enabled?: boolean
    administradora_sueldo?: number
    beneficios_json?: Record<string, unknown>
    utilidad_pct?: number
    utilidad_adicional?: number
  }
}

function formatBs(n: number) {
  return `Bs. ${(n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
  return new Date(d).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
}

/* ─── Header reutilizable para páginas interiores ─── */
function InnerHeader({ title }: { title: string }) {
  return (
    <>
      <View style={s.innerHeader}>
        <Image src={altrionLogo} style={s.innerLogo} />
        <Text style={s.innerHeaderTitle}>{title}</Text>
      </View>
      <View style={s.innerDivider} />
    </>
  )
}

/* ─── Footer reutilizable con paginación automática ─── */
function PageFooter({ numero }: { numero?: string | null }) {
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>ALTRION S.R.L. — Propuesta Confidencial{numero ? ` | ${numero}` : ''}</Text>
      <Text style={s.footerText} render={({ pageNumber }) => `Página ${pageNumber}`} />
    </View>
  )
}

export default function PropuestaPDF({ propuesta: p }: Props) {
  const adminOn = !!p.administradora_enabled
  const visitasOn = (p.visitas_semanales ?? 0) > 0
  const diasVisita = p.visitas_semanales ?? 0

  /* ── Costos ── */
  const sueldoAdmin = adminOn ? Number(p.administradora_sueldo ?? 0) : 0
  const b: Record<string, unknown> = p.beneficios_json ?? {}
  const totalBeneficios = adminOn ? (
    (b.aguinaldo ? sueldoAdmin / 12 : 0) +
    (b.afp ? sueldoAdmin * 0.03 : 0) +
    (b.cns ? sueldoAdmin * 0.10 : 0) +
    (b.pro_bolivia ? sueldoAdmin * 0.02 : 0) +
    (b.riesgos ? sueldoAdmin * 0.0171 : 0) +
    (b.vacaciones ? (sueldoAdmin / 30 * 15 / 12) : 0) +
    (b.antiguedad ? sueldoAdmin * Number(b.pct_antiguedad ?? 5) / 100 : 0) +
    (b.frontera ? sueldoAdmin * 0.20 : 0) +
    (b.produccion ? Number(b.monto_produccion ?? 0) : 0) +
    (b.poliza_acc ? Number(b.monto_poliza_acc ?? 0) / 12 : 0) +
    (b.poliza_rc ? Number(b.monto_poliza_rc ?? 0) / 12 : 0)
  ) : 0

  const costoVisitas = visitasOn ? (3300 / 30) * diasVisita : 0
  const totalCostosBase = 350 + (adminOn ? sueldoAdmin + totalBeneficios : 0) + costoVisitas
  const utilidadPct = Number(p.utilidad_pct ?? 0)
  const utilidadAdicional = Number(p.utilidad_adicional ?? 0)
  const utilidad = totalCostosBase * utilidadPct / 100
  const precioFinalCalc = totalCostosBase + utilidad + utilidadAdicional

  // App DOMIA (350) se absorbe en Administradora/Visitas; la línea App DOMIA es informativa (siempre Bs. 0)
  const factor = totalCostosBase > 0 ? precioFinalCalc / totalCostosBase : 1
  const adminPdf = adminOn ? (sueldoAdmin + totalBeneficios + 350) * factor : 0
  const visitasPdf = visitasOn ? (costoVisitas + (!adminOn ? 350 : 0)) * factor : 0
  const domiaPdf = 0

  const fecha = formatDate(p.created_at)

  return (
    <Document>
      {/* ════════ PÁGINA 1: PORTADA ════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          <Image src={altrionLogo} style={s.coverLogo} />
          <View style={s.coverLine} />
          <Text style={s.coverTitle}>Propuesta Comercial</Text>
          <Text style={s.coverSubtitle}>Administración Integral de Condominios</Text>
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

      {/* ════════ PÁGINA 2: CARTA DE PRESENTACIÓN ════════ */}
      <Page size="A4" style={s.innerPage}>
        <View style={s.innerHeader}>
          <Image src={altrionLogo} style={s.innerLogo} />
          <Text style={{ fontSize: 10, color: C.midGray }}>{fecha}</Text>
        </View>
        <View style={s.innerDivider} />

        <Text style={{ fontFamily: 'Roboto', fontWeight: 700, fontSize: 12, marginBottom: 16, color: C.navy }}>
          Estimado/a {p.nombre_prospecto},
        </Text>

        <Text style={s.paragraph}>
          Es un placer dirigirnos a usted para presentarle nuestra propuesta de servicios de administración integral para el condominio {p.nombre_condominio}. En ALTRION, nos especializamos en brindar soluciones profesionales que garantizan la tranquilidad y el bienestar de los copropietarios.
        </Text>
        <Text style={s.paragraph}>
          Nuestra experiencia en la administración de condominios nos permite ofrecer un servicio completo que incluye gestión financiera transparente, mantenimiento preventivo y correctivo, atención personalizada a propietarios y cumplimiento normativo vigente.
        </Text>
        <Text style={s.paragraph}>
          Utilizamos tecnología de vanguardia a través de nuestra plataforma DOMIA, que permite a los copropietarios acceder en tiempo real a la información financiera, reportar incidencias y mantenerse informados sobre todas las actividades del condominio.
        </Text>
        <Text style={s.paragraph}>
          En las siguientes páginas encontrará el detalle de nuestra propuesta económica, adaptada a las características específicas de {p.nombre_condominio}. Quedamos a su entera disposición para resolver cualquier consulta.
        </Text>

        <Text style={{ ...s.paragraph, marginTop: 10 }}>Atentamente,</Text>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: 'Roboto', fontWeight: 700, fontSize: 11, color: C.navy }}>María del Carmen Salcedo Feeney</Text>
          <Text style={{ fontSize: 9, color: C.midGray, marginTop: 2 }}>Gerente de Administración</Text>
          <Text style={{ fontSize: 9, color: C.midGray, marginTop: 2 }}>ALTRION S.R.L.</Text>
        </View>

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PÁGINA 3: MISIÓN / VISIÓN / VALORES ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Quiénes Somos" />
        <Text style={s.pageTitle}>Misión, Visión y Valores</Text>
        <Text style={s.pageSubtitle}>Los pilares que guían nuestro trabajo diario</Text>

        <View style={s.mvvCard} wrap={false}>
          <Text style={s.mvvTitle}>Misión</Text>
          <Text style={s.mvvText}>
            Brindar servicios de administración de condominios con excelencia, transparencia y compromiso, utilizando tecnología innovadora para optimizar la gestión y mejorar la calidad de vida de los copropietarios en Bolivia.
          </Text>
        </View>

        <View style={s.mvvCard} wrap={false}>
          <Text style={s.mvvTitle}>Visión</Text>
          <Text style={s.mvvText}>
            Ser la empresa líder en administración de condominios en Bolivia, reconocida por la confianza, profesionalismo y soluciones tecnológicas que generamos para nuestras comunidades.
          </Text>
        </View>

        <Text style={{ ...s.sectionTitle, marginTop: 20 }}>Nuestros Valores</Text>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>1</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Transparencia</Text>
            <Text style={s.valorDesc}>Rendición de cuentas clara y accesible en todo momento a través de nuestra plataforma digital.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>2</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Compromiso</Text>
            <Text style={s.valorDesc}>Dedicación total al bienestar de cada comunidad que administramos, con atención personalizada.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>3</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Innovación</Text>
            <Text style={s.valorDesc}>Implementación de tecnología de punta para simplificar y mejorar la gestión condominial.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>4</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Responsabilidad</Text>
            <Text style={s.valorDesc}>Cumplimiento estricto de normativas legales y manejo responsable de los recursos del condominio.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>5</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Cercanía</Text>
            <Text style={s.valorDesc}>Relación directa y accesible con cada copropietario, construyendo confianza a largo plazo.</Text>
          </View>
        </View>

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PÁGINA 4: OBJETIVO GENERAL ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Objetivo" />
        <Text style={s.pageTitle}>Objetivo General</Text>
        <Text style={s.pageSubtitle}>Propuesta para {p.nombre_condominio}</Text>

        <View style={{ ...s.mvvCard, borderLeftColor: C.navy }} wrap={false}>
          <Text style={{ ...s.mvvText, fontSize: 11, lineHeight: 1.8 }}>
            Proveer al condominio {p.nombre_condominio} un servicio de administración integral que garantice el correcto funcionamiento de todas las áreas comunes, la transparencia en el manejo de recursos financieros, el cumplimiento de la normativa vigente y la satisfacción de todos los copropietarios, apoyados en nuestra plataforma tecnológica DOMIA.
          </Text>
        </View>

        <Text style={{ ...s.sectionTitle, marginTop: 24 }}>Objetivos Específicos</Text>

        {[
          'Establecer un sistema de cobro eficiente de expensas con seguimiento automatizado de morosidad.',
          'Implementar un programa de mantenimiento preventivo para preservar el valor del inmueble.',
          'Garantizar la transparencia financiera mediante reportes mensuales accesibles en línea.',
          'Supervisar y coordinar al personal de seguridad, limpieza y mantenimiento del edificio.',
          'Facilitar la comunicación entre la administración y los copropietarios a través de canales digitales.',
          'Asegurar el cumplimiento de la Ley de Propiedad Horizontal y normativas municipales aplicables.',
          'Convocar y gestionar asambleas ordinarias y extraordinarias según estatuto del condominio.',
        ].map((txt, i) => (
          <View key={i} style={s.bulletRow} wrap={false}>
            <View style={s.bulletDot} />
            <Text style={s.bulletText}>{txt}</Text>
          </View>
        ))}

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PÁGINA 5: ALCANCE DEL SERVICIO ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Alcance" />
        <Text style={s.pageTitle}>Alcance del Servicio</Text>
        <Text style={s.pageSubtitle}>Las cinco áreas de gestión integral que cubrimos</Text>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>01</Text>
          <Text style={s.alcanceTitle}>Gestión Administrativa y Financiera</Text>
          <Text style={s.alcanceDesc}>Control de ingresos y egresos, elaboración de presupuestos, cobro de expensas, conciliaciones bancarias, emisión de estados de cuenta mensuales, y gestión de fondo de reserva. Toda la información financiera disponible en tiempo real a través de DOMIA.</Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>02</Text>
          <Text style={s.alcanceTitle}>Mantenimiento de Áreas Comunes</Text>
          <Text style={s.alcanceDesc}>Programa de mantenimiento preventivo y correctivo de ascensores, bombas de agua, sistemas eléctricos, áreas verdes, piscinas, gimnasios y demás instalaciones comunes. Coordinación con proveedores especializados y supervisión de trabajos.</Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>03</Text>
          <Text style={s.alcanceTitle}>Supervisión de Personal</Text>
          <Text style={s.alcanceDesc}>Coordinación y supervisión del personal de seguridad, limpieza, conserjería y mantenimiento. Control de asistencia, evaluación de desempeño, capacitación continua y cumplimiento de obligaciones laborales.</Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>04</Text>
          <Text style={s.alcanceTitle}>Atención a Copropietarios</Text>
          <Text style={s.alcanceDesc}>Canal de comunicación directo para consultas, reclamos y sugerencias. Gestión de reservas de áreas comunes, autorizaciones de mudanza, registro de vehículos y atención de emergencias. Respuesta en menos de 24 horas hábiles.</Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>05</Text>
          <Text style={s.alcanceTitle}>Cumplimiento Legal y Normativo</Text>
          <Text style={s.alcanceDesc}>Verificación del cumplimiento de la Ley de Propiedad Horizontal, normativas municipales, obligaciones tributarias del condominio, seguros obligatorios y actualización del reglamento interno según corresponda.</Text>
        </View>

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PÁGINAS 6-7: CONDICIONALES SEGÚN TIPO ════════ */}
      {adminOn ? (
        /* ─── Administradora ON: hoja de horario y funciones ─── */
        <Page size="A4" style={s.innerPage}>
          <InnerHeader title="Administradora" />
          <Text style={s.pageTitle}>Horario y Funciones de la Administradora</Text>
          <Text style={s.pageSubtitle}>Dedicación presencial y responsabilidades del cargo</Text>

          <View style={s.highlightBox} wrap={false}>
            <Text style={s.highlightBold}>Horario de trabajo</Text>
            <Text style={s.highlightText}>Lunes a Viernes — 8 horas diarias</Text>
            <Text style={s.highlightText}>Sábados — 4 horas</Text>
          </View>

          <Text style={s.sectionTitle}>Gestión Administrativa</Text>
          {[
            'Atención presencial y telefónica a residentes y copropietarios.',
            'Recepción, clasificación y archivo de correspondencia y documentos.',
            'Coordinación y supervisión de proveedores de servicios y mantenimiento.',
            'Redacción y distribución de circulares, comunicados y avisos internos.',
            'Mantenimiento actualizado del archivo físico y digital del condominio.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          <Text style={s.sectionTitle}>Gestión Financiera</Text>
          {[
            'Cobranza de expensas ordinarias y extraordinarias con seguimiento de morosidad.',
            'Control de copropietarios morosos y gestión de acuerdos de pago.',
            'Registro detallado de ingresos y egresos en la plataforma DOMIA.',
            'Elaboración de reportes financieros mensuales para la junta directiva.',
            'Gestión de pagos a proveedores y control de cuentas por pagar.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          <Text style={s.sectionTitle}>Gestión Operativa</Text>
          {[
            'Supervisión del personal de limpieza, seguridad y mantenimiento.',
            'Control de accesos de visitantes, proveedores y personal externo.',
            'Inspección y reporte del estado de áreas comunes e instalaciones.',
            'Gestión de reservas de salón de eventos, gimnasio y piscina.',
            'Registro y seguimiento de incidencias y solicitudes de mantenimiento.',
            'Control de inventario de suministros e insumos del condominio.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          <Text style={s.sectionTitle}>Atención al Residente</Text>
          {[
            'Recepción y gestión de quejas, sugerencias y reclamos de residentes.',
            'Comunicación permanente con la junta directiva del condominio.',
            'Organización y apoyo logístico en asambleas ordinarias y extraordinarias.',
            'Notificación oportuna de resoluciones, acuerdos y comunicados oficiales.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          {/* ── Respaldo y Supervisión ── */}
          <Text style={{ ...s.sectionTitle, marginTop: 20 }}>Respaldo y Supervisión de ALTRION</Text>

          <Text style={{ fontFamily: 'Roboto', fontWeight: 700, fontSize: 10, color: C.navy, marginBottom: 6, marginTop: 4 }}>
            Supervisora de Operaciones
          </Text>
          <Text style={{ ...s.paragraph, marginBottom: 6 }}>
            ALTRION cuenta con una Supervisora de Operaciones que brinda respaldo continuo a la Administradora del condominio:
          </Text>
          {[
            'Visitas periódicas de supervisión para verificar el cumplimiento de funciones.',
            'Evaluación del desempeño y calidad del servicio prestado.',
            'Apoyo en la resolución de situaciones complejas o excepcionales.',
            'Canal directo de comunicación entre el condominio y ALTRION.',
            'Garantía de continuidad del servicio ante ausencias o imprevistos.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          <Text style={{ fontFamily: 'Roboto', fontWeight: 700, fontSize: 10, color: C.navy, marginBottom: 6, marginTop: 10 }}>
            Contadora
          </Text>
          <Text style={{ ...s.paragraph, marginBottom: 6 }}>
            ALTRION dispone de una Contadora profesional que supervisa y valida toda la gestión contable:
          </Text>
          {[
            'Revisión y validación de los registros contables realizados por la Administradora.',
            'Supervisión de los asientos contables generados automáticamente por la plataforma DOMIA.',
            'Elaboración y revisión de estados financieros mensuales.',
            'Cumplimiento de normativas contables y tributarias bolivianas.',
            'Asesoría en temas financieros y contables al directorio del condominio.',
          ].map((txt, i) => (
            <View key={i} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{txt}</Text>
            </View>
          ))}

          <Text style={{ fontSize: 9, color: C.midGray, lineHeight: 1.6, marginTop: 14, fontStyle: 'italic' }} wrap={false}>
            Esta estructura de supervisión garantiza que la administración del condominio cuente con respaldo profesional en todo momento, combinando la presencia diaria de la Administradora con la experiencia de un equipo especializado.
          </Text>

          <PageFooter numero={p.numero_propuesta} />
        </Page>
      ) : (
        <>
          {/* ─── Visitas/Ninguno: mantener hojas originales ─── */}

          {/* PÁGINA 6: TAREAS PERIÓDICAS */}
          <Page size="A4" style={s.innerPage}>
            <InnerHeader title="Tareas" />
            <Text style={s.pageTitle}>Tareas Periódicas</Text>
            <Text style={s.pageSubtitle}>Cronograma de actividades para {p.nombre_condominio}</Text>

            {visitasOn && (
              <View style={s.highlightBox} wrap={false}>
                <Text style={s.highlightBold}>Frecuencia de visitas presenciales</Text>
                <Text style={s.highlightText}>
                  {diasVisita} día{diasVisita > 1 ? 's' : ''} de visita al mes
                </Text>
              </View>
            )}

            <Text style={{ ...s.sectionTitle, marginTop: 16 }}>Actividades por Visita</Text>
            <View style={s.tableHeader}>
              <Text style={{ ...s.tableHeaderText, flex: 3 }}>Actividad</Text>
              <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'center' }}>Frecuencia</Text>
            </View>
            {[
              ['Inspección general de áreas comunes y equipos', 'Cada visita'],
              ['Revisión de libro de novedades de seguridad/conserjería', 'Cada visita'],
              ['Seguimiento de cobro de expensas y morosidad', 'Cada visita'],
              ['Coordinación de trabajos de mantenimiento pendientes', 'Cada visita'],
              ['Atención presencial a copropietarios', 'Cada visita'],
              ['Verificación de limpieza y orden en áreas comunes', 'Cada visita'],
            ].map(([act, freq], i) => (
              <View key={i} style={i % 2 === 0 ? s.tareaRow : s.tareaRowAlt}>
                <Text style={{ flex: 3, fontSize: 9 }}>{act}</Text>
                <Text style={{ flex: 1, fontSize: 9, textAlign: 'center', color: C.midGray }}>{freq}</Text>
              </View>
            ))}

            <Text style={{ ...s.sectionTitle, marginTop: 16 }}>Actividades Mensuales</Text>
            <View style={s.tableHeader}>
              <Text style={{ ...s.tableHeaderText, flex: 3 }}>Actividad</Text>
              <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'center' }}>Frecuencia</Text>
            </View>
            {[
              ['Elaboración y envío de estado de cuenta mensual', 'Mensual'],
              ['Conciliación bancaria y cierre contable', 'Mensual'],
              ['Informe de mantenimientos realizados y pendientes', 'Mensual'],
              ['Revisión de contratos con proveedores', 'Trimestral'],
              ['Convocatoria y gestión de asambleas', 'Semestral'],
              ['Actualización de presupuesto anual', 'Anual'],
            ].map(([act, freq], i) => (
              <View key={i} style={i % 2 === 0 ? s.tareaRow : s.tareaRowAlt}>
                <Text style={{ flex: 3, fontSize: 9 }}>{act}</Text>
                <Text style={{ flex: 1, fontSize: 9, textAlign: 'center', color: C.midGray }}>{freq}</Text>
              </View>
            ))}

            <PageFooter numero={p.numero_propuesta} />
          </Page>

          {/* PÁGINA 7: ATENCIÓN FUERA DE HORARIO + BENEFICIOS */}
          <Page size="A4" style={s.innerPage}>
            <InnerHeader title="Servicio" />
            <Text style={s.pageTitle}>Atención Fuera de Horario</Text>
            <Text style={s.pageSubtitle}>Disponibilidad para emergencias y situaciones críticas</Text>

            <View style={s.mvvCard} wrap={false}>
              <Text style={s.mvvText}>
                ALTRION ofrece una línea de atención para emergencias disponible fuera del horario de visitas. En caso de situaciones críticas como fallas en el suministro de agua, problemas eléctricos graves, emergencias de seguridad o cualquier evento que requiera intervención inmediata, los copropietarios pueden comunicarse directamente con la administradora.
              </Text>
            </View>

            {[
              'Línea directa de emergencias disponible 24/7 para situaciones críticas.',
              'Coordinación inmediata con proveedores de emergencia (plomería, electricidad, cerrajería).',
              'Comunicación por WhatsApp para consultas no urgentes fuera de horario.',
              'Respuesta garantizada en un máximo de 2 horas para emergencias.',
            ].map((txt, i) => (
              <View key={i} style={s.bulletRow} wrap={false}>
                <View style={s.bulletDot} />
                <Text style={s.bulletText}>{txt}</Text>
              </View>
            ))}

            <Text style={{ ...s.pageTitle, marginTop: 24, fontSize: 16 }}>Beneficios</Text>
            <Text style={{ ...s.pageSubtitle, marginBottom: 14 }}>¿Por qué elegir ALTRION para su condominio?</Text>

            {[
              { icon: '$', title: 'Transparencia Financiera Total', desc: 'Acceso en tiempo real a estados de cuenta, ingresos, egresos y presupuestos a través de la plataforma DOMIA.' },
              { icon: 'T', title: 'Tecnología de Punta', desc: 'Sistema DOMIA con panel para copropietarios: consultas, pagos, reportes de incidencias y reservas desde cualquier dispositivo.' },
              { icon: 'P', title: 'Personal Capacitado', desc: 'Equipo profesional con experiencia en administración inmobiliaria y atención al cliente.' },
              { icon: 'R', title: 'Reducción de Morosidad', desc: 'Sistema automatizado de cobranza con recordatorios, seguimiento y reportes de estado por copropietario.' },
              { icon: 'V', title: 'Valorización del Inmueble', desc: 'Mantenimiento preventivo constante que preserva y aumenta el valor de la propiedad a largo plazo.' },
            ].map((b, i) => (
              <View key={i} style={s.beneficioCard} wrap={false}>
                <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>{b.icon}</Text></View>
                <View style={s.beneficioContent}>
                  <Text style={s.beneficioTitle}>{b.title}</Text>
                  <Text style={s.beneficioDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}

            <PageFooter numero={p.numero_propuesta} />
          </Page>
        </>
      )}

      {/* ════════ PLATAFORMA DOMIA — pág. 1 (capturas 1-2) ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Tecnología" />
        <Text style={s.pageTitle}>Plataforma DOMIA</Text>
        <Text style={s.pageSubtitle}>Sistema integral de gestión condominial incluido en el servicio</Text>

        <Text style={s.paragraph}>
          Todos nuestros condominios administrados cuentan con acceso a DOMIA, nuestra plataforma web desarrollada internamente que centraliza toda la gestión del condominio en un solo lugar.
        </Text>

        <View style={s.screenshotWrap} wrap={false}>
          <Image src="/domia_captura_1.png" style={s.screenshotImg} />
          <Text style={s.screenshotCaption}>Dashboard del condominio</Text>
        </View>

        <View style={s.screenshotWrap} wrap={false}>
          <Image src="/domia_captura_2.png" style={s.screenshotImg} />
          <Text style={s.screenshotCaption}>Módulo de Residentes y Propietarios</Text>
        </View>

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PLATAFORMA DOMIA — pág. 2 (capturas 3-4) ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Tecnología" />

        <View style={s.screenshotWrap} wrap={false}>
          <Image src="/domia_captura_3.png" style={s.screenshotImg} />
          <Text style={s.screenshotCaption}>Módulo Financiero y Cobranza</Text>
        </View>

        <View style={s.screenshotWrap} wrap={false}>
          <Image src="/domia_captura_4.png" style={s.screenshotImg} />
          <Text style={s.screenshotCaption}>Portal del Residente</Text>
        </View>

        <View style={s.highlightBox} wrap={false}>
          <Text style={s.highlightBold}>Acceso incluido sin costo adicional</Text>
          <Text style={s.highlightText}>
            La plataforma DOMIA está incluida en el costo mensual del servicio de administración. No genera cargos adicionales por licencias, usuarios ni actualizaciones.
          </Text>
        </View>

        <PageFooter numero={p.numero_propuesta} />
      </Page>

      {/* ════════ PROPUESTA ECONÓMICA ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Propuesta Económica" />
        <Text style={s.pageTitle}>Propuesta Económica</Text>
        <Text style={s.pageSubtitle}>{p.nombre_condominio} — {p.numero_propuesta || 'Borrador'}</Text>

        {/* Datos del condominio */}
        <Text style={s.sectionTitle}>Datos del Condominio</Text>
        <View style={s.infoRow} wrap={false}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Condominio</Text>
            <Text style={s.infoValue}>{p.nombre_condominio}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Contacto</Text>
            <Text style={s.infoValue}>{p.nombre_prospecto}</Text>
          </View>
        </View>
        <View style={s.infoRow} wrap={false}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Ubicación</Text>
            <Text style={s.infoValue}>{[p.direccion, p.ciudad].filter(Boolean).join(', ') || '—'}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Teléfono / Email</Text>
            <Text style={s.infoValue}>{[p.telefono, p.email].filter(Boolean).join(' / ') || '—'}</Text>
          </View>
        </View>

        {/* Parámetros del Servicio */}
        <Text style={s.sectionTitle}>Parámetros del Servicio</Text>
        <View style={s.infoRow} wrap={false}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Departamentos</Text>
            <Text style={s.infoValue}>{p.num_departamentos ?? '—'}</Text>
          </View>
          {adminOn && (
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>Administradora</Text>
              <Text style={s.infoValue}>Incluida</Text>
            </View>
          )}
          {visitasOn && (
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>Visitas diarias</Text>
              <Text style={s.infoValue}>{diasVisita} días/mes — {formatBs(costoVisitas)}</Text>
            </View>
          )}
        </View>

        {/* Desglose de precio */}
        <Text style={s.sectionTitle}>Desglose de Precio Mensual</Text>
        <View style={{ marginBottom: 16 }}>
          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderText, flex: 3 }}>Concepto</Text>
            <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'right' }}>Monto</Text>
          </View>

          {adminOn && (
            <View style={s.tableRow}>
              <Text style={{ flex: 3, fontSize: 10 }}>Administradora</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(adminPdf)}</Text>
            </View>
          )}
          {visitasOn && (
            <View style={s.tableRowAlt}>
              <Text style={{ flex: 3, fontSize: 10 }}>Visitas diarias ({diasVisita} días/mes)</Text>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(visitasPdf)}</Text>
            </View>
          )}
          <View style={visitasOn || adminOn ? s.tableRow : s.tableRowAlt}>
            <Text style={{ flex: 3, fontSize: 10 }}>App DOMIA</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(domiaPdf)}</Text>
          </View>

          <View style={s.tableTotal}>
            <Text style={s.tableTotalLabel}>PRECIO FINAL</Text>
            <Text style={s.tableTotalMonto}>{formatBs(precioFinalCalc)}</Text>
          </View>
        </View>

        {/* Notas */}
        {p.notas && (
          <View style={s.notesBox} wrap={false}>
            <Text style={{ ...s.infoLabel, marginBottom: 4 }}>Observaciones</Text>
            <Text style={{ fontSize: 10, color: C.darkText, lineHeight: 1.5 }}>{p.notas}</Text>
          </View>
        )}

        <PageFooter numero={p.numero_propuesta} />
      </Page>
    </Document>
  )
}
