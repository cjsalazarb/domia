import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function LoginGuardia() {
  const [modo, setModo] = useState<'pin' | 'email'>('pin')
  const [codigo, setCodigo] = useState('')
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuthStore()

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const pinHash = await hashPin(pin)
      // Query by code, then compare PIN (supports both hashed and plain-text storage)
      const { data: guardia, error: qErr } = await supabase
        .from('guardias')
        .select('id, codigo_guardia, condominio_id, nombre, apellido, activo, pin_acceso')
        .eq('codigo_guardia', codigo.toUpperCase())
        .single()

      if (qErr || !guardia) {
        setError('Código o PIN incorrecto')
        setLoading(false)
        return
      }

      // Compare PIN: if stored as hash (64 chars) compare hashes, otherwise compare plain text
      const pinMatch = guardia.pin_acceso === pinHash || guardia.pin_acceso === pin
      if (!pinMatch) {
        setError('Código o PIN incorrecto')
        setLoading(false)
        return
      }

      if (!guardia.activo) {
        setError('Este guardia está desactivado. Contacta al administrador.')
        setLoading(false)
        return
      }

      // Store session in localStorage
      const session = {
        guardia_id: guardia.id,
        codigo: guardia.codigo_guardia,
        condominio_id: guardia.condominio_id,
        nombre: `${guardia.nombre} ${guardia.apellido}`,
        expires: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
      }
      localStorage.setItem('guardia_session', JSON.stringify(session))
      navigate('/guardia')
    } catch (err: any) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    navigate('/guardia')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '380px',
        border: '1px solid #333'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>
            <span style={{ color: 'white' }}>DOM</span>
            <span style={{ color: '#1A7A4A' }}>IA</span>
          </div>
          <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Portal de Guardia</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px', border: '1px solid #333' }}>
          <button onClick={() => { setModo('pin'); setError('') }} style={{
            flex: 1, padding: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            backgroundColor: modo === 'pin' ? '#1A7A4A' : '#222', color: modo === 'pin' ? 'white' : '#888'
          }}>Código + PIN</button>
          <button onClick={() => { setModo('email'); setError('') }} style={{
            flex: 1, padding: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            backgroundColor: modo === 'email' ? '#1A7A4A' : '#222', color: modo === 'email' ? 'white' : '#888'
          }}>Email</button>
        </div>

        {modo === 'pin' ? (
          <form onSubmit={handlePinLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#aaa', marginBottom: '6px' }}>Código GRD</label>
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                placeholder="GRD-001"
                required
                style={{
                  width: '100%', padding: '14px 16px', border: '1px solid #333', borderRadius: '10px',
                  fontSize: '18px', fontWeight: 700, color: 'white', backgroundColor: '#0f3460',
                  outline: 'none', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif",
                  letterSpacing: '2px', textAlign: 'center'
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#aaa', marginBottom: '6px' }}>PIN (6 dígitos)</label>
              <input
                type="password"
                value={pin}
                onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setPin(e.target.value) }}
                placeholder="••••••"
                required
                maxLength={6}
                style={{
                  width: '100%', padding: '14px 16px', border: '1px solid #333', borderRadius: '10px',
                  fontSize: '24px', fontWeight: 700, color: 'white', backgroundColor: '#0f3460',
                  outline: 'none', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif",
                  letterSpacing: '8px', textAlign: 'center'
                }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: '#3d1515', borderLeft: '3px solid #ff4444', color: '#ff6b6b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !codigo || pin.length !== 6} style={{
              width: '100%', padding: '14px', backgroundColor: (loading || !codigo || pin.length !== 6) ? '#333' : '#1A7A4A',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
              fontFamily: "'Nunito', sans-serif", cursor: (loading || !codigo || pin.length !== 6) ? 'not-allowed' : 'pointer'
            }}>{loading ? 'Verificando...' : 'Ingresar'}</button>
          </form>
        ) : (
          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#aaa', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{
                  width: '100%', padding: '12px 16px', border: '1px solid #333', borderRadius: '10px',
                  fontSize: '14px', color: 'white', backgroundColor: '#0f3460',
                  outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif"
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#aaa', marginBottom: '6px' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 16px', border: '1px solid #333', borderRadius: '10px',
                  fontSize: '14px', color: 'white', backgroundColor: '#0f3460',
                  outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif"
                }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: '#3d1515', borderLeft: '3px solid #ff4444', color: '#ff6b6b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', backgroundColor: loading ? '#333' : '#1A7A4A',
              color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
              fontFamily: "'Nunito', sans-serif", cursor: loading ? 'not-allowed' : 'pointer'
            }}>{loading ? 'Iniciando sesión...' : 'Ingresar'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
