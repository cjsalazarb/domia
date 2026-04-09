import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async () => {
  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Find recibos emitidos with fecha_vencimiento <= today
    const { data: recibos, error: fetchErr } = await supabase
      .from('recibos')
      .select(`
        id, periodo, monto_total, fecha_vencimiento, residente_id,
        unidades(numero),
        residentes(nombre, apellido, email, user_id),
        condominios(nombre)
      `)
      .eq('estado', 'emitido')
      .lte('fecha_vencimiento', hoy)

    if (fetchErr) {
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    let actualizados = 0
    let notificados = 0

    for (const recibo of recibos || []) {
      // Update estado to 'vencido'
      const { error: updateErr } = await supabase
        .from('recibos')
        .update({ estado: 'vencido' })
        .eq('id', recibo.id)

      if (updateErr) continue
      actualizados++

      // Calculate days overdue
      const vencimiento = new Date(recibo.fecha_vencimiento + 'T00:00:00')
      const ahora = new Date(hoy + 'T00:00:00')
      const diasAtraso = Math.floor((ahora.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24))

      const residente = recibo.residentes as { nombre: string; apellido: string; email: string | null; user_id: string | null } | null
      const condoNombre = (recibo.condominios as { nombre: string })?.nombre || 'Tu condominio'
      const unidadNum = (recibo.unidades as { numero: string })?.numero || '—'

      // Create in-app notification
      if (residente?.user_id) {
        await supabase.from('notificaciones').insert({
          condominio_id: (recibo as any).condominio_id || null,
          titulo: 'Pago pendiente — recibo vencido',
          cuerpo: `Tu recibo de Bs. ${Number(recibo.monto_total).toFixed(2)} (Unidad ${unidadNum}) venció hace ${diasAtraso} día${diasAtraso !== 1 ? 's' : ''}. Paga lo antes posible para evitar recargos.`,
          tipo: 'recordatorio_mora',
          destinatario_id: residente.user_id,
        }).catch(() => {}) // non-blocking
      }

      notificados++
    }

    return new Response(JSON.stringify({
      success: true,
      fecha: hoy,
      recibosVencidos: actualizados,
      notificacionesEnviadas: notificados,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
