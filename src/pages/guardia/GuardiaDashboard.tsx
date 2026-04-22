import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMiTurno } from '@/hooks/useGuardias'
import { useAlertasGuardia } from '@/hooks/useAlertasGuardia'
import GuardiaLayout from '@/components/guardia/GuardiaLayout'
import TurnoModule from './modules/TurnoModule'
import VisitantesModule from './modules/VisitantesModule'
import IncidenciasModule from './modules/IncidenciasModule'
import AlertasModule from './modules/AlertasModule'
import VehiculosModule from './modules/VehiculosModule'

type Tab = 'turno' | 'visitantes' | 'incidencias' | 'alertas' | 'vehiculos'

export default function GuardiaDashboard() {
  const { user, profile, signOut } = useAuthStore()
  const [tab, setTab] = useState<Tab>('turno')

  const { data: guardia } = useQuery({
    queryKey: ['mi-guardia', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('guardias')
        .select('id, condominio_id, nombre, apellido')
        .eq('user_id', user!.id)
        .eq('activo', true)
        .single()
      return data
    },
    enabled: !!user,
  })

  const guardiaId = guardia?.id || ''
  const condominioId = guardia?.condominio_id || profile?.condominio_id || ''
  const guardiaName = guardia ? `${guardia.nombre} ${guardia.apellido}` : profile?.nombre || ''

  const { turnoActual } = useMiTurno(guardiaId)
  const { pendientes } = useAlertasGuardia(condominioId)
  const turnoActivo = turnoActual?.estado === 'activo'

  const handleSignOut = () => {
    signOut()
    window.location.href = '/login'
  }

  if (!guardia && user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            <span style={{ color: '#0D1117' }}>DOM</span><span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
          <p style={{ color: '#5E6B62', fontSize: '14px' }}>Cargando datos de guardia...</p>
        </div>
      </div>
    )
  }

  return (
    <GuardiaLayout
      guardiaName={guardiaName}
      onSignOut={handleSignOut}
      activeTab={tab}
      onTabChange={(t) => setTab(t as Tab)}
      alertCount={pendientes}
    >
      {tab === 'turno' && (
        <TurnoModule guardiaId={guardiaId} condominioId={condominioId} />
      )}

      {tab === 'visitantes' && (
        turnoActivo ? (
          <VisitantesModule condominioId={condominioId} guardiaId={guardiaId} />
        ) : (
          <NoTurnoMessage modulo="Visitantes" />
        )
      )}

      {tab === 'incidencias' && (
        turnoActivo && turnoActual ? (
          <IncidenciasModule turnoId={turnoActual.id} guardiaId={guardiaId} condominioId={condominioId} />
        ) : (
          <NoTurnoMessage modulo="Incidencias" />
        )
      )}

      {tab === 'alertas' && (
        turnoActivo ? (
          <AlertasModule condominioId={condominioId} guardiaId={guardiaId} />
        ) : (
          <NoTurnoMessage modulo="Alertas" />
        )
      )}

      {tab === 'vehiculos' && (
        turnoActivo ? (
          <VehiculosModule condominioId={condominioId} guardiaId={guardiaId} />
        ) : (
          <NoTurnoMessage modulo="Vehiculos" />
        )
      )}
    </GuardiaLayout>
  )
}

function NoTurnoMessage({ modulo }: { modulo: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>🛡️</div>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', marginBottom: '8px' }}>
        Turno no activo
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', lineHeight: '1.5' }}>
        Debes iniciar tu turno para acceder a {modulo}.
      </p>
    </div>
  )
}
