import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { DomiaCard } from '@/components/ui/domia'
import { DomiaButton } from '@/components/ui/domia'
import { DomiaBadge } from '@/components/ui/domia'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

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
    <div className="min-h-screen bg-domia-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold font-display">
            DOM<span className="text-domia-primary">IA</span>
          </h1>
          <p className="text-sm font-body text-domia-muted mt-1">
            Administración de condominios · Bolivia
          </p>
        </div>

        <DomiaCard>
          {resetMode ? (
            /* Reset Password Form */
            <form onSubmit={handleReset} className="space-y-4">
              <h2 className="text-lg font-bold font-display text-domia-ink text-center">
                Recuperar contraseña
              </h2>
              <p className="text-sm text-domia-muted text-center">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {resetSent ? (
                <div className="text-center space-y-3">
                  <DomiaBadge variant="success">Email enviado</DomiaBadge>
                  <p className="text-sm text-domia-muted">
                    Revisa tu bandeja de entrada y sigue las instrucciones.
                  </p>
                  <DomiaButton
                    variant="ghost"
                    type="button"
                    className="w-full"
                    onClick={() => { setResetMode(false); setResetSent(false) }}
                  >
                    Volver al login
                  </DomiaButton>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-domia-muted" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-input border border-domia-border bg-domia-bg text-sm font-body text-domia-ink placeholder:text-domia-muted/60 focus:outline-none focus:ring-2 focus:ring-domia-primary/30 focus:border-domia-primary"
                    />
                  </div>

                  {error && <DomiaBadge variant="danger">{error}</DomiaBadge>}

                  <DomiaButton type="submit" loading={loading} className="w-full">
                    Enviar enlace
                  </DomiaButton>

                  <button
                    type="button"
                    onClick={() => { setResetMode(false); setError(null) }}
                    className="w-full text-sm text-domia-primary hover:underline font-body"
                  >
                    Volver al login
                  </button>
                </>
              )}
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-lg font-bold font-display text-domia-ink text-center">
                Iniciar sesión
              </h2>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-domia-muted" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-input border border-domia-border bg-domia-bg text-sm font-body text-domia-ink placeholder:text-domia-muted/60 focus:outline-none focus:ring-2 focus:ring-domia-primary/30 focus:border-domia-primary"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-domia-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-input border border-domia-border bg-domia-bg text-sm font-body text-domia-ink placeholder:text-domia-muted/60 focus:outline-none focus:ring-2 focus:ring-domia-primary/30 focus:border-domia-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-domia-muted hover:text-domia-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && <DomiaBadge variant="danger">{error}</DomiaBadge>}

              <DomiaButton type="submit" loading={loading} className="w-full">
                Iniciar sesión
              </DomiaButton>

              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null) }}
                className="w-full text-sm text-domia-primary hover:underline font-body"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}
        </DomiaCard>

        <p className="text-center text-xs text-domia-muted mt-6 font-body">
          DOMIA · Sistema de Administración de Condominios
        </p>
      </div>
    </div>
  )
}
