import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const C = {
  azulOscuro: '#0D1B2A',
  azulAltrion: '#1A4A7A',
  dorado: '#C9A84C',
  verde: '#1A7A4A',
  rojo: '#B83232',
  naranja: '#C07A2E',
  gris: '#5E6B62',
  fondo: '#F4F7F5',
  blanco: '#FFFFFF',
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0D1117', position: 'relative' },
  // Header ALTRION
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.azulAltrion, letterSpacing: 1 },
  headerSub: { fontSize: 9, color: C.gris, marginTop: 2 },
  goldLine: { height: 2, backgroundColor: C.dorado, marginBottom: 24 },
  // Document title
  docTitle: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.azulOscuro, textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  docNumber: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.azulAltrion, textAlign: 'center', marginBottom: 20 },
  // Info grid
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBlock: { flex: 1, backgroundColor: C.fondo, borderRadius: 8, padding: 12 },
  infoLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gris, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0D1117' },
  infoValueSmall: { fontSize: 10, color: '#0D1117', marginTop: 2 },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: C.azulAltrion, borderRadius: 6, padding: 8, marginTop: 16, marginBottom: 4 },
  thText: { color: 'white', fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E8F4F0' },
  tableRowAlt: { backgroundColor: '#FAFBFA' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#E8F4F0', borderRadius: 6, marginTop: 4, marginBottom: 16 },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.azulAltrion },
  totalMonto: { fontFamily: 'Helvetica-Bold', fontSize: 14, textAlign: 'right', color: C.azulAltrion },
  // Instrucciones
  instrucciones: { backgroundColor: '#FEF9EC', borderRadius: 8, padding: 14, marginBottom: 16 },
  instrTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.naranja, marginBottom: 6 },
  instrTexto: { fontSize: 9, color: '#0D1117', lineHeight: 1.6 },
  // Watermark
  watermark: { position: 'absolute', top: '40%', left: '15%', fontSize: 60, fontFamily: 'Helvetica-Bold', opacity: 0.06, transform: 'rotate(-30deg)' },
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#D4D4D4', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.gris },
})

function formatBs(n: number) { return `Bs. ${n.toFixed(2)}` }

function formatFecha(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── SOLICITUD DE RESERVA ───
export interface SolicitudReservaProps {
  numero: string       // SOL-2026-001
  residente: string
  unidad: string
  area: string
  fecha: string        // ISO date
  horaInicio: string
  horaFin: string
  garantia: number
  alquiler: number
  condominioNombre: string
}

export function SolicitudReservaPDF(props: SolicitudReservaProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={{ ...s.watermark, color: C.naranja }}>PENDIENTE</Text>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>ALTRION</Text>
            <Text style={s.headerSub}>Administracion de Condominios</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: C.gris }}>Fecha de emision</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>
              {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />

        <Text style={s.docTitle}>Solicitud de Reserva</Text>
        <Text style={s.docNumber}>{props.numero}</Text>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{props.residente}</Text>
            <Text style={s.infoValueSmall}>Unidad {props.unidad}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Area solicitada</Text>
            <Text style={s.infoValue}>{props.area}</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Fecha</Text>
            <Text style={s.infoValue}>{formatFecha(props.fecha)}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Horario</Text>
            <Text style={s.infoValue}>{props.horaInicio.slice(0, 5)} — {props.horaFin.slice(0, 5)}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 3 }}>Concepto</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
        </View>
        {props.garantia > 0 && (
          <View style={s.tableRow}>
            <Text style={{ flex: 3, fontSize: 10 }}>Garantia</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.garantia)}</Text>
          </View>
        )}
        {props.alquiler > 0 && (
          <View style={{ ...s.tableRow, ...s.tableRowAlt }}>
            <Text style={{ flex: 3, fontSize: 10 }}>Alquiler / Tarifa de uso</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.alquiler)}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 3 }}>TOTAL ESTIMADO</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(props.garantia + props.alquiler)}</Text>
        </View>

        <View style={{ backgroundColor: '#FEF9EC', borderLeftWidth: 3, borderLeftColor: C.naranja, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.naranja, marginBottom: 4 }}>PENDIENTE DE APROBACION</Text>
          <Text style={{ fontSize: 9, color: '#0D1117', lineHeight: 1.6 }}>
            Esta solicitud sera revisada por la administracion. Se le notificara cuando sea aprobada o rechazada.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — {props.condominioNombre}</Text>
          <Text style={s.footerText}>{props.numero}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── COMPROBANTE DE RESERVA APROBADA ───
export interface ComprobanteReservaProps {
  numero: string       // RES-2026-001
  residente: string
  unidad: string
  area: string
  fecha: string
  horaInicio: string
  horaFin: string
  garantia: number
  alquiler: number
  total: number
  fechaLimitePago: string
  condominioNombre: string
  qrUrl?: string
}

