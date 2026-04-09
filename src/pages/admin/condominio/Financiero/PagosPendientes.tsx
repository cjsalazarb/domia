import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface Pago {
  id: string
  recibo_id: string
  residente_id: string
  condominio_id: string
  monto: number
  metodo: string
  fecha_pago: string
  comprobante_url: string | null
  confirmado_por: string | null
  confirmado_at: string | null
  notas: string | null
  created_at: string
  residentes?: { nombre: string; apellido: string }
  recibos?: { periodo: string; estado: string; unidades?: { numero: string } }
}

const METODO_LABEL: Record<string, string> = {
  transferencia: '🏦 Transferencia',
  qr: '📱 QR',
  deposito: '💵 Depósito',
  efectivo: '💰 Efectivo',
  otro: 'Otro',
}

interface Props {
  condominioId: string
}

export default function PagosPendientes({ condominioId }: Props) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [modalUrl, setModalUrl] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const { data: pagos, isLoading } = useQuery({
    queryKey: ['pagos-pendientes', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select('*, residentes(nombre, apellido), recibos(periodo, estado, unidades(numero))')
        .eq('condominio_id', condominioId)
        .is('confirmado_por', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Pago[]
    },
    enabled: !!condominioId,
  })

  const confirmarMut = useMutation({
    mutationFn: async (pagoId: string) => {
      const pago = pagos?.find(p => p.id === pagoId)
      if (!pago) throw new Error('Pago no encontrado')

      const { error: pagoErr } = await supabase
        .from('pagos')
        .update({ confirmado_por: user?.id, confirmado_at: new Date().toISOString() })
        .eq('id', pagoId)
      if (pagoErr) throw pagoErr

      const { error: reciboErr } = await supabase
        .from('recibos')
        .update({ estado: 'pagado' })
        .eq('id', pago.recibo_id)
      if (reciboErr) throw reciboErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-pendientes', condominioId] })
      queryClient.invalidateQueries({ queryKey: ['recibos', condominioId] })
    },
  })

  const rechazarMut = useMutation({
    mutationFn: async ({ pagoId, motivo }: { pagoId: string; motivo: string }) => {
      const pago = pagos?.find(p => p.id === pagoId)
      if (!pago) throw new Error('Pago no encontrado')

      // Delete the pago (rejected)
      const { error: delErr } = await supabase
        .from('pagos')
        .delete()
        .eq('id', pagoId)
      if (delErr) throw delErr

      // Create notification for the resident
      const { error: notifErr } = await supabase.from('notificaciones').insert({
        condominio_id: condominioId,
        titulo: 'Pago rechazado',
        cuerpo: `Tu comprobante de pago fue rechazado. Motivo: ${motivo}`,
        tipo: 'pago_rechazado',
        destinatario_id: null, // Would need user_id from residentes
        enviado_por: user?.id,
      })
      if (notifErr) console.error('Notif error:', notifErr)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-pendientes', condominioId] })
      setRechazando(null)
      setMotivoRechazo('')
    },
  })

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando pagos...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
          Pagos Pendientes de Confirmación
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
          {pagos?.length || 0} pago{(pagos?.length || 0) !== 1 ? 's' : ''} pendiente{(pagos?.length || 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {!pagos || pagos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
          No hay pagos pendientes de confirmación
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pagos.map(pago => {
            const periodo = pago.recibos?.periodo
            const periodoLabel = periodo ? (() => {
              const d = new Date(periodo + 'T00:00:00')
              const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
              return `${meses[d.getMonth()]} ${d.getFullYear()}`
            })() : '—'

            return (
              <div key={pago.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                {/* Pago header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                      {pago.residentes?.nombre} {pago.residentes?.apellido}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                      Unidad {pago.recibos?.unidades?.numero || '—'} · {periodoLabel}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#1A7A4A' }}>
                      Bs. {Number(pago.monto).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5E6B62' }}>
                      {METODO_LABEL[pago.metodo] || pago.metodo}
                    </div>
                  </div>
                </div>

                {/* Info row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#5E6B62', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px' }}>
                    Fecha: {new Date(pago.fecha_pago + 'T00:00:00').toLocaleDateString('es-BO')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#5E6B62', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px' }}>
                    Enviado: {new Date(pago.created_at).toLocaleDateString('es-BO')}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {pago.comprobante_url && (
                    <button
                      onClick={() => setModalUrl(pago.comprobante_url)}
                      style={{ padding: '8px 16px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                    >
                      Ver comprobante
                    </button>
                  )}
                  <button
                    onClick={() => confirmarMut.mutate(pago.id)}
                    disabled={confirmarMut.isPending}
                    style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background-color 0.2s' }}
                    onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E'}
                    onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A'}
                  >
                    {confirmarMut.isPending ? '...' : '✓ Confirmar'}
                  </button>
                  <button
                    onClick={() => setRechazando(rechazando === pago.id ? null : pago.id)}
                    style={{ padding: '8px 16px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    ✕ Rechazar
                  </button>
                </div>

                {/* Rechazo form */}
                {rechazando === pago.id && (
                  <div style={{ marginTop: '12px', backgroundColor: '#FCEAEA', borderRadius: '10px', padding: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#B83232', marginBottom: '6px' }}>
                      Motivo de rechazo
                    </label>
                    <input
                      type="text"
                      value={motivoRechazo}
                      onChange={e => setMotivoRechazo(e.target.value)}
                      placeholder="Ej: Comprobante ilegible, monto no coincide..."
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #B83232', borderRadius: '8px', fontSize: '13px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                    />
                    <button
                      onClick={() => rechazarMut.mutate({ pagoId: pago.id, motivo: motivoRechazo })}
                      disabled={!motivoRechazo || rechazarMut.isPending}
                      style={{ padding: '8px 16px', backgroundColor: !motivoRechazo ? '#C8D4CB' : '#B83232', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: !motivoRechazo ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}
                    >
                      {rechazarMut.isPending ? '...' : 'Confirmar rechazo'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal comprobante */}
      {modalUrl && (
        <div
          onClick={() => setModalUrl(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
                Comprobante
              </h3>
              <button onClick={() => setModalUrl(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#5E6B62' }}>✕</button>
            </div>
            {modalUrl.endsWith('.pdf') ? (
              <iframe src={modalUrl} style={{ width: '100%', height: '500px', border: 'none', borderRadius: '10px' }} />
            ) : (
              <img src={modalUrl} alt="Comprobante" style={{ width: '100%', borderRadius: '10px' }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
