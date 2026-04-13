import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { templateAvisoGeneral } from '@/lib/emailTemplates'

interface Props {
  condominioId: string
  condominioNombre: string
}

type Destinatario = 'todos' | 'propietarios' | 'inquilinos'

const PLANTILLAS = [
  { emoji: '\uD83D\uDCC5', titulo: 'Corte de agua programado', cuerpo: 'Estimados residentes, se informa que el dia [FECHA] se realizara un corte programado de agua de [HORA] a [HORA] por trabajos de mantenimiento. Les pedimos tomar las previsiones necesarias.' },
  { emoji: '\uD83D\uDD27', titulo: 'Mantenimiento en areas comunes', cuerpo: 'Estimados residentes, les informamos que se realizaran trabajos de mantenimiento en [AREA] el dia [FECHA]. Pedimos disculpas por las molestias.' },
  { emoji: '\uD83D\uDCCB', titulo: 'Convocatoria a asamblea', cuerpo: 'Estimados propietarios, se convoca a la Asamblea Ordinaria de Propietarios del condominio para el dia [FECHA] a horas [HORA] en [LUGAR]. Orden del dia: 1. Lectura del acta anterior 2. Informe financiero 3. Varios' },
  { emoji: '\uD83D\uDCB0', titulo: 'Recordatorio de pago', cuerpo: 'Estimado(a) residente, le recordamos que su cuota de mantenimiento del mes actual se encuentra pendiente de pago. Le solicitamos regularizar su situacion a la brevedad.' },
  { emoji: '\uD83C\uDF89', titulo: 'Comunicado general', cuerpo: '' },
]