export function ComprobanteReservaPDF(props: ComprobanteReservaProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={{ ...s.watermark, color: C.verde }}>APROBADO</Text>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>ALTRION</Text>
            <Text style={s.headerSub}>Administracion de Condominios</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: C.gris }}>Fecha de aprobacion</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>
              {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />

        <Text style={s.docTitle}>Comprobante de Reserva Aprobada</Text>
        <Text style={s.docNumber}>{props.numero}</Text>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{props.residente}</Text>
            <Text style={s.infoValueSmall}>Unidad {props.unidad}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Area confirmada</Text>
            <Text style={s.infoValue}>{props.area}</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Fecha confirmada</Text>
            <Text style={s.infoValue}>{formatFecha(props.fecha)}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Horario confirmado</Text>
            <Text style={s.infoValue}>{props.horaInicio.slice(0, 5)} — {props.horaFin.slice(0, 5)}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 3 }}>Concepto</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
        </View>
        {props.garantia > 0 && (
          <View style={s.tableRow}>
            <Text style={{ flex: 3, fontSize: 10 }}>Garantia</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.garantia)}</Text>
          </View>
        )}
        {props.alquiler > 0 && (
          <View style={{ ...s.tableRow, ...s.tableRowAlt }}>
            <Text style={{ flex: 3, fontSize: 10 }}>Alquiler / Tarifa de uso</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.alquiler)}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 3 }}>TOTAL A PAGAR</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(props.total)}</Text>
        </View>

        <View style={s.instrucciones}>
          <Text style={s.instrTitulo}>Instrucciones de pago</Text>
          <Text style={s.instrTexto}>Realice el pago antes de la fecha limite indicada.</Text>
          <Text style={s.instrTexto}>Fecha limite de pago: {formatFecha(props.fechaLimitePago)}</Text>
          {props.qrUrl && (
            <Text style={{ ...s.instrTexto, marginTop: 4 }}>Escanee el codigo QR de pago disponible en el portal DOMIA.</Text>
          )}
        </View>

        <View style={{ backgroundColor: '#E8F4F0', borderLeftWidth: 3, borderLeftColor: C.verde, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.verde }}>RESERVA APROBADA</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — {props.condominioNombre}</Text>
          <Text style={s.footerText}>{props.numero}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── COMPROBANTE DE PAGO ───
export interface ComprobantePagoReservaProps {
  numero: string       // PAG-2026-001
  residente: string
  unidad: string
  area: string
  fecha: string
  horaInicio: string
  horaFin: string
  montoPagado: number
  fechaPago: string
  condominioNombre: string
}

export function ComprobantePagoReservaPDF(props: ComprobantePagoReservaProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={{ ...s.watermark, color: C.verde }}>PAGADO</Text>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>ALTRION</Text>
            <Text style={s.headerSub}>Administracion de Condominios</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: C.gris }}>Fecha de pago</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>
              {formatFecha(props.fechaPago)}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />

        <Text style={s.docTitle}>Comprobante de Pago</Text>
        <Text style={s.docNumber}>{props.numero}</Text>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{props.residente}</Text>
            <Text style={s.infoValueSmall}>Unidad {props.unidad}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Area</Text>
            <Text style={s.infoValue}>{props.area}</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Fecha de reserva</Text>
            <Text style={s.infoValue}>{formatFecha(props.fecha)}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Horario</Text>
            <Text style={s.infoValue}>{props.horaInicio.slice(0, 5)} — {props.horaFin.slice(0, 5)}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 3 }}>Concepto</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={{ flex: 3, fontSize: 10 }}>Pago por reserva de area comun</Text>
          <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.montoPagado)}</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 3 }}>MONTO PAGADO</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(props.montoPagado)}</Text>
        </View>

        <View style={{ backgroundColor: '#E8F4F0', borderLeftWidth: 3, borderLeftColor: C.verde, borderRadius: 8, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14, color: C.verde }}>PAGADO</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — {props.condominioNombre}</Text>
          <Text style={s.footerText}>{props.numero}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── CONFIRMACIÓN DE RESERVA CON CONDICIONES ───
export interface ConfirmacionReservaProps {
  numeroReserva: string
  residente: string
  unidad: string
  area: string
  fecha: string
  horaInicio: string
  horaFin: string
  montoGarantia: number
  montoAlquiler: number
  montoTotal: number
  condominioNombre: string
  condicionesUso: string | null
  inventario: string | null
  reglas: string | null
  politicaGarantia: string | null
  contactoEmergencia: string | null
}

const sectionHeader = { fontFamily: 'Helvetica-Bold' as const, fontSize: 11, color: '#0D1B2A', marginTop: 16, marginBottom: 6 }
const sectionBody = { fontSize: 9, color: '#0D1117', lineHeight: 1.6 }

