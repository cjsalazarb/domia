import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Login from '@/pages/auth/Login'

function App() {
  const { user, loading, initialize, signOut } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-domia-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold font-display">
            DOM<span className="text-domia-primary">IA</span>
          </h1>
          <p className="text-sm text-domia-muted mt-2">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  // Temporary logged-in view until router is implemented
  return (
    <div className="min-h-screen bg-domia-bg flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold font-display">
          DOM<span className="text-domia-primary">IA</span>
        </h1>
        <p className="text-sm text-domia-muted">
          Sesión iniciada como <strong>{user.email}</strong>
        </p>
        <button
          onClick={signOut}
          className="inline-flex items-center justify-center rounded-button px-4 py-2.5 text-sm font-semibold font-display bg-domia-red hover:bg-domia-red/90 text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default App
