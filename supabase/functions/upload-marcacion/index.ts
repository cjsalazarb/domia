import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const foto = formData.get('foto') as File | null
    const guardia_id = formData.get('guardia_id') as string
    const condominio_id = formData.get('condominio_id') as string
    const turno_id = formData.get('turno_id') as string | null
    const tipo = formData.get('tipo') as string // 'entrada' | 'salida'
    const latitud = formData.get('latitud') as string | null
    const longitud = formData.get('longitud') as string | null

    if (!guardia_id || !condominio_id || !tipo) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify guard exists and is active
    const { data: guardia, error: guardiaErr } = await supabase
      .from('guardias')
      .select('id')
      .eq('id', guardia_id)
      .eq('activo', true)
      .single()

    if (guardiaErr || !guardia) {
      return new Response(JSON.stringify({ error: 'Guardia no válido' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let foto_url: string | null = null

    // Upload photo if provided
    if (foto) {
      const timestamp = Date.now()
      const path = `marcaciones/${guardia_id}/${timestamp}.jpg`
      const arrayBuffer = await foto.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) {
        // Try creating bucket if it doesn't exist
        if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
          await supabase.storage.createBucket('comprobantes', { public: true })
          const { error: retryErr } = await supabase.storage
            .from('comprobantes')
            .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false })
          if (retryErr) throw retryErr
        } else {
          throw uploadError
        }
      }

      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
      foto_url = urlData.publicUrl
    }

    // Insert marcacion record
    const { error: insertError } = await supabase.from('marcaciones_guardia').insert({
      guardia_id,
      condominio_id,
      turno_id: turno_id || null,
      tipo,
      foto_url,
      latitud: latitud ? parseFloat(latitud) : null,
      longitud: longitud ? parseFloat(longitud) : null,
    })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ success: true, foto_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
