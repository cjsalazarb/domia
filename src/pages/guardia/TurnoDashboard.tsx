import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMiTurno } from '@/hooks/useGuardias'
import MiTurno from './Turno/MiTurno'
import ReportarIncidente from './Turno/ReportarIncidente'
import LibroNovedades from './Turno/LibroNovedades'

type Tab = 'turno' | 'incidentes' | 'novedades'

export default function TurnoDashboard() {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('turno')

  // Get guardia record
  const { data: guardia } = useQuery({
    queryKey: ['mi-guardia', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('guardias').select('id, condominio_id, nombre, apellido').eq('user_id', user!.id).eq('activo', true).single()
      return data
    },
    enabled: !!user,
  })

  const guardiaId = guardia?.id || ''
  const condominioId = guardia?.condominio_id || profile?.condominio_id || ''
  const { turnoActual, isLoading, historial, iniciar, finalizar } = useMiTurno(guardiaId)

  const tabs: { key: Tab; label: string; icon: string; disabled: boolean }[] = [
    { key: 'turno', label: 'Mi Turno', icon: '🛡️', disabled: false },
    { key: 'incidentes', label: 'Incidentes', icon: '🚨', disabled: !turnoActual || turnoActual.estado !== 'activo' },
    { key: 'novedades', label: 'Novedades', icon: '📋', disabled: !turnoActual || turnoActual.estado !== 'activo' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800 }}>DOM<span style={{ opacity: 0.9 }}>IA</span></span>
          <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>Guardia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px' }}>{profile?.nombre || guardia?.nombre}</span>
          <button onClick={() => { signOut(); navigate('/login') }} style={{ padding: '5px 12px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      {/* Tabs — big for mobile */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #E8F4F0' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => !t.disabled && setTab(t.key)}
            style={{
              flex: 1, padding: '14px 8px', border: 'none', backgroundColor: 'transparent',
              borderBottom: tab === t.key ? '3px solid #1A7A4A' : '3px solid transparent',
              cursor: t.disabled ? 'not-allowed' : 'pointer',
              opacity: t.disabled ? 0.4 : 1,
              fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#1A7A4A' : '#5E6B62', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '2px' }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {tab === 'turno' && (
          <MiTurno
            turno={turnoActual || null}
            isLoading={isLoading}
            historial={historial}
            onIniciar={(id) => iniciar.mutate(id)}
            onFinalizar={(id) => finalizar.mutate(id)}
            iniciando={iniciar.isPending}
            finalizando={finalizar.isPending}
          />
        )}

        {tab === 'incidentes' && turnoActual && (
          <ReportarIncidente turnoId={turnoActual.id} guardiaId={guardiaId} condominioId={condominioId} />
        )}

        {tab === 'novedades' && turnoActual && (
          <LibroNovedades turnoId={turnoActual.id} guardiaId={guardiaId} condominioId={condominioId} />
        )}
      </div>
    </div>
  )
}