export default function EnviarAviso({ condominioId, condominioNombre }: Props) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [destinatarios, setDestinatarios] = useState<Destinatario>('todos')
  const [showPreview, setShowPreview] = useState(false)

  // Historial de notificaciones
  const { data: historial, isLoading: historialLoading } = useQuery({
    queryKey: ['notificaciones-historial', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('id, titulo, cuerpo, tipo, created_at, destinatario_id')
        .eq('condominio_id', condominioId)
        .eq('tipo', 'aviso_general')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data
    },
    enabled: !!condominioId,
  })

  const enviarMut = useMutation({
    mutationFn: async () => {
      // Get target residents
      let query = supabase
        .from('residentes')
        .select('id, nombre, apellido, email, user_id, tipo')
        .eq('condominio_id', condominioId)
        .eq('estado', 'activo')

      if (destinatarios === 'propietarios') query = query.eq('tipo', 'propietario')
      if (destinatarios === 'inquilinos') query = query.eq('tipo', 'inquilino')

      const { data: residentes, error: resErr } = await query
      if (resErr) throw resErr

      const fecha = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

      // Insert notification for each resident (or general if no specific target)
      const notificaciones = (residentes || []).map(r => ({
        condominio_id: condominioId,
        titulo,
        cuerpo,
        tipo: 'aviso_general',
        destinatario_id: r.user_id,
        enviado_por: user?.id,
      }))

      // Also insert one general notification without specific destinatario
      if (notificaciones.length === 0) {
        notificaciones.push({
          condominio_id: condominioId,
          titulo,
          cuerpo,
          tipo: 'aviso_general',
          destinatario_id: null,
          enviado_por: user?.id || undefined,
        })
      }

      const { error: notifErr } = await supabase.from('notificaciones').insert(notificaciones)
      if (notifErr) throw notifErr

      // Generate email HTML (for reference — actual sending needs Resend API key)
      const _emailHtml = templateAvisoGeneral(titulo, cuerpo, condominioNombre, fecha)

      return { enviados: residentes?.length || 0, emailHtml: _emailHtml }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones-historial', condominioId] })
      setTitulo('')
      setCuerpo('')
      setShowPreview(false)
    },
  })

  const fecha = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
  const previewHtml = templateAvisoGeneral(titulo || 'Título del aviso', cuerpo || 'Contenido del aviso...', condominioNombre, fecha)

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #C8D4CB',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0D1117',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  return (
    <div>
      {/* Compose */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Enviar Aviso
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '16px' }}>
          Notifica a los residentes del condominio
        </p>

        {/* Plantillas */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
            Plantillas rapidas
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PLANTILLAS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setTitulo(p.titulo); setCuerpo(p.cuerpo) }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: titulo === p.titulo ? '2px solid #1A7A4A' : '1px solid #C8D4CB',
                  backgroundColor: titulo === p.titulo ? '#E8F4F0' : 'white',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: titulo === p.titulo ? '#1A7A4A' : '#0D1117',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '16px' }}>{p.emoji}</span>
                {p.titulo}
              </button>
            ))}
          </div>
        </div>

        {/* Success */}
        {enviarMut.isSuccess && (
          <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1A7A4A', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
            Aviso enviado correctamente a {(enviarMut.data as { enviados: number })?.enviados || 0} residente(s)
          </div>
        )}

        {/* Destinatarios */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
            Destinatarios
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {([
              { key: 'todos', label: '👥 Todos', desc: 'Propietarios e inquilinos' },
              { key: 'propietarios', label: '🏠 Propietarios', desc: 'Solo propietarios' },
              { key: 'inquilinos', label: '📋 Inquilinos', desc: 'Solo inquilinos' },
            ] as const).map(d => (
              <button
                key={d.key}
                onClick={() => setDestinatarios(d.key)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: destinatarios === d.key ? '2px solid #1A7A4A' : '1px solid #C8D4CB',
                  backgroundColor: destinatarios === d.key ? '#E8F4F0' : 'white',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  color: destinatarios === d.key ? '#1A7A4A' : '#5E6B62',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>{d.label}</div>
                <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
            Título
          </label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej: Corte de agua programado"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#1A7A4A'}
            onBlur={e => e.target.style.borderColor = '#C8D4CB'}
          />
        </div>

        {/* Cuerpo */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
            Mensaje
          </label>
          <textarea
            value={cuerpo}
            onChange={e => setCuerpo(e.target.value)}
            placeholder="Escribe el contenido del aviso..."
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#1A7A4A'}
            onBlur={e => e.target.style.borderColor = '#C8D4CB'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={!titulo && !cuerpo}
            style={{
              padding: '10px 20px',
              backgroundColor: '#EBF4FF',
              color: '#0D4A8F',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: !titulo && !cuerpo ? 'not-allowed' : 'pointer',
              opacity: !titulo && !cuerpo ? 0.5 : 1,
            }}
          >
            {showPreview ? '✕ Cerrar preview' : '👁 Preview email'}
          </button>
          <button
            onClick={() => enviarMut.mutate()}
            disabled={!titulo || !cuerpo || enviarMut.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: (!titulo || !cuerpo || enviarMut.isPending) ? '#C8D4CB' : '#1A7A4A',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: (!titulo || !cuerpo || enviarMut.isPending) ? 'not-allowed' : 'pointer',
            }}
          >
            {enviarMut.isPending ? 'Enviando...' : 'Enviar aviso →'}
          </button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={{ marginTop: '20px', border: '1px solid #C8D4CB', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#F4F7F5', padding: '8px 16px', fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview del email
            </div>
            <div
              style={{ padding: '0', maxHeight: '400px', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>

      {/* Historial */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Historial de Avisos
        </h3>

        {historialLoading ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>
        ) : !historial || historial.length === 0 ? (
          <div style={{ color: '#5E6B62', fontSize: '14px', fontFamily: "'Inter', sans-serif", textAlign: 'center', padding: '20px' }}>
            No se han enviado avisos todavía
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historial.map(n => (
              <div key={n.id} style={{
                padding: '14px',
                backgroundColor: '#FAFBFA',
                borderRadius: '10px',
                fontFamily: "'Inter', sans-serif",
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>
                    {n.titulo}
                  </div>
                  <span style={{ fontSize: '11px', color: '#5E6B62', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {new Date(n.created_at).toLocaleDateString('es-BO')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#5E6B62', marginTop: '4px', lineHeight: 1.5 }}>
                  {n.cuerpo.length > 120 ? n.cuerpo.slice(0, 120) + '...' : n.cuerpo}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 500,
                    backgroundColor: n.destinatario_id ? '#F5ECFF' : '#E8F4F0',
                    color: n.destinatario_id ? '#7B1AC8' : '#1A7A4A',
                  }}>
                    {n.destinatario_id ? 'Individual' : 'General'}
                  </span>
                  <button
                    onClick={() => {
                      setTitulo(n.titulo)
                      setCuerpo(n.cuerpo)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #C8D4CB',
                      backgroundColor: 'white',
                      color: '#1A7A4A',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Reenviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
