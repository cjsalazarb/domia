import { useState } from 'react'
import { useReservas } from '@/hooks/useReservas'
import { useAuthStore } from '@/stores/authStore'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
  aprobada: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Aprobada' },
  rechazada: { bg: '#FCEAEA', text: '#B83232', label: 'Rechazada' },
  cancelada: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelada' },
}

interface Props { condominioId: string }

export default function GestionReservas({ condominioId }: Props) {
  const { user } = useAuthStore()
  const { reservas, isLoading, aprobar, rechazar } = useReservas(condominioId)
  const [filtro, setFiltro] = useState<string>('pendiente')
  const [rechazandoId, setRechazandoId] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const filtradas = filtro === 'todos' ? reservas : reservas.filter(r => r.estado === filtro)

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Gestión de Reservas</h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{reservas.filter(r => r.estado === 'pendiente').length} pendiente{reservas.filter(r => r.estado === 'pendiente').length !== 1 ? 's' : ''} de aprobación</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['pendiente', 'aprobada', 'rechazada', 'todos'].map(e => (
          <button key={e} onClick={() => setFiltro(e)} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px',
            fontWeight: filtro === e ? 600 : 400, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            backgroundColor: filtro === e ? '#1A7A4A' : '#F0F0F0', color: filtro === e ? 'white' : '#5E6B62',
          }}>{e === 'todos' ? 'Todas' : ESTADO_STYLE[e]?.label || e}</button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay reservas</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtradas.map(r => {
            const est = ESTADO_STYLE[r.estado] || ESTADO_STYLE.pendiente
            return (
              <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                      {(r.areas_comunes as { nombre: string } | null)?.nombre || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                      {(r.residentes as { nombre: string; apellido: string } | null)?.nombre} {(r.residentes as { nombre: string; apellido: string } | null)?.apellido}
                      {' · Unidad '}{(r.unidades as { numero: string } | null)?.numero}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#0D1117', fontWeight: 600 }}>{r.fecha}</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#5E6B62' }}>{r.hora_inicio?.slice(0,5)} — {r.hora_fin?.slice(0,5)}</span>
                  {r.cobro && Number(r.cobro) > 0 && <span style={{ fontSize: '12px', backgroundColor: '#FEF9EC', padding: '4px 8px', borderRadius: '4px', color: '#C07A2E' }}>Bs. {Number(r.cobro).toFixed(2)}</span>}
                  {r.motivo && <span style={{ fontSize: '12px', color: '#5E6B62' }}>"{r.motivo}"</span>}
                </div>

                {r.estado === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => aprobar.mutate({ id: r.id, aprobado_por: user!.id })}
                      disabled={aprobar.isPending}
                      style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ✓ Aprobar
                    </button>
                    <button onClick={() => setRechazandoId(rechazandoId === r.id ? null : r.id)}
                      style={{ padding: '8px 16px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ✕ Rechazar
                    </button>
                  </div>
                )}

                {rechazandoId === r.id && (
                  <div style={{ marginTop: '12px', backgroundColor: '#FCEAEA', borderRadius: '10px', padding: '14px' }}>
                    <input type="text" value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo de rechazo..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #B83232', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                    <button onClick={() => { rechazar.mutate({ id: r.id, motivo_rechazo: motivoRechazo }); setRechazandoId(null); setMotivoRechazo('') }}
                      disabled={!motivoRechazo} style={{ padding: '6px 14px', backgroundColor: !motivoRechazo ? '#C8D4CB' : '#B83232', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: !motivoRechazo ? 'not-allowed' : 'pointer' }}>
                      Confirmar rechazo
                    </button>
                  </div>
                )}

                {r.motivo_rechazo && (
                  <div style={{ marginTop: '8px', backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#B83232' }}>
                    Rechazado: {r.motivo_rechazo}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
