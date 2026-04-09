import { useParams } from 'react-router-dom'

export default function Financiero() {
  const { id } = useParams()
  return (
    <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117' }}>
        Financiero
      </h1>
      <p style={{ color: '#5E6B62', fontSize: '14px' }}>Condominio: {id} — Módulo en construcción</p>
    </div>
  )
}
