import { useState } from 'react'
import { useHistorialUnidad, type Residente } from '@/hooks/useResidentes'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { supabase } from '@/lib/supabase'
import EstadoCuentaPDF from '@/components/financiero/EstadoCuentaPDF'
import CartaMoraPDF from '@/components/financiero/CartaMoraPDF'

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
  const queryClient = useQueryClient()
  const { data: historial, isLoading: historialLoading } = useHistorialUnidad(residente.unidad_id)
  const estado = ESTADO_STYLE[residente.estado] || ESTADO_STYLE.activo

  const [showPagoForm, setShowPagoForm] = useState(false)
  const [pagoReciboId, setPagoReciboId] = useState('')
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoFecha, setPagoFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [pagoMetodo, setPagoMetodo] = useState('efectivo')
  const [pagoNotas, setPagoNotas] = useState('')
  const [pagoError, setPagoError] = useState('')

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

  // Pending recibos for the payment form
  const recibosPendientes = (recibos as any[]).filter(
    (r: any) => r.estado === 'emitido' || r.estado === 'vencido'
  )

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

  // Payment mutation
  const registrarPago = useMutation({
    mutationFn: async () => {
      if (!pagoReciboId) throw new Error('Seleccione un recibo')
      const monto = parseFloat(pagoMonto)
      if (isNaN(monto) || monto <= 0) throw new Error('Monto invalido')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Insert pago
      const { error: pagoErr } = await supabase.from('pagos').insert({
        condominio_id: residente.condominio_id,
        recibo_id: pagoReciboId,
        residente_id: residente.id,
        monto,
        fecha_pago: pagoFecha,
        metodo_pago: pagoMetodo,
        confirmado_por: user?.id || null,
        notas: pagoNotas || null,
      })
      if (pagoErr) throw pagoErr

      // Update recibo to pagado
      const { error: reciboErr } = await supabase.from('recibos')
        .update({ estado: 'pagado' })
        .eq('id', pagoReciboId)
      if (reciboErr) throw reciboErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos-residente', residente.id] })
      queryClient.invalidateQueries({ queryKey: ['recibos-lista'] })
      setShowPagoForm(false)
      setPagoReciboId('')
      setPagoMonto('')
      setPagoFecha(new Date().toISOString().split('T')[0])
      setPagoMetodo('efectivo')
      setPagoNotas('')
      setPagoError('')
    },
    onError: (err: Error) => {
      setPagoError(err.message)
    },
  })

  const handleSelectRecibo = (reciboId: string) => {
    setPagoReciboId(reciboId)
    const recibo = recibosPendientes.find((r: any) => r.id === reciboId)
    if (recibo) {
      setPagoMonto(Number(recibo.monto_total).toFixed(2))
    }
  }

  const handleEstadoCuenta = async () => {
    if (!recibos.length || !condInfo) return
    const blob = await pdf(
      <EstadoCuentaPDF
        condominio={{ nombre: condInfo.nombre, direccion: condInfo.direccion || undefined, ciudad: condInfo.ciudad || undefined }}
        residente={{ nombre: residente.nombre, apellido: residente.apellido, ci: residente.ci || undefined }}
        unidad={{ numero: residente.unidades?.numero || '\u2014', tipo: residente.unidades?.tipo || '' }}
        recibos={recibos as any[]}
      />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleCartaMora = async () => {
    if (!condInfo) return
    const deudas = recibosPendientes.map((r: any) => ({ periodo: r.periodo, monto: Number(r.monto_total) }))
    const totalDeuda = deudas.reduce((s: number, d: { monto: number }) => s + d.monto, 0)
    const blob = await pdf(
      <CartaMoraPDF
        condominio={{ nombre: condInfo.nombre, direccion: condInfo.direccion || undefined, ciudad: condInfo.ciudad || undefined }}
        residente={{ nombre: residente.nombre, apellido: residente.apellido }}
        unidad={residente.unidades?.numero || '—'}
        deudas={deudas}
        totalDeuda={totalDeuda}
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

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #C8D4CB',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    color: '#0D1117',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    color: '#5E6B62',
    marginBottom: '4px',
    display: 'block',
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
                {residente.tipo === 'propietario' ? 'Propietario' : 'Inquilino'}
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleEstadoCuenta} disabled={!recibos.length}
              style={{ padding: '8px 16px', backgroundColor: '#0D4A8F', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", opacity: recibos.length ? 1 : 0.5 }}>
              Estado de cuenta PDF
            </button>
            <button
              onClick={() => { setShowPagoForm(prev => !prev); setPagoError('') }}
              disabled={recibosPendientes.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: recibosPendientes.length > 0 ? '#C07A2E' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: recibosPendientes.length > 0 ? 'pointer' : 'default',
                fontFamily: "'Inter', sans-serif",
              }}>
              Registrar pago
            </button>
            {recibosPendientes.length > 0 && (
              <button onClick={handleCartaMora}
                style={{ padding: '8px 16px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Carta de mora
              </button>
            )}
            <button onClick={onEditar}
              style={{ padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Editar
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {[
            { label: 'Unidad', value: residente.unidades?.numero || '\u2014' },
            { label: 'CI', value: residente.ci || '\u2014' },
            { label: 'Email', value: residente.email || '\u2014' },
            { label: 'Telefono', value: residente.telefono || '\u2014' },
            ...(residente.tipo === 'inquilino' ? [
              { label: 'Inicio contrato', value: residente.fecha_inicio ? new Date(residente.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO') : '\u2014' },
              { label: 'Fin contrato', value: residente.fecha_fin ? new Date(residente.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO') : '\u2014' },
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

      {/* Inline payment form */}
      {showPagoForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
            Registrar Pago
          </h3>

          {pagoError && (
            <div style={{ backgroundColor: '#FCEAEA', color: '#B83232', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", marginBottom: '12px' }}>
              {pagoError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Recibo a pagar</label>
              <select
                value={pagoReciboId}
                onChange={e => handleSelectRecibo(e.target.value)}
                style={{ ...inputStyle, backgroundColor: 'white' }}
              >
                <option value="">Seleccione un recibo...</option>
                {recibosPendientes.map((r: any) => {
                  const d = new Date(r.periodo + 'T00:00:00')
                  const est = r.estado === 'vencido' ? ' (Vencido)' : ''
                  return (
                    <option key={r.id} value={r.id}>
                      {meses[d.getMonth()]} {d.getFullYear()} - Bs. {Number(r.monto_total).toFixed(2)}{est}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Monto (Bs.)</label>
              <input
                type="number"
                step="0.01"
                value={pagoMonto}
                onChange={e => setPagoMonto(e.target.value)}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={labelStyle}>Fecha del pago</label>
              <input
                type="date"
                value={pagoFecha}
                onChange={e => setPagoFecha(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Metodo de pago</label>
              <select
                value={pagoMetodo}
                onChange={e => setPagoMetodo(e.target.value)}
                style={{ ...inputStyle, backgroundColor: 'white' }}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Deposito</option>
                <option value="qr">QR</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Notas (opcional)</label>
              <textarea
                value={pagoNotas}
                onChange={e => setPagoNotas(e.target.value)}
                style={{ ...inputStyle, minHeight: '40px', resize: 'vertical' }}
                placeholder="Observaciones del pago..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={() => { setShowPagoForm(false); setPagoError('') }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#F4F7F5',
                color: '#5E6B62',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => registrarPago.mutate()}
              disabled={registrarPago.isPending || !pagoReciboId}
              style={{
                padding: '10px 20px',
                backgroundColor: registrarPago.isPending || !pagoReciboId ? '#ccc' : '#1A7A4A',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: registrarPago.isPending || !pagoReciboId ? 'default' : 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {registrarPago.isPending ? 'Guardando...' : 'Confirmar pago'}
            </button>
          </div>
        </div>
      )}

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
                    {esActual && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#1A7A4A', fontWeight: 600 }}>actual</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#5E6B62' }}>
                      {h.fecha_inicio ? new Date(h.fecha_inicio + 'T00:00:00').toLocaleDateString('es-BO') : new Date(h.created_at).toLocaleDateString('es-BO')}
                      {h.fecha_fin && ` \u2014 ${new Date(h.fecha_fin + 'T00:00:00').toLocaleDateString('es-BO')}`}
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
                    <span style={{ fontWeight: 600, color: '#0D1117' }}>{r.areas_comunes?.nombre || '\u2014'}</span>
                    <span style={{ fontSize: '11px', color: '#5E6B62', marginLeft: '8px' }}>{r.fecha} \u00B7 {r.hora_inicio?.slice(0, 5)} \u2014 {r.hora_fin?.slice(0, 5)}</span>
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
