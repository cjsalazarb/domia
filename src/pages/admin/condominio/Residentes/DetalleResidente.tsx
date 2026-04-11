import { useHistorialUnidad, type Residente } from '@/hooks/useResidentes'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { supabase } from '@/lib/supabase'
import EstadoCuentaPDF from '@/components/financiero/EstadoCuentaPDF'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  moroso: { bg: '#FCEAEA', text: '#B83232', label: 'Moroso' },
  inactivo: { bg: '#F0F0F0', text: '#5E6B62', label: 'Inactivo' },
}

interface Props {
  residente: Residente
  onBack: () => void
  onEditar: () => void
}

export default function DetalleResidente({ residente, onBack, onEditar }: Props) {
  const { data: historial, isLoading: historialLoading } = useHistorialUnidad(residente.unidad_id)
  const estado = ESTADO_STYLE[residente.estado] || ESTADO_STYLE.activo

  // Payment history
  const { data: recibos = [] } = useQuery({
    queryKey: ['recibos-residente', residente.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('recibos')
        .select('id, periodo, monto_base, monto_recargo, monto_total, estado, fecha_vencimiento, unidades(numero, tipo)')
        .eq('residente_id', residente.id).order('periodo', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  // Maintenance history
  const { data: mantenimientos = [] } = useQuery({
    queryKey: ['mantenimientos-unidad', residente.unidad_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('mantenimientos')
        .select('id, titulo, estado, prioridad, created_at')
        .eq('unidad_id', residente.unidad_id).order('created_at', { ascending: false }).limit(10)
      if (error) throw error
      return data || []
    },
  })

  // Reservations history
  const { data: reservasHist = [] } = useQuery({
    queryKey: ['reservas-residente', residente.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reservas')
        .select('id, fecha, hora_inicio, hora_fin, estado, areas_comunes(nombre)')
        .eq('residente_id', residente.id).order('fecha', { ascending: false }).limit(10)
      if (error) throw error
      return data || []
    },
  })

  // Condominio info for PDF
  const { data: condInfo } = useQuery({
    queryKey: ['condo-pdf', residente.condominio_id],
    queryFn: async () => {
      const { data } = await supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', residente.condominio_id).single()
      return data
    },
  })

  const handleEstadoCuenta = async () => {
    if (!recibos.length || !condInfo) return
    const blob = await pdf(
      <EstadoCuentaPDF
        condominio={{ nombre: condInfo.nombre, direccion: condInfo.direccion || undefined, ciudad: condInfo.ciudad || undefined }}
        residente={{ nombre: residente.nombre, apellido: residente.apellido, ci: residente.ci || undefined }}
        unidad={{ numero: residente.unidades?.numero || '—', tipo: residente.unidades?.tipo || '' }}
        recibos={recibos as any[]}
      />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const RECIBO_EST: Record<string, { bg: string; text: string; label: string }> = {
    emitido: { bg: '#F0F0F0', text: '#5E6B62', label: 'Emitido' },
    pagado: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Pagado' },
    vencido: { bg: '#FCEAEA', text: '#B83232', label: 'Vencido' },
    anulado: { bg: '#F0F0F0', text: '#999', label: 'Anulado' },
  }

  const MTTO_EST: Record<string, { bg: string; text: string; label: string }> = {
    pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
    asignado: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Asignado' },
    en_proceso: { bg: '#EBF4FF', text: '#0D4A8F', label: 'En proceso' },
    completado: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Completado' },
    cancelado: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelado' },
  }

  const RESERVA_EST: Record<string, { bg: string; text: string; label: string }> = {
    pendiente: { bg: '#FEF9EC', text: '#C07A2E', label: 'Pendiente' },
    aprobada: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Aprobada' },
    rechazada: { bg: '#FCEAEA', text: '#B83232', label: 'Rechazada' },
    cancelada: { bg: '#F0F0F0', text: '#5E6B62', label: 'Cancelada' },
  }

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
        ← Volver a lista
      </button>

      {/* Header card */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D1117', margin: 0 }}>
              {residente.nombre} {residente.apellido}
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: residente.tipo === 'propietario' ? '#EBF4FF' : '#F5ECFF',
                color: residente.tipo === 'propietario' ? '#0D4A8F' : '#7B1AC8',
                fontFamily: "'Inter', sans-serif",
              }}>
                {residente.tipo === 'propietario' ? '🏠 Propietario' : '📋 Inquilino'}
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: estado.bg,
                color: estado.text,
                fontFamily: "'Inter', sans-serif",
              }}>
                {estado.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleEstadoCuenta} disabled={!recibos.length}
              style={{ padding: '8px 16px', backgroundColor: '#0D4A8F', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", opacity: recibos.length ? 1 : 0.5 }}>
              Estado de cuenta PDF
            </button>
            <button onClick={onEditar}
              style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Editar
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {[
            { label: 'Unidad', value: residente.unidades?.numero || '—' },
            { label: 'CI', value: residente.ci || '—' },
            { label: 'Email', value: residente.email || '—' },
            { label: 'Teléfono', value: residente.telefono || '—' },
            ...(residente.tipo === 'inquilino' ? [
              { label: 'Inicio contrato', value: residente.fecha_inicio ? new Date(residente.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO') : '—' },
              { label: 'Fin contrato', value: residente.fecha_fin ? new Date(residente.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO') : '—' },
            ] : []),
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {residente.notas && (
          <div style={{ marginTop: '16px', backgroundColor: '#FEF9EC', borderRadius: '10px', padding: '12px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#C07A2E' }}>
            <strong>Notas:</strong> {residente.notas}
          </div>
        )}
      </div>

      {/* Historial unidad */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Historial de Unidad {residente.unidades?.numero}
        </h3>

        {historialLoading ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>
        ) : !historial || historial.length === 0 ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Sin historial</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historial.map((h, i) => {
              const esActual = h.id === residente.id
              const est = ESTADO_STYLE[h.estado] || ESTADO_STYLE.activo
              return (
                <div key={h.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: esActual ? '#E8F4F0' : i % 2 === 0 ? '#FAFBFA' : 'white',
                  borderRadius: '8px',
                  border: esActual ? '1px solid #1A7A4A' : 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                }}>
                  <div>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>
                      {h.nombre} {h.apellido}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#5E6B62' }}>
                      ({h.tipo})
                    </span>
                    {esActual && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#1A7A4A', fontWeight: 600 }}>← actual</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#5E6B62' }}>
                      {h.fecha_inicio ? new Date(h.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO') : new Date(h.created_at).toLocaleDateString('es-BO')}
                      {h.fecha_fin && ` — ${new Date(h.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO')}`}
                    </span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>
                      {est.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginTop: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Historial de Pagos
        </h3>
        {recibos.length === 0 ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Sin recibos</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(recibos as any[]).map(r => {
              const d = new Date(r.periodo + 'T00:00:00')
              const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
              const est = RECIBO_EST[r.estado] || RECIBO_EST.emitido
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#FAFBFA', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{meses[d.getMonth()]} {d.getFullYear()}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: r.estado === 'pagado' ? '#1A7A4A' : '#0D1117' }}>Bs. {Number(r.monto_total).toFixed(2)}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de mantenimiento */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginTop: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Historial de Mantenimiento
        </h3>
        {mantenimientos.length === 0 ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Sin solicitudes</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(mantenimientos as any[]).map(m => {
              const est = MTTO_EST[m.estado] || MTTO_EST.pendiente
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#FAFBFA', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0D1117' }}>{m.titulo}</span>
                    <span style={{ fontSize: '11px', color: '#5E6B62', marginLeft: '8px' }}>{new Date(m.created_at).toLocaleDateString('es-BO')}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de reservas */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginTop: '16px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Historial de Reservas
        </h3>
        {reservasHist.length === 0 ? (
          <div style={{ color: '#5E6B62', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>Sin reservas</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(reservasHist as any[]).map(r => {
              const est = RESERVA_EST[r.estado] || RESERVA_EST.pendiente
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#FAFBFA', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0D1117' }}>{r.areas_comunes?.nombre || '—'}</span>
                    <span style={{ fontSize: '11px', color: '#5E6B62', marginLeft: '8px' }}>{r.fecha} · {r.hora_inicio?.slice(0, 5)} — {r.hora_fin?.slice(0, 5)}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
