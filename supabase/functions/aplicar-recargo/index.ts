import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async () => {
  try {
    // Get all vencido recibos
    const { data: recibos, error: fetchErr } = await supabase
      .from('recibos')
      .select('id, monto_base, monto_recargo, condominio_id, residente_id, unidades(numero), residentes(nombre, user_id)')
      .eq('estado', 'vencido')

    if (fetchErr) {
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get recargo % per condominio
    const condoIds = [...new Set((recibos || []).map(r => r.condominio_id))]
    const { data: condominios } = await supabase
      .from('condominios')
      .select('id, recargo_mora_porcentaje')
      .in('id', condoIds)

    const recargoMap: Record<string, number> = {}
    for (const c of condominios || []) {
      recargoMap[c.id] = c.recargo_mora_porcentaje || 2.00
    }

    let aplicados = 0
    let montoTotalRecargo = 0

    for (const recibo of recibos || []) {
      const porcentaje = recargoMap[recibo.condominio_id] || 2.00
      const recargo = Number(recibo.monto_base) * (porcentaje / 100)

      const { error: updateErr } = await supabase
        .from('recibos')
        .update({ monto_recargo: Number(recibo.monto_recargo) + recargo })
        .eq('id', recibo.id)

      if (updateErr) continue

      aplicados++
      montoTotalRecargo += recargo

      // Notify resident
      const residente = recibo.residentes as { nombre: string; user_id: string | null } | null
      const unidadNum = (recibo.unidades as { numero: string })?.numero || '—'

      if (residente?.user_id) {
        await supabase.from('notificaciones').insert({
          condominio_id: recibo.condominio_id,
          titulo: 'Recargo por mora aplicado',
          cuerpo: `Se aplicó un recargo de Bs. ${recargo.toFixed(2)} (${porcentaje}%) a tu recibo de la Unidad ${unidadNum}. Total actualizado: Bs. ${(Number(recibo.monto_base) + Number(recibo.monto_recargo) + recargo).toFixed(2)}.`,
          tipo: 'recargo_mora',
          destinatario_id: residente.user_id,
        }).catch(() => {})
      }
    }

    return new Response(JSON.stringify({
      success: true,
      recibosConRecargo: aplicados,
      montoTotalRecargo: montoTotalRecargo.toFixed(2),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
