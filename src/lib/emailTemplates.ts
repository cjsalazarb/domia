// Base layout wrapper for all DOMIA emails
function wrap(condominioNombre: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7F5;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:24px">
<tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%">
  <tr><td style="background:linear-gradient(to right,#1A7A4A,#0D9E6E);padding:20px 24px;border-radius:12px 12px 0 0">
    <span style="font-family:'Nunito',sans-serif;font-size:20px;font-weight:800;color:white">DOMIA</span>
  </td></tr>
  <tr><td style="background:white;padding:28px 24px;border:1px solid #E8F4F0;border-top:none;border-radius:0 0 12px 12px">
    ${content}
  </td></tr>
  <tr><td style="padding:16px 0;text-align:center;font-size:11px;color:#5E6B62">
    ${condominioNombre} · DOMIA Sistema de Administración de Condominios · Bolivia
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:block;text-align:center;background:#1A7A4A;color:white;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;font-family:'Nunito',sans-serif;margin-top:16px">${text}</a>`
}

function kpiBox(label: string, value: string, color = '#1A7A4A'): string {
  return `<div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
    <div style="font-size:12px;color:#5E6B62">${label}</div>
    <div style="font-family:'Nunito',sans-serif;font-size:22px;font-weight:800;color:${color};margin-top:2px">${value}</div>
  </div>`
}

// 1. Recibo mensual
export function templateReciboMensual(
  residente: string, condominio: string, unidad: string, monto: number, periodo: string, linkPortal: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:18px">Hola ${residente},</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Se ha generado tu recibo de mantenimiento para <strong>${periodo}</strong>.</p>
    ${kpiBox(`Unidad ${unidad}`, `Bs. ${monto.toFixed(2)}`)}
    ${btn('Ver recibo →', linkPortal)}
  `)
}

// 2. Recordatorio de pago
export function templateRecordatorioPago(
  residente: string, condominio: string, monto: number, diasAtraso: number
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:18px">Recordatorio de pago</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, tu cuota de mantenimiento tiene <strong>${diasAtraso} día${diasAtraso !== 1 ? 's' : ''} de atraso</strong>.</p>
    ${kpiBox('Monto pendiente', `Bs. ${monto.toFixed(2)}`, '#C07A2E')}
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Realiza tu pago lo antes posible para evitar recargos adicionales.</p>
  `)
}

// 3. Alerta de mora
export function templateAlertaMora(
  residente: string, condominio: string, montoTotal: number, mesesAdeudados: number
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#B83232;margin:0 0 8px;font-size:18px">Alerta de mora</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, registras <strong>${mesesAdeudados} mes${mesesAdeudados !== 1 ? 'es' : ''}</strong> de deuda acumulada.</p>
    ${kpiBox('Deuda total', `Bs. ${montoTotal.toFixed(2)}`, '#B83232')}
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Regulariza tu situación para evitar las medidas del reglamento interno.</p>
  `)
}

// 4. Pago confirmado
export function templatePagoConfirmado(
  residente: string, condominio: string, monto: number, periodo: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#1A7A4A;margin:0 0 8px;font-size:18px">Pago confirmado ✓</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, tu pago de <strong>${periodo}</strong> ha sido confirmado.</p>
    ${kpiBox('Monto pagado', `Bs. ${monto.toFixed(2)}`)}
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Gracias por tu puntualidad.</p>
  `)
}

