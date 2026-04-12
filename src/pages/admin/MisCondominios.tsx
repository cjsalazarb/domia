import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export default function MisCondominios() {
  const { profile, signOut } = useAuthStore()

  const { data: condoStats, isLoading } = useQuery({
    queryKey: ['mis-condominios-stats'],
    queryFn: async () => {
      const [condosRes, residentesRes, recibosRes, mttoRes, unidadesRes] = await Promise.all([
        supabase.from('condominios').select('id, nombre, direccion, ciudad, estado').eq('estado', 'activo').order('nombre'),
        supabase.from('residentes').select('id, condominio_id, estado'),
        supabase.from('recibos').select('id, condominio_id, estado'),
        supabase.from('mantenimientos').select('id, condominio_id, estado').in('estado', ['pendiente', 'asignado', 'en_proceso']),
        supabase.from('unidades').select('id, condominio_id').eq('activa', true),
      ])

      const condos = condosRes.data || []
      const residentes = residentesRes.data || []
      const recibos = recibosRes.data || []
      const mtto = mttoRes.data || []
      const unidades = unidadesRes.data || []

      return condos.map(c => {
        const cRecibos = recibos.filter(r => r.condominio_id === c.id)
        const cPagados = cRecibos.filter(r => r.estado === 'pagado').length
        const cTotal = cRecibos.length
        const cobranza = cTotal > 0 ? Math.round((cPagados / cTotal) * 100) : 0
        const cMorosos = recibos.filter(r => r.condominio_id === c.id && (r.estado === 'emitido' || r.estado === 'vencido')).length
        const cMtto = mtto.filter(m => m.condominio_id === c.id).length
        const cUnidades = unidades.filter(u => u.condominio_id === c.id).length
        const cResidentes = residentes.filter(r => r.condominio_id === c.id).length
        return { ...c, cobranza, morosos: cMorosos, ticketsPendientes: cMtto, totalUnidades: cUnidades, residentes: cResidentes }
      })
    },
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0D1117', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: 'white' }}>
          DOM<span style={{ color: '#0D9E6E' }}>IA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.nombre} {profile?.apellido}</span>
          <button onClick={() => { signOut(); window.location.href = '/login' }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>
              Mis Condominios
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', margin: 0 }}>
              Selecciona un condominio para administrar
            </p>
          </div>
          <a href="/admin/condominios"
            style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nuevo condominio
          </a>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#5E6B62', fontSize: '14px' }}>
            Cargando condominios...
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!condoStats || condoStats.length === 0) && (
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '48px', textAlign: 'center', marginTop: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <p style={{ color: '#5E6B62', fontSize: '15px', marginBottom: '20px' }}>No hay condominios registrados</p>
            <a href="/admin/condominios"
              style={{ display: 'inline-block', padding: '14px 28px', backgroundColor: '#1A7A4A', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", textDecoration: 'none' }}>
              Crear primer condominio
            </a>
          </div>
        )}

        {/* Cards */}
        {condoStats && condoStats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '24px' }}>
            {condoStats.map(c => (
              <div key={c.id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '24px', transition: 'box-shadow 0.2s' }}>
                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '3px' }}>{c.ciudad} {c.direccion ? `· ${c.direccion}` : ''}</div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.totalUnidades}</div>
                    <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unidades</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#E8F4F0' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#0D1117' }}>{c.residentes}</div>
                    <div style={{ fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Residentes</div>
                  </div>
                </div>

                {/* Cobranza bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#5E6B62', marginBottom: '4px' }}>
                    <span>Cobranza del mes</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232' }}>{c.cobranza}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#E8F4F0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.cobranza}%`, backgroundColor: c.cobranza >= 80 ? '#1A7A4A' : c.cobranza >= 50 ? '#C07A2E' : '#B83232', borderRadius: '100px', transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {c.morosos > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{c.morosos} pendiente{c.morosos !== 1 ? 's' : ''}</span>}
                  {c.ticketsPendientes > 0 && <span style={{ fontSize: '11px', backgroundColor: '#FEF9EC', color: '#C07A2E', padding: '3px 8px', borderRadius: '6px' }}>{c.ticketsPendientes} ticket{c.ticketsPendientes !== 1 ? 's' : ''}</span>}
                  {c.morosos === 0 && c.ticketsPendientes === 0 && <span style={{ fontSize: '11px', backgroundColor: '#E8F4F0', color: '#1A7A4A', padding: '3px 8px', borderRadius: '6px' }}>Todo al dia</span>}
                </div>

                {/* Enter button */}
                <a href={`/admin/condominio/${c.id}/dashboard`}
                  style={{
                    display: 'block', width: '100%', padding: '12px', backgroundColor: '#1A7A4A', color: 'white', border: 'none',
                    borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
                    textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box',
                  }}>
                  Entrar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
