import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useCondominios } from '@/hooks/useCondominios'

type Tab = 'activos' | 'archivados'

export default function MisCondominios() {
  const { profile, signOut } = useAuthStore()
  const { archivar, restaurar, eliminarPermanentemente } = useCondominios()
  const [tab, setTab] = useState<Tab>('activos')

  // Modal state
  const [modalArchivar, setModalArchivar] = useState<{ id: string; nombre: string } | null>(null)
  const [modalEliminar, setModalEliminar] = useState<{ id: string; nombre: string; paso: 1 | 2 } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { data: condoStats, isLoading } = useQuery({
    queryKey: ['mis-condominios-stats'],
    queryFn: async () => {
      const [condosRes, residentesRes, recibosRes, mttoRes, unidadesRes] = await Promise.all([
        supabase.from('condominios').select('*').in('estado', ['activo', 'archivado', 'en_configuracion']).order('nombre'),
        supabase.from('residentes').select('id, condominio_id, estado'),
        supabase.from('recibos').select('id, condominio_id, estado'),
        supabase.from('mantenimientos').select('id, condominio_id, estado').in('estado', ['pendiente', 'asignado', 'en_proceso']),
        supabase.from('unidades').select('id, condominio_id').eq('activa', true),
      ])

      const condos = condosRes.data || []
      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const mtto = mttoRes.data || []
      const unidades = unidadesRes.data || []

      return condos.map(c => {
        const cRecibos = recibos.filter(r => r.condominio_id === c.id)
        const cPagados = cRecibos.filter(r => r.estado === 'pagado').length
        const cTotal = cRecibos.length
        const cobranza = cTotal > 0 ? Math.round((cPagados / cTotal) * 100) : 0
        const cMorosos = recibos.filter(r => r.condominio_id === c.id && (r.estado === 'emitido' || r.estado === 'vencido')).length
        const cMtto = mtto.filter(m => m.condominio_id === c.id).length
        const cUnidades = unidades.filter(u => u.condominio_id === c.id).length
        const cResidentes = residentes.filter(r => r.condominio_id === c.id).length
        return { ...c, cobranza, morosos: cMorosos, ticketsPendientes: cMtto, totalUnidades: cUnidades, residentes: cResidentes }
      })
    },
  })

  const activos = (condoStats || []).filter(c => c.estado === 'activo' || c.estado === 'en_configuracion')
  const archivados = (condoStats || []).filter(c => c.estado === 'archivado')

  function diasRestantes(archivadoEn: string | null): number {
    if (!archivadoEn) return 30
    const diff = 30 - Math.floor((Date.now() - new Date(archivadoEn).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  async function handleArchivar() {
    if (!modalArchivar) return
    setActionLoading(true)
    await archivar.mutateAsync(modalArchivar.id)
    setActionLoading(false)
    setModalArchivar(null)
  }

  async function handleRestaurar(id: string) {
    setActionLoading(true)
    await restaurar.mutateAsync(id)
    setActionLoading(false)
  }

  async function handleEliminar() {
    if (!modalEliminar) return
    setActionLoading(true)
    await eliminarPermanentemente.mutateAsync(modalEliminar.id)
    setActionLoading(false)
    setModalEliminar(null)
    setConfirmText('')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
          DOM<span style={{ color: '#0D9E6E' }}>IA</span>
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
      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              Mis Condominios
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
              Selecciona un condominio para administrar
            </p>
          </div>
          <a href="/admin/condominios"
            style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nuevo condominio
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '20px', marginBottom: '24px', backgroundColor: '#E8F4F0', borderRadius: '12px', padding: '4px' }}>
          {([
            { key: 'activos' as Tab, label: 'Activos', count: activos.length },
            { key: 'archivados' as Tab, label: 'Archivados', count: archivados.length },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                backgroundColor: tab === t.key ? 'white' : 'transparent',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600,
                color: tab === t.key ? '#0D1117' : '#5E6B62',
                transition: 'all 0.2s',
              }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62', fontSize: '14px' }}>Cargando condominios...</div>
        )}

        {/* ═══ TAB ACTIVOS ═══ */}
        {!isLoading && tab === 'activos' && (
          <>
            {activos.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center', marginTop: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                <p style={{ color: '#5E6B62', fontSize: '15px', marginBottom: '20px' }}>No hay condominios activos</p>
                <a href="/admin/condominios"
                  style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: '#1A7A4A', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none' }}>
                  Crear primer condominio
                </a>
              </div>
            )}

            {activos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {activos.map(c => (
                  <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '3px' }}>{c.ciudad} {c.direccion ? `· ${c.direccion}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.totalUnidades}</div>
                        <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unidades</div>
                      </div>
                      <div style={{ width: '1px', backgroundColor: '#E8F4F0' }} />
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.residentes}</div>
                        <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Residentes</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5E6B62', marginBottom: '4px' }}>
                        <span>Cobranza del mes</span>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#E8F4F0', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.cobranza}%`, backgroundColor: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232', borderRadius: '100px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {c.morosos > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{c.morosos} pendiente{c.morosos !== 1 ? 's' : ''}</span>}
                      {c.ticketsPendientes > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FEF9EC', color: '#C07A2E', padding: '3px 8px', borderRadius: '6px' }}>{c.ticketsPendientes} ticket{c.ticketsPendientes !== 1 ? 's' : ''}</span>}
                      {c.morosos === 0 && c.ticketsPendientes === 0 && <span style={{ fontSize: '11px', backgroundColor: '#E8F4F0', color: '#1A7A4A', padding: '3px 8px', borderRadius: '6px' }}>Todo al dia</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={`/admin/condominio/${c.id}/dashboard`}
                        style={{
                          flex: 1, display: 'block', padding: '12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none',
                          borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                          textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                        }}>
                        Entrar
                      </a>
                      <button onClick={() => setModalArchivar({ id: c.id, nombre: c.nombre })}
                        style={{
                          padding: '12px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none',
                          borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        }}
                        title="Archivar condominio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="21 8 21 21 3 21 3 8"/>
                          <rect x="1" y="3" width="22" height="5"/>
                          <line x1="10" y1="12" x2="14" y2="12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ TAB ARCHIVADOS ═══ */}
        {!isLoading && tab === 'archivados' && (
          <>
            {archivados.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: '#5E6B62', fontSize: '15px' }}>No hay condominios archivados</p>
              </div>
            )}

            {archivados.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {archivados.map(c => {
                  const dias = diasRestantes(c.archivado_en)
                  const fechaArchivado = c.archivado_en ? new Date(c.archivado_en).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                  return (
                    <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', borderLeft: '4px solid #C07A2E' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</span>
                            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: '#FEF3E0', color: '#C07A2E' }}>ARCHIVADO</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#5E6B62' }}>{c.ciudad} · {c.direccion}</div>
                          <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '4px' }}>Archivado el {fechaArchivado}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: dias <= 7 ? '#B83232' : '#C07A2E' }}>
                            {dias}
                          </div>
                          <div style={{ fontSize: '11px', color: dias <= 7 ? '#B83232' : '#C07A2E', fontWeight: 500 }}>
                            {dias === 1 ? 'dia restante' : 'dias restantes'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleRestaurar(c.id)} disabled={actionLoading}
                          style={{
                            padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                            cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1,
                          }}>
                          Restaurar
                        </button>
                        <button onClick={() => setModalEliminar({ id: c.id, nombre: c.nombre, paso: 1 })}
                          style={{
                            padding: '10px 20px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none',
                            borderRadius: '10px', fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                          }}>
                          Eliminar permanentemente
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ MODAL ARCHIVAR ═══ */}
      {modalArchivar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
              Archivar condominio
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', lineHeight: '1.6', margin: '0 0 8px' }}>
              ¿Estás segura de archivar <strong style={{ color: '#0D1117' }}>{modalArchivar.nombre}</strong>?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', lineHeight: '1.5', margin: '0 0 24px' }}>
              Todos los datos se conservan. Tienes 30 dias para restaurarlo si fue un error.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalArchivar(null)}
                style={{ padding: '12px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleArchivar} disabled={actionLoading}
                style={{
                  padding: '12px 20px', backgroundColor: '#C07A2E', color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                  cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1,
                }}>
                {actionLoading ? 'Archivando...' : 'Si, archivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ELIMINAR — PASO 1 ═══ */}
      {modalEliminar?.paso === 1 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#FFF5F5', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>
              ATENCION: Accion IRREVERSIBLE
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 8px' }}>
              Se eliminaran todos los accesos a <strong style={{ color: '#0D1117' }}>{modalEliminar.nombre}</strong>.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#555', lineHeight: '1.5', margin: '0 0 24px' }}>
              Propietarios, pagos, historial contable y documentos quedaran permanentemente inaccesibles.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalEliminar(null); setConfirmText('') }}
                style={{ padding: '12px 20px', backgroundColor: 'white', color: '#5E6B62', border: '1px solid #E0E0E0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={() => setModalEliminar({ ...modalEliminar, paso: 2 })}
                style={{
                  padding: '12px 20px', backgroundColor: '#B83232', color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                }}>
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ELIMINAR — PASO 2 ═══ */}
      {modalEliminar?.paso === 2 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#B83232', margin: '0 0 12px' }}>
              Confirmar eliminacion
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', lineHeight: '1.6', margin: '0 0 16px' }}>
              Para confirmar, escribe el nombre exacto del condominio:
            </p>
            <div style={{ backgroundColor: '#F4F7F5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0D1117' }}>
              {modalEliminar.nombre}
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Escribe el nombre aqui..."
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #C8D4CB', borderRadius: '10px',
                fontSize: '14px', color: '#0D1117', outline: 'none', boxSizing: 'border-box',
                fontFamily: "'Inter', sans-serif", marginBottom: '20px',
              }}
              onFocus={e => e.target.style.borderColor = '#B83232'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalEliminar(null); setConfirmText('') }}
                style={{ padding: '12px 20px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={confirmText !== modalEliminar.nombre || actionLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: confirmText === modalEliminar.nombre ? '#B83232' : '#C8D4CB',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                  cursor: confirmText === modalEliminar.nombre && !actionLoading ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}>
                {actionLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
