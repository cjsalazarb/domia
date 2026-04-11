import { useParams, useNavigate } from 'react-router-dom'
import EnviarAviso from './Comunicaciones/EnviarAviso'
import AdminLayout from '@/components/layout/AdminLayout'

export default function Comunicaciones() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <AdminLayout title="Comunicaciones" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
          ← Volver
        </button>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Comunicaciones
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Envía avisos y notificaciones a los residentes
        </p>

        <EnviarAviso condominioId={id} condominioNombre="Residencial Los Pinos" />
      </div>
    </AdminLayout>
  )
}