// 5. Mantenimiento actualizado
export function templateMantenimientoActualizado(
  residente: string, condominio: string, ticket: string, nuevoEstado: string
): string {
  const estadoColor: Record<string, string> = { pendiente: '#C07A2E', asignado: '#0D4A8F', en_proceso: '#7B1AC8', resuelto: '#1A7A4A', cancelado: '#B83232' }
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:18px">Actualización de solicitud</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, tu solicitud de mantenimiento ha sido actualizada.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Solicitud</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${ticket}</div>
    </div>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#5E6B62">Nuevo estado</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:${estadoColor[nuevoEstado] || '#0D1117'};margin-top:2px;text-transform:capitalize">${nuevoEstado.replace('_', ' ')}</div>
    </div>
  `)
}

// 6. Reserva confirmada
export function templateReservaConfirmada(
  residente: string, condominio: string, area: string, fecha: string, horaInicio: string, horaFin: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#1A7A4A;margin:0 0 8px;font-size:18px">Reserva confirmada ✓</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, tu reserva ha sido aprobada.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Área</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${area}</div>
    </div>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px">
      <div style="font-size:12px;color:#5E6B62">Fecha y hora</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${fecha} · ${horaInicio} — ${horaFin}</div>
    </div>
  `)
}

// 7. Reserva rechazada
export function templateReservaRechazada(
  residente: string, condominio: string, area: string, fecha: string, motivoRechazo: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#B83232;margin:0 0 8px;font-size:18px">Reserva rechazada</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Hola ${residente}, tu solicitud de reserva no fue aprobada.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">${area} · ${fecha}</div>
    </div>
    <div style="background:#FCEAEA;border-left:3px solid #B83232;border-radius:8px;padding:10px 14px;font-size:13px;color:#B83232">
      <strong>Motivo:</strong> ${motivoRechazo}
    </div>
  `)
}

// 8. Aviso general
export function templateAvisoGeneral(
  titulo: string, cuerpo: string, condominio: string, fecha: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 4px;font-size:18px">${titulo}</h2>
    <p style="font-size:12px;color:#5E6B62;margin:0 0 16px">${fecha}</p>
    <div style="color:#0D1117;font-size:14px;line-height:1.6;white-space:pre-wrap">${cuerpo}</div>
  `)
}

// 9. Convocatoria asamblea
export function templateConvocatoriaAsamblea(
  condominio: string, fechaAsamblea: string, lugar: string, temas: string[]
): string {
  const temasHtml = temas.map((t, i) => `<li style="margin-bottom:6px;color:#0D1117;font-size:14px">${i + 1}. ${t}</li>`).join('')
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:18px">Convocatoria a Asamblea</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Se convoca a todos los propietarios e inquilinos a la asamblea del condominio.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;color:#5E6B62">Fecha y lugar</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${fechaAsamblea}</div>
      <div style="font-size:13px;color:#5E6B62;margin-top:2px">${lugar}</div>
    </div>
    <div style="margin-bottom:8px;font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;color:#0D1117">Orden del día:</div>
    <ol style="padding-left:20px;margin:0">${temasHtml}</ol>
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Su asistencia es importante. Gracias.</p>
  `)
}

// 10. Bienvenida residente — credenciales de acceso (branding ALTRION azul #1A4A7A)
export function templateBienvenidaResidente(
  nombre: string,
  apellido: string,
  email: string,
  passwordTemporal: string,
  condominioNombre: string,
  portalUrl: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:24px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
  <tr><td style="background:#1A4A7A;padding:24px 28px;border-radius:12px 12px 0 0">
    <span style="font-family:'Nunito',sans-serif;font-size:22px;font-weight:800;color:white;letter-spacing:0.5px">ALTRION</span>
    <span style="font-size:12px;color:rgba(255,255,255,0.7);margin-left:8px">Administración de Condominios</span>
  </td></tr>
  <tr><td style="background:white;padding:32px 28px;border:1px solid #E0E0E0;border-top:none">
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:20px">
      Estimado/a ${nombre} ${apellido},
    </h2>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px">
      Le damos la bienvenida al portal de residentes de
      <strong>${condominioNombre}</strong>, administrado por ALTRION.
    </p>

    <div style="background:#F8F9FA;border:1px solid #E0E0E0;border-radius:10px;padding:20px;margin-bottom:20px">
      <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;font-weight:600">
        Sus credenciales de acceso
      </div>
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr>
          <td style="font-size:13px;color:#555;padding:4px 0;width:100px">Usuario:</td>
          <td style="font-size:14px;color:#0D1117;font-weight:600;padding:4px 0">${email}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#555;padding:4px 0">Contraseña:</td>
          <td style="font-family:'Courier New',monospace;font-size:16px;color:#1A4A7A;font-weight:700;padding:4px 0;letter-spacing:1px">${passwordTemporal}</td>
        </tr>
      </table>
    </div>

    <a href="${portalUrl}" style="display:block;text-align:center;background:#1A4A7A;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Nunito',sans-serif">
      Ingresar al portal →
    </a>

    <div style="background:#FFF8E1;border-left:3px solid #C07A2E;border-radius:0 8px 8px 0;padding:12px 14px;margin-top:20px">
      <p style="font-size:13px;color:#555;margin:0;line-height:1.5">
        <strong style="color:#C07A2E">IMPORTANTE:</strong> Al ingresar por primera vez, el sistema le pedirá crear una contraseña personal por seguridad.
      </p>
    </div>

    <div style="border-top:1px solid #E0E0E0;margin-top:24px;padding-top:20px">
      <p style="font-size:13px;color:#555;margin:0;line-height:1.5">
        Atentamente,<br/>
        <strong style="color:#0D1117">María del Carmen Salcedo Feeney</strong><br/>
        <span style="color:#888;font-size:12px">Administradora — ALTRION</span>
      </p>
    </div>
  </td></tr>
  <tr><td style="padding:16px 0;text-align:center;font-size:11px;color:#999">
    ${condominioNombre} · ALTRION Administración de Condominios · Bolivia
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// 11. Condominio archivado
export function templateCondominioArchivado(
  condominio: string, fecha: string, linkRestaurar: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#C07A2E;margin:0 0 8px;font-size:18px">Condominio archivado</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">El condominio <strong>${condominio}</strong> fue archivado el ${fecha}.</p>
    <p style="color:#5E6B62;font-size:13px;margin:0 0 16px">Los datos se conservan. Tienes 30 dias para restaurarlo.</p>
    ${btn('Restaurar ahora →', linkRestaurar)}
  `)
}

