import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Redirect based on role after successful signIn
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('rol, condominio_id')
        .eq('id', user.id)
        .single()

      if (profile?.rol === 'super_admin') {
        window.location.href = '/admin'
      } else if (profile?.rol === 'admin_condominio') {
        window.location.href = `/admin/condominio/${profile.condominio_id}/residentes`
      } else if (profile?.rol === 'guardia') {
        window.location.href = '/turno'
      } else {
        // Propietario/Inquilino — check if must change password
        const { data: authData } = await supabase
          .from('residentes_auth')
          .select('debe_cambiar_password')
          .eq('user_id', user.id)
          .single()

        if (authData?.debe_cambiar_password) {
          window.location.href = '/cambiar-password'
        } else {
          window.location.href = '/portal'
        }
      }
    }
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
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* CARD */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 48px',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
            <span style={{ color: '#0D1117' }}>DOM</span>
            <span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
          <div style={{ color: '#5E6B62', fontSize: '13px', marginTop: '4px' }}>
            Administración de condominios · Bolivia
          </div>
        </div>

        {/* TÍTULO */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Iniciar sesión
          </h1>
          <p style={{ color: '#5E6B62', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Ingresa con tu cuenta DOMIA
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #C8D4CB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#0D1117',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#1A7A4A'}
              onBlur={e => e.target.style.borderColor = '#C8D4CB'}
            />
          </div>

          {/* CONTRASEÑA */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#0D1117', marginBottom: '6px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '1px solid #C8D4CB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#0D1117',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#1A7A4A'}
                onBlur={e => e.target.style.borderColor = '#C8D4CB'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#5E6B62',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
          </div>

          {/* OLVIDASTE CONTRASEÑA */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => {/* TODO: reset password flow */}}
              style={{ color: '#1A7A4A', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{
              backgroundColor: '#FCEAEA',
              borderLeft: '3px solid #B83232',
              color: '#B83232',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif"
            }}>
              {error}
            </div>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#5E6B62' : '#1A7A4A',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#0D9E6E' }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#1A7A4A' }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Iniciando sesión...
              </>
            ) : 'Iniciar sesión →'}
          </button>
        </form>

        {/* DIVISOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#C8D4CB' }} />
          <span style={{ color: '#5E6B62', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#C8D4CB' }} />
        </div>

        {/* LINK ACCESO */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#5E6B62', fontFamily: "'Inter', sans-serif", margin: 0 }}>
          ¿Primera vez?{' '}
          <span style={{ color: '#1A7A4A', cursor: 'pointer', fontWeight: 500 }}>
            Solicita acceso
          </span>
        </p>
      </div>

      {/* FOOTER */}
      <span style={{ color: '#5E6B62', fontSize: '13px', marginTop: '24px', fontFamily: "'Inter', sans-serif" }}>
        ← Volver al inicio
      </span>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
