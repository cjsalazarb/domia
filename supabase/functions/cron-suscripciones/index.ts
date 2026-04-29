import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function notificar(tenantId: string, tipo: string) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/notificar-pago-suscripcion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ tenant_id: tenantId, tipo }),
    })
  } catch (e) {
    console.error(`Error notificando ${tipo} a ${tenantId}:`, (e as Error).message)
  }
}

serve(async () => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  const resultado = { recordatoriosPrevios: 0, recordatorios: 0, suspendidos: 0, cancelados: 0, trialsExpirados: 0 }

  try {
    // 1. Pre-payment reminders: active tenants with upcoming proximo_cobro
    const { data: proximosAPagar } = await supabase
      .from('tenants')
      .select('id, nombre, proximo_cobro')
      .eq('estado', 'activo')
      .not('proximo_cobro', 'is', null)
      .gte('proximo_cobro', hoyStr)

    for (const t of proximosAPagar || []) {
      const diasParaCobro = Math.ceil((new Date(t.proximo_cobro).getTime() - hoy.getTime()) / 86400000)
      if (diasParaCobro === 5 || diasParaCobro === 1 || diasParaCobro === 0) {
        await notificar(t.id, 'recordatorio')
        resultado.recordatoriosPrevios++
        console.log(`Recordatorio previo (${diasParaCobro}d): ${t.nombre}`)
      }
    }

    // 2. Overdue tenants: active with proximo_cobro < today
    const { data: activos } = await supabase
      .from('tenants')
      .select('id, nombre, proximo_cobro')
      .eq('estado', 'activo')
      .not('proximo_cobro', 'is', null)
      .lt('proximo_cobro', hoyStr)

    for (const t of activos || []) {
      const diasVencido = Math.floor((hoy.getTime() - new Date(t.proximo_cobro).getTime()) / 86400000)

      // Check if there's a pending payment — don't bother them if they already sent comprobante
      const { data: pendiente } = await supabase
        .from('pagos_suscripcion')
        .select('id')
        .eq('tenant_id', t.id)
        .eq('estado', 'pendiente')
        .limit(1)

      if (!pendiente || pendiente.length === 0) {
        // Only send reminders — NO auto-suspend. Maria del Carmen suspends manually.
        if (diasVencido === 1 || diasVencido === 3 || diasVencido === 5 || diasVencido === 10) {
          await notificar(t.id, 'recordatorio')
          resultado.recordatorios++
          console.log(`Recordatorio vencido (${diasVencido}d): ${t.nombre}`)
        }
      }
    }

    // 2. Check expired trials
    const { data: trials } = await supabase
      .from('tenants')
      .select('id, nombre, trial_hasta')
      .eq('estado', 'trial')
      .not('trial_hasta', 'is', null)
      .lt('trial_hasta', hoy.toISOString())

    for (const t of trials || []) {
      // Check if there's a pending or verified payment
      const { data: pagos } = await supabase
        .from('pagos_suscripcion')
        .select('id')
        .eq('tenant_id', t.id)
        .in('estado', ['pendiente', 'verificado'])
        .limit(1)

      if (!pagos || pagos.length === 0) {
        // Don't auto-suspend — just send reminder. Maria del Carmen suspends manually.
        await notificar(t.id, 'recordatorio')
        resultado.trialsExpirados++
        console.log(`Trial expirado — recordatorio enviado: ${t.nombre}`)
      }
    }

    console.log('Cron suscripciones completado:', resultado)
    return new Response(JSON.stringify({ success: true, ...resultado }), { headers })
  } catch (err) {
    console.error('Error cron:', (err as Error).message)
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), { headers })
  }
})
