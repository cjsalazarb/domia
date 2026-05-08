import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { router } from '@/router'

function App() {
  const { loading, initialize } = useAuthStore()

  useEffect(() => {
    document.getElementById('initial-loader')?.remove()
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800 }}>
            <span style={{ color: '#0D1117' }}>DOM</span>
            <span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
          <p style={{ color: '#5E6B62', fontSize: '14px', marginTop: '8px' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
