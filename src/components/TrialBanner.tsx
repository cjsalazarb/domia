import type { Tenant } from '@/hooks/useTenants'

interface Props { tenant: Tenant | null | undefined }

export default function TrialBanner({ tenant }: Props) {
  if (!tenant || tenant.estado !== 'trial' || !tenant.trial_hasta) return null

  const ahora = new Date()
  const vence = new Date(tenant.trial_hasta)
  const diasRestantes = Math.max(0, Math.ceil((vence.getTime() - ahora.getTime()) / 86400000))

  if (diasRestantes > 10) return null

  const color = diasRestantes >= 5 ? '#0D4A8F' : diasRestantes >= 2 ? '#C07A2E' : '#B83232'
  const bg = diasRestantes >= 5 ? '#EBF4FF' : diasRestantes >= 2 ? '#FEF9EC' : '#FCEAEA'
  const texto = diasRestantes === 0
    ? 'Tu prueba gratuita vence hoy'
    : diasRestantes === 1
    ? 'Tu prueba gratuita vence manana'
    : `Prueba gratuita: te quedan ${diasRestantes} dias`

  return (
    <div style={{ backgroundColor: bg, borderLeft: `3px solid ${color}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color, fontFamily: "'Inter', sans-serif" }}>
        {texto}
      </span>
      <a href="/activar" style={{ fontSize: '12px', fontWeight: 700, color: 'white', backgroundColor: color, padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontFamily: "'Nunito', sans-serif" }}>
        Activar suscripcion
      </a>
    </div>
  )
}