// 12. Recordatorio antes de eliminación
export function templateRecordatorioEliminacion(
  condominio: string, diasRestantes: number, linkRestaurar: string
): string {
  const urgencia = diasRestantes <= 3 ? '#B83232' : '#C07A2E'
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:${urgencia};margin:0 0 8px;font-size:18px">
      ${diasRestantes <= 1 ? 'Ultimo aviso' : `Quedan ${diasRestantes} dias`}
    </h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">
      ${diasRestantes <= 1
        ? `Mañana se eliminara permanentemente el condominio <strong>${condominio}</strong>.`
        : `El condominio <strong>${condominio}</strong> sera eliminado en ${diasRestantes} dias.`
      }
    </p>
    <p style="color:#5E6B62;font-size:13px;margin:0 0 16px">Si deseas conservarlo, restauralo ahora.</p>
    ${btn('Restaurar condominio →', linkRestaurar)}
  `)
}

// 13. Solicitud de reserva (para administradora)
export function templateSolicitudReserva(
  residente: string, condominio: string, area: string, fecha: string,
  horaInicio: string, horaFin: string, monto: number
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#C07A2E;margin:0 0 8px;font-size:18px">Nueva solicitud de reserva</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px"><strong>${residente}</strong> ha solicitado reservar un area comun.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Area</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${area}</div>
    </div>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Fecha y hora</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${fecha} · ${horaInicio} — ${horaFin}</div>
    </div>
    ${monto > 0 ? kpiBox('Monto estimado', `Bs. ${monto.toFixed(2)}`, '#C07A2E') : ''}
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Ingresa al panel de administracion para aprobar o rechazar esta solicitud.</p>
  `)
}

