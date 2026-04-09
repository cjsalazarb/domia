import { useNavigate } from 'react-router-dom'

export default function SinAcceso() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F4F7F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 48px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 8px' }}>
          Sin acceso
        </h1>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          No tienes permisos para ver esta página.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1A7A4A',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
          }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
