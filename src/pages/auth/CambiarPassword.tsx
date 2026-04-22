import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export default function CambiarPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuthStore()

  const passwordValido = password.length >= 8 && /\d/.test(password)
  const passwordsCoinciden = password === confirmPassword
  const puedeGuardar = passwordValido && passwordsCoinciden && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!puedeGuardar) return

    setLoading(true)
    setError('')

    try {
      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // Mark debe_cambiar_password = false
      const { error: raError } = await supabase
        .from('residentes_auth')
        .update({ debe_cambiar_password: false, ultimo_acceso: new Date().toISOString() })
        .eq('user_id', user?.id)

      if (raError) {
        console.error('Error actualizando residentes_auth:', raError.message)
      }

      // Redirect to portal
      window.location.href = '/portal'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #C8D4CB',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0D1117',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F4F7F5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 48px',
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
            <span style={{ color: '#0D1117' }}>DOM</span>
            <span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          backgroundColor: '#FFF8E1',
          borderLeft: '3px solid #C07A2E',
          borderRadius: '0 10px 10px 0',
          padding: '14px 16px',
          marginBottom: '24px',
        }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
            Cambio de contraseña obligatorio
          </p>
          <p style={{ fontSize: '13px', color: '#5E6B62', margin: 0, lineHeight: '1.4' }}>
            Por seguridad, debe crear una contraseña personal antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nueva contraseña */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>
              Nueva contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, al menos 1 número"
                required
                style={{ ...inputStyle, paddingRight: '48px' }}
                onFocus={e => e.target.style.borderColor = '#1A7A4A'}
                onBlur={e => e.target.style.borderColor = '#C8D4CB'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#5E6B62',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Password requirements */}
            {password.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: password.length >= 8 ? '#1A7A4A' : '#B83232' }}>
                  <span>{password.length >= 8 ? '✓' : '✗'}</span>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: /\d/.test(password) ? '#1A7A4A' : '#B83232' }}>
                  <span>{/\d/.test(password) ? '✓' : '✗'}</span>
                  <span>Al menos 1 número</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>
              Confirmar contraseña
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita la nueva contraseña"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'}
            />
            {confirmPassword.length > 0 && !passwordsCoinciden && (
              <p style={{ fontSize: '12px', color: '#B83232', margin: '4px 0 0' }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', color: '#B83232',
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!puedeGuardar}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: puedeGuardar ? '#1A7A4A' : '#C8D4CB',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: puedeGuardar ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña →'}
          </button>
        </form>
      </div>
    </div>
  )
}
