import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

interface Props { condominioId: string }

interface ReporteRow {
  guardia: string
  horas_programadas: number
  horas_reales: number
  diferencia: number
  turnos_completados: number
  incidentes: number
  tarifa: number
  total_facturar: number
}

const TARIFA_DEFAULT = 15 // Bs. por hora default

export default function ReporteHoras({ condominioId }: Props) {
  const [tarifas, setTarifas] = useState<Record<string, number>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['reporte-horas', condominioId],
    queryFn: async () => {
      const mesActual = new Date()
      const inicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).toISOString().split('T')[0]

      const [turnosRes, incidentesRes] = await Promise.all([
        supabase.from('turnos').select('guardia_id, estado, horas_trabajadas, guardias(nombre, apellido)').eq('condominio_id', condominioId).gte('fecha', inicio).lte('fecha', fin),
        supabase.from('incidentes').select('guardia_id').eq('condominio_id', condominioId),
      ])

      const map: Record<string, ReporteRow> = {}
      for (const t of (turnosRes.data || []) as any[]) {
        const key = t.guardia_id
        if (!map[key]) {
          map[key] = { guardia: `${t.guardias?.nombre || ''} ${t.guardias?.apellido || ''}`.trim(), horas_programadas: 0, horas_reales: 0, diferencia: 0, turnos_completados: 0, incidentes: 0, tarifa: TARIFA_DEFAULT, total_facturar: 0 }
        }
        map[key].horas_programadas += 8
        if (t.estado === 'completado') {
          map[key].turnos_completados++
          map[key].horas_reales += Number(t.horas_trabajadas) || 0
        }
      }

      for (const inc of (incidentesRes.data || []) as any[]) {
        if (map[inc.guardia_id]) map[inc.guardia_id].incidentes++
      }

      const rows = Object.entries(map).map(([id, r]) => {
        r.diferencia = r.horas_reales - r.horas_programadas
        r.tarifa = tarifas[id] || TARIFA_DEFAULT
        r.total_facturar = r.horas_reales * r.tarifa
        return { id, ...r }
      })

      return rows.sort((a, b) => b.horas_reales - a.horas_reales)
    },
    enabled: !!condominioId,
  })

  const totalHoras = (data || []).reduce((s, r) => s + r.horas_reales, 0)
  const totalFacturar = (data || []).reduce((s, r) => s + (r.horas_reales * (tarifas[(r as any).id] || r.tarifa)), 0)

  const handleExport = () => {
    if (!data) return
    const rows = data.map(r => ({
      'Guardia': r.guardia,
      'Horas Programadas': r.horas_programadas,
      'Horas Reales': Number(r.horas_reales.toFixed(1)),
      'Diferencia': Number(r.diferencia.toFixed(1)),
      'Tarifa Bs/h': tarifas[(r as any).id] || r.tarifa,
      'Total a Facturar Bs.': Number((r.horas_reales * (tarifas[(r as any).id] || r.tarifa)).toFixed(2)),
      'Turnos': r.turnos_completados,
      'Incidentes': r.incidentes,
    }))
    // Add total row
    rows.push({
      'Guardia': 'TOTAL',
      'Horas Programadas': data.reduce((s, r) => s + r.horas_programadas, 0),
      'Horas Reales': Number(totalHoras.toFixed(1)),
      'Diferencia': 0,
      'Tarifa Bs/h': 0,
      'Total a Facturar Bs.': Number(totalFacturar.toFixed(2)),
      'Turnos': data.reduce((s, r) => s + r.turnos_completados, 0),
      'Incidentes': data.reduce((s, r) => s + r.incidentes, 0),
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 8 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Horas')
    XLSX.writeFile(wb, `Reporte_Horas_Guardias_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Reporte de Horas</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>Mes actual · {totalHoras.toFixed(1)} horas · Bs. {totalFacturar.toFixed(2)} a facturar</p>
        </div>
        <button onClick={handleExport} disabled={!data?.length} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
          📊 Exportar Excel
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', borderLeft: '4px solid #1A7A4A' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Horas totales</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#0D1117' }}>{totalHoras.toFixed(1)}h</div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', borderLeft: '4px solid #C07A2E' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#5E6B62', textTransform: 'uppercase' }}>Total a facturar</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 800, color: '#C07A2E' }}>Bs. {totalFacturar.toFixed(2)}</div>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay datos de turnos para este mes</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'auto' }}>
          <div style={{ minWidth: '700px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 0.6fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Guardia</span><span style={{ textAlign: 'right' }}>Programadas</span><span style={{ textAlign: 'right' }}>Reales</span>
              <span style={{ textAlign: 'right' }}>Tarifa Bs/h</span><span style={{ textAlign: 'right' }}>Total Bs.</span><span style={{ textAlign: 'center' }}>Turnos</span><span style={{ textAlign: 'center' }}>Incid.</span>
            </div>
            {data.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 0.8fr 1fr 0.6fr 0.6fr', padding: '12px 20px', borderBottom: i < data.length - 1 ? '1px solid #F0F0F0' : 'none', fontFamily: "'Inter', sans-serif", fontSize: '13px', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{r.guardia}</span>
                <span style={{ textAlign: 'right', color: '#5E6B62' }}>{r.horas_programadas}h</span>
                <span style={{ textAlign: 'right', fontWeight: 600, color: '#0D1117' }}>{r.horas_reales.toFixed(1)}h</span>
                <span style={{ textAlign: 'right' }}>
                  <input type="number" value={tarifas[(r as any).id] ?? TARIFA_DEFAULT} onChange={e => setTarifas(p => ({ ...p, [(r as any).id]: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '60px', padding: '4px 6px', border: '1px solid #C8D4CB', borderRadius: '6px', fontSize: '12px', textAlign: 'right', fontFamily: "'Inter', sans-serif", color: '#0D1117', outline: 'none' }} />
                </span>
                <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#C07A2E' }}>
                  Bs. {(r.horas_reales * (tarifas[(r as any).id] ?? TARIFA_DEFAULT)).toFixed(2)}
                </span>
                <span style={{ textAlign: 'center', color: '#5E6B62' }}>{r.turnos_completados}</span>
                <span style={{ textAlign: 'center' }}>
                  {r.incidentes > 0 ? <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', fontWeight: 600 }}>{r.incidentes}</span> : <span style={{ color: '#5E6B62' }}>0</span>}
                </span>
              </div>
            ))}
            {/* Total row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 0.8fr 1fr 0.6fr 0.6fr', padding: '14px 20px', backgroundColor: '#FEF9EC', fontFamily: "'Inter', sans-serif" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#C07A2E' }}>TOTAL A FACTURAR</span>
              <span /><span style={{ textAlign: 'right', fontWeight: 700, color: '#0D1117' }}>{totalHoras.toFixed(1)}h</span><span />
              <span style={{ textAlign: 'right', fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#C07A2E', fontSize: '15px' }}>Bs. {totalFacturar.toFixed(2)}</span>
              <span /><span />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
