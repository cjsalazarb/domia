import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  condominioId: string
}

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function Balance({ condominioId }: Props) {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)

  // Fetch ingresos (recibos pagados) and egresos (gastos) for last 6 months
  const { data, isLoading } = useQuery({
    queryKey: ['balance', condominioId, anio, mes],
    queryFn: async () => {
      // Last 6 months range
      const meses6 = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anio, mes - 1 - i, 1)
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
        meses6.push({ start, end: endStr, label: `${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}` })
      }

      const chartData = []

      for (const periodo of meses6) {
        // Ingresos: sum of pagos confirmed in this month
        const { data: pagos } = await supabase
          .from('pagos')
          .select('monto')
          .eq('condominio_id', condominioId)
          .not('confirmado_por', 'is', null)
          .gte('fecha_pago', periodo.start)
          .lte('fecha_pago', periodo.end)

        const ingresos = (pagos || []).reduce((s, p) => s + Number(p.monto), 0)

        // Egresos: sum of gastos in this month
        const { data: gastos } = await supabase
          .from('gastos')
          .select('monto')
          .eq('condominio_id', condominioId)
          .gte('fecha', periodo.start)
          .lte('fecha', periodo.end)

        const egresos = (gastos || []).reduce((s, g) => s + Number(g.monto), 0)

        chartData.push({ name: periodo.label, ingresos, egresos })
      }

      // Current month summary
      const actual = chartData[chartData.length - 1]

      return { chartData, actual }
    },
    enabled: !!condominioId,
  })

  const actual = data?.actual
  const superavit = (actual?.ingresos || 0) - (actual?.egresos || 0)
  const fondoReserva = (actual?.ingresos || 0) * 0.10

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando balance...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Balance Financiero
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>
            Ingresos vs egresos del condominio
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white' }}
          >
            {MESES_CORTO.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#0D1117', backgroundColor: 'white' }}
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#1A7A4A', marginTop: '4px' }}>
            Bs. {(actual?.ingresos || 0).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Egresos</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#B83232', marginTop: '4px' }}>
            Bs. {(actual?.egresos || 0).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {superavit >= 0 ? 'Superávit' : 'Déficit'}
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: superavit >= 0 ? '#1A7A4A' : '#B83232', marginTop: '4px' }}>
            Bs. {Math.abs(superavit).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fondo reserva (10%)</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D4A8F', marginTop: '4px' }}>
            Bs. {fondoReserva.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px' }}>
        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>
          Últimos 6 meses
        </h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8F4F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Inter', fill: '#5E6B62' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Inter', fill: '#5E6B62' }} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #C8D4CB', fontFamily: 'Inter', fontSize: '12px' }}
                formatter={(value) => [`Bs. ${Number(value).toFixed(2)}`]}
              />
              <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#1A7A4A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="egresos" name="Egresos" fill="#B83232" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
