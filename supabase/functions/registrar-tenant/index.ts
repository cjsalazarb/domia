import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://app.domia.me'

function calcularPlan(totalUnidades: number): { plan: string; montoMensual: number } {
  if (totalUnidades <= 20) return { plan: 'basico', montoMensual: 150 }
  if (totalUnidades <= 50) return { plan: 'mediano', montoMensual: 250 }
  if (totalUnidades <= 100) return { plan: 'grande', montoMensual: 400 }
  return { plan: 'corporativo', montoMensual: 600 }
}

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
    const {
      nombre_empresa, nombre, apellido, email, telefono,
      nombre_condominio, tipo_propiedad, num_pisos, dptos_por_piso,
      total_casas, cuota_mensual, direccion_condominio,
      valor_mensual_saas, dia_cobro, duracion_meses,
    } = await req.json()

    if (!nombre_empresa || !nombre || !apellido || !email) {
      return fail('Campos requeridos: nombre_empresa, nombre, apellido, email')
    }

    // 1. Check if email already exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    if (users?.some(u => u.email === email)) {
      return fail(`El email ${email} ya tiene una cuenta registrada`)
    }

    // 2. Compute units and plan
    let totalUnidades = 0
    if (nombre_condominio) {
      if (tipo_propiedad === 'edificio') {
        totalUnidades = (num_pisos || 1) * (dptos_por_piso || 1)
      } else {
        totalUnidades = total_casas || 0
      }
    }
    const { plan, montoMensual } = calcularPlan(totalUnidades)
    const montoFinal = valor_mensual_saas || montoMensual
    const diaCobro = dia_cobro || 5
    const trialHasta = new Date(Date.now() + 14 * 86400000)
    // Calcular primer cobro: dia_cobro del mes siguiente al fin del trial
    const primerCobro = new Date(trialHasta)
    primerCobro.setDate(diaCobro)
    if (primerCobro <= trialHasta) {
      primerCobro.setMonth(primerCobro.getMonth() + 1)
    }

    // 3. Create tenant
    const fechaFinContrato = duracion_meses
      ? new Date(Date.now() + duracion_meses * 30 * 86400000).toISOString()
      : null
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        nombre: nombre_empresa,
        email,
        telefono: telefono || null,
        plan,
        estado: 'trial',
        trial_hasta: trialHasta.toISOString(),
        proximo_cobro: primerCobro.toISOString().split('T')[0],
        dia_cobro: diaCobro,
        total_unidades: totalUnidades,
        monto_mensual: montoFinal,
        ...(fechaFinContrato && { fecha_fin_contrato: fechaFinContrato }),
      })
      .select()
      .single()

    if (tenantErr || !tenant) {
      return fail(tenantErr?.message || 'Error creando tenant')
    }

    // 4. Generate temporary password
    const passwordTemporal = generarPasswordTemporal()

    // 5. Create auth user
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

    // 6. Create profile
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

    // 7. Create condominio + edificio + unidades if condominio data provided
    let condominioId: string | null = null
    if (nombre_condominio) {
      const { data: condo, error: condoErr } = await supabase
        .from('condominios')
        .insert({
          nombre: nombre_condominio,
          direccion: direccion_condominio || 'Por definir',
          ciudad: 'Santa Cruz de la Sierra',
          departamento: 'Santa Cruz',
          estado: 'activo',
          tenant_id: tenant.id,
          admin_id: userId,
        })
        .select()
        .single()

      if (condoErr) {
        console.error('Error creando condominio:', condoErr.message)
      } else {
        condominioId = condo.id
        const edificioNombre = tipo_propiedad === 'edificio' ? nombre_condominio : 'General'
        const pisos = tipo_propiedad === 'edificio' ? (num_pisos || 1) : 1

        const { data: edificio, error: edifErr } = await supabase
          .from('edificios')
          .insert({ condominio_id: condo.id, nombre: edificioNombre, numero_pisos: pisos })
          .select()
          .single()

        if (edifErr) {
          console.error('Error creando edificio:', edifErr.message)
        } else {
          const unidades: { edificio_id: string; condominio_id: string; numero: string; piso: number; tipo: string }[] = []

          if (tipo_propiedad === 'edificio') {
            for (let p = 1; p <= (num_pisos || 1); p++) {
              for (let d = 1; d <= (dptos_por_piso || 1); d++) {
                unidades.push({
                  edificio_id: edificio.id,
                  condominio_id: condo.id,
                  numero: `${p}${String(d).padStart(2, '0')}`,
                  piso: p,
                  tipo: 'apartamento',
                })
              }
            }
          } else {
            for (let c = 1; c <= (total_casas || 1); c++) {
              unidades.push({
                edificio_id: edificio.id,
                condominio_id: condo.id,
                numero: `Casa ${c}`,
                piso: 1,
                tipo: 'casa',
              })
            }
          }

          if (unidades.length > 0) {
            const { error: unidErr } = await supabase.from('unidades').insert(unidades)
            if (unidErr) console.error('Error creando unidades:', unidErr.message)
          }
        }

        // Update profile with condominio_id
        await supabase.from('profiles').update({ condominio_id: condo.id }).eq('id', userId)
      }
    }

    // 8. Send welcome email
    let emailSent = false
    let emailError: string | null = null
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      try {
        const emailResult = await resend.emails.send({
          from: 'ALTRION <noreply@domia.me>',
          to: email,
          subject: nombre_condominio
            ? `Bienvenido a DOMIA — ${nombre_condominio} esta listo`
            : 'Bienvenido a DOMIA — Tu prueba gratuita de 14 dias',
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
    ${nombre_condominio ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px">
      Su condominio <strong>${nombre_condominio}</strong> tiene <strong>${totalUnidades} unidades</strong> configuradas.
    </p>` : ''}
    <div style="background:#F8F9FA;border:1px solid #E0E0E0;border-radius:10px;padding:20px;margin-bottom:20px">
      <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;font-weight:600">Tus credenciales</div>
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr><td style="font-size:13px;color:#555;padding:4px 0;width:100px">Usuario:</td><td style="font-size:14px;color:#0D1117;font-weight:600">${email}</td></tr>
        <tr><td style="font-size:13px;color:#555;padding:4px 0">Contrasena:</td><td style="font-family:'Courier New',monospace;font-size:16px;color:#1A7A4A;font-weight:700;letter-spacing:1px">${passwordTemporal}</td></tr>
      </table>
    </div>
    <p style="color:#555;font-size:13px;line-height:1.5;margin:0 0 20px">Al ingresar debera crear su contrasena personal.</p>
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
        if (emailResult.error) {
          emailError = JSON.stringify(emailResult.error)
          console.error('Resend error:', emailError)
        } else {
          emailSent = true
          console.log('Email enviado exitosamente a:', email)
        }
      } catch (e) {
        emailError = (e as Error).message
        console.error('Error enviando email:', emailError)
      }
    } else {
      emailError = 'RESEND_API_KEY not configured'
      console.error(emailError)
    }

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenant.id, user_id: userId, condominio_id: condominioId, email_sent: emailSent }),
      { headers }
    )
  } catch (err) {
    return fail((err as Error).message || 'Error inesperado')
  }
})
