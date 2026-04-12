import { useParams } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import ConfigurarCondominio from '@/pages/admin/Condominios/ConfigurarCondominio'

export default function Configurar() {
  const { id } = useParams()

  if (!id) return null

  return (
    <AdminLayout title="Configurar" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Configurar Condominio
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Edificios, unidades, areas comunes, documentos y cuotas
        </p>
        <ConfigurarCondominio condominioId={id} onBack={() => window.location.href = `/admin/condominio/${id}/dashboard`} />
      </div>
    </AdminLayout>
  )
}
