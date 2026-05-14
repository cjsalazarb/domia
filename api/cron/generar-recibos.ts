import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({ error: 'Server misconfigured — missing Supabase env vars' })
  }

  try {
    // Get today's day in Bolivia timezone (UTC-4)
    const nowBolivia = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const boliviaDay = nowBolivia.getDate()
    const lastDayOfMonth = new Date(nowBolivia.getFullYear(), nowBolivia.getMonth() + 1, 0).getDate()

    // Short-month handling: if today is the last day of a month shorter than 28 days
    // (only Feb can be < 28), also fire condominios configured for days past the month end.
    // In practice dia_generacion_recibos is capped at 28, but the guard is kept for safety.
    const dayFilter = (boliviaDay === lastDayOfMonth && boliviaDay < 28)
      ? `dia_generacion_recibos=gte.${boliviaDay}`
      : `dia_generacion_recibos=eq.${boliviaDay}`

    // Fetch condominios whose generation day matches today (via Supabase REST API)
    const condosRes = await fetch(
      `${SUPABASE_URL}/rest/v1/condominios?select=id,nombre,dia_generacion_recibos&estado=eq.activo&${dayFilter}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (!condosRes.ok) {
      const err = await condosRes.text()
      console.error('[cron] Failed to fetch condominios:', err)
      return res.status(502).json({ ok: false, error: `Failed to fetch condominios: ${err}` })
    }

    const condominios: Array<{ id: string; nombre: string; dia_generacion_recibos: number }> =
      await condosRes.json()

    if (!condominios || condominios.length === 0) {
      console.log(`[cron] No condominios scheduled for Bolivia day ${boliviaDay}`)
      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        boliviaDay,
        condominios: 0,
      })
    }

    console.log(`[cron] Bolivia day: ${boliviaDay} — processing ${condominios.length} condominio(s)`)

    const results = []
    const errors = []

    for (const condo of condominios) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generar-recibos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ condominio_id: condo.id }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          console.error(`[cron] generar-recibos failed for ${condo.nombre} (${response.status}):`, data)
          errors.push({ condominio: condo.nombre, status: response.status, error: data })
        } else {
          console.log(`[cron] generar-recibos OK for ${condo.nombre}:`, data)
          results.push({ condominio: condo.nombre, ...data })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[cron] generar-recibos exception for ${condo.nombre}:`, message)
        errors.push({ condominio: condo.nombre, error: message })
      }
    }

    return res.status(200).json({
      ok: errors.length === 0,
      timestamp: new Date().toISOString(),
      boliviaDay,
      condominios: condominios.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron] generar-recibos exception:', message)
    return res.status(500).json({ ok: false, error: message })
  }
}
