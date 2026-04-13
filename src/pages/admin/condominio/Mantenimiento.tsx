import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import GestionTickets from './Mantenimiento/GestionTickets'
import AdminLayout from '@/components/layout/AdminLayout'

export default function Mantenimiento() {
  const { id } = useParams()

  const { data: condominio } = useQuery({
    queryKey: ['condominio-nombre', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('condominios').select('nombre').eq('id', id!).single()
      if (error) throw error
      return data as { nombre: string }
    },
    enabled: !!id,
  })

  if (!id) return null

  return (
    <AdminLayout title="Mantenimiento" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Mantenimiento · {condominio?.nombre || 'Condominio'}
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>Gestión de solicitudes de mantenimiento</p>

        <GestionTickets condominioId={id} />
      </div>
    </AdminLayout>
  )
}
