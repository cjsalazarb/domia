import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTenants, type Tenant, type CrearClienteInput } from '@/hooks/useTenants'
import { usePagosPendientes, usePagosSuscripcion, usePagosMutations, type PagoSuscripcion } from '@/hooks/usePagosSuscripcion'
import { supabase } from '@/lib/supabase'

const ESTADO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  trial: { bg: '#EBF4FF', text: '#0D4A8F', label: 'Trial' },
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  suspendido: { bg: '#FEF9EC', text: '#C07A2E', label: 'Suspendido' },
  cancelado: { bg: '#FCEAEA', text: '#B83232', label: 'Cancelado' },
}

const PLAN_LABEL: Record<string, string> = {
  basico: 'Basico',
  mediano: 'Mediano',
  grande: 'Grande',
  corporativo: 'Corporativo',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #D0D5DD', borderRadius: '10px',
  fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#344054', marginBottom: '4px', display: 'block',
}

function DetalleClienteModal({ tenant, profile, onClose, editField, setEditField, editValue, setEditValue, pagoManual, setPagoManual, pmPeriodo, setPmPeriodo, pmMonto, setPmMonto, pmRef, setPmRef, actualizar, setSuccessMsg, verificarPago }: any) {
  const { data: pagos, refetch } = usePagosSuscripcion(tenant.id)
  const { crearPago } = usePagosMutations()
  const est = ESTADO_STYLE[tenant.estado] || ESTADO_STYLE.trial
  const condoNombre = tenant.condominios?.[0]?.nombre || '-'
  const [rechazoId, setRechazoId] = useState<string | null>(null)
  const [rechazoMotivo, setRechazoMotivo] = useState('')
  const [verComprobante, setVerComprobante] = useState<string | null>(null)

  const handleEdit = async () => {
    if (!editField) return
    const updates: any = {}
    if (editField === 'monto') updates.monto_mensual = parseFloat(editValue)
    if (editField === 'dia') updates.dia_cobro = parseInt(editValue)
    await actualizar.mutateAsync({ id: tenant.id, updates })
    setEditField(null)
    setSuccessMsg(`${editField === 'monto' ? 'Monto' : 'Dia de cobro'} actualizado`)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handlePagoManual = async () => {
    if (!pmPeriodo || !pmMonto) return
    await crearPago.mutateAsync({
      tenant_id: tenant.id,
      monto: parseFloat(pmMonto),
      periodo: pmPeriodo,
      metodo: 'efectivo',
      referencia: pmRef || 'Pago manual',
    })
    // Mark as verified immediately
    const { data: newPago } = await supabase.from('pagos_suscripcion').select('id').eq('tenant_id', tenant.id).eq('periodo', pmPeriodo).eq('estado', 'pendiente').order('created_at', { ascending: false }).limit(1).single()
    if (newPago) {
      await supabase.from('pagos_suscripcion').update({ estado: 'verificado', verificado_por: profile.id }).eq('id', newPago.id)
    }
    setPagoManual(false); setPmPeriodo(''); setPmMonto(''); setPmRef('')
    refetch()
    setSuccessMsg('Pago manual registrado')
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '640px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>{tenant.nombre}</h3>
            <div style={{ fontSize: '13px', color: '#5E6B62' }}>{tenant.email} {tenant.telefono ? `· ${tenant.telefono}` : ''}</div>
            <div style={{ fontSize: '13px', color: '#5E6B62' }}>Condominio: <strong>{condoNombre}</strong> · {tenant.total_unidades} unidades</div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
        </div>

        {/* Suscripcion */}
        <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D1117', marginBottom: '10px', fontFamily: "'Nunito', sans-serif" }}>Suscripcion</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Plan</div>
              <div style={{ fontWeight: 600, color: '#0D1117' }}>{PLAN_LABEL[tenant.plan] || tenant.plan}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Monto mensual</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#1A7A4A' }}>Bs. {Number(tenant.monto_mensual).toFixed(0)}</span>
                <button onClick={() => { setEditField('monto'); setEditValue(String(tenant.monto_mensual)) }} style={{ padding: '2px 6px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '4px', fontSize: '9px', cursor: 'pointer' }}>Editar</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Dia de cobro</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600, color: '#0D1117' }}>{tenant.dia_cobro || 5}</span>
                <button onClick={() => { setEditField('dia'); setEditValue(String(tenant.dia_cobro || 5)) }} style={{ padding: '2px 6px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '4px', fontSize: '9px', cursor: 'pointer' }}>Editar</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Trial hasta</div>
              <div style={{ fontWeight: 600, color: '#0D1117' }}>{tenant.trial_hasta ? new Date(tenant.trial_hasta).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Proximo cobro</div>
              <div style={{ fontWeight: 600, color: '#0D1117' }}>{tenant.proximo_cobro ? new Date(tenant.proximo_cobro).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
            </div>
          </div>
        </div>

        {/* Edit inline */}
        {editField && (
          <div style={{ backgroundColor: '#EBF4FF', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#0D4A8F', fontWeight: 600 }}>{editField === 'monto' ? 'Nuevo monto (Bs.)' : 'Nuevo dia (1-28)'}:</span>
            <input type="number" value={editValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
              min={editField === 'dia' ? 1 : 1} max={editField === 'dia' ? 28 : undefined}
              style={{ padding: '6px 10px', border: '1px solid #D0D5DD', borderRadius: '8px', fontSize: '13px', width: '100px', fontFamily: "'Inter', sans-serif" }} />
            <button onClick={handleEdit} style={{ padding: '6px 12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setEditField(null)} style={{ padding: '6px 12px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        )}

        {/* Historial de pagos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0D1117', fontFamily: "'Nunito', sans-serif" }}>Historial de pagos</div>
          <button onClick={() => { setPagoManual(true); setPmPeriodo(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`); setPmMonto(String(tenant.monto_mensual)) }}
            style={{ padding: '4px 10px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>+ Pago manual</button>
        </div>

        {pagoManual && (
          <div style={{ backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#5E6B62', display: 'block' }}>Periodo</label>
              <input value={pmPeriodo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPmPeriodo(e.target.value)} placeholder="2026-05" style={{ padding: '6px 8px', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', width: '90px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#5E6B62', display: 'block' }}>Monto</label>
              <input value={pmMonto} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPmMonto(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', width: '70px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#5E6B62', display: 'block' }}>Referencia</label>
              <input value={pmRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPmRef(e.target.value)} placeholder="Efectivo" style={{ padding: '6px 8px', border: '1px solid #D0D5DD', borderRadius: '6px', fontSize: '12px', width: '100px' }} />
            </div>
            <button onClick={handlePagoManual} style={{ padding: '6px 12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Registrar</button>
            <button onClick={() => setPagoManual(false)} style={{ padding: '6px 12px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        )}

        <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          {(!pagos || pagos.length === 0) ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#5E6B62', fontSize: '13px' }}>Sin pagos registrados</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.6fr 0.7fr 1fr 0.8fr 1fr', padding: '8px 14px', backgroundColor: '#F4F7F5', fontSize: '9px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase' }}>
                <span>Periodo</span><span>Monto</span><span>Estado</span><span>Referencia</span><span>Pagado</span><span></span>
              </div>
              {pagos.map((p: PagoSuscripcion, i: number) => {
                const pEst = ESTADO_STYLE[p.estado] || { bg: '#F4F7F5', text: '#5E6B62', label: p.estado }
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.6fr 0.7fr 1fr 0.8fr 1fr', padding: '8px 14px', fontSize: '12px', borderBottom: i < pagos.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{p.periodo}</span>
                    <span style={{ color: '#1A7A4A' }}>Bs. {Number(p.monto).toFixed(0)}</span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, backgroundColor: pEst.bg, color: pEst.text, width: 'fit-content' }}>{pEst.label}</span>
                    <span style={{ color: '#5E6B62', fontSize: '11px' }}>{p.referencia || '-'}</span>
                    <span style={{ color: '#5E6B62', fontSize: '11px' }}>{p.pagado_en ? new Date(p.pagado_en).toLocaleDateString('es-BO') : '-'}</span>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {p.comprobante_url && (
                        <button onClick={() => setVerComprobante(p.comprobante_url)} style={{ padding: '2px 6px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}>Ver</button>
                      )}
                      {p.estado === 'pendiente' && (
                        <>
                          <button onClick={async () => {
                            await verificarPago.mutateAsync({ pagoId: p.id, tenantId: p.tenant_id, verificadoPor: profile.id })
                            refetch()
                            try { await supabase.functions.invoke('notificar-pago-suscripcion', { body: { tenant_id: p.tenant_id, tipo: 'verificado' } }) } catch {}
                          }} style={{ padding: '2px 6px', backgroundColor: '#E8F4F0', color: '#1A7A4A', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}>Verificar</button>
                          <button onClick={() => { setRechazoId(p.id); setRechazoMotivo('') }} style={{ padding: '2px 6px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}>Rechazar</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: '10px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cerrar</button>
      </div>

      {/* Rechazo con motivo */}
      {rechazoId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }} onClick={() => setRechazoId(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h4 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>Rechazar pago</h4>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#344054', marginBottom: '4px', display: 'block' }}>Motivo del rechazo</label>
            <textarea value={rechazoMotivo} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRechazoMotivo(e.target.value)} placeholder="Ej: Comprobante ilegible, monto incorrecto..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D0D5DD', borderRadius: '10px', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setRechazoId(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={async () => {
                await supabase.from('pagos_suscripcion').update({ estado: 'rechazado', rechazado_motivo: rechazoMotivo || null }).eq('id', rechazoId)
                try { const pago = pagos?.find((p: PagoSuscripcion) => p.id === rechazoId); if (pago) await supabase.functions.invoke('notificar-pago-suscripcion', { body: { tenant_id: pago.tenant_id, tipo: 'rechazado' } }) } catch {}
                setRechazoId(null)
                refetch()
                setSuccessMsg('Pago rechazado')
                setTimeout(() => setSuccessMsg(null), 3000)
              }} style={{ flex: 1, padding: '10px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Confirmar rechazo</button>
            </div>
          </div>
        </div>
      )}

      {/* Ver comprobante */}
      {verComprobante && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }} onClick={() => setVerComprobante(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {verComprobante.match(/\.(jpg|jpeg|png|webp)/i) ? (
              <img src={verComprobante} alt="Comprobante" style={{ width: '100%', borderRadius: '8px' }} />
            ) : (
              <a href={verComprobante} target="_blank" rel="noopener noreferrer" style={{ color: '#1A7A4A', fontWeight: 600, fontSize: '14px' }}>Abrir comprobante (PDF)</a>
            )}
            <button onClick={() => setVerComprobante(null)} style={{ marginTop: '12px', width: '100%', padding: '10px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientesDomia() {
  const { profile, signOut } = useAuthStore()
  const { tenants, isLoading, actualizar, crearCliente } = useTenants()
  const { data: pagosPendientes } = usePagosPendientes()
  const { verificarPago, rechazarPago } = usePagosMutations()
  const [confirmAction, setConfirmAction] = useState<{ tenant: Tenant; action: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ tenant: Tenant; step: number } | null>(null)
  const [pagoModal, setPagoModal] = useState<PagoSuscripcion | null>(null)
  const [detalleTenant, setDetalleTenant] = useState<Tenant | null>(null)
  const [editField, setEditField] = useState<'monto' | 'dia' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pagoManual, setPagoManual] = useState(false)
  const [pmPeriodo, setPmPeriodo] = useState('')
  const [pmMonto, setPmMonto] = useState('')
  const [pmRef, setPmRef] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [uploadingQr, setUploadingQr] = useState(false)
  const qrFileRef = useRef<HTMLInputElement>(null)

  // Load QR
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('configuracion_sistema').select('valor').eq('clave', 'qr_pago_url').single()
      if (data?.valor) setQrUrl(data.valor)
    })()
  }, [])

  const handleUploadQr = async (file: File) => {
    setUploadingQr(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `qr-pago.${ext}`
      const { error } = await supabase.storage.from('qr-pago').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('qr-pago').getPublicUrl(path)
      const url = urlData.publicUrl + '?t=' + Date.now()
      await supabase.from('configuracion_sistema').upsert({ clave: 'qr_pago_url', valor: url, updated_at: new Date().toISOString() })
      setQrUrl(url)
      setSuccessMsg('QR de pago actualizado')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      alert('Error subiendo QR: ' + err.message)
    } finally {
      setUploadingQr(false)
    }
  }

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [paso, setPaso] = useState<1 | 2>(1)
  const [creating, setCreating] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Paso A fields
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [telefonoCliente, setTelefonoCliente] = useState('')

  // Paso B fields
  const [nombreCondominio, setNombreCondominio] = useState('')
  const [tipoPropiedad, setTipoPropiedad] = useState<'edificio' | 'conjunto'>('edificio')
  const [numPisos, setNumPisos] = useState(3)
  const [dptosPorPiso, setDptosPorPiso] = useState(4)
  const [totalCasas, setTotalCasas] = useState(8)
  const [cuotaMensual, setCuotaMensual] = useState(0)
  const [direccionCondominio, setDireccionCondominio] = useState('')
  const [valorMensualSaas, setValorMensualSaas] = useState(150)
  const [diaCobro, setDiaCobro] = useState(5)

  const resetForm = () => {
    setPaso(1)
    setNombreEmpresa(''); setEmailCliente(''); setTelefonoCliente('')
    setNombreCondominio(''); setTipoPropiedad('edificio')
    setNumPisos(3); setDptosPorPiso(4); setTotalCasas(8)
    setCuotaMensual(0); setDireccionCondominio('')
    setValorMensualSaas(150); setDiaCobro(5)
  }

  const openModal = () => { resetForm(); setShowModal(true) }
  const closeModal = () => { setShowModal(false); resetForm() }

  const pasoAValid = nombreEmpresa.trim() && emailCliente.trim()
  const pasoBValid = nombreCondominio.trim()

  // Split nombre into nombre + apellido
  const splitNombre = (full: string) => {
    const parts = full.trim().split(/\s+/)
    if (parts.length <= 1) return { nombre: parts[0] || '', apellido: '' }
    const apellido = parts.pop()!
    return { nombre: parts.join(' '), apellido }
  }

  const handleCrear = async () => {
    setCreating(true)
    try {
      const { nombre, apellido } = splitNombre(nombreEmpresa)
      const input: CrearClienteInput = {
        nombre_empresa: nombreEmpresa.trim(),
        nombre: nombre || nombreEmpresa.trim(),
        apellido: apellido || '.',
        email: emailCliente.trim(),
        telefono: telefonoCliente.trim() || undefined,
        nombre_condominio: nombreCondominio.trim(),
        tipo_propiedad: tipoPropiedad,
        num_pisos: tipoPropiedad === 'edificio' ? numPisos : undefined,
        dptos_por_piso: tipoPropiedad === 'edificio' ? dptosPorPiso : undefined,
        total_casas: tipoPropiedad === 'conjunto' ? totalCasas : undefined,
        cuota_mensual: cuotaMensual || undefined,
        direccion_condominio: direccionCondominio.trim() || undefined,
        valor_mensual_saas: valorMensualSaas,
        dia_cobro: diaCobro,
      }
      const result = await crearCliente.mutateAsync(input)
      closeModal()
      setSuccessMsg(`Cliente ${nombreEmpresa} creado. ${result.email_sent ? `Email enviado a ${emailCliente}` : 'Email pendiente de envio'}`)
      setTimeout(() => setSuccessMsg(null), 6000)
    } catch (err: any) {
      console.error('Error crear cliente:', err)
      alert(err.message || JSON.stringify(err))
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async () => {
    if (!confirmAction) return
    const { tenant, action } = confirmAction
    await actualizar.mutateAsync({ id: tenant.id, updates: { estado: action } })
    setConfirmAction(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.step === 1) {
      setDeleteConfirm({ ...deleteConfirm, step: 2 })
      return
    }
    try {
      await actualizar.mutateAsync({ id: deleteConfirm.tenant.id, updates: { estado: 'cancelado' } })
      setDeleteConfirm(null)
      setSuccessMsg(`Cliente ${deleteConfirm.tenant.nombre} eliminado`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      console.error('Error eliminando tenant:', err)
      alert('Error al eliminar: ' + (err.message || JSON.stringify(err)))
    }
  }

  const totalUnidadesPreview = tipoPropiedad === 'edificio' ? numPisos * dptosPorPiso : totalCasas
  const montoSugerido = totalUnidadesPreview <= 20 ? 150 : totalUnidadesPreview <= 50 ? 250 : totalUnidadesPreview <= 100 ? 400 : 600

  // Calcular primer cobro
  const calcPrimerCobro = () => {
    const trial = new Date(Date.now() + 14 * 86400000)
    const cobro = new Date(trial)
    cobro.setDate(diaCobro)
    if (cobro <= trial) cobro.setMonth(cobro.getMonth() + 1)
    return cobro
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
              { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
              { label: 'Condominios', path: '/admin', icon: '🏢' },
              { label: 'Clientes', path: '/admin/clientes', icon: '👥' },
              { label: 'Finanzas Global', path: '/finanzas-global', icon: '💰' },
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
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              Clientes DOMIA
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
              {tenants.length} cliente{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={openModal}
            style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
            + Nuevo Cliente
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{ backgroundColor: '#E8F4F0', border: '1px solid #1A7A4A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1A7A4A', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* QR de cobro */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input ref={qrFileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleUploadQr(e.target.files[0]) }} />
          {qrUrl ? (
            <img src={qrUrl} alt="QR" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E0E0E0' }} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📱</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0D1117' }}>QR de cobro ALTRION</div>
            <div style={{ fontSize: '11px', color: '#5E6B62' }}>{qrUrl ? 'QR configurado — visible para todos los tenants' : 'No configurado — los tenants no veran QR'}</div>
          </div>
          <button onClick={() => qrFileRef.current?.click()} disabled={uploadingQr}
            style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
            {uploadingQr ? 'Subiendo...' : qrUrl ? 'Cambiar QR' : 'Subir QR'}
          </button>
        </div>

        {isLoading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62' }}>Cargando...</div>}

        {!isLoading && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 160px 130px 90px 50px 80px 110px auto', gap: '12px', padding: '12px 20px', backgroundColor: '#F4F7F5', fontSize: '10px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Empresa</span><span>Condominio</span><span>Plan</span><span>Estado</span><span>Uds</span><span>Bs/mes</span><span>Trial hasta</span><span></span>
            </div>
            {tenants.map((t, i) => {
              const est = ESTADO_STYLE[t.estado] || ESTADO_STYLE.trial
              const trialDias = t.trial_hasta ? Math.max(0, Math.ceil((new Date(t.trial_hasta).getTime() - Date.now()) / 86400000)) : null
              const condoNombre = t.condominios && t.condominios.length > 0 ? t.condominios[0].nombre : '-'
              const trialFecha = t.trial_hasta ? new Date(t.trial_hasta).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '180px 160px 130px 90px 50px 80px 110px auto', gap: '12px', padding: '14px 20px', fontSize: '13px', borderBottom: i < tenants.length - 1 ? '1px solid #F0F0F0' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{t.nombre}</span>
                      {pagosPendientes?.some(p => p.tenant_id === t.id) && (
                        <span onClick={() => { const p = pagosPendientes?.find(p => p.tenant_id === t.id); if (p) setPagoModal(p) }}
                          style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, backgroundColor: '#FEF9EC', color: '#C07A2E', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Pago pendiente
                        </span>
                      )}
                    </div>
                    {t.telefono && <div style={{ fontSize: '11px', color: '#5E6B62' }}>{t.telefono}</div>}
                  </div>
                  <span style={{ fontSize: '12px', color: '#0D1117', fontWeight: 500 }}>{condoNombre}</span>
                  <span style={{ fontSize: '11px', color: '#5E6B62' }}>{PLAN_LABEL[t.plan] || t.plan}</span>
                  <div>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                    {t.estado === 'trial' && trialDias !== null && (
                      <div style={{ fontSize: '10px', color: trialDias <= 3 ? '#B83232' : '#5E6B62', marginTop: '2px' }}>{trialDias}d</div>
                    )}
                  </div>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{t.total_unidades}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#1A7A4A' }}>Bs. {Number(t.monto_mensual).toFixed(0)}</span>
                  <span style={{ fontSize: '11px', color: '#5E6B62' }}>{trialFecha}</span>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => setDetalleTenant(t)} style={{ padding: '3px 8px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Ver</button>
                    {(t.estado === 'trial' || t.estado === 'suspendido') && (
                      <button onClick={() => setConfirmAction({ tenant: t, action: 'activo' })} style={{ padding: '3px 8px', backgroundColor: '#E8F4F0', color: '#1A7A4A', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Activar</button>
                    )}
                    {(t.estado === 'activo' || t.estado === 'trial') && (
                      <button onClick={() => setConfirmAction({ tenant: t, action: 'suspendido' })} style={{ padding: '3px 8px', backgroundColor: '#FEF9EC', color: '#C07A2E', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Suspender</button>
                    )}
                    {t.nombre !== 'ALTRION' && (
                      <button onClick={() => setDeleteConfirm({ tenant: t, step: 1 })} style={{ padding: '3px 8px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Eliminar</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Nuevo Cliente */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Steps indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: '#1A7A4A' }} />
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: paso === 2 ? '#1A7A4A' : '#E0E0E0' }} />
            </div>

            {paso === 1 && (
              <>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
                  Datos del cliente
                </h3>
                <p style={{ fontSize: '13px', color: '#5E6B62', margin: '0 0 20px' }}>Paso 1 de 2</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nombre completo o empresa *</label>
                    <input value={nombreEmpresa} onChange={e => setNombreEmpresa(e.target.value)} placeholder="Ej: Inmobiliaria Quispe" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email (usuario de acceso) *</label>
                    <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="admin@ejemplo.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefono WhatsApp</label>
                    <input value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} placeholder="+591 7XXXXXXX" style={inputStyle} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#5E6B62', margin: '4px 0 0', fontStyle: 'italic' }}>
                    La contrasena temporal sera generada automaticamente por el sistema.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                  <button onClick={closeModal} style={{ padding: '10px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
                  <button onClick={() => setPaso(2)} disabled={!pasoAValid}
                    style={{ padding: '10px 20px', backgroundColor: pasoAValid ? '#1A7A4A' : '#C8D0CB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: pasoAValid ? 'pointer' : 'not-allowed', fontFamily: "'Nunito', sans-serif" }}>
                    Siguiente
                  </button>
                </div>
              </>
            )}

            {paso === 2 && (
              <>
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
                  Pre-configuracion del condominio
                </h3>
                <p style={{ fontSize: '13px', color: '#5E6B62', margin: '0 0 20px' }}>Paso 2 de 2</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nombre del condominio *</label>
                    <input value={nombreCondominio} onChange={e => setNombreCondominio(e.target.value)} placeholder="Ej: Edificio Quispe" style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>Tipo de propiedad</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {([['edificio', 'Edificio', 'Unidades son departamentos'], ['conjunto', 'Conjunto residencial', 'Unidades son casas']] as const).map(([val, lbl, desc]) => (
                        <div key={val} onClick={() => setTipoPropiedad(val)}
                          style={{ flex: 1, padding: '12px', border: `2px solid ${tipoPropiedad === val ? '#1A7A4A' : '#E0E0E0'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: tipoPropiedad === val ? '#F0FAF5' : 'white' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0D1117', fontFamily: "'Nunito', sans-serif" }}>{lbl}</div>
                          <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '2px' }}>{desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tipoPropiedad === 'edificio' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>N° de pisos</label>
                        <input type="number" min={1} max={50} value={numPisos} onChange={e => setNumPisos(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Departamentos por piso</label>
                        <input type="number" min={1} max={20} value={dptosPorPiso} onChange={e => setDptosPorPiso(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
                      </div>
                    </div>
                  )}

                  {tipoPropiedad === 'conjunto' && (
                    <div>
                      <label style={labelStyle}>Total de casas</label>
                      <input type="number" min={1} max={200} value={totalCasas} onChange={e => setTotalCasas(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
                    </div>
                  )}

                  {/* Preview */}
                  <div style={{ backgroundColor: '#F4F7F5', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#5E6B62' }}>
                    Se generaran <strong style={{ color: '#0D1117' }}>{totalUnidadesPreview}</strong> unidades:
                    {tipoPropiedad === 'edificio' ? (
                      <span> {Array.from({ length: Math.min(numPisos, 3) }, (_, p) =>
                        Array.from({ length: Math.min(dptosPorPiso, 4) }, (_, d) => `${p + 1}${String(d + 1).padStart(2, '0')}`).join(', ')
                      ).join(', ')}{numPisos > 3 || dptosPorPiso > 4 ? '...' : ''}</span>
                    ) : (
                      <span> Casa 1, Casa 2{totalCasas > 2 ? `, ... Casa ${totalCasas}` : ''}</span>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Cuota mensual por unidad (Bs.)</label>
                    <input type="number" min={0} value={cuotaMensual || ''} onChange={e => setCuotaMensual(parseInt(e.target.value) || 0)} placeholder="El cliente la configura despues" style={inputStyle} />
                    {cuotaMensual > 0 && (
                      <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '4px' }}>
                        Total mensual residentes: <strong style={{ color: '#1A7A4A' }}>Bs. {(totalUnidadesPreview * cuotaMensual).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Direccion del condominio</label>
                    <input value={direccionCondominio} onChange={e => setDireccionCondominio(e.target.value)} placeholder="Av. Banzer 4to Anillo" style={inputStyle} />
                  </div>

                  {/* Suscripcion DOMIA */}
                  <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '16px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0D1117', marginBottom: '12px', fontFamily: "'Nunito', sans-serif" }}>Suscripcion DOMIA</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Valor mensual (Bs.) *</label>
                        <input type="number" min={1} value={valorMensualSaas} onChange={e => setValorMensualSaas(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
                        <div style={{ fontSize: '10px', color: '#5E6B62', marginTop: '3px' }}>Sugerido: Bs. {montoSugerido} ({totalUnidadesPreview} uds)</div>
                      </div>
                      <div>
                        <label style={labelStyle}>Dia de cobro mensual *</label>
                        <input type="number" min={1} max={28} value={diaCobro} onChange={e => setDiaCobro(Math.max(1, Math.min(28, parseInt(e.target.value) || 5)))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#5E6B62', marginTop: '6px' }}>
                      Primer cobro: <strong style={{ color: '#0D1117' }}>{calcPrimerCobro().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> (despues del trial)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '24px' }}>
                  <button onClick={() => setPaso(1)} style={{ padding: '10px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    Anterior
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={closeModal} style={{ padding: '10px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
                    <button onClick={handleCrear} disabled={!pasoBValid || creating}
                      style={{ padding: '10px 20px', backgroundColor: pasoBValid && !creating ? '#1A7A4A' : '#C8D0CB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: pasoBValid && !creating ? 'pointer' : 'not-allowed', fontFamily: "'Nunito', sans-serif" }}>
                      {creating ? 'Creando...' : 'Crear Cliente'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm action modal */}
      {confirmAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setConfirmAction(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
              {confirmAction.action === 'activo' ? 'Activar' : 'Suspender'} cliente
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿{confirmAction.action === 'activo' ? 'Activar' : 'Suspender'} a <strong>{confirmAction.tenant.nombre}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleAction} style={{ padding: '8px 18px', backgroundColor: confirmAction.action === 'activo' ? '#1A7A4A' : '#C07A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                {confirmAction.action === 'activo' ? 'Activar' : 'Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (double confirm) */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>
              {deleteConfirm.step === 1 ? 'Eliminar cliente' : 'Confirmar eliminacion'}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#0D1117', margin: '0 0 20px', lineHeight: 1.5 }}>
              {deleteConfirm.step === 1
                ? <>¿Eliminar a <strong>{deleteConfirm.tenant.nombre}</strong>? Se eliminaran todos sus datos, condominios y unidades.</>
                : <>Esta accion es <strong>irreversible</strong>. ¿Confirmar eliminacion de <strong>{deleteConfirm.tenant.nombre}</strong>?</>
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 18px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleDelete} style={{ padding: '8px 18px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                {deleteConfirm.step === 1 ? 'Si, eliminar' : 'Confirmar eliminacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle tenant modal */}
      {detalleTenant && <DetalleClienteModal
        tenant={detalleTenant}
        profile={profile}
        onClose={() => { setDetalleTenant(null); setEditField(null); setPagoManual(false) }}
        editField={editField} setEditField={setEditField}
        editValue={editValue} setEditValue={setEditValue}
        pagoManual={pagoManual} setPagoManual={setPagoManual}
        pmPeriodo={pmPeriodo} setPmPeriodo={setPmPeriodo}
        pmMonto={pmMonto} setPmMonto={setPmMonto}
        pmRef={pmRef} setPmRef={setPmRef}
        actualizar={actualizar}
        setSuccessMsg={setSuccessMsg}
        verificarPago={verificarPago}
        rechazarPago={rechazarPago}
      />}

      {/* Pago verification modal */}
      {pagoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setPagoModal(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
              Verificar pago de suscripcion
            </h3>
            <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '13px' }}>
                <span style={{ color: '#5E6B62' }}>Tenant:</span>
                <span style={{ color: '#0D1117', fontWeight: 600 }}>{(pagoModal as any).tenants?.nombre || '-'}</span>
                <span style={{ color: '#5E6B62' }}>Periodo:</span>
                <span style={{ color: '#0D1117', fontWeight: 600 }}>{pagoModal.periodo}</span>
                <span style={{ color: '#5E6B62' }}>Monto:</span>
                <span style={{ color: '#1A7A4A', fontWeight: 700 }}>Bs. {Number(pagoModal.monto).toFixed(0)}</span>
                <span style={{ color: '#5E6B62' }}>Metodo:</span>
                <span style={{ color: '#0D1117' }}>{pagoModal.metodo}</span>
                <span style={{ color: '#5E6B62' }}>Referencia:</span>
                <span style={{ color: '#0D1117', fontWeight: 600, fontFamily: "'Courier New', monospace" }}>{pagoModal.referencia || '-'}</span>
                <span style={{ color: '#5E6B62' }}>Fecha pago:</span>
                <span style={{ color: '#0D1117' }}>{pagoModal.pagado_en ? new Date(pagoModal.pagado_en).toLocaleDateString('es-BO') : '-'}</span>
              </div>
            </div>

            {pagoModal.comprobante_url && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#344054', marginBottom: '6px' }}>Comprobante:</div>
                {pagoModal.comprobante_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img src={pagoModal.comprobante_url} alt="Comprobante" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #E0E0E0' }} />
                ) : (
                  <a href={pagoModal.comprobante_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1A7A4A', fontWeight: 600, fontSize: '13px' }}>Ver comprobante (PDF)</a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPagoModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cerrar</button>
              <button onClick={async () => {
                try {
                  await rechazarPago.mutateAsync(pagoModal.id)
                  setPagoModal(null)
                  setSuccessMsg('Pago rechazado')
                  setTimeout(() => setSuccessMsg(null), 4000)
                } catch (err: any) { alert(err.message) }
              }} style={{ flex: 1, padding: '10px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Rechazar</button>
              <button onClick={async () => {
                try {
                  await verificarPago.mutateAsync({ pagoId: pagoModal.id, tenantId: pagoModal.tenant_id, verificadoPor: profile!.id })
                  setPagoModal(null)
                  setSuccessMsg('Pago verificado. Tenant activado.')
                  setTimeout(() => setSuccessMsg(null), 4000)
                } catch (err: any) { alert(err.message) }
              }} style={{ flex: 1, padding: '10px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Verificar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
