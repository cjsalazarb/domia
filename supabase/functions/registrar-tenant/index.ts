import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://app.domia.me'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    })
  }

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  const fail = (error: string) => new Response(JSON.stringify({ success: false, error }), { headers })

  try {
    const { nombre_empresa, nombre, apellido, email, telefono } = await req.json()

    if (!nombre_empresa || !nombre || !apellido || !email) {
      return fail('Campos requeridos: nombre_empresa, nombre, apellido, email')
    }

    // 1. Check if email already exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    if (users?.some(u => u.email === email)) {
      return fail(`El email ${email} ya tiene una cuenta registrada`)
    }

    // 2. Create tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        nombre: nombre_empresa,
        email,
        telefono: telefono || null,
        plan: 'basico',
        estado: 'trial',
        trial_hasta: new Date(Date.now() + 14 * 86400000).toISOString(),
        monto_mensual: 150,
      })
      .select()
      .single()

    if (tenantErr || !tenant) {
      return fail(tenantErr?.message || 'Error creando tenant')
    }

    // 3. Generate temporary password
    const passwordTemporal = generarPasswordTemporal()

    // 4. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: { nombre, apellido, rol: 'tenant_admin', tenant_id: tenant.id },
    })

    if (authError || !authData.user) {
      // Rollback tenant
      await supabase.from('tenants').delete().eq('id', tenant.id)
      return fail(authError?.message || 'Error creando usuario')
    }

    const userId = authData.user.id

    // 5. Create profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        rol: 'tenant_admin',
        nombre,
        apellido,
        email,
        tenant_id: tenant.id,
        activo: true,
      }, { onConflict: 'id' })

    if (profileErr) {
      console.error('Error creando perfil:', profileErr.message)
    }

    // 6. Send welcome email
    let emailSent = false
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      try {
        const result = await resend.emails.send({
          from: 'DOMIA <noreply@domia.me>',
          to: email,
          subject: 'Bienvenido a DOMIA — Tu prueba gratuita de 14 dias',
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
    <h2 style="font-family:'Nunito',sans-serif;color:#0D1117;margin:0 0 8px;font-size:20px">
      Bienvenido/a ${nombre} ${apellido}
    </h2>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px">
      Tu cuenta para <strong>${nombre_empresa}</strong> ha sido creada.
      Tienes <strong>14 dias de prueba gratuita</strong> para explorar todas las funcionalidades.
    </p>
    <div style="background:#F8F9FA;border:1px solid #E0E0E0;border-radius:10px;padding:20px;margin-bottom:20px">
      <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;font-weight:600">Tus credenciales</div>
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr><td style="font-size:13px;color:#555;padding:4px 0;width:100px">Usuario:</td><td style="font-size:14px;color:#0D1117;font-weight:600">${email}</td></tr>
        <tr><td style="font-size:13px;color:#555;padding:4px 0">Contrasena:</td><td style="font-family:'Courier New',monospace;font-size:16px;color:#1A7A4A;font-weight:700;letter-spacing:1px">${passwordTemporal}</td></tr>
      </table>
    </div>
    <a href="${appUrl}/login" style="display:block;text-align:center;background:#1A7A4A;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Nunito',sans-serif">
      Ingresar a DOMIA →
    </a>
  </td></tr>
  <tr><td style="padding:16px 0;text-align:center;font-size:11px;color:#999">
    DOMIA · Administracion de Condominios · Bolivia
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
        })
        if (!result.error) emailSent = true
      } catch (e) {
        console.error('Error enviando email:', (e as Error).message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenant.id, user_id: userId, email_sent: emailSent }),
      { headers }
    )
  } catch (err) {
    return fail((err as Error).message || 'Error inesperado')
  }
})
