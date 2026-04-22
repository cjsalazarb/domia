import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://domia-sigma.vercel.app'

function generarPasswordTemporal(): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numeros = '23456789'
  const especiales = '#!@$%&'

  let pw = ''
  for (let i = 0; i < 2; i++) pw += mayusculas[Math.floor(Math.random() * mayusculas.length)]
  for (let i = 0; i < 4; i++) pw += numeros[Math.floor(Math.random() * numeros.length)]
  for (let i = 0; i < 2; i++) pw += especiales[Math.floor(Math.random() * especiales.length)]
  return pw
}

function emailHtml(
  nombre: string, apellido: string, email: string,
  password: string, condominioNombre: string
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
          <td style="font-family:'Courier New',monospace;font-size:16px;color:#1A4A7A;font-weight:700;padding:4px 0;letter-spacing:1px">${password}</td>
        </tr>
      </table>
    </div>
    <a href="${appUrl}/portal" style="display:block;text-align:center;background:#1A4A7A;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Nunito',sans-serif">
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

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  const fail = (error: string) => new Response(JSON.stringify({ success: false, error }), { headers })

  try {
    const {
      email, nombre, apellido, tipo, condominio_id, condominio_nombre,
      residente_id, guardia_id,
    } = await req.json()

    const entityId = residente_id || guardia_id
    if (!email || !nombre || !apellido || !tipo || !condominio_id || !entityId) {
      return fail('Campos requeridos: email, nombre, apellido, tipo, condominio_id, residente_id o guardia_id')
    }

    // 1. Check if email already exists in auth
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
    const emailExists = existingUsers?.some(u => u.email === email)
    if (emailExists) {
      return fail(`El email ${email} ya tiene una cuenta registrada`)
    }

    // 2. Generate temporary password
    const passwordTemporal = generarPasswordTemporal()

    // 3. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: passwordTemporal,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return fail(authError?.message || 'Error creando usuario en auth')
    }

    const userId = authData.user.id

    // 4. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        rol: tipo,
        nombre,
        apellido,
        email,
        condominio_id,
        activo: true,
      })

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      return fail(`Error creando perfil: ${profileError.message}`)
    }

    // 5. Create residentes_auth record
    const authRecord: Record<string, unknown> = {
      user_id: userId,
      debe_cambiar_password: true,
    }
    if (residente_id) authRecord.residente_id = residente_id
    if (guardia_id) authRecord.guardia_id = guardia_id

    const { error: raError } = await supabase
      .from('residentes_auth')
      .insert(authRecord)

    if (raError) {
      console.error('Error creando residentes_auth:', raError.message)
    }

    // 6. Update entity user_id
    if (residente_id) {
      await supabase.from('residentes').update({ user_id: userId }).eq('id', residente_id)
    }
    if (guardia_id) {
      await supabase.from('guardias').update({ user_id: userId }).eq('id', guardia_id)
    }

    // 7. Send welcome email via Resend
    let emailSent = false
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      try {
        await resend.emails.send({
          from: 'ALTRION <noreply@domia.bo>',
          to: email,
          subject: `Bienvenido a DOMIA — Sus credenciales | ${condominio_nombre || 'Su Condominio'}`,
          html: emailHtml(nombre, apellido, email, passwordTemporal, condominio_nombre || 'Su Condominio'),
        })
        emailSent = true
      } catch (emailErr) {
        console.error('Error enviando email:', (emailErr as Error).message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email_sent: emailSent }),
      { headers }
    )
  } catch (err) {
    return fail((err as Error).message || 'Error inesperado en la función')
  }
})
