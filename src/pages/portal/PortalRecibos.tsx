import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { supabase } from '@/lib/supabase'
import EstadoCuentaPDF from '@/components/financiero/EstadoCuentaPDF'
import PortalLayout from '@/components/layout/PortalLayout'

const ESTADO: Record<string, { bg: string; text: string; label: string }> = {
  emitido: { bg: '#F0F0F0', text: '#5E6B62', label: 'Emitido' },
  pagado: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Pagado' },
  vencido: { bg: '#FCEAEA', text: '#B83232', label: 'Vencido' },
  anulado: { bg: '#F0F0F0', text: '#999', label: 'Anulado' },
}

export default function PortalRecibos() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: residenteInfo } = useQuery({
    queryKey: ['mi-residente-info', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('residentes').select('id, nombre, apellido, ci, condominio_id, unidad_id, unidades(numero, tipo)').eq('user_id', user!.id).eq('estado', 'activo').single()
      return data
    },
    enabled: !!user,
  })

  const { data: condominioInfo } = useQuery({
    queryKey: ['mi-condominio-info', residenteInfo?.condominio_id],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', residenteInfo!.condominio_id).single()
      return data
    },
    enabled: !!residenteInfo?.condominio_id,
  })

  const { data: recibos, isLoading } = useQuery({
    queryKey: ['mis-recibos-all', user?.id],
    queryFn: async () => {
      if (!residenteInfo) return []
      const { data, error } = await supabase.from('recibos').select('id, periodo, monto_base, monto_recargo, monto_total, estado, fecha_vencimiento, unidades(numero)')
        .eq('residente_id', residenteInfo.id).order('periodo', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!residenteInfo,
  })

  const handleEstadoCuenta = async () => {
    if (!recibos || !residenteInfo || !condominioInfo) return
    const blob = await pdf(
      <EstadoCuentaPDF
        condominio={{ nombre: condominioInfo.nombre, direccion: condominioInfo.direccion || undefined, ciudad: condominioInfo.ciudad || undefined }}
        residente={{ nombre: residenteInfo.nombre, apellido: residenteInfo.apellido, ci: residenteInfo.ci || undefined }}
        unidad={{ numero: (residenteInfo.unidades as any)?.numero || '—', tipo: (residenteInfo.unidades as any)?.tipo || '' }}
        recibos={recibos as any[]}
      />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return (
    <PortalLayout title="Pagos">
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Mis Recibos</h1>
          <button onClick={handleEstadoCuenta} disabled={!recibos?.length}
            style={{ padding: '8px 16px', backgroundColor: '#0D4A8F', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', opacity: recibos?.length ? 1 : 0.5 }}>
            Estado de cuenta PDF
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando recibos...</div>
        ) : !recibos || recibos.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62' }}>No tienes recibos todavía</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(recibos as any[]).map(r => {
              const d = new Date(r.periodo + 'T00:00:00')
              const est = ESTADO[r.estado] || ESTADO.emitido
              return (
                <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>{meses[d.getMonth()]} {d.getFullYear()}</div>
                    <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>Unidad {r.unidades?.numero || '—'} · Vence {new Date(r.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-BO')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: r.estado === 'pagado' ? '#1A7A4A' : '#0D1117' }}>Bs. {Number(r.monto_total).toFixed(2)}</div>
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {recibos && recibos.length > 0 && (recibos as any[]).some(r => r.estado !== 'pagado') && (
          <button onClick={() => navigate('/portal/pagar')} style={{ marginTop: '20px', width: '100%', padding: '14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            Pagar cuota →
          </button>
        )}
      </div>
    </PortalLayout>
  )
}
