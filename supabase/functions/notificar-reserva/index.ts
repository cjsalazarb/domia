import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resendApiKey = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tipo, reservaId, pdfBase64, pdfFilename, emailDestinatario, emailAsunto, emailHtml } = await req.json()

    if (!tipo || !reservaId) {
      return new Response(JSON.stringify({ error: 'tipo y reservaId son requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Upload PDF to Supabase Storage if provided
    let pdfUrl: string | null = null
    if (pdfBase64 && pdfFilename) {
      const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
      const storagePath = `reservas/${reservaId}/${pdfFilename}`

      const { error: uploadErr } = await supabase.storage
        .from('comprobantes')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadErr) {
        console.error('Error subiendo PDF:', uploadErr)
      } else {
        const { data: urlData } = supabase.storage
          .from('comprobantes')
          .getPublicUrl(storagePath)
        pdfUrl = urlData?.publicUrl || null
      }
    }

    // Send email via Resend
    if (resendApiKey && emailDestinatario && emailAsunto && emailHtml) {
      const resend = new Resend(resendApiKey)

      const emailPayload: Record<string, unknown> = {
        from: 'DOMIA <noreply@domia.me>',
        to: emailDestinatario,
        subject: emailAsunto,
        html: emailHtml,
      }

      // Attach PDF if available
      if (pdfBase64 && pdfFilename) {
        emailPayload.attachments = [{
          filename: pdfFilename,
          content: pdfBase64,
        }]
      }

      const { error: emailErr } = await resend.emails.send(emailPayload as Parameters<typeof resend.emails.send>[0])
      if (emailErr) {
        console.error('Error enviando email:', emailErr)
      }
    }

    return new Response(JSON.stringify({ success: true, pdfUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error en notificar-reserva:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
