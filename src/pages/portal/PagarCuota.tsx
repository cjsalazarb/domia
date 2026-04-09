import { useState, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

const METODOS = [
  { key: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { key: 'qr', label: 'QR', icon: '📱' },
  { key: 'deposito', label: 'Depósito', icon: '💵' },
  { key: 'efectivo', label: 'Efectivo', icon: '💰' },
]

export default function PagarCuota() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [metodo, setMetodo] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Fetch pending recibos for this resident
  const { data: recibos, isLoading } = useQuery({
    queryKey: ['mis-recibos', user?.id],
    queryFn: async () => {
      // Get residente record
      const { data: residente } = await supabase
        .from('residentes')
        .select('id')
        .eq('user_id', user!.id)
        .eq('estado', 'activo')
        .single()

      if (!residente) return []

      const { data, error } = await supabase
        .from('recibos')
        .select('*, unidades(numero, tipo), condominios(nombre)')
        .eq('residente_id', residente.id)
        .in('estado', ['emitido', 'vencido'])
        .order('periodo', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const [selectedRecibo, setSelectedRecibo] = useState<string>('')

  const handleFile = useCallback((f: File) => {
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!selectedRecibo || !metodo || !file || !user) return

    setUploading(true)
    setError('')

    try {
      // Upload to storage
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${selectedRecibo}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(path)

      // Get residente id
      const { data: residente } = await supabase
        .from('residentes')
        .select('id, condominio_id')
        .eq('user_id', user.id)
        .single()

      if (!residente) throw new Error('Residente no encontrado')

      // Insert pago
      const recibo = recibos?.find(r => r.id === selectedRecibo)
      const { error: pagoError } = await supabase.from('pagos').insert({
        recibo_id: selectedRecibo,
        residente_id: residente.id,
        condominio_id: residente.condominio_id,
        monto: recibo?.monto_total || 0,
        metodo: metodo,
        fecha_pago: new Date().toISOString().split('T')[0],
        comprobante_url: urlData.publicUrl,
      })

      if (pagoError) throw pagoError

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar comprobante')
    }
    setUploading(false)
  }

  const reciboSeleccionado = recibos?.find(r => r.id === selectedRecibo)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)',
        padding: '20px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>
            DOM<span style={{ opacity: 0.9 }}>IA</span>
          </span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Portal Residente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button
            onClick={() => { signOut(); navigate('/login') }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
          ← Volver al portal
        </button>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Pagar Cuota
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Sube tu comprobante de pago para confirmación
        </p>

        {success ? (
          /* Success */
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
              Comprobante enviado
            </h2>
            <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
              Pendiente de confirmación por el administrador.
            </p>
            <button onClick={() => navigate('/portal')} style={{ padding: '12px 24px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
              Volver al portal
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#5E6B62' }}>Cargando recibos...</div>
            ) : recibos && recibos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#5E6B62' }}>
                No tienes recibos pendientes de pago.
              </div>
            ) : (
              <>
                {/* Select recibo */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>
                    Selecciona el recibo
                  </label>
                  <select
                    value={selectedRecibo}
                    onChange={e => setSelectedRecibo(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                  >
                    <option value="">— Seleccionar —</option>
                    {recibos?.map(r => {
                      const d = new Date(r.periodo + 'T00:00:00')
                      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                      return (
                        <option key={r.id} value={r.id}>
                          {r.unidades?.numero} — {meses[d.getMonth()]} {d.getFullYear()} — Bs. {Number(r.monto_total).toFixed(2)} ({r.estado})
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Recibo detail */}
                {reciboSeleccionado && (
                  <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62' }}>Total a pagar</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#1A7A4A' }}>
                        Bs. {Number(reciboSeleccionado.monto_total).toFixed(2)}
                      </span>
                    </div>
                    {reciboSeleccionado.estado === 'vencido' && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#B83232', backgroundColor: '#FCEAEA', padding: '6px 10px', borderRadius: '6px' }}>
                        Recibo vencido — incluye recargo
                      </div>
                    )}
                  </div>
                )}

                {/* Método de pago */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px' }}>
                    Método de pago
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {METODOS.map(m => (
                      <button
                        key={m.key}
                        onClick={() => setMetodo(m.key)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: metodo === m.key ? '2px solid #1A7A4A' : '1px solid #C8D4CB',
                          backgroundColor: metodo === m.key ? '#E8F4F0' : 'white',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '13px',
                          color: '#0D1117',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload comprobante */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '8px' }}>
                    Comprobante de pago
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${dragOver ? '#1A7A4A' : '#C8D4CB'}`,
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: dragOver ? '#E8F4F0' : '#FAFBFA',
                      transition: 'all 0.2s',
                    }}
                  >
                    {file ? (
                      <div>
                        {preview && (
                          <img src={preview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', marginBottom: '8px' }} />
                        )}
                        <p style={{ fontSize: '13px', color: '#0D1117', fontWeight: 500 }}>{file.name}</p>
                        <p style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{(file.size / 1024).toFixed(0)} KB</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                          style={{ marginTop: '8px', background: 'none', border: 'none', color: '#B83232', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📎</span>
                        <p style={{ fontSize: '13px', color: '#5E6B62' }}>Arrastra o haz clic para subir</p>
                        <p style={{ fontSize: '11px', color: '#5E6B62', marginTop: '4px' }}>JPG, PNG o PDF — máx 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', color: '#B83232', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedRecibo || !metodo || !file || uploading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: (!selectedRecibo || !metodo || !file || uploading) ? '#C8D4CB' : '#1A7A4A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: (!selectedRecibo || !metodo || !file || uploading) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {uploading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      Enviando...
                    </>
                  ) : 'Enviar comprobante →'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
