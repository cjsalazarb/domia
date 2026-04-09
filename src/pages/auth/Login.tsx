import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, resetPassword } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) {
      setError(error)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div
        className="w-full max-w-[420px] bg-white px-6 py-10 sm:px-12 sm:py-10"
        style={{
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="font-extrabold"
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: '32px', color: '#0D1117' }}
          >
            DOM<span style={{ color: '#1A7A4A' }}>IA</span>
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62' }}
          >
            Administración de condominios · Bolivia
          </p>
        </div>

        {resetMode ? (
          /* ── Reset Password ── */
          <form onSubmit={handleReset}>
            <div className="mb-6">
              <h2
                className="font-bold"
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', color: '#0D1117' }}
              >
                Recuperar contraseña
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62' }} className="mt-1">
                Ingresa tu email y te enviaremos un enlace
              </p>
            </div>

            {resetSent ? (
              <div className="text-center space-y-4">
                <div
                  className="px-3.5 py-2.5"
                  style={{
                    background: '#E8F4F0',
                    borderLeft: '3px solid #1A7A4A',
                    borderRadius: '8px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    color: '#1A7A4A',
                  }}
                >
                  Revisa tu bandeja de entrada y sigue las instrucciones.
                </div>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSent(false); setError(null) }}
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A' }}
                  className="hover:underline"
                >
                  ← Volver al login
                </button>
              </div>
            ) : (
              <>
                {/* Email */}
                <div className="mb-4">
                  <label
                    className="block mb-1"
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', color: '#0D1117' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full focus:outline-none"
                    style={{
                      border: '1px solid #C8D4CB',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#0D1117',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1A7A4A'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#C8D4CB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="mb-4 px-3.5 py-2.5"
                    style={{
                      background: '#FCEAEA',
                      borderLeft: '3px solid #B83232',
                      borderRadius: '8px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      color: '#B83232',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white transition-colors disabled:opacity-50"
                  style={{
                    background: '#1A7A4A',
                    borderRadius: '12px',
                    padding: '14px',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0D9E6E' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1A7A4A' }}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Enviando...' : 'Enviar enlace →'}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => { setResetMode(false); setError(null) }}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A' }}
                    className="hover:underline"
                  >
                    ← Volver al login
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          /* ── Login Form ── */
          <form onSubmit={handleLogin}>
            {/* Title */}
            <div className="mb-6">
              <h2
                className="font-bold"
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', color: '#0D1117' }}
              >
                Iniciar sesión
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62' }} className="mt-1">
                Ingresa con tu cuenta DOMIA
              </p>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label
                className="block mb-1"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', color: '#0D1117' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full focus:outline-none"
                style={{
                  border: '1px solid #C8D4CB',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: '#0D1117',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1A7A4A'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.12)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#C8D4CB'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div className="mb-1">
              <label
                className="block mb-1"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', color: '#0D1117' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full focus:outline-none"
                  style={{
                    border: '1px solid #C8D4CB',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    paddingRight: '44px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#0D1117',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1A7A4A'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,122,74,0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#C8D4CB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#5E6B62' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="text-right mb-6">
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null) }}
                className="hover:underline"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#1A7A4A' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 px-3.5 py-2.5"
                style={{
                  background: '#FCEAEA',
                  borderLeft: '3px solid #B83232',
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#B83232',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white transition-colors disabled:opacity-50"
              style={{
                background: '#1A7A4A',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: '15px',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0D9E6E' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1A7A4A' }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión →'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: '#C8D4CB' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62' }}>o</span>
              <div className="flex-1 h-px" style={{ background: '#C8D4CB' }} />
            </div>

            {/* Registration link */}
            <p className="text-center" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62' }}>
              ¿Primera vez?{' '}
              <span className="cursor-pointer hover:underline" style={{ color: '#1A7A4A' }}>
                Solicita acceso
              </span>
            </p>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62' }}>
        ← Volver al inicio
      </p>
    </div>
  )
}
