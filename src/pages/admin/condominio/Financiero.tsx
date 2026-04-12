import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { exportarExcel } from '@/lib/exportarReporte'
import ReporteJuntaPDF from '@/components/financiero/ReporteJuntaPDF'
import ConfiguradorCuotas from './Financiero/ConfiguradorCuotas'
import ListaRecibos from './Financiero/ListaRecibos'
import PagosPendientes from './Financiero/PagosPendientes'
import Morosos from './Financiero/Morosos'
import Balance from './Financiero/Balance'
import Gastos from './Financiero/Gastos'

export default function Financiero() {
  const { id } = useParams()
  const navigate = useNavigate()
  const profile = useAuthStore(s => s.profile)
  const isSuperAdmin = profile?.rol === 'super_admin'

  // Selector state — defaults to the condominio from URL
  const [selectedCondoId, setSelectedCondoId] = useState<string>(id || '')
  const activeCondoId = selectedCondoId || id!

  // Fetch all condominios for super_admin selector
  const { data: condominios } = useQuery({
    queryKey: ['all-condominios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('condominios')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      return data
    },
    enabled: isSuperAdmin,
  })

  // Fetch data for Excel/PDF export
  const { data: exportData } = useQuery({
    queryKey: ['export-data', activeCondoId],
    queryFn: async () => {
      const [recibosRes, gastosRes, morososRes] = await Promise.all([
        supabase.from('recibos').select('periodo, monto_total, estado, unidades(numero), residentes(nombre, apellido)').eq('condominio_id', activeCondoId),
        supabase.from('gastos').select('fecha, categoria, descripcion, monto, proveedor_nombre').eq('condominio_id', activeCondoId),
        supabase.from('recibos').select('residente_id, periodo, monto_total, residentes(nombre, apellido), unidades(numero)').eq('condominio_id', activeCondoId).in('estado', ['emitido', 'vencido']),
      ])

      const ingresos = (recibosRes.data || []).map((r: any) => ({
        periodo: r.periodo,
        unidad: r.unidades?.numero || '—',
        residente: `${r.residentes?.nombre || ''} ${r.residentes?.apellido || ''}`.trim(),
        monto: Number(r.monto_total),
        estado: r.estado,
      }))

      const egresos = (gastosRes.data || []).map(g => ({
        fecha: g.fecha,
        categoria: g.categoria,
        descripcion: g.descripcion,
        monto: Number(g.monto),
        proveedor: g.proveedor_nombre || '—',
      }))

      // Group morosos
      const morosoMap: Record<string, { residente: string; unidad: string; meses: number; deuda: number }> = {}
      for (const r of (morososRes.data || []) as any[]) {
        const key = r.residente_id
        if (!morosoMap[key]) {
          morosoMap[key] = {
            residente: `${r.residentes?.nombre || ''} ${r.residentes?.apellido || ''}`.trim(),
            unidad: r.unidades?.numero || '—',
            meses: 0,
            deuda: 0,
          }
        }
        morosoMap[key].meses++
        morosoMap[key].deuda += Number(r.monto_total)
      }

      return { ingresos, egresos, morosos: Object.values(morosoMap) }
    },
    enabled: !!activeCondoId,
  })

  const { data: condominioInfo } = useQuery({
    queryKey: ['condominio-info', activeCondoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('condominios').select('nombre, direccion, ciudad').eq('id', activeCondoId).single()
      if (error) throw error
      return data as { nombre: string; direccion: string | null; ciudad: string | null }
    },
    enabled: !!activeCondoId,
  })

  // Reporte Junta PDF state
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  if (!id) return null

  const condoNombre = condominioInfo?.nombre || 'Condominio'
  const condoDir = condominioInfo?.direccion || ''
  const condoCiudad = condominioInfo?.ciudad || ''

  const handleExportExcel = () => {
    if (!exportData) return
    exportarExcel(exportData.ingresos, exportData.egresos, exportData.morosos, condoNombre)
  }

  const handleReporteJunta = async () => {
    if (!exportData) return
    setPdfLoading(true)
    setPdfError(null)
    try {
      const now = new Date()
      const periodo = now.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
      const blob = await pdf(
        <ReporteJuntaPDF
          condominio={{ nombre: condoNombre, direccion: condoDir, ciudad: condoCiudad }}
          periodo={periodo}
          ingresos={exportData.ingresos}
          egresos={exportData.egresos}
          morosos={exportData.morosos}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Error generando Reporte Junta PDF:', err)
      setPdfError(err?.message || 'Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <AdminLayout title="Financiero" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
          ← Volver
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Módulo Financiero
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReporteJunta}
              disabled={pdfLoading || !exportData}
              style={{
                padding: '6px 14px',
                backgroundColor: pdfLoading ? '#5E6B62' : '#0D4A8F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: pdfLoading || !exportData ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                opacity: !exportData ? 0.5 : 1,
              }}
            >
              {pdfLoading ? 'Generando...' : 'Reporte Junta PDF'}
            </button>
            <button
              onClick={handleExportExcel}
              style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              Excel
            </button>
          </div>
        </div>
        <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
          Gestión de cuotas, recibos y pagos del condominio
        </p>

        {/* Selector de condominio para super_admin */}
        {isSuperAdmin && condominios && condominios.length > 0 && (
          <div style={{
            backgroundColor: '#F4F7F5',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', whiteSpace: 'nowrap' }}>
              Condominio:
            </span>
            <select
              value={selectedCondoId}
              onChange={e => setSelectedCondoId(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #C8D4CB',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0D1117',
                fontFamily: "'Inter', sans-serif",
                backgroundColor: 'white',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {condominios.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div style={{
            backgroundColor: '#FCEAEA',
            borderLeft: '3px solid #B83232',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#B83232',
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{pdfError}</span>
            <button onClick={() => setPdfError(null)} style={{ background: 'none', border: 'none', color: '#B83232', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>✕</button>
          </div>
        )}

        {/* Balance */}
        <Balance condominioId={activeCondoId} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Morosos */}
        <Morosos
          condominioId={activeCondoId}
          condominioNombre={condoNombre}
          condominioDir={condoDir}
          condomionioCiudad={condoCiudad}
        />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Gastos */}
        <Gastos condominioId={activeCondoId} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Cuotas */}
        <ConfiguradorCuotas condominioId={activeCondoId} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Pagos pendientes */}
        <PagosPendientes condominioId={activeCondoId} />

        <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '32px 0' }} />

        {/* Recibos */}
        <ListaRecibos
          condominioId={activeCondoId}
          condominioNombre={condoNombre}
          condominioDir={condoDir}
          condomionioCiudad={condoCiudad}
        />
      </div>
    </AdminLayout>
  )
}