// 14. Reserva aprobada (para residente, con adjunto PDF)
export function templateReservaAprobadaConPago(
  residente: string, condominio: string, area: string, fecha: string,
  horaInicio: string, horaFin: string, total: number, fechaLimitePago: string,
  numeroReserva?: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#1A7A4A;margin:0 0 8px;font-size:18px">Reserva aprobada</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Estimado/a <strong>${residente}</strong>, su solicitud de reserva ha sido aprobada.</p>
    ${numeroReserva ? `<div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px"><div style="font-size:12px;color:#5E6B62">Numero de reserva</div><div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${numeroReserva}</div></div>` : ''}
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Area: ${area}</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${fecha} · ${horaInicio} — ${horaFin}</div>
    </div>
    ${total > 0 ? kpiBox('Total a pagar', `Bs. ${total.toFixed(2)}`) : ''}
    ${total > 0 ? `
    <p style="color:#5E6B62;font-size:13px;margin:8px 0 0">Fecha limite de pago: <strong>${fechaLimitePago}</strong></p>
    <p style="color:#5E6B62;font-size:13px;margin:8px 0 0">Para confirmar su reserva, realice el pago y suba el comprobante en el portal:</p>
    ${btn('Subir comprobante de pago →', 'https://app.domia.me/portal/reservar')}
    ` : '<p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Su reserva esta confirmada. Adjuntamos el comprobante.</p>'}
  `)
}

// 15. Pago de reserva confirmado (para residente)
export function templatePagoReservaConfirmado(
  residente: string, condominio: string, area: string, fecha: string, monto: number
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#1A7A4A;margin:0 0 8px;font-size:18px">Pago confirmado</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Estimado/a <strong>${residente}</strong>, el pago de su reserva ha sido confirmado.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:#5E6B62">Reserva</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${area} · ${fecha}</div>
    </div>
    ${kpiBox('Monto pagado', `Bs. ${monto.toFixed(2)}`)}
    <p style="color:#5E6B62;font-size:13px;margin:16px 0 0">Adjuntamos el comprobante de pago. Gracias.</p>
  `)
}