export function ConfirmacionReservaPDF(props: ConfirmacionReservaProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={{ ...s.watermark, color: C.verde }}>CONFIRMADO</Text>

        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>ALTRION</Text>
            <Text style={s.headerSub}>Administracion de Condominios</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: C.gris }}>Fecha de emision</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>
              {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={s.goldLine} />

        <Text style={s.docTitle}>Confirmacion de Reserva</Text>
        <Text style={s.docNumber}>{props.numeroReserva}</Text>

        {/* Datos de la reserva */}
        <Text style={sectionHeader}>Datos de la Reserva</Text>
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Residente</Text>
            <Text style={s.infoValue}>{props.residente}</Text>
            <Text style={s.infoValueSmall}>Unidad {props.unidad}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Area</Text>
            <Text style={s.infoValue}>{props.area}</Text>
          </View>
        </View>
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Fecha</Text>
            <Text style={s.infoValue}>{formatFecha(props.fecha)}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Horario</Text>
            <Text style={s.infoValue}>{props.horaInicio.slice(0, 5)} — {props.horaFin.slice(0, 5)}</Text>
          </View>
        </View>

        {/* Pagos */}
        <Text style={sectionHeader}>Pagos Registrados</Text>
        <View style={s.tableHeader}>
          <Text style={{ ...s.thText, flex: 3 }}>Concepto</Text>
          <Text style={{ ...s.thText, flex: 1, textAlign: 'right' }}>Monto</Text>
        </View>
        {props.montoGarantia > 0 && (
          <View style={s.tableRow}>
            <Text style={{ flex: 3, fontSize: 10 }}>Garantia (reembolsable al finalizar)</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.montoGarantia)}</Text>
          </View>
        )}
        {props.montoAlquiler > 0 && (
          <View style={{ ...s.tableRow, ...s.tableRowAlt }}>
            <Text style={{ flex: 3, fontSize: 10 }}>Alquiler / Tarifa de uso</Text>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>{formatBs(props.montoAlquiler)}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={{ ...s.totalLabel, flex: 3 }}>TOTAL PAGADO</Text>
          <Text style={{ ...s.totalMonto, flex: 1 }}>{formatBs(props.montoTotal)}</Text>
        </View>

        {/* Condiciones de entrega */}
        {props.condicionesUso && (
          <>
            <Text style={sectionHeader}>Condiciones de Entrega</Text>
            <View style={{ backgroundColor: C.fondo, borderRadius: 8, padding: 12 }}>
              <Text style={sectionBody}>{props.condicionesUso}</Text>
            </View>
          </>
        )}

        {/* Inventario */}
        {props.inventario && (
          <>
            <Text style={sectionHeader}>Inventario del Area</Text>
            <View style={{ backgroundColor: C.fondo, borderRadius: 8, padding: 12 }}>
              <Text style={sectionBody}>{props.inventario}</Text>
              <Text style={{ fontSize: 8, color: C.gris, marginTop: 6, fontStyle: 'italic' }}>
                Al recibir el area confirma que estos elementos estan en buen estado.
              </Text>
            </View>
          </>
        )}

        {/* Reglas */}
        {props.reglas && (
          <>
            <Text style={sectionHeader}>Reglas de Uso</Text>
            <View style={{ backgroundColor: '#FEF9EC', borderLeftWidth: 3, borderLeftColor: C.naranja, borderRadius: 8, padding: 12 }}>
              <Text style={sectionBody}>{props.reglas}</Text>
            </View>
          </>
        )}

        {/* Política de garantía */}
        {props.politicaGarantia && props.montoGarantia > 0 && (
          <>
            <Text style={sectionHeader}>Politica de Garantia</Text>
            <View style={{ backgroundColor: C.fondo, borderRadius: 8, padding: 12 }}>
              <Text style={sectionBody}>{props.politicaGarantia}</Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.azulAltrion, marginTop: 6 }}>
                Garantia: {formatBs(props.montoGarantia)} — sera devuelta previa inspeccion del area.
              </Text>
            </View>
          </>
        )}

        {/* Contacto de emergencia */}
        {props.contactoEmergencia && (
          <>
            <Text style={sectionHeader}>Contacto de Emergencia</Text>
            <View style={{ backgroundColor: C.fondo, borderRadius: 8, padding: 12 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>{props.contactoEmergencia}</Text>
            </View>
          </>
        )}

        {/* Firma */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#D4D4D4', paddingTop: 16 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#0D1117' }}>Maria del Carmen Salcedo Feeney</Text>
          <Text style={{ fontSize: 9, color: C.gris, marginTop: 2 }}>Administradora — ALTRION S.R.L.</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>ALTRION S.R.L. — {props.condominioNombre}</Text>
          <Text style={s.footerText}>{props.numeroReserva} — {new Date().toLocaleDateString('es-BO')}</Text>
        </View>
      </Page>
    </Document>
  )
}
