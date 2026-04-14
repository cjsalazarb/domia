import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/layout/AdminLayout'
import RegistroGuardias from './RegistroGuardias'
import GestionTurnos from './GestionTurnos'
import ReporteHoras from './ReporteHoras'

const TIPO_TURNO_LABEL: Record<string, string> = {
  manana: 'Turno Mañana',
  tarde: 'Turno Tarde',
  noche: 'Turno Noche',
}

export default function GuardiasAdmin() {
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

  // Turno activo ahora
  const { data: turnosActivos } = useQuery({
    queryKey: ['turnos-activos-ahora', id],
    queryFn: async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('turnos')
        .select('*, guardias(nombre, apellido)')
        .eq('condominio_id', id!)
        .eq('fecha', hoy)
        .eq('estado', 'activo')
      if (error) throw error
      return data as Array<{
        id: string; tipo: string; hora_programada_inicio: string;
        guardias: { nombre: string; apellido: string } | null
      }>
    },
    enabled: !!id,
  })

  if (!id) return null

  return (
    <AdminLayout title="Guardias" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Guardias · {condominio?.nombre || 'Condominio'}
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Gestión de personal de seguridad, turnos y reportes
        </p>

        {/* Turno Activo Ahora */}
        {turnosActivos && turnosActivos.length > 0 ? (
          <div style={{ marginBottom: '24px' }}>
            {turnosActivos.map(t => (
              <div key={t.id} style={{
                backgroundColor: '#E8F4F0', borderRadius: '20px', padding: '20px 24px',
                borderLeft: '4px solid #1A7A4A', marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  backgroundColor: '#1A7A4A', flexShrink: 0,
                  boxShadow: '0 0 0 4px rgba(26,122,74,0.2)',
                }} />
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 800, color: '#1A7A4A' }}>
                    {t.guardias?.nombre} {t.guardias?.apellido} — {TIPO_TURNO_LABEL[t.tipo] || t.tipo}
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                    En turno desde las {t.hora_programada_inicio?.slice(0, 5)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#F0F0F0', borderRadius: '20px', padding: '20px 24px',
            marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
            fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62',
          }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
            Sin guardia en turno ahora
          </div>
        )}

        {/* Guardias asignados */}
        <RegistroGuardias condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Turnos + Vista Semanal + Incidentes */}
        <GestionTurnos condominioId={id} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Reporte de horas */}
        <ReporteHoras condominioId={id} />
      </div>
    </AdminLayout>
  )
}
