import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { supabase } from '@/lib/supabase'
import {
  SolicitudReservaPDF,
  ComprobanteReservaPDF,
  ConfirmacionReservaPDF,
  type SolicitudReservaProps,
  type ComprobanteReservaProps,
  type ConfirmacionReservaProps,
} from '@/components/financiero/ReservaPDF'
import {
  templateSolicitudReserva,
  templateReservaAprobadaConPago,
  templateConfirmacionReserva,
} from '@/lib/emailTemplates'

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function formatFechaCorta(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function invocarEdgeFunction(payload: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke('notificar-reserva', {
    body: payload,
  })
  if (error) console.error('Error invocando notificar-reserva:', error)
}

// ─── SOLICITAR RESERVA ───
export async function generarSolicitudReserva(params: {
  reservaId: string
  residenteNombre: string
  unidadNumero: string
  areaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  cobro: number
  condominioNombre: string
  emailAdmin: string
}) {
  const props: SolicitudReservaProps = {
    numero: `SOL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    residente: params.residenteNombre,
    unidad: params.unidadNumero,
    area: params.areaNombre,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    garantia: 0,
    alquiler: params.cobro,
    condominioNombre: params.condominioNombre,
  }

  const blob = await pdf(createElement(SolicitudReservaPDF, props)).toBlob()
  const base64 = await blobToBase64(blob)

  const emailHtml = templateSolicitudReserva(
    params.residenteNombre,
    params.condominioNombre,
    params.areaNombre,
    formatFechaCorta(params.fecha),
    params.horaInicio.slice(0, 5),
    params.horaFin.slice(0, 5),
    params.cobro,
  )

  await invocarEdgeFunction({
    tipo: 'solicitud',
    reservaId: params.reservaId,
    pdfBase64: base64,
    pdfFilename: `${props.numero}.pdf`,
    emailDestinatario: params.emailAdmin,
    emailAsunto: `Nueva solicitud de reserva — ${params.areaNombre} ${formatFechaCorta(params.fecha)}`,
    emailHtml,
  })
}

// ─── APROBAR RESERVA ───
export async function generarComprobanteAprobacion(params: {
  reservaId: string
  residenteNombre: string
  residenteEmail: string
  unidadNumero: string
  areaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  cobro: number
  condominioNombre: string
  numeroReserva: string
}) {
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() + 2) // 48 hours
  const fechaLimitePago = fechaLimite.toISOString().split('T')[0]

  const props: ComprobanteReservaProps = {
    numero: params.numeroReserva,
    residente: params.residenteNombre,
    unidad: params.unidadNumero,
    area: params.areaNombre,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    garantia: 0,
    alquiler: params.cobro,
    total: params.cobro,
    fechaLimitePago,
    condominioNombre: params.condominioNombre,
  }

  const blob = await pdf(createElement(ComprobanteReservaPDF, props)).toBlob()
  const base64 = await blobToBase64(blob)

  const emailHtml = templateReservaAprobadaConPago(
    params.residenteNombre,
    params.condominioNombre,
    params.areaNombre,
    formatFechaCorta(params.fecha),
    params.horaInicio.slice(0, 5),
    params.horaFin.slice(0, 5),
    params.cobro,
    formatFechaCorta(fechaLimitePago),
    params.numeroReserva,
  )

  await invocarEdgeFunction({
    tipo: 'aprobacion',
    reservaId: params.reservaId,
    pdfBase64: base64,
    pdfFilename: `${params.numeroReserva}_aprobacion.pdf`,
    emailDestinatario: params.residenteEmail,
    emailAsunto: `Reserva aprobada — Adjunte comprobante de pago`,
    emailHtml,
  })
}

// ─── CONFIRMACIÓN CON CONDICIONES ───
export async function generarConfirmacionReserva(params: {
  reservaId: string
  residenteNombre: string
  residenteEmail: string
  unidadNumero: string
  areaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  montoGarantia: number
  montoAlquiler: number
  montoTotal: number
  condominioNombre: string
  numeroReserva: string
  condicionesUso: string | null
  inventario: string | null
  reglas: string | null
  politicaGarantia: string | null
  contactoEmergencia: string | null
}) {
  const props: ConfirmacionReservaProps = {
    numeroReserva: params.numeroReserva,
    residente: params.residenteNombre,
    unidad: params.unidadNumero,
    area: params.areaNombre,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    montoGarantia: params.montoGarantia,
    montoAlquiler: params.montoAlquiler,
    montoTotal: params.montoTotal,
    condominioNombre: params.condominioNombre,
    condicionesUso: params.condicionesUso,
    inventario: params.inventario,
    reglas: params.reglas,
    politicaGarantia: params.politicaGarantia,
    contactoEmergencia: params.contactoEmergencia,
  }

  const blob = await pdf(createElement(ConfirmacionReservaPDF, props)).toBlob()
  const base64 = await blobToBase64(blob)

  const emailHtml = templateConfirmacionReserva(
    params.residenteNombre,
    params.condominioNombre,
    params.areaNombre,
    formatFechaCorta(params.fecha),
    params.horaInicio.slice(0, 5),
    params.horaFin.slice(0, 5),
    params.unidadNumero,
    params.numeroReserva,
    params.montoGarantia,
    params.montoAlquiler,
    params.montoTotal,
    params.condicionesUso,
    params.inventario,
    params.reglas,
    params.politicaGarantia,
    params.contactoEmergencia,
  )

  // Also save the PDF URL back to the reserva
  await invocarEdgeFunction({
    tipo: 'confirmacion',
    reservaId: params.reservaId,
    pdfBase64: base64,
    pdfFilename: `${params.numeroReserva}_confirmacion.pdf`,
    emailDestinatario: params.residenteEmail,
    emailAsunto: `Pago confirmado — Condiciones de entrega del area`,
    emailHtml,
  })
}
