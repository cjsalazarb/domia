import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PortalLayout from '@/components/layout/PortalLayout'

const PRIORIDADES = [
  { key: 'baja', label: 'Baja', color: '#1A7A4A', bg: '#E8F4F0' },
  { key: 'media', label: 'Media', color: '#C07A2E', bg: '#FEF9EC' },
  { key: 'alta', label: 'Alta', color: '#B83232', bg: '#FCEAEA' },
  { key: 'urgente', label: 'Urgente', color: '#B83232', bg: '#FCEAEA' },
]

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  asignado: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Asignado' },
  en_proceso: { bg: '#F5ECFF', text: '#7B1AC8', label: 'En proceso' },
  resuelto: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Resuelto' },
  cancelado: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelado' },
}

export default function SolicitarMantenimiento() {
  const { user, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch my tickets
  const { data: misTickets } = useQuery({
    queryKey: ['mis-mantenimientos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mantenimientos')
        .select('id, titulo, prioridad, estado, created_at')
        .eq('solicitado_por', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const crearMut = useMutation({
    mutationFn: async () => {
      let foto_url: string | undefined

      if (file && user) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        await supabase.storage.from('comprobantes').upload(path, file, { upsert: true })
        const { data } = supabase.storage.from('comprobantes').getPublicUrl(path)
        foto_url = data.publicUrl
      }

      const residente = profile?.condominio_id ? {
        condominio_id: profile.condominio_id,
      } : null

      if (!residente) throw new Error('Sin condominio asignado')

      const { error } = await supabase.from('mantenimientos').insert({
        condominio_id: residente.condominio_id,
        titulo,
        descripcion,
        prioridad,
        foto_url: foto_url || null,
        solicitado_por: user?.id,
        estado: 'pendiente',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-mantenimientos'] })
      setTitulo('')
      setDescripcion('')
      setPrioridad('media')
      setFile(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    },
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px',
    fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  }

  return (
    <PortalLayout title="Incidencias">
      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 24px' }}>Solicitar Mantenimiento</h1>

        {/* Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px', marginBottom: '24px' }}>
          {success && (
            <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1A7A4A', marginBottom: '16px' }}>
              Solicitud enviada correctamente. El administrador la revisará pronto.
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Fuga de agua en baño" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'} onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Descripción *</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} placeholder="Describe el problema con detalle..."
              style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#1A7A4A'} onBlur={e => e.target.style.borderColor = '#C8D4CB'} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px' }}>Prioridad</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PRIORIDADES.map(p => (
                <button key={p.key} onClick={() => setPrioridad(p.key)} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: prioridad === p.key ? `2px solid ${p.color}` : '1px solid #C8D4CB',
                  backgroundColor: prioridad === p.key ? p.bg : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: p.color, fontFamily: "'Inter', sans-serif",
                }}>{p.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>Foto (opcional)</label>
            <button onClick={() => fileRef.current?.click()} style={{
              padding: '10px 16px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: '1px dashed #C8D4CB', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>
              {file ? `📎 ${file.name}` : '📷 Adjuntar foto'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} style={{ display: 'none' }} />
          </div>

          <button onClick={() => crearMut.mutate()} disabled={!titulo || !descripcion || crearMut.isPending}
            style={{
              width: '100%', padding: '14px', backgroundColor: (!titulo || !descripcion || crearMut.isPending) ? '#C8D4CB' : '#1A7A4A',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
              cursor: (!titulo || !descripcion || crearMut.isPending) ? 'not-allowed' : 'pointer',
            }}>
            {crearMut.isPending ? 'Enviando...' : 'Enviar solicitud →'}
          </button>
        </div>

        {/* My tickets */}
        {misTickets && misTickets.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Mis solicitudes</h3>
            {misTickets.map(t => {
              const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE.pendiente
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '14px', color: '#0D1117' }}>{t.titulo}</div>
                    <div style={{ fontSize: '11px', color: '#5E6B62' }}>{new Date(t.created_at).toLocaleDateString('es-BO')}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
