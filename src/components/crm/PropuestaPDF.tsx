import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import altrionLogo from '@/assets/altrion-logo.jpg'

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
  coverTitle: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: C.white, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  coverSubtitle: { fontFamily: 'Helvetica', fontSize: 14, color: C.gold, textAlign: 'center', letterSpacing: 1 },
  coverBottom: { paddingHorizontal: 60, paddingBottom: 50 },
  coverInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  coverLabel: { fontFamily: 'Helvetica', fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  coverValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white },
  coverDivider: { height: 1, backgroundColor: C.gold, opacity: 0.3, marginBottom: 20, marginTop: 10 },

  /* ── Paginas interiores ── */
  innerPage: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: C.darkText },
  innerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  innerLogo: { width: 80 },
  innerHeaderTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.midGray, textTransform: 'uppercase', letterSpacing: 1 },
  innerDivider: { height: 2, backgroundColor: C.gold, marginBottom: 20 },
  pageTitle: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  pageSubtitle: { fontSize: 10, color: C.midGray, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  paragraph: { fontSize: 10, lineHeight: 1.7, marginBottom: 10, color: C.darkText },
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingLeft: 8 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 4, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.6, color: C.darkText },

  /* ── Mision/Vision/Valores ── */
  mvvCard: { backgroundColor: C.lightGray, borderRadius: 8, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: C.gold },
  mvvTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.navy, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  mvvText: { fontSize: 10, lineHeight: 1.7, color: C.darkText },
  valorItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  valorNumber: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.gold, marginRight: 10, width: 20 },
  valorContent: { flex: 1 },
  valorName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy, marginBottom: 2 },
  valorDesc: { fontSize: 9, color: C.midGray, lineHeight: 1.5 },

  /* ── Alcance / Tareas ── */
  alcanceCard: { backgroundColor: C.white, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  alcanceNum: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.gold, marginBottom: 4 },
  alcanceTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, marginBottom: 6 },
  alcanceDesc: { fontSize: 9, lineHeight: 1.6, color: C.darkText },
  tareaRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  tareaRowAlt: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', backgroundColor: '#FAFAFA' },
  highlightBox: { backgroundColor: C.navy, borderRadius: 6, padding: 14, marginTop: 12 },
  highlightText: { fontSize: 10, color: C.gold, lineHeight: 1.6 },
  highlightBold: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white, marginBottom: 4 },

  /* ── Beneficios ── */
  beneficioCard: { flexDirection: 'row', marginBottom: 10, backgroundColor: C.lightGray, borderRadius: 8, padding: 12, alignItems: 'flex-start' },
  beneficioIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  beneficioIconText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.gold },
  beneficioContent: { flex: 1 },
  beneficioTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy, marginBottom: 3 },
  beneficioDesc: { fontSize: 9, lineHeight: 1.5, color: C.darkText },

  /* ── Capturas DOMIA ── */
  capturaCard: { backgroundColor: C.lightGray, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  capturaTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, marginBottom: 4 },
  capturaDesc: { fontSize: 9, lineHeight: 1.5, color: C.midGray },
  capturaGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  /* ── Propuesta economica ── */
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
    horas_visita?: number
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

/* ─── Header reutilizable para paginas interiores ─── */
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

/* ─── Footer reutilizable ─── */
function PageFooter({ numero, pagina }: { numero?: string | null; pagina: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>ALTRION S.R.L. — Propuesta Confidencial{numero ? ` | ${numero}` : ''}</Text>
      <Text style={s.footerText}>Pagina {pagina}</Text>
    </View>
  )
}

