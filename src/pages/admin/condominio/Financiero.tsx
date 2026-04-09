import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import ConfiguradorCuotas from './Financiero/ConfiguradorCuotas'
import ListaRecibos from './Financiero/ListaRecibos'

export default function Financiero() {
  const { id } = useParams()
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)',
        padding: '20px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>
            DOM<span style={{ opacity: 0.9 }}>IA</span>
          </span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Financiero</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button
            onClick={() => { signOut(); navigate('/login') }}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#1A7A4A',
            padding: 0,
            marginBottom: '16px',
          }}
        >
          ← Volver
        </button>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
          Módulo Financiero
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Gestión de cuotas, recibos y pagos del condominio
        </p>

        <ConfiguradorCuotas condominioId={id} />

        {/* Separator */}
        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        <ListaRecibos
          condominioId={id}
          condominioNombre="Residencial Los Pinos"
          condominioDir="Av. Banzer 3er Anillo, Zona Norte"
          condomionioCiudad="Santa Cruz de la Sierra"
        />
      </div>
    </div>
  )
}
