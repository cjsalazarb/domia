import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const appUrl = Deno.env.get('APP_URL') || 'https://domia-sigma.vercel.app'

serve(async () => {
  try {
    const hoy = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
    const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), 10).toISOString().split('T')[0]

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const mesLabel = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`

    // Get active units with their cuota and active resident (pagador)
    const { data: unidades, error: unidadesErr } = await supabase
      .from('unidades')
      .select(`
        id, numero, tipo, condominio_id, pagador_cuota,
        condominios(nombre),
        residentes(id, nombre, apellido, email, tipo)
      `)
      .eq('activa', true)

    if (unidadesErr) {
      return new Response(JSON.stringify({ success: false, error: unidadesErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get cuotas indexed by condominio + tipo_unidad
    const { data: cuotas } = await supabase
      .from('cuotas')
      .select('condominio_id, tipo_unidad, monto')
      .eq('activa', true)
      .order('vigente_desde', { ascending: false })

    const cuotaMap: Record<string, number> = {}
    for (const c of cuotas || []) {
      const key = `${c.condominio_id}:${c.tipo_unidad}`
      if (!cuotaMap[key]) cuotaMap[key] = c.monto // most recent first
    }

    let generados = 0
    let omitidos = 0
    const errores: string[] = []

    // Initialize Resend only if API key is configured
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    for (const unidad of unidades || []) {
      try {
        // Find the cuota for this unit type
        const cuotaKey = `${unidad.condominio_id}:${unidad.tipo}`
        const monto = cuotaMap[cuotaKey]
        if (!monto) {
          omitidos++
          continue
        }

        // Find the resident who should pay
        const residentes = unidad.residentes as Array<{
          id: string; nombre: string; apellido: string; email: string | null; tipo: string
        }> || []

        const residente = residentes.find(r => r.tipo === unidad.pagador_cuota) || residentes[0]
        if (!residente) {
          omitidos++
          continue
        }

        // Check if receipt already exists for this period
        const { data: existente } = await supabase
          .from('recibos')
          .select('id')
          .eq('unidad_id', unidad.id)
          .eq('periodo', primerDiaMes)
          .single()

        if (existente) {
          omitidos++
          continue
        }

        // Create receipt
        const { data: recibo, error: reciboErr } = await supabase
          .from('recibos')
          .insert({
            unidad_id: unidad.id,
            condominio_id: unidad.condominio_id,
            residente_id: residente.id,
            periodo: primerDiaMes,
            monto_base: monto,
            monto_recargo: 0,
            fecha_vencimiento: fechaVencimiento,
            estado: 'emitido',
          })
          .select()
          .single()

        if (reciboErr) {
          errores.push(`Unidad ${unidad.numero}: ${reciboErr.message}`)
          continue
        }

        // Send email notification via Resend (if configured)
        if (resend && residente.email && recibo) {
          const condoNombre = (unidad.condominios as { nombre: string })?.nombre || 'Tu condominio'

          try {
            await resend.emails.send({
              from: 'ALTRION <noreply@domia.me>',
              to: residente.email,
              subject: `Recibo de mantenimiento ${mesLabel} — ${condoNombre}`,
              html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                  <div style="background: linear-gradient(to right, #1A7A4A, #0D9E6E); padding: 20px 24px; border-radius: 12px 12px 0 0;">
                    <span style="font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 800; color: white;">
                      DOMIA
                    </span>
                  </div>
                  <div style="padding: 24px; background: white; border: 1px solid #E8F4F0; border-radius: 0 0 12px 12px;">
                    <h2 style="font-family: 'Nunito', sans-serif; color: #0D1117; margin: 0 0 8px;">
                      Hola ${residente.nombre},
                    </h2>
                    <p style="color: #5E6B62; font-size: 14px; margin: 0 0 16px;">
                      Se ha generado tu recibo de mantenimiento para <strong>${mesLabel}</strong>.
                    </p>
                    <div style="background: #F4F7F5; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #5E6B62; font-size: 13px;">Unidad ${unidad.numero}</span>
                        <span style="font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 800; color: #1A7A4A;">
                          Bs. ${monto.toFixed(2)}
                        </span>
                      </div>
                      <div style="color: #5E6B62; font-size: 12px; margin-top: 4px;">
                        Vence: ${fechaVencimiento}
                      </div>
                    </div>
                    <a href="${appUrl}/portal/recibos" style="display: block; text-align: center; background: #1A7A4A; color: white; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
                      Ver recibo →
                    </a>
                    <p style="color: #5E6B62; font-size: 11px; margin: 16px 0 0; text-align: center;">
                      ${condoNombre} · DOMIA Sistema de Administración
                    </p>
                  </div>
                </div>
              `,
            })
          } catch (emailErr) {
            // Don't fail the whole process if email fails
            errores.push(`Email ${residente.email}: ${(emailErr as Error).message}`)
          }
        }

        generados++
      } catch (unitErr) {
        errores.push(`Unidad ${unidad.numero}: ${(unitErr as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        periodo: primerDiaMes,
        fechaVencimiento,
        generados,
        omitidos,
        errores: errores.length > 0 ? errores : undefined,
        emailsEnabled: !!resend,
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