// 16. Confirmación de reserva con condiciones de entrega
export function templateConfirmacionReserva(
  residente: string, condominio: string, area: string, fecha: string,
  horaInicio: string, horaFin: string, unidad: string, numeroReserva: string,
  montoGarantia: number, montoAlquiler: number, montoTotal: number,
  condicionesUso: string | null, inventario: string | null,
  reglas: string | null, politicaGarantia: string | null,
  contactoEmergencia: string | null
): string {
  const separator = '<hr style="border:none;border-top:2px solid #C9A84C;margin:20px 0">'

  let content = `
    ${separator}
    <h2 style="font-family:'Nunito',sans-serif;color:#1A7A4A;margin:0 0 4px;font-size:18px;text-align:center">CONFIRMACION DE RESERVA</h2>
    <p style="text-align:center;font-size:13px;color:#0D4A8F;font-weight:700;margin:0 0 16px">${numeroReserva}</p>
    ${separator}

    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">Estimado/a <strong>${residente}</strong>, su pago ha sido recibido y su reserva esta confirmada.</p>

    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Datos de la Reserva</div>
      <div style="font-size:14px;color:#0D1117;line-height:1.8">
        <strong>Area:</strong> ${area}<br/>
        <strong>Fecha:</strong> ${fecha}<br/>
        <strong>Horario:</strong> ${horaInicio} a ${horaFin}<br/>
        <strong>Unidad:</strong> ${unidad}
      </div>
    </div>

    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Pagos Registrados</div>
      ${montoGarantia > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#0D1117;margin-bottom:4px"><span>Garantia (reembolsable):</span> <strong>Bs. ${montoGarantia.toFixed(2)}</strong></div>` : ''}
      ${montoAlquiler > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#0D1117;margin-bottom:4px"><span>Alquiler:</span> <strong>Bs. ${montoAlquiler.toFixed(2)}</strong></div>` : ''}
      <div style="border-top:1px solid #C8D4CB;padding-top:6px;margin-top:4px;font-size:14px;color:#0D1117"><strong>Total pagado: Bs. ${montoTotal.toFixed(2)}</strong></div>
    </div>`

  if (condicionesUso) {
    content += `
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Condiciones de Entrega</div>
      <div style="font-size:13px;color:#0D1117;line-height:1.6;white-space:pre-wrap">${condicionesUso}</div>
    </div>`
  }

  if (inventario) {
    content += `
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Inventario del Area</div>
      <div style="font-size:13px;color:#0D1117;line-height:1.6;white-space:pre-wrap">${inventario}</div>
      <p style="font-size:11px;color:#5E6B62;font-style:italic;margin:8px 0 0">Al recibir el area confirma que estos elementos estan en buen estado.</p>
    </div>`
  }

  if (reglas) {
    content += `
    <div style="background:#FEF9EC;border-left:3px solid #C07A2E;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#C07A2E;text-transform:uppercase;font-weight:600;margin-bottom:8px">Reglas de Uso</div>
      <div style="font-size:13px;color:#0D1117;line-height:1.6;white-space:pre-wrap">${reglas}</div>
    </div>`
  }

  if (politicaGarantia && montoGarantia > 0) {
    content += `
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Politica de Garantia</div>
      <div style="font-size:13px;color:#0D1117;line-height:1.6;white-space:pre-wrap">${politicaGarantia}</div>
      <p style="font-size:13px;color:#0D4A8F;font-weight:700;margin:8px 0 0">Garantia: Bs. ${montoGarantia.toFixed(2)}</p>
    </div>`
  }

  if (contactoEmergencia) {
    content += `
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:11px;color:#5E6B62;text-transform:uppercase;font-weight:600;margin-bottom:8px">Contacto de Emergencia</div>
      <div style="font-size:14px;color:#0D1117;font-weight:700">${contactoEmergencia}</div>
    </div>`
  }

  content += `
    ${separator}
    <p style="font-size:11px;color:#5E6B62;text-align:center;margin:0">Este email sirve como comprobante oficial. Guardelo para cualquier consulta.</p>
    <p style="font-size:11px;color:#5E6B62;text-align:center;margin:4px 0 0">ALTRION S.R.L. — noreply@domia.me</p>
    ${separator}`

  return wrap(condominio, content)
}

// 17. Emergencia de residente
export function templateEmergenciaResidente(
  residente: string, unidad: string, condominio: string, timestamp: string
): string {
  return wrap(condominio, `
    <div style="background:#FEF2F2;border:2px solid #DC2626;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">\uD83D\uDEA8</div>
      <h2 style="font-family:'Nunito',sans-serif;color:#DC2626;margin:0 0 4px;font-size:20px">EMERGENCIA</h2>
    </div>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">El residente <strong>${residente}</strong> de la <strong>Unidad ${unidad}</strong> en <strong>${condominio}</strong> reporto una EMERGENCIA.</p>
    <div style="background:#F4F7F5;border-radius:10px;padding:14px;margin-bottom:16px">
      <div style="font-size:12px;color:#5E6B62">Hora del reporte</div>
      <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;color:#0D1117;margin-top:2px">${timestamp}</div>
    </div>
    ${btn('Ver en DOMIA →', 'https://app.domia.me/dashboard')}
    <p style="color:#B83232;font-size:13px;font-weight:600;margin:16px 0 0;text-align:center">Requiere atencion inmediata</p>
  `)
}

// 18. Condominio eliminado definitivamente
export function templateCondominioEliminado(
  condominio: string, fecha: string
): string {
  return wrap(condominio, `
    <h2 style="font-family:'Nunito',sans-serif;color:#B83232;margin:0 0 8px;font-size:18px">Condominio eliminado</h2>
    <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">El condominio <strong>${condominio}</strong> fue eliminado definitivamente el ${fecha}.</p>
    <p style="color:#5E6B62;font-size:13px;margin:0 0 0">Los datos ya no son accesibles desde el portal.</p>
  `)
}
