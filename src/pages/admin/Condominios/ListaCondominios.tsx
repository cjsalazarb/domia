import { useState } from 'react'
import { useCondominios } from '@/hooks/useCondominios'

const ESTADO: Record<string, { bg: string; text: string; label: string }> = {
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  inactivo: { bg: '#F0F0F0', text: '#5E6B62', label: 'Inactivo' },
  en_configuracion: { bg: '#FEF9EC', text: '#C07A2E', label: 'En configuración' },
  archivado: { bg: '#FEF3E0', text: '#C07A2E', label: 'Archivado' },
}

interface Props {
  onNuevo: () => void
  onVer: (id: string) => void
  onEditar: (id: string) => void
  onConfigurar: (id: string) => void
}

export default function ListaCondominios({ onNuevo, onVer, onEditar, onConfigurar }: Props) {
  const { condominios, isLoading, archivar } = useCondominios()
  const [modalArchivar, setModalArchivar] = useState<{ id: string; nombre: string } | null>(null)
  const [archivando, setArchivando] = useState(false)

  const activos = condominios.filter(c => c.estado !== 'eliminado' && c.estado !== 'archivado')

  async function handleArchivar() {
    if (!modalArchivar) return
    setArchivando(true)
    await archivar.mutateAsync(modalArchivar.id)
    setArchivando(false)
    setModalArchivar(null)
  }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando condominios...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Condominios</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{activos.length} condominio{activos.length !== 1 ? 's' : ''} registrado{activos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onNuevo} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}
          onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E'}
          onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A'}>
          + Nuevo condominio
        </button>
      </div>

      {activos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay condominios registrados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activos.map(c => {
            const est = ESTADO[c.estado] || ESTADO.activo
            return (
              <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                    <div style={{ fontSize: '13px', color: '#5E6B62', marginTop: '2px' }}>{c.direccion} · {c.ciudad}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {c.telefono && <span style={{ fontSize: '11px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#5E6B62' }}>📞 {c.telefono}</span>}
                  {c.email_contacto && <span style={{ fontSize: '11px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#5E6B62' }}>📧 {c.email_contacto}</span>}
                  <span style={{ fontSize: '11px', backgroundColor: '#F4F7F5', padding: '4px 8px', borderRadius: '4px', color: '#5E6B62' }}>Mora: {c.recargo_mora_porcentaje}%</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => onVer(c.id)} style={{ padding: '6px 14px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Ver</button>
                  <button onClick={() => onEditar(c.id)} style={{ padding: '6px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => onConfigurar(c.id)} style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>⚙ Configurar</button>
                  <button onClick={() => setModalArchivar({ id: c.id, nombre: c.nombre })}
                    style={{ padding: '6px 14px', backgroundColor: '#FEF3E0', color: '#C07A2E', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Archivar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal archivar */}
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
              <button onClick={handleArchivar} disabled={archivando}
                style={{
                  padding: '12px 20px', backgroundColor: '#C07A2E', color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                  cursor: archivando ? 'not-allowed' : 'pointer', opacity: archivando ? 0.6 : 1,
                }}>
                {archivando ? 'Archivando...' : 'Si, archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
