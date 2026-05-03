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

const BUCKET = 'selfies-guardias'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { imagen_base64, guardia_id, condominio_id, tipo, gps_lat, gps_lng, turno_id } = body

    if (!guardia_id || !condominio_id || !tipo) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos requeridos: guardia_id, condominio_id, tipo' }), {
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
      return new Response(JSON.stringify({ success: false, error: 'Guardia no válido o inactivo' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let foto_url: string | null = null

    if (imagen_base64) {
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((b: any) => b.name === BUCKET)
      if (!bucketExists) {
        await supabase.storage.createBucket(BUCKET, { public: false })
      }

      // Decode base64 to bytes
      const base64Clean = imagen_base64.replace(/^data:image\/\w+;base64,/, '')
      const binaryStr = atob(base64Clean)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const timestamp = Date.now()
      const path = `${condominio_id}/${guardia_id}/${tipo}-${timestamp}.jpg`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) {
        return new Response(JSON.stringify({ success: false, error: `Error al subir imagen: ${uploadError.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Generate signed URL (private bucket, 1 year expiry)
      const { data: urlData } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      foto_url = urlData?.signedUrl || null
    }

    // Insert marcacion record
    const { error: insertError } = await supabase.from('marcaciones_guardia').insert({
      guardia_id,
      condominio_id,
      turno_id: turno_id || null,
      tipo,
      foto_url,
      latitud: gps_lat ?? null,
      longitud: gps_lng ?? null,
    })

    if (insertError) {
      return new Response(JSON.stringify({ success: false, error: `Error al guardar registro: ${insertError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, foto_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
