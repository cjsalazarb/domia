import { useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import PlanCuentas from './Contabilidad/PlanCuentas'
import LibroDiario from './Contabilidad/LibroDiario'
import Reportes from './Contabilidad/Reportes'
import ArqueoCaja from './Contabilidad/ArqueoCaja'

const tabs = ['Plan de Cuentas', 'Libro Diario', 'Reportes', 'Arqueo de Caja'] as const
type Tab = typeof tabs[number]

export default function Contabilidad() {
  const { id } = useParams()
  const [tab, setTab] = useState<Tab>('Plan de Cuentas')

  if (!id) return null

  return (
    <AdminLayout title="Contabilidad" condominioId={id}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #E8F4F0', paddingBottom: '0', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              fontSize: '13px', fontWeight: tab === t ? 700 : 500, borderRadius: '8px 8px 0 0',
              backgroundColor: tab === t ? '#0D9E6E' : 'transparent',
              color: tab === t ? 'white' : '#5E6B62',
              transition: 'all 0.15s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Plan de Cuentas' && <PlanCuentas condominioId={id} />}
      {tab === 'Libro Diario' && <LibroDiario condominioId={id} />}
      {tab === 'Reportes' && <Reportes condominioId={id} />}
      {tab === 'Arqueo de Caja' && <ArqueoCaja condominioId={id} />}
    </AdminLayout>
  )
}
