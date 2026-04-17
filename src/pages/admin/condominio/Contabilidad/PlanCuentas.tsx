import { usePlanCuentas } from '@/hooks/useContabilidad'

const tipoColor: Record<string, string> = {
  activo: '#0D9E6E',
  pasivo: '#E85D04',
  patrimonio: '#0D4A8F',
  ingreso: '#2D6A4F',
  gasto: '#D62828',
}

const tipoLabel: Record<string, string> = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  patrimonio: 'Patrimonio',
  ingreso: 'Ingreso',
  gasto: 'Gasto',
}

export default function PlanCuentas({ condominioId }: { condominioId: string }) {
  const { cuentas, isLoading } = usePlanCuentas(condominioId)

  if (isLoading) return <p style={{ color: '#5E6B62' }}>Cargando plan de cuentas...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
          Plan de Cuentas
        </h2>
        <span style={{ fontSize: '12px', color: '#5E6B62' }}>{cuentas.length} cuentas</span>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8F4F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7F5' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Codigo</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cuenta</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nivel</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: c.nivel <= 2 ? 700 : 400, color: c.nivel === 1 ? '#0D1117' : '#333' }}>
                  {c.codigo}
                </td>
                <td style={{ padding: '10px 16px', paddingLeft: `${16 + (c.nivel - 1) * 20}px`, fontWeight: c.nivel <= 2 ? 700 : 400, color: c.nivel === 1 ? '#0D1117' : '#333' }}>
                  {c.nombre}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    backgroundColor: `${tipoColor[c.tipo]}15`, color: tipoColor[c.tipo],
                  }}>
                    {tipoLabel[c.tipo]}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center', color: '#5E6B62', fontSize: '12px' }}>{c.nivel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
