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
}

export default function ReporteHoras({ condominioId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['reporte-horas', condominioId],
    queryFn: async () => {
      // Get completed turnos this month
      const mesActual = new Date()
      const inicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: turnos } = await supabase.from('turnos')
        .select('guardia_id, estado, horas_trabajadas, guardias(nombre, apellido)')
        .eq('condominio_id', condominioId)
        .gte('fecha', inicio).lte('fecha', fin)

      const { data: incidentes } = await supabase.from('incidentes')
        .select('guardia_id')
        .eq('condominio_id', condominioId)

      // Group by guardia
      const map: Record<string, ReporteRow> = {}
      for (const t of (turnos || []) as any[]) {
        const key = t.guardia_id
        if (!map[key]) {
          map[key] = {
            guardia: `${t.guardias?.nombre || ''} ${t.guardias?.apellido || ''}`.trim(),
            horas_programadas: 0, horas_reales: 0, diferencia: 0, turnos_completados: 0, incidentes: 0,
          }
        }
        map[key].horas_programadas += 8
        if (t.estado === 'completado') {
          map[key].turnos_completados++
          map[key].horas_reales += Number(t.horas_trabajadas) || 0
        }
      }

      // Count incidentes
      for (const inc of (incidentes || []) as any[]) {
        if (map[inc.guardia_id]) map[inc.guardia_id].incidentes++
      }

      // Calc differences
      const rows = Object.values(map)
      rows.forEach(r => { r.diferencia = r.horas_reales - r.horas_programadas })

      return rows.sort((a, b) => b.horas_reales - a.horas_reales)
    },
    enabled: !!condominioId,
  })

  const handleExport = () => {
    if (!data) return
    const rows = data.map(r => ({
      'Guardia': r.guardia,
      'Horas Programadas': r.horas_programadas,
      'Horas Reales': Number(r.horas_reales.toFixed(1)),
      'Diferencia': Number(r.diferencia.toFixed(1)),
      'Turnos Completados': r.turnos_completados,
      'Incidentes': r.incidentes,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Horas')
    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Reporte_Horas_Guardias_${fecha}.xlsx`)
  }

  if (isLoading) return <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>

  const totalHorasReales = (data || []).reduce((s, r) => s + r.horas_reales, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: 0 }}>Reporte de Horas</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginTop: '4px' }}>Mes actual · {totalHorasReales.toFixed(1)} horas totales</p>
        </div>
        <button onClick={handleExport} disabled={!data?.length} style={{
          padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
        }}>📊 Exportar Excel</button>
      </div>

      {!data || data.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center', color: '#5E6B62', fontSize: '14px' }}>No hay datos de turnos para este mes</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr 0.7fr', padding: '12px 20px', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Guardia</span><span style={{ textAlign: 'right' }}>Programadas</span><span style={{ textAlign: 'right' }}>Reales</span>
            <span style={{ textAlign: 'right' }}>Diferencia</span><span style={{ textAlign: 'center' }}>Turnos</span><span style={{ textAlign: 'center' }}>Incid.</span>
          </div>
          {data.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr 0.7fr', padding: '14px 20px', borderBottom: i < data.length - 1 ? '1px solid #F0F0F0' : 'none', fontFamily: "'Inter', sans-serif", fontSize: '13px', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: '#0D1117' }}>{r.guardia}</span>
              <span style={{ textAlign: 'right', color: '#5E6B62' }}>{r.horas_programadas}h</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#0D1117' }}>{r.horas_reales.toFixed(1)}h</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: r.diferencia >= 0 ? '#1A7A4A' : '#B83232' }}>
                {r.diferencia >= 0 ? '+' : ''}{r.diferencia.toFixed(1)}h
              </span>
              <span style={{ textAlign: 'center', color: '#5E6B62' }}>{r.turnos_completados}</span>
              <span style={{ textAlign: 'center' }}>
                {r.incidentes > 0 ? (
                  <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', backgroundColor: '#FCEAEA', color: '#B83232', fontWeight: 600 }}>{r.incidentes}</span>
                ) : <span style={{ color: '#5E6B62' }}>0</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
