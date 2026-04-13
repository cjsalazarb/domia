import { useParams } from 'react-router-dom'
import GestionTickets from './Mantenimiento/GestionTickets'
import AdminLayout from '@/components/layout/AdminLayout'
import Proveedores from './Mantenimiento/Proveedores'

export default function Mantenimiento() {
  const { id } = useParams()

  if (!id) return null

  return (
    <AdminLayout title="Mantenimiento" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>Módulo de Mantenimiento</h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>Gestión de solicitudes y proveedores</p>

        <GestionTickets condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        <Proveedores condominioId={id} />
      </div>
    </AdminLayout>
  )
}