export default function PropuestaPDF({ propuesta: p }: Props) {
  const ajustePisos = (p.num_pisos - 5) * 100
  const dptosExtra = Math.max(0, p.num_departamentos - 20)
  const ajusteDptos = Math.floor(dptosExtra / 10) * 50
  const visitasExtra = Math.max(0, p.visitas_semanales - 2)
  const ajusteVisitas = visitasExtra * 150
  const fecha = formatDate(p.created_at)
  const horasVisita = p.horas_visita ?? 4

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
      <Page size="A4" style={s.innerPage}>
        <View style={s.innerHeader}>
          <Image src={altrionLogo} style={s.innerLogo} />
          <Text style={{ fontSize: 10, color: C.midGray }}>{fecha}</Text>
        </View>
        <View style={s.innerDivider} />

        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, marginBottom: 16, color: C.navy }}>
          Estimado/a {p.nombre_prospecto},
        </Text>

        <Text style={s.paragraph}>
          Es un placer dirigirnos a usted para presentarle nuestra propuesta de servicios de administracion integral para el condominio {p.nombre_condominio}. En ALTRION, nos especializamos en brindar soluciones profesionales que garantizan la tranquilidad y el bienestar de los copropietarios.
        </Text>
        <Text style={s.paragraph}>
          Nuestra experiencia en la administracion de condominios nos permite ofrecer un servicio completo que incluye gestion financiera transparente, mantenimiento preventivo y correctivo, atencion personalizada a propietarios y cumplimiento normativo vigente.
        </Text>
        <Text style={s.paragraph}>
          Utilizamos tecnologia de vanguardia a traves de nuestra plataforma DOMIA, que permite a los copropietarios acceder en tiempo real a la informacion financiera, reportar incidencias y mantenerse informados sobre todas las actividades del condominio.
        </Text>
        <Text style={s.paragraph}>
          En las siguientes paginas encontrara el detalle de nuestra propuesta economica, adaptada a las caracteristicas especificas de {p.nombre_condominio}. Quedamos a su entera disposicion para resolver cualquier consulta.
        </Text>

        <Text style={{ ...s.paragraph, marginTop: 10 }}>Atentamente,</Text>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy }}>Maria del Carmen Salcedo Feeney</Text>
          <Text style={{ fontSize: 9, color: C.midGray, marginTop: 2 }}>Gerente de Administracion</Text>
          <Text style={{ fontSize: 9, color: C.midGray, marginTop: 2 }}>ALTRION S.R.L.</Text>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={2} />
      </Page>

      {/* ════════ PAGINA 3: MISION / VISION / VALORES ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Quienes Somos" />
        <Text style={s.pageTitle}>Mision, Vision y Valores</Text>
        <Text style={s.pageSubtitle}>Los pilares que guian nuestro trabajo diario</Text>

        <View style={s.mvvCard} wrap={false}>
          <Text style={s.mvvTitle}>Mision</Text>
          <Text style={s.mvvText}>
            Brindar servicios de administracion de condominios con excelencia, transparencia y compromiso, utilizando tecnologia innovadora para optimizar la gestion y mejorar la calidad de vida de los copropietarios en Bolivia.
          </Text>
        </View>

        <View style={s.mvvCard} wrap={false}>
          <Text style={s.mvvTitle}>Vision</Text>
          <Text style={s.mvvText}>
            Ser la empresa lider en administracion de condominios en Bolivia, reconocida por la confianza, profesionalismo y soluciones tecnologicas que generamos para nuestras comunidades.
          </Text>
        </View>

        <Text style={{ ...s.sectionTitle, marginTop: 20 }}>Nuestros Valores</Text>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>1</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Transparencia</Text>
            <Text style={s.valorDesc}>Rendicion de cuentas clara y accesible en todo momento a traves de nuestra plataforma digital.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>2</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Compromiso</Text>
            <Text style={s.valorDesc}>Dedicacion total al bienestar de cada comunidad que administramos, con atencion personalizada.</Text>
          </View>
        </View>
        <View style={s.valorItem} wrap={false}>
          <Text style={s.valorNumber}>3</Text>
          <View style={s.valorContent}>
            <Text style={s.valorName}>Innovacion</Text>
            <Text style={s.valorDesc}>Implementacion de tecnologia de punta para simplificar y mejorar la gestion condominial.</Text>
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
            <Text style={s.valorName}>Cercania</Text>
            <Text style={s.valorDesc}>Relacion directa y accesible con cada copropietario, construyendo confianza a largo plazo.</Text>
          </View>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={3} />
      </Page>

      {/* ════════ PAGINA 4: OBJETIVO GENERAL ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Objetivo" />
        <Text style={s.pageTitle}>Objetivo General</Text>
        <Text style={s.pageSubtitle}>Propuesta para {p.nombre_condominio}</Text>

        <View style={{ ...s.mvvCard, borderLeftColor: C.navy }} wrap={false}>
          <Text style={{ ...s.mvvText, fontSize: 11, lineHeight: 1.8 }}>
            Proveer al condominio {p.nombre_condominio} un servicio de administracion integral que garantice el correcto funcionamiento de todas las areas comunes, la transparencia en el manejo de recursos financieros, el cumplimiento de la normativa vigente y la satisfaccion de todos los copropietarios, apoyados en nuestra plataforma tecnologica DOMIA.
          </Text>
        </View>

        <Text style={{ ...s.sectionTitle, marginTop: 24 }}>Objetivos Especificos</Text>

        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Establecer un sistema de cobro eficiente de expensas con seguimiento automatizado de morosidad.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Implementar un programa de mantenimiento preventivo para preservar el valor del inmueble.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Garantizar la transparencia financiera mediante reportes mensuales accesibles en linea.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Supervisar y coordinar al personal de seguridad, limpieza y mantenimiento del edificio.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Facilitar la comunicacion entre la administracion y los copropietarios a traves de canales digitales.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Asegurar el cumplimiento de la Ley de Propiedad Horizontal y normativas municipales aplicables.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Convocar y gestionar asambleas ordinarias y extraordinarias segun estatuto del condominio.</Text>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={4} />
      </Page>

      {/* ════════ PAGINA 5: ALCANCE DEL SERVICIO ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Alcance" />
        <Text style={s.pageTitle}>Alcance del Servicio</Text>
        <Text style={s.pageSubtitle}>Las cinco areas de gestion integral que cubrimos</Text>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>01</Text>
          <Text style={s.alcanceTitle}>Gestion Administrativa y Financiera</Text>
          <Text style={s.alcanceDesc}>
            Control de ingresos y egresos, elaboracion de presupuestos, cobro de expensas, conciliaciones bancarias, emision de estados de cuenta mensuales, y gestion de fondo de reserva. Toda la informacion financiera disponible en tiempo real a traves de DOMIA.
          </Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>02</Text>
          <Text style={s.alcanceTitle}>Mantenimiento de Areas Comunes</Text>
          <Text style={s.alcanceDesc}>
            Programa de mantenimiento preventivo y correctivo de ascensores, bombas de agua, sistemas electricos, areas verdes, piscinas, gimnasios y demas instalaciones comunes. Coordinacion con proveedores especializados y supervision de trabajos.
          </Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>03</Text>
          <Text style={s.alcanceTitle}>Supervision de Personal</Text>
          <Text style={s.alcanceDesc}>
            Coordinacion y supervision del personal de seguridad, limpieza, conserjeria y mantenimiento. Control de asistencia, evaluacion de desempeno, capacitacion continua y cumplimiento de obligaciones laborales.
          </Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>04</Text>
          <Text style={s.alcanceTitle}>Atencion a Copropietarios</Text>
          <Text style={s.alcanceDesc}>
            Canal de comunicacion directo para consultas, reclamos y sugerencias. Gestion de reservas de areas comunes, autorizaciones de mudanza, registro de vehiculos y atencion de emergencias. Respuesta en menos de 24 horas habiles.
          </Text>
        </View>

        <View style={s.alcanceCard} wrap={false}>
          <Text style={s.alcanceNum}>05</Text>
          <Text style={s.alcanceTitle}>Cumplimiento Legal y Normativo</Text>
          <Text style={s.alcanceDesc}>
            Verificacion del cumplimiento de la Ley de Propiedad Horizontal, normativas municipales, obligaciones tributarias del condominio, seguros obligatorios y actualizacion del reglamento interno segun corresponda.
          </Text>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={5} />
      </Page>

      {/* ════════ PAGINA 6: TAREAS PERIODICAS ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Tareas" />
        <Text style={s.pageTitle}>Tareas Periodicas</Text>
        <Text style={s.pageSubtitle}>Cronograma de actividades para {p.nombre_condominio}</Text>

        <View style={s.highlightBox} wrap={false}>
          <Text style={s.highlightBold}>Frecuencia de visitas presenciales</Text>
          <Text style={s.highlightText}>
            {p.visitas_semanales} visita{p.visitas_semanales > 1 ? 's' : ''} por semana — {horasVisita} hora{horasVisita > 1 ? 's' : ''} por visita ({p.visitas_semanales * horasVisita} horas semanales en sitio)
          </Text>
        </View>

        <Text style={{ ...s.sectionTitle, marginTop: 16 }}>Actividades por Visita</Text>
        <View style={s.tableHeader}>
          <Text style={{ ...s.tableHeaderText, flex: 3 }}>Actividad</Text>
          <Text style={{ ...s.tableHeaderText, flex: 1, textAlign: 'center' }}>Frecuencia</Text>
        </View>
        {[
          ['Inspeccion general de areas comunes y equipos', 'Cada visita'],
          ['Revision de libro de novedades de seguridad/conserjeria', 'Cada visita'],
          ['Seguimiento de cobro de expensas y morosidad', 'Cada visita'],
          ['Coordinacion de trabajos de mantenimiento pendientes', 'Cada visita'],
          ['Atencion presencial a copropietarios', 'Cada visita'],
          ['Verificacion de limpieza y orden en areas comunes', 'Cada visita'],
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
          ['Elaboracion y envio de estado de cuenta mensual', 'Mensual'],
          ['Conciliacion bancaria y cierre contable', 'Mensual'],
          ['Informe de mantenimientos realizados y pendientes', 'Mensual'],
          ['Revision de contratos con proveedores', 'Trimestral'],
          ['Convocatoria y gestion de asambleas', 'Semestral'],
          ['Actualizacion de presupuesto anual', 'Anual'],
        ].map(([act, freq], i) => (
          <View key={i} style={i % 2 === 0 ? s.tareaRow : s.tareaRowAlt}>
            <Text style={{ flex: 3, fontSize: 9 }}>{act}</Text>
            <Text style={{ flex: 1, fontSize: 9, textAlign: 'center', color: C.midGray }}>{freq}</Text>
          </View>
        ))}

        <PageFooter numero={p.numero_propuesta} pagina={6} />
      </Page>

      {/* ════════ PAGINA 7: ATENCION FUERA DE HORARIO + BENEFICIOS ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Servicio" />
        <Text style={s.pageTitle}>Atencion Fuera de Horario</Text>
        <Text style={s.pageSubtitle}>Disponibilidad para emergencias y situaciones criticas</Text>

        <View style={s.mvvCard} wrap={false}>
          <Text style={s.mvvText}>
            ALTRION ofrece una linea de atencion para emergencias disponible fuera del horario de visitas. En caso de situaciones criticas como fallas en el suministro de agua, problemas electricos graves, emergencias de seguridad o cualquier evento que requiera intervencion inmediata, los copropietarios pueden comunicarse directamente con la administradora.
          </Text>
        </View>

        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Linea directa de emergencias disponible 24/7 para situaciones criticas.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Coordinacion inmediata con proveedores de emergencia (plomeria, electricidad, cerrajeria).</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Comunicacion por WhatsApp para consultas no urgentes fuera de horario.</Text>
        </View>
        <View style={s.bulletRow} wrap={false}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>Respuesta garantizada en un maximo de 2 horas para emergencias.</Text>
        </View>

        <Text style={{ ...s.pageTitle, marginTop: 24, fontSize: 16 }}>Beneficios</Text>
        <Text style={{ ...s.pageSubtitle, marginBottom: 14 }}>Por que elegir ALTRION para su condominio</Text>

        <View style={s.beneficioCard} wrap={false}>
          <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>$</Text></View>
          <View style={s.beneficioContent}>
            <Text style={s.beneficioTitle}>Transparencia Financiera Total</Text>
            <Text style={s.beneficioDesc}>Acceso en tiempo real a estados de cuenta, ingresos, egresos y presupuestos a traves de la plataforma DOMIA.</Text>
          </View>
        </View>
        <View style={s.beneficioCard} wrap={false}>
          <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>T</Text></View>
          <View style={s.beneficioContent}>
            <Text style={s.beneficioTitle}>Tecnologia de Punta</Text>
            <Text style={s.beneficioDesc}>Sistema DOMIA con panel para copropietarios: consultas, pagos, reportes de incidencias y reservas desde cualquier dispositivo.</Text>
          </View>
        </View>
        <View style={s.beneficioCard} wrap={false}>
          <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>P</Text></View>
          <View style={s.beneficioContent}>
            <Text style={s.beneficioTitle}>Personal Capacitado</Text>
            <Text style={s.beneficioDesc}>Equipo profesional con experiencia en administracion inmobiliaria y atencion al cliente.</Text>
          </View>
        </View>
        <View style={s.beneficioCard} wrap={false}>
          <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>R</Text></View>
          <View style={s.beneficioContent}>
            <Text style={s.beneficioTitle}>Reduccion de Morosidad</Text>
            <Text style={s.beneficioDesc}>Sistema automatizado de cobranza con recordatorios, seguimiento y reportes de estado por copropietario.</Text>
          </View>
        </View>
        <View style={s.beneficioCard} wrap={false}>
          <View style={s.beneficioIcon}><Text style={s.beneficioIconText}>V</Text></View>
          <View style={s.beneficioContent}>
            <Text style={s.beneficioTitle}>Valorizacion del Inmueble</Text>
            <Text style={s.beneficioDesc}>Mantenimiento preventivo constante que preserva y aumenta el valor de la propiedad a largo plazo.</Text>
          </View>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={7} />
      </Page>

      {/* ════════ PAGINA 8: PLATAFORMA DOMIA ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Tecnologia" />
        <Text style={s.pageTitle}>Plataforma DOMIA</Text>
        <Text style={s.pageSubtitle}>Sistema integral de gestion condominial incluido en el servicio</Text>

        <Text style={s.paragraph}>
          Todos nuestros condominios administrados cuentan con acceso a DOMIA, nuestra plataforma web desarrollada internamente que centraliza toda la gestion del condominio en un solo lugar.
        </Text>

        <View style={s.capturaGrid} wrap={false}>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Dashboard Principal</Text>
            <Text style={s.capturaDesc}>Vista general con indicadores clave: cobranza del mes, morosidad, gastos vs presupuesto, y alertas pendientes.</Text>
          </View>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Gestion de Residentes</Text>
            <Text style={s.capturaDesc}>Directorio completo de copropietarios e inquilinos, con datos de contacto, estado de pagos y documentos.</Text>
          </View>
        </View>

        <View style={s.capturaGrid} wrap={false}>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Cobranza y Expensas</Text>
            <Text style={s.capturaDesc}>Generacion automatica de boletas, seguimiento de pagos, recordatorios por WhatsApp y reportes de morosidad.</Text>
          </View>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Gastos y Presupuesto</Text>
            <Text style={s.capturaDesc}>Registro detallado de gastos con respaldo fotografico, categorias y comparacion contra presupuesto aprobado.</Text>
          </View>
        </View>

        <View style={s.capturaGrid} wrap={false}>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Mantenimiento</Text>
            <Text style={s.capturaDesc}>Solicitudes de mantenimiento con seguimiento de estado, asignacion de proveedores y historial completo.</Text>
          </View>
          <View style={{ ...s.capturaCard, flex: 1 }}>
            <Text style={s.capturaTitle}>Portal del Residente</Text>
            <Text style={s.capturaDesc}>Acceso individual para cada copropietario: pagos en linea, consultas, reservas de areas comunes y notificaciones.</Text>
          </View>
        </View>

        <View style={s.highlightBox} wrap={false}>
          <Text style={s.highlightBold}>Acceso incluido sin costo adicional</Text>
          <Text style={s.highlightText}>
            La plataforma DOMIA esta incluida en el costo mensual del servicio de administracion. No genera cargos adicionales por licencias, usuarios ni actualizaciones.
          </Text>
        </View>

        <PageFooter numero={p.numero_propuesta} pagina={8} />
      </Page>

      {/* ════════ PAGINA 9: PROPUESTA ECONOMICA ════════ */}
      <Page size="A4" style={s.innerPage}>
        <InnerHeader title="Propuesta Economica" />
        <Text style={s.pageTitle}>Propuesta Economica</Text>
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
        <View style={s.infoRow} wrap={false}>
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
          <View style={s.notesBox} wrap={false}>
            <Text style={{ ...s.infoLabel, marginBottom: 4 }}>Observaciones</Text>
            <Text style={{ fontSize: 10, color: C.darkText, lineHeight: 1.5 }}>{p.notas}</Text>
          </View>
        )}

        <PageFooter numero={p.numero_propuesta} pagina={9} />
      </Page>
    </Document>
  )
}
