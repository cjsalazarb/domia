import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { pdf } from '@react-pdf/renderer'
import CartaMoraPDF from '@/components/financiero/CartaMoraPDF'
import { useState } from 'react'

interface Props {
  condominioId: string
  condominioNombre: string
  condominioDir?: string
  condomionioCiudad?: string
}

interface MorosoRow {
  residente_id: string
  nombre: string
  apellido: string
  unidad_numero: string
  meses_adeudados: number
  total_deuda: number
  deudas: { periodo: string; monto: number }[]
}

export default function Morosos({ condominioId, condominioNombre, condominioDir, condomionioCiudad }: Props) {
  const [generando, setGenerando] = useState<string | null>(null)

  const { data: morosos, isLoading } = useQuery({
    queryKey: ['morosos', condominioId],
    queryFn: async () => {
      const { data: recibos, error } = await supabase
        .from('recibos')
        .select('residente_id, periodo, monto_total, residentes(nombre, apellido), unidades(numero)')
        .eq('condominio_id', condominioId)
        .eq('estado', 'vencido')
        .order('periodo', { ascending: true })

      if (error) throw error

      // Group by residente
      const map: Record<string, MorosoRow> = {}
      for (const r of (recibos || []) as any[]) {
        const key = r.residente_id
        if (!map[key]) {
          map[key] = {
            residente_id: key,
            nombre: r.residentes?.nombre || '',
            apellido: r.residentes?.apellido || '',
            unidad_numero: r.unidades?.numero || '—',
            meses_adeudados: 0,
            total_deuda: 0,
            deudas: [],
          }
        }
        map[key].meses_adeudados++
        map[key].total_deuda += Number(r.monto_total)
        map[key].deudas.push({ periodo: r.periodo, monto: Number(r.monto_total) })
      }

      return Object.values(map).sort((a, b) => b.total_deuda - a.total_deuda)
    },
    enabled: !!condominioId,
  })

  const totalDeudaCondominio = (morosos || []).reduce((sum, m) => sum + m.total_deuda, 0)

  const handleCartaMora = async (moroso: MorosoRow) => {
    setGenerando(moroso.residente_id)
    try {
      const blob = await pdf(
        <CartaMoraPDF
          condominio={{ nombre: condominioNombre, direccion: condominioDir, ciudad: condomionioCiudad }}
          residente={{ nombre: moroso.nombre, apellido: moroso.apellido }}
          unidad={moroso.unidad_numero}
          deudas={moroso.deudas}
          totalDeuda={moroso.total_deuda}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generando carta:', err)
    }
    setGenerando(null)
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando morosos...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Morosos
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
            {morosos?.length || 0} residente{(morosos?.length || 0) !== 1 ? 's' : ''} con deuda pendiente
          </p>
        </div>
        {totalDeudaCondominio > 0 && (
          <div style={{ backgroundColor: '#FCEAEA', borderRadius: '12px', padding: '12px 20px', textAlign: 'right' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#B83232' }}>Deuda total</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#B83232' }}>
              Bs. {totalDeudaCondominio.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {!morosos || morosos.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
          No hay residentes con deuda pendiente 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {morosos.map(m => (
            <div key={m.residente_id} style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>
                    {m.nombre} {m.apellido}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                    Unidad {m.unidad_numero} · {m.meses_adeudados} mes{m.meses_adeudados !== 1 ? 'es' : ''} adeudado{m.meses_adeudados !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: '#B83232' }}>
                    Bs. {m.total_deuda.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Deuda detail */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '12px' }}>
                {m.deudas.map((d, i) => {
                  const dt = new Date(d.periodo + 'T00:00:00')
                  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                  return (
                    <span key={i} style={{ fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', padding: '4px 8px', borderRadius: '4px' }}>
                      {meses[dt.getMonth()]} {dt.getFullYear()} · Bs. {d.monto.toFixed(2)}
                    </span>
                  )
                })}
              </div>

              <button
                onClick={() => handleCartaMora(m)}
                disabled={generando === m.residente_id}
                style={{
                  padding: '8px 16px',
                  backgroundColor: generando === m.residente_id ? '#5E6B62' : '#B83232',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: generando === m.residente_id ? 'not-allowed' : 'pointer',
                }}
              >
                {generando === m.residente_id ? '...' : '📄 Carta de mora'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
