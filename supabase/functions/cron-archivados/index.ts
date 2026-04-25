import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://domia-sigma.vercel.app'

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
    ${condominioNombre} · DOMIA Sistema de Administración
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:block;text-align:center;background:#1A7A4A;color:white;padding:12px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;font-family:'Nunito',sans-serif;margin-top:16px">${text}</a>`
}

serve(async () => {
  try {
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    // Get all archived condominios
    const { data: archivados, error } = await supabase
      .from('condominios')
      .select('id, nombre, email_contacto, admin_id, archivado_en')
      .eq('estado', 'archivado')
      .not('archivado_en', 'is', null)

    if (error) throw error
    if (!archivados || archivados.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No hay condominios archivados' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ahora = Date.now()
    let eliminados = 0
    let alertasEnviadas = 0

    for (const condo of archivados) {
      const diasArchivado = Math.floor((ahora - new Date(condo.archivado_en).getTime()) / (1000 * 60 * 60 * 24))
      const diasRestantes = 30 - diasArchivado

      // Get admin email for notifications
      let adminEmail = condo.email_contacto
      if (!adminEmail && condo.admin_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', condo.admin_id)
          .single()
        adminEmail = profile?.email
      }
      // Fallback: get super_admin email
      if (!adminEmail) {
        const { data: superAdmin } = await supabase
          .from('profiles')
          .select('email')
          .eq('rol', 'super_admin')
          .limit(1)
          .single()
        adminEmail = superAdmin?.email
      }

      const linkRestaurar = `${appUrl}/admin`

      // Auto-delete at day 30
      if (diasRestantes <= 0) {
        await supabase
          .from('condominios')
          .update({
            estado: 'eliminado',
            eliminado_en: new Date().toISOString(),
          })
          .eq('id', condo.id)

        eliminados++

        // Send final email
        if (resend && adminEmail) {
          const fecha = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
          try {
            await resend.emails.send({
              from: 'ALTRION <noreply@domia.me>',
              to: adminEmail,
              subject: `Condominio eliminado — ${condo.nombre}`,
              html: wrap(condo.nombre, `
                <h2 style="font-family:'Nunito',sans-serif;color:#B83232;margin:0 0 8px;font-size:18px">Condominio eliminado</h2>
                <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">El condominio <strong>${condo.nombre}</strong> fue eliminado automaticamente el ${fecha} tras 30 dias archivado.</p>
                <p style="color:#5E6B62;font-size:13px;margin:0">Los datos ya no son accesibles desde el portal.</p>
              `),
            })
          } catch (e) {
            console.error(`Email eliminacion ${adminEmail}:`, (e as Error).message)
          }
        }
        continue
      }

      // Send reminder emails at specific days
      const diasAlerta = [10, 3, 1] // quedan 10, 3, 1 días
      if (diasAlerta.includes(diasRestantes) && resend && adminEmail) {
        const urgencia = diasRestantes <= 3 ? '#B83232' : '#C07A2E'
        const asunto = diasRestantes <= 1
          ? `Ultimo aviso: mañana se elimina ${condo.nombre}`
          : `Quedan ${diasRestantes} dias para la eliminacion de ${condo.nombre}`

        try {
          await resend.emails.send({
            from: 'ALTRION <noreply@domia.me>',
            to: adminEmail,
            subject: asunto,
            html: wrap(condo.nombre, `
              <h2 style="font-family:'Nunito',sans-serif;color:${urgencia};margin:0 0 8px;font-size:18px">
                ${diasRestantes <= 1 ? 'Ultimo aviso' : `Quedan ${diasRestantes} dias`}
              </h2>
              <p style="color:#5E6B62;font-size:14px;margin:0 0 16px">
                ${diasRestantes <= 1
                  ? `Mañana se eliminara permanentemente el condominio <strong>${condo.nombre}</strong>.`
                  : `El condominio <strong>${condo.nombre}</strong> sera eliminado en ${diasRestantes} dias.`
                }
              </p>
              <p style="color:#5E6B62;font-size:13px;margin:0 0 16px">Si deseas conservarlo, restauralo ahora.</p>
              ${btn('Restaurar condominio →', linkRestaurar)}
            `),
          })
          alertasEnviadas++
        } catch (e) {
          console.error(`Email alerta ${adminEmail}:`, (e as Error).message)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        archivados: archivados.length,
        eliminados,
        alertasEnviadas,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
