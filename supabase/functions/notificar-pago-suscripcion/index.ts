import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://app.domia.me'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    })
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  try {
    const { tenant_id, tipo } = await req.json()

    if (!tenant_id || !tipo) {
      return new Response(JSON.stringify({ success: false, error: 'tenant_id y tipo requeridos' }), { headers })
    }

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenant_id).single()
    if (!tenant) {
      return new Response(JSON.stringify({ success: false, error: 'Tenant no encontrado' }), { headers })
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, error: 'RESEND_API_KEY no configurada' }), { headers })
    }

    const resend = new Resend(resendApiKey)

    const asuntos: Record<string, string> = {
      verificado: `DOMIA — Tu pago ha sido verificado`,
      rechazado: `DOMIA — Pago rechazado`,
      recordatorio: `DOMIA — Recordatorio de pago pendiente`,
      suspension: `DOMIA — Tu acceso ha sido suspendido`,
      nuevo_comprobante: `Nuevo comprobante de pago — ${tenant.nombre}`,
    }

    const mensajes: Record<string, string> = {
      verificado: `<p style="color:#555;font-size:14px;line-height:1.6">Tu pago de <strong>Bs. ${Number(tenant.monto_mensual).toFixed(0)}</strong> ha sido verificado exitosamente.</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Tu suscripcion esta activa hasta el <strong>${tenant.proximo_cobro ? new Date(tenant.proximo_cobro).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'proximo mes'}</strong>.</p>`,
      rechazado: `<p style="color:#555;font-size:14px;line-height:1.6">Tu comprobante de pago fue <strong style="color:#B83232">rechazado</strong>.</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Por favor intenta nuevamente o contacta soporte en <a href="mailto:admin@altrion.bo" style="color:#1A7A4A">admin@altrion.bo</a>.</p>`,
      recordatorio: `<p style="color:#555;font-size:14px;line-height:1.6">Tu pago de <strong>Bs. ${Number(tenant.monto_mensual).toFixed(0)}</strong> esta pendiente.</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Realiza el pago para evitar la suspension de tu acceso.</p>`,
      suspension: `<p style="color:#555;font-size:14px;line-height:1.6">Tu acceso a DOMIA ha sido <strong style="color:#B83232">suspendido</strong> por falta de pago.</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Monto pendiente: <strong>Bs. ${Number(tenant.monto_mensual).toFixed(0)}</strong></p>
        <p style="color:#555;font-size:14px;line-height:1.6">Regulariza tu pago para reactivar tu cuenta.</p>`,
      nuevo_comprobante: `<p style="color:#555;font-size:14px;line-height:1.6">El cliente <strong>${tenant.nombre}</strong> envio su comprobante de pago.</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Monto: <strong>Bs. ${Number(tenant.monto_mensual).toFixed(0)}</strong></p>
        <p style="color:#555;font-size:14px;line-height:1.6">Ingresa al panel de clientes para verificar el pago.</p>`,
    }

    const adminEmail = 'mcarmensalcedo@altrion.bo'
    const emailResult = await resend.emails.send({
      from: 'ALTRION <noreply@domia.me>',
      to: tipo === 'nuevo_comprobante' ? adminEmail : tenant.email,
      subject: asuntos[tipo] || 'DOMIA — Notificacion',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:24px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
  <tr><td style="background:linear-gradient(135deg,#1A7A4A,#0D9E6E);padding:24px 28px;border-radius:12px 12px 0 0">
    <span style="font-family:'Nunito',sans-serif;font-size:24px;font-weight:800;color:white">DOMIA</span>
    <span style="font-size:12px;color:rgba(255,255,255,0.7);margin-left:8px">Administracion de Condominios</span>
  </td></tr>
  <tr><td style="background:white;padding:32px 28px;border:1px solid #E0E0E0;border-top:none">
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 16px;font-size:18px">${tenant.nombre}</h2>
    ${mensajes[tipo] || ''}
    <a href="${appUrl}/tenant/suscripcion" style="display:block;text-align:center;background:#1A7A4A;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Nunito',sans-serif;margin-top:20px">
      ${tipo === 'verificado' ? 'Ir a mi panel' : 'Pagar ahora'}
    </a>
  </td></tr>
  <tr><td style="padding:16px 0;text-align:center;font-size:11px;color:#999">
    DOMIA · Administracion de Condominios · Bolivia
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    })

    const emailSent = !emailResult.error
    if (emailResult.error) {
      console.error('Resend error:', JSON.stringify(emailResult.error))
    }

    return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers })
  } catch (err) {
    console.error('Error:', (err as Error).message)
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), { headers })
  }
})
