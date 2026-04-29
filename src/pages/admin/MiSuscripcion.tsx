import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useMiTenant } from '@/hooks/useTenants'
import { usePagosSuscripcion, usePagosMutations } from '@/hooks/usePagosSuscripcion'
import { supabase } from '@/lib/supabase'
import TrialBanner from '@/components/TrialBanner'

const PLAN_LABEL: Record<string, string> = {
  basico: 'Basico',
  mediano: 'Mediano',
  grande: 'Grande',
  corporativo: 'Corporativo',
}

const ESTADO_PAGO: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  verificado: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Verificado' },
  rechazado: { bg: '#FCEAEA', text: '#B83232', label: 'Rechazado' },
}

export default function MiSuscripcion() {
  const { profile, signOut } = useAuthStore()
  const { data: tenant } = useMiTenant(profile?.tenant_id || null)
  const { data: pagos } = usePagosSuscripcion(profile?.tenant_id || null)
  const { crearPago } = usePagosMutations()

  const [referencia, setReferencia] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ahora = new Date()
  const periodoActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  const periodoLabel = ahora.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })

  const pagoPendiente = pagos?.find(p => p.estado === 'pendiente')
  const ultimoRechazado = pagos?.find(p => p.estado === 'rechazado' && p.periodo === periodoActual)
  const pagoMesActual = pagos?.find(p => p.periodo === periodoActual && p.estado !== 'rechazado')

  const trialVencido = tenant?.estado === 'trial' && tenant.trial_hasta && new Date(tenant.trial_hasta) < ahora
  const pagoVencido = tenant?.proximo_cobro && new Date(tenant.proximo_cobro) < ahora
  const mostrarSeccionPago = (trialVencido || pagoVencido) && !pagoMesActual

  // Load QR image from configuracion_sistema
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('configuracion_sistema').select('valor').eq('clave', 'qr_pago_url').single()
      if (data?.valor) setQrUrl(data.valor)
    })()
  }, [])

  const handleEnviarComprobante = async () => {
    if (!tenant || !archivo) return
    setEnviando(true)
    try {
      const ext = archivo.name.split('.').pop() || 'jpg'
      const path = `suscripcion/${tenant.id}/${periodoActual}.${ext}`
      const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, archivo, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)

      await crearPago.mutateAsync({
        tenant_id: tenant.id,
        monto: Number(tenant.monto_mensual),
        periodo: periodoActual,
        metodo: 'qr',
        referencia: referencia.trim() || undefined,
        comprobante_url: urlData.publicUrl,
      })
      setReferencia('')
      setArchivo(null)
      setSuccessMsg('Comprobante enviado. Tu pago sera verificado en menos de 24 horas habiles.')
      setTimeout(() => setSuccessMsg(null), 10000)

      // Notify admin via edge function
      try {
        await supabase.functions.invoke('notificar-pago-suscripcion', {
          body: { tenant_id: tenant.id, tipo: 'nuevo_comprobante' },
        })
      } catch { /* non-critical */ }
    } catch (err: any) {
      console.error('Error enviando comprobante:', err)
      alert(err.message || 'Error al enviar comprobante')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
            DOM<span style={{ color: '#0D9E6E' }}>IA</span>
          </div>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Dashboard', path: '/tenant', icon: '🏠' },
              { label: 'Suscripcion', path: '/tenant/suscripcion', icon: '💳' },
            ].map(item => {
              const active = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: active ? 600 : 400, backgroundColor: active ? 'rgba(13,158,110,0.15)' : 'transparent', color: active ? '#0D9E6E' : 'rgba(255,255,255,0.6)' }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>{item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
            {tenant && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{tenant.nombre}</div>}
          </div>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <TrialBanner tenant={tenant} />

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 24px' }}>
          Mi Suscripcion
        </h1>

        {successMsg && (
          <div style={{ backgroundColor: '#E8F4F0', border: '1px solid #1A7A4A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1A7A4A', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* Status banners */}
        {pagoPendiente && (
          <div style={{ backgroundColor: '#E8F4F0', borderLeft: '3px solid #1A7A4A', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1A7A4A' }}>
            Comprobante recibido. En verificacion. Sera revisado en menos de 24 horas.
          </div>
        )}
        {ultimoRechazado && !pagoPendiente && (
          <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#B83232' }}>
            Tu ultimo comprobante fue rechazado{ultimoRechazado.rechazado_motivo ? `: ${ultimoRechazado.rechazado_motivo}` : ''}. Por favor reenvia tu comprobante.
          </div>
        )}

        {/* Plan card */}
        {tenant && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Plan</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{PLAN_LABEL[tenant.plan] || tenant.plan}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Unidades</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{tenant.total_unidades}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Monto mensual</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#1A7A4A' }}>Bs. {Number(tenant.monto_mensual).toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Estado</div>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: tenant.estado === 'activo' ? '#E8F4F0' : tenant.estado === 'trial' ? '#EBF4FF' : '#FEF9EC', color: tenant.estado === 'activo' ? '#1A7A4A' : tenant.estado === 'trial' ? '#0D4A8F' : '#C07A2E' }}>
                  {tenant.estado === 'trial' ? 'Prueba gratuita' : tenant.estado === 'activo' ? 'Activo' : tenant.estado === 'suspendido' ? 'Suspendido' : tenant.estado}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Dia de cobro</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{tenant.dia_cobro || 5} de cada mes</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {tenant.estado === 'trial' ? 'Trial hasta' : 'Proximo cobro'}
                </div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                  {tenant.estado === 'trial' && tenant.trial_hasta
                    ? new Date(tenant.trial_hasta).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
                    : tenant.proximo_cobro
                    ? new Date(tenant.proximo_cobro).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '-'}
                </div>
              </div>
            </div>
            {tenant.estado === 'trial' && tenant.proximo_cobro && (
              <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '12px' }}>
                Proximo cobro: <strong style={{ color: '#0D1117' }}>{new Date(tenant.proximo_cobro).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </div>
            )}
          </div>
        )}

        {/* ═══ SECCION DE PAGO INLINE ═══ */}
        {tenant && (mostrarSeccionPago || ultimoRechazado) && !pagoPendiente && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
              Realizar pago
            </h2>
            <p style={{ fontSize: '13px', color: '#5E6B62', margin: '0 0 20px' }}>Periodo: {periodoLabel}</p>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '36px', fontWeight: 800, color: '#1A7A4A' }}>
                Bs. {Number(tenant.monto_mensual).toFixed(2)}
              </div>
            </div>

            {/* QR Image */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {qrUrl ? (
                <img src={qrUrl} alt="QR de pago" style={{ maxWidth: '280px', width: '100%', borderRadius: '12px', border: '1px solid #E0E0E0' }} />
              ) : (
                <div style={{ backgroundColor: '#F4F7F5', border: '2px dashed #C8D0CB', borderRadius: '16px', padding: '40px', display: 'inline-block' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📱</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#5E6B62' }}>QR no configurado</div>
                  <div style={{ fontSize: '11px', color: '#9AA09C', marginTop: '4px' }}>Contacta a admin@altrion.bo</div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{ backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D1117', marginBottom: '8px' }}>Instrucciones:</div>
              <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#5E6B62', lineHeight: 1.8 }}>
                <li>Escanea el QR con tu app bancaria</li>
                <li>Ingresa el monto exacto: <strong style={{ color: '#1A7A4A' }}>Bs. {Number(tenant.monto_mensual).toFixed(2)}</strong></li>
                <li>Usa la referencia: <strong style={{ color: '#0D1117', fontFamily: "'Courier New', monospace" }}>DOMIA-{tenant.id.slice(0, 8)}</strong></li>
                <li>Toma captura del comprobante</li>
                <li>Subelo aqui abajo</li>
              </ol>
            </div>

            {/* Upload comprobante */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#344054', marginBottom: '6px', display: 'block' }}>Subir comprobante de pago *</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => setArchivo(e.target.files?.[0] || null)} />
              <div onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${archivo ? '#1A7A4A' : '#D0D5DD'}`, borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', backgroundColor: archivo ? '#F0FAF5' : '#FAFAFA', transition: 'all 0.2s' }}>
                {archivo ? (
                  <div>
                    <div style={{ fontSize: '14px', color: '#1A7A4A', fontWeight: 600 }}>{archivo.name}</div>
                    <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '4px' }}>{(archivo.size / 1024).toFixed(0)} KB — Clic para cambiar</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📎</div>
                    <div style={{ fontSize: '13px', color: '#5E6B62' }}>Clic para seleccionar imagen o PDF</div>
                    <div style={{ fontSize: '11px', color: '#9AA09C', marginTop: '2px' }}>JPG, PNG o PDF, max 5MB</div>
                  </div>
                )}
              </div>
            </div>

            {/* Referencia opcional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#344054', marginBottom: '4px', display: 'block' }}>Numero de transaccion (opcional)</label>
              <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: 123456789"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D0D5DD', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleEnviarComprobante} disabled={!archivo || enviando}
              style={{ width: '100%', padding: '14px', backgroundColor: archivo && !enviando ? '#1A7A4A' : '#C8D0CB', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: archivo && !enviando ? 'pointer' : 'not-allowed' }}>
              {enviando ? 'Enviando...' : 'Enviar comprobante'}
            </button>
          </div>
        )}

        {/* Payment history */}
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
          Historial de pagos
        </h2>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {(!pagos || pagos.length === 0) ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay pagos registrados</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr 0.8fr', padding: '10px 20px', backgroundColor: '#F4F7F5', fontSize: '10px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Periodo</span><span>Monto</span><span>Referencia</span><span>Estado</span>
              </div>
              {pagos.map((p, i) => {
                const est = ESTADO_PAGO[p.estado] || ESTADO_PAGO.pendiente
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr 0.8fr', padding: '12px 20px', fontSize: '13px', borderBottom: i < pagos.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{p.periodo}</span>
                    <span style={{ color: '#1A7A4A', fontWeight: 600 }}>Bs. {Number(p.monto).toFixed(0)}</span>
                    <span style={{ color: '#5E6B62', fontSize: '12px' }}>{p.referencia || '-'}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: est.bg, color: est.text, display: 'inline-block', width: 'fit-content' }}>{est.label}</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
