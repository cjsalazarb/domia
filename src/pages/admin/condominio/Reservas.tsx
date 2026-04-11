import { useParams, useNavigate } from 'react-router-dom'
import ConfigurarAreas from './AreasComunes/ConfigurarAreas'
import AdminLayout from '@/components/layout/AdminLayout'
import GestionReservas from './Reservas/GestionReservas'

export default function Reservas() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <AdminLayout title="Reservas" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>← Volver</button>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>Reservas y Áreas Comunes</h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>Gestión de áreas y solicitudes de reserva</p>

        <GestionReservas condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        <ConfigurarAreas condominioId={id} />
      </div>
    </AdminLayout>
  )
}
