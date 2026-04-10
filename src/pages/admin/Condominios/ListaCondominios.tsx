import { useCondominios } from '@/hooks/useCondominios'

const ESTADO: Record<string, { bg: string; text: string; label: string }> = {
  activo: { bg: '#E8F4F0', text: '#1A7A4A', label: 'Activo' },
  inactivo: { bg: '#F0F0F0', text: '#5E6B62', label: 'Inactivo' },
  en_configuracion: { bg: '#FEF9EC', text: '#C07A2E', label: 'En configuración' },
}

interface Props {
  onNuevo: () => void
  onVer: (id: string) => void
  onEditar: (id: string) => void
  onConfigurar: (id: string) => void
}

export default function ListaCondominios({ onNuevo, onVer, onEditar, onConfigurar }: Props) {
  const { condominios, isLoading } = useCondominios()

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando condominios...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Condominios</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>{condominios.length} condominio{condominios.length !== 1 ? 's' : ''} registrado{condominios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onNuevo} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}
          onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E'}
          onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A'}>
          + Nuevo condominio
        </button>
      </div>

      {condominios.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay condominios registrados</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {condominios.map(c => {
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
