import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import PropuestaPDF from '@/components/crm/PropuestaPDF'
import AdminLayout from '@/components/layout/AdminLayout'

type Estado = 'borrador' | 'enviada' | 'en_negociacion' | 'aprobada' | 'rechazada' | 'en_pausa' | 'vencida'

interface Propuesta {
  id: string
  numero_propuesta: string | null
  nombre_prospecto: string
  telefono: string | null
  email: string | null
  nombre_condominio: string
  direccion: string | null
  ciudad: string | null
  num_pisos: number
  num_departamentos: number
  visitas_semanales: number
  precio_calculado: number
  precio_final: number
  estado: Estado
  notas: string | null
  condominio_creado_id: string | null
  created_at: string
  administradora_enabled: boolean
  administradora_sueldo: number
  beneficios_json: Record<string, unknown>
  utilidad_pct: number
  utilidad_adicional: number
}

const ESTADOS: { value: Estado; label: string; color: string; bg: string }[] = [
  { value: 'borrador', label: 'Borrador', color: '#5E6B62', bg: '#F0F0F0' },
  { value: 'enviada', label: 'Enviada', color: '#0D4A8F', bg: '#EBF4FF' },
  { value: 'en_negociacion', label: 'En negociacion', color: '#C07A2E', bg: '#FEF9EC' },
  { value: 'aprobada', label: 'Aprobada', color: '#1A7A4A', bg: '#E8F4F0' },
  { value: 'rechazada', label: 'Rechazada', color: '#B83232', bg: '#FCEAEA' },
  { value: 'en_pausa', label: 'En pausa', color: '#5E6B62', bg: '#F4F7F5' },
  { value: 'vencida', label: 'Vencida', color: '#B83232', bg: '#FCEAEA' },
]

function calcularPrecio(visitasActivo: boolean, diasVisita: number, adminActivo: boolean, sueldoAdmin: number, totalBeneficios: number, utilidadPct: number, utilidadAdicional: number): number {
  const costoVisitas = visitasActivo ? (3300 / 30) * diasVisita : 0
  const costoAdmin = adminActivo ? sueldoAdmin + totalBeneficios : 0
  const totalCostos = 350 + costoVisitas + costoAdmin
  const utilidad = totalCostos * utilidadPct / 100
  return totalCostos + utilidad + utilidadAdicional
}

function getEstadoStyle(estado: Estado) {
  return ESTADOS.find(e => e.value === estado) || ESTADOS[0]
}

export default function CRM() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [vista, setVista] = useState<'lista' | 'form'>('lista')
  const [editando, setEditando] = useState<Propuesta | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<Estado | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')

  // Form state
  const [nombreProspecto, setNombreProspecto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [nombreCondominio, setNombreCondominio] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [numDptos, setNumDptos] = useState(20)
  const [visitasActivo, setVisitasActivo] = useState(false)
  const [diasVisita, setDiasVisita] = useState(10)
  const [adminActivo, setAdminActivo] = useState(false)
  const [sueldoAdmin, setSueldoAdmin] = useState(3000)
  const [beneficiosExpandido, setBeneficiosExpandido] = useState(false)
  // Benefits checkboxes
  const [benAguinaldo, setBenAguinaldo] = useState(false)
  const [benAfp, setBenAfp] = useState(false)
  const [benCns, setBenCns] = useState(false)
  const [benProBolivia, setBenProBolivia] = useState(false)
  const [benRiesgos, setBenRiesgos] = useState(false)
  const [benVacaciones, setBenVacaciones] = useState(false)
  const [benAntiguedad, setBenAntiguedad] = useState(false)
  const [pctAntiguedad, setPctAntiguedad] = useState(5)
  const [benFrontera, setBenFrontera] = useState(false)
  const [benProduccion, setBenProduccion] = useState(false)
  const [montoProduccion, setMontoProduccion] = useState(500)
  const [benPolizaAcc, setBenPolizaAcc] = useState(false)
  const [montoPolizaAcc, setMontoPolizaAcc] = useState(1200)
  const [benPolizaRC, setBenPolizaRC] = useState(false)
  const [montoPolizaRC, setMontoPolizaRC] = useState(1200)
  const [utilidadPct, setUtilidadPct] = useState(0)
  const [utilidadAdicional, setUtilidadAdicional] = useState(0)
  const [notas, setNotas] = useState('')

  const totalBeneficios = adminActivo ? (
    (benAguinaldo ? sueldoAdmin / 12 : 0) +
    (benAfp ? sueldoAdmin * 0.03 : 0) +
    (benCns ? sueldoAdmin * 0.10 : 0) +
    (benProBolivia ? sueldoAdmin * 0.02 : 0) +
    (benRiesgos ? sueldoAdmin * 0.0171 : 0) +
    (benVacaciones ? (sueldoAdmin / 30 * 15 / 12) : 0) +
    (benAntiguedad ? sueldoAdmin * pctAntiguedad / 100 : 0) +
    (benFrontera ? sueldoAdmin * 0.20 : 0) +
    (benProduccion ? montoProduccion : 0) +
    (benPolizaAcc ? montoPolizaAcc / 12 : 0) +
    (benPolizaRC ? montoPolizaRC / 12 : 0)
  ) : 0

  const precioCalc = calcularPrecio(visitasActivo, diasVisita, adminActivo, sueldoAdmin, totalBeneficios, utilidadPct, utilidadAdicional)
  const totalCostosBase = (() => {
    const costoVisitas = visitasActivo ? (3300 / 30) * diasVisita : 0
    const costoAdmin = adminActivo ? sueldoAdmin + totalBeneficios : 0
    return 350 + costoVisitas + costoAdmin
  })()

  const { data: propuestas = [], isLoading } = useQuery({
    queryKey: ['propuestas-crm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propuestas_crm')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Propuesta[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (input: any) => {
      if (editando) {
        const { error } = await supabase.from('propuestas_crm').update(input).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('propuestas_crm').insert(input)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propuestas-crm'] })
      resetForm()
    },
  })

  const estadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Estado }) => {
      const { error } = await supabase.from('propuestas_crm').update({ estado, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['propuestas-crm'] }),
  })

  const crearCondominioMutation = useMutation({
    mutationFn: async (prop: Propuesta) => {
      const { data, error } = await supabase.from('condominios').insert({
        nombre: prop.nombre_condominio,
        direccion: prop.direccion,
        ciudad: prop.ciudad,
        admin_id: profile!.id,
      }).select('id').single()
      if (error) throw error
      await supabase.from('propuestas_crm').update({ condominio_creado_id: data.id }).eq('id', prop.id)
      return data.id
    },
    onSuccess: (condoId) => {
      qc.invalidateQueries({ queryKey: ['propuestas-crm'] })
      navigate(`/admin/condominio/${condoId}/configurar`)
    },
  })

  function resetForm() {
    setVista('lista')
    setEditando(null)
    setNombreProspecto('')
    setTelefono('')
    setEmail('')
    setNombreCondominio('')
    setDireccion('')
    setCiudad('')
    setNumDptos(20)
    setVisitasActivo(false)
    setDiasVisita(10)
    setAdminActivo(false)
    setSueldoAdmin(3000)
    setBeneficiosExpandido(false)
    setBenAguinaldo(false); setBenAfp(false); setBenCns(false); setBenProBolivia(false)
    setBenRiesgos(false); setBenVacaciones(false); setBenAntiguedad(false); setPctAntiguedad(5)
    setBenFrontera(false); setBenProduccion(false); setMontoProduccion(500)
    setBenPolizaAcc(false); setMontoPolizaAcc(1200); setBenPolizaRC(false); setMontoPolizaRC(1200)
    setUtilidadPct(0); setUtilidadAdicional(0)
    setNotas('')
  }

  function abrirEditar(p: Propuesta) {
    setEditando(p)
    setVista('form')
  }

  // Pre-populate calculator state whenever editando changes
  useEffect(() => {
    if (!editando) return
    const p = editando
    setNombreProspecto(p.nombre_prospecto)
    setTelefono(p.telefono || '')
    setEmail(p.email || '')
    setNombreCondominio(p.nombre_condominio)
    setDireccion(p.direccion || '')
    setCiudad(p.ciudad || '')
    setNumDptos(p.num_departamentos)
    // Visitas
    setVisitasActivo(p.visitas_semanales > 0)
    setDiasVisita(p.visitas_semanales > 0 ? p.visitas_semanales : 10)
    // Administradora
    setAdminActivo(!!p.administradora_enabled)
    setSueldoAdmin(Number(p.administradora_sueldo) || 3000)
    // Benefits
    const b: Record<string, unknown> = p.beneficios_json || {}
    setBeneficiosExpandido(false)
    setBenAguinaldo(!!b.aguinaldo); setBenAfp(!!b.afp); setBenCns(!!b.cns)
    setBenProBolivia(!!b.pro_bolivia); setBenRiesgos(!!b.riesgos); setBenVacaciones(!!b.vacaciones)
    setBenAntiguedad(!!b.antiguedad); setPctAntiguedad(Number(b.pct_antiguedad) || 5)
    setBenFrontera(!!b.frontera)
    setBenProduccion(!!b.produccion); setMontoProduccion(Number(b.monto_produccion) || 500)
    setBenPolizaAcc(!!b.poliza_acc); setMontoPolizaAcc(Number(b.monto_poliza_acc) || 1200)
    setBenPolizaRC(!!b.poliza_rc); setMontoPolizaRC(Number(b.monto_poliza_rc) || 1200)
    // Utilidad
    setUtilidadPct(Number(p.utilidad_pct) || 0)
    setUtilidadAdicional(Number(p.utilidad_adicional) || 0)
    setNotas(p.notas || '')
  }, [editando])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate({
      nombre_prospecto: nombreProspecto,
      telefono: telefono || null,
      email: email || null,
      nombre_condominio: nombreCondominio,
      direccion: direccion || null,
      ciudad: ciudad || null,
      num_pisos: 1,
      num_departamentos: numDptos,
      visitas_semanales: visitasActivo ? diasVisita : 0,
      administradora_enabled: adminActivo,
      administradora_sueldo: adminActivo ? sueldoAdmin : 0,
      beneficios_json: adminActivo ? {
        aguinaldo: benAguinaldo, afp: benAfp, cns: benCns, pro_bolivia: benProBolivia,
        riesgos: benRiesgos, vacaciones: benVacaciones,
        antiguedad: benAntiguedad, pct_antiguedad: pctAntiguedad,
        frontera: benFrontera,
        produccion: benProduccion, monto_produccion: montoProduccion,
        poliza_acc: benPolizaAcc, monto_poliza_acc: montoPolizaAcc,
        poliza_rc: benPolizaRC, monto_poliza_rc: montoPolizaRC,
      } : {},
      utilidad_pct: utilidadPct,
      utilidad_adicional: utilidadAdicional,
      precio_calculado: precioCalc,
      precio_final: precioCalc,
      notas: notas || null,
      ...(!editando && { created_by: profile!.id, estado: 'borrador' }),
      updated_at: new Date().toISOString(),
    })
  }

  async function handlePDF(p: Propuesta) {
    const blob = await pdf(<PropuestaPDF propuesta={p as any} />).toBlob()
    window.open(URL.createObjectURL(blob), '_blank')
  }

  // KPIs
  const total = propuestas.length
  const aprobadas = propuestas.filter(p => p.estado === 'aprobada').length
  const pendientes = propuestas.filter(p => ['enviada', 'en_negociacion'].includes(p.estado)).length
  const rechazadas = propuestas.filter(p => p.estado === 'rechazada').length
  const montoAprobado = propuestas.filter(p => p.estado === 'aprobada').reduce((s, p) => s + Number(p.precio_final), 0)
  const montoPendientes = propuestas.filter(p => ['enviada', 'en_negociacion'].includes(p.estado)).reduce((s, p) => s + Number(p.precio_final), 0)
  const montoRechazadas = propuestas.filter(p => p.estado === 'rechazada').reduce((s, p) => s + Number(p.precio_final), 0)
  const pipeline = propuestas.filter(p => ['enviada', 'en_negociacion', 'borrador'].includes(p.estado)).reduce((s, p) => s + Number(p.precio_final), 0)
  const tasaConversion = total > 0 ? Math.round((aprobadas / total) * 100) : 0

  const propuestasFiltradas = propuestas.filter(p => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        p.nombre_prospecto.toLowerCase().includes(q) ||
        p.nombre_condominio.toLowerCase().includes(q) ||
        (p.numero_propuesta && p.numero_propuesta.toLowerCase().includes(q)) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(q))
      )
    }
    return true
  })

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '14px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: '13px', fontWeight: 500 as const, color: '#0D1117', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }

  return (
    <AdminLayout title="CRM / Pre-venta">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {vista === 'lista' ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 800, color: '#0D1117', margin: '0 0 4px' }}>CRM / Pre-venta</h1>
                <p style={{ color: '#5E6B62', fontSize: '13px', margin: 0, fontFamily: "'Inter', sans-serif" }}>Propuestas comerciales para nuevos condominios</p>
              </div>
              <button onClick={() => { resetForm(); setVista('form') }} style={{ padding: '10px 20px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
                + Nueva propuesta
              </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Total', value: total, color: '#0D1117', bg: 'white', monto: null },
                { label: 'Aprobadas', value: aprobadas, color: '#1A7A4A', bg: '#E8F4F0', monto: montoAprobado },
                { label: 'Pendientes', value: pendientes, color: '#C07A2E', bg: '#FEF9EC', monto: montoPendientes },
                { label: 'Rechazadas', value: rechazadas, color: '#B83232', bg: '#FCEAEA', monto: montoRechazadas },
                { label: 'Conversion', value: `${tasaConversion}%`, color: '#0D4A8F', bg: '#EBF4FF', monto: null },
                { label: 'Aprobado/mes', value: `Bs. ${montoAprobado.toFixed(0)}`, color: '#1A7A4A', bg: '#E8F4F0', monto: null },
                { label: 'Pipeline', value: `Bs. ${pipeline.toFixed(0)}`, color: '#C07A2E', bg: '#FEF9EC', monto: null },
              ].map(k => (
                <div key={k.label} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#5E6B62', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif", marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800, color: k.color, backgroundColor: k.bg, borderRadius: '8px', padding: '4px 8px', display: 'inline-block' }}>{k.value}</div>
                  {k.monto !== null && (
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700, color: k.color, marginTop: '4px' }}>Bs. {k.monto.toLocaleString('es-BO')}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Filtros y búsqueda */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, condominio, numero..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none' }}
              />
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as Estado | 'todos')}
                style={{ padding: '10px 14px', border: '1px solid #C8D4CB', borderRadius: '10px', fontSize: '13px', color: '#0D1117', fontFamily: "'Inter', sans-serif", outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              {(filtroEstado !== 'todos' || busqueda) && (
                <button
                  onClick={() => { setFiltroEstado('todos'); setBusqueda('') }}
                  style={{ padding: '10px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  Limpiar filtros
                </button>
              )}
              <span style={{ fontSize: '12px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>
                {propuestasFiltradas.length} de {propuestas.length}
              </span>
            </div>

            {/* Lista */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>
            ) : propuestasFiltradas.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', marginBottom: '8px' }}>Sin propuestas</div>
                <p style={{ fontSize: '13px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Crea tu primera propuesta comercial</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {propuestasFiltradas.map(p => {
                  const est = getEstadoStyle(p.estado)
                  return (
                    <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.numero_propuesta && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D4A8F', backgroundColor: '#EBF4FF', padding: '2px 8px', borderRadius: '4px', fontFamily: "'Inter', sans-serif" }}>{p.numero_propuesta}</span>
                            )}
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117' }}>{p.nombre_condominio}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#5E6B62', marginTop: '2px' }}>
                            {p.nombre_prospecto}{p.ciudad ? ` · ${p.ciudad}` : ''} · {p.num_departamentos} dptos
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: est.color, backgroundColor: est.bg }}>{est.label}</span>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 800, color: '#1A7A4A' }}>Bs. {Number(p.precio_final).toFixed(0)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => abrirEditar(p)} style={{ padding: '6px 14px', backgroundColor: '#F4F7F5', color: '#0D1117', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Editar</button>
                        <button onClick={() => handlePDF(p)} style={{ padding: '6px 14px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>PDF</button>

                        {/* Estado transitions */}
                        {p.estado === 'borrador' && (
                          <button onClick={() => estadoMutation.mutate({ id: p.id, estado: 'enviada' })} style={{ padding: '6px 14px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Marcar enviada</button>
                        )}
                        {p.estado === 'enviada' && (
                          <button onClick={() => estadoMutation.mutate({ id: p.id, estado: 'en_negociacion' })} style={{ padding: '6px 14px', backgroundColor: '#FEF9EC', color: '#C07A2E', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>En negociacion</button>
                        )}
                        {['enviada', 'en_negociacion'].includes(p.estado) && (
                          <>
                            <button onClick={() => estadoMutation.mutate({ id: p.id, estado: 'aprobada' })} style={{ padding: '6px 14px', backgroundColor: '#E8F4F0', color: '#1A7A4A', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Aprobar</button>
                            <button onClick={() => estadoMutation.mutate({ id: p.id, estado: 'rechazada' })} style={{ padding: '6px 14px', backgroundColor: '#FCEAEA', color: '#B83232', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Rechazar</button>
                          </>
                        )}
                        {p.estado === 'aprobada' && !p.condominio_creado_id && (
                          <button onClick={() => crearCondominioMutation.mutate(p)} disabled={crearCondominioMutation.isPending} style={{ padding: '6px 14px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                            {crearCondominioMutation.isPending ? '...' : 'Crear condominio'}
                          </button>
                        )}
                        {p.estado === 'aprobada' && p.condominio_creado_id && (
                          <button onClick={() => navigate(`/admin/condominio/${p.condominio_creado_id}/configurar`)} style={{ padding: '6px 14px', backgroundColor: '#E8F4F0', color: '#1A7A4A', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Ver condominio</button>
                        )}
                        {!['en_pausa', 'vencida', 'rechazada'].includes(p.estado) && p.estado !== 'aprobada' && (
                          <button onClick={() => estadoMutation.mutate({ id: p.id, estado: 'en_pausa' })} style={{ padding: '6px 14px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Pausar</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* FORMULARIO */
          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
              {editando ? 'Editar Propuesta' : 'Nueva Propuesta'}
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '24px' }}>
              Datos del prospecto y calculadora de precio
            </p>

            <form onSubmit={handleSave}>
              {/* Prospecto */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>Datos del prospecto</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Nombre contacto *</label>
                  <input value={nombreProspecto} onChange={e => setNombreProspecto(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre condominio *</label>
                  <input value={nombreCondominio} onChange={e => setNombreCondominio(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Telefono</label>
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ciudad</label>
                  <input value={ciudad} onChange={e => setCiudad(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Direccion</label>
                <input value={direccion} onChange={e => setDireccion(e.target.value)} style={inputStyle} />
              </div>

              {/* Calculadora */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>Calculadora de precio</div>

              {/* Departamentos */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Departamentos</label>
                <input type="number" min={1} value={numDptos} onChange={e => setNumDptos(Number(e.target.value))} style={{ ...inputStyle, width: '200px' }} />
              </div>

              {/* Opciones: Administradora + Visitas diarias */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Administradora */}
                <div style={{ backgroundColor: adminActivo ? '#E8F4F0' : '#F4F7F5', borderRadius: '12px', padding: '16px', border: `1px solid ${adminActivo ? '#0D9E6E' : '#C8D4CB'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: adminActivo ? '12px' : '0' }}>
                    <input type="checkbox" checked={adminActivo} onChange={e => { setAdminActivo(e.target.checked) }}
                      style={{ width: '18px', height: '18px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Administradora</span>
                  </label>
                  {adminActivo && (
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Sueldo mensual (Bs.)</label>
                      <input type="number" min={0} value={sueldoAdmin} onChange={e => { setSueldoAdmin(Number(e.target.value)) }} style={inputStyle} />

                      {/* Beneficios salariales */}
                      <button type="button" onClick={() => setBeneficiosExpandido(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 700, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>
                        <span style={{ fontSize: '10px' }}>{beneficiosExpandido ? '▼' : '▶'}</span>
                        Beneficios salariales
                        {totalBeneficios > 0 && <span style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— Bs. {totalBeneficios.toFixed(0)}/mes</span>}
                      </button>

                      {beneficiosExpandido && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { label: 'Aguinaldo', value: sueldoAdmin / 12, checked: benAguinaldo, set: setBenAguinaldo, extra: null },
                            { label: 'AFP', value: sueldoAdmin * 0.03, checked: benAfp, set: setBenAfp, extra: null },
                            { label: 'CNS', value: sueldoAdmin * 0.10, checked: benCns, set: setBenCns, extra: null },
                            { label: 'PRO-Bolivia', value: sueldoAdmin * 0.02, checked: benProBolivia, set: setBenProBolivia, extra: null },
                            { label: 'Seg. Riesgos Laborales', value: sueldoAdmin * 0.0171, checked: benRiesgos, set: setBenRiesgos, extra: null },
                            { label: 'Vacaciones', value: (sueldoAdmin / 30 * 15 / 12), checked: benVacaciones, set: setBenVacaciones, extra: null },
                          ].map(b => (
                            <label key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={b.checked} onChange={e => { b.set(e.target.checked) }}
                                  style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>{b.label}</span>
                              </div>
                              <span style={{ fontSize: '12px', color: b.checked ? '#1A7A4A' : '#5E6B62', fontWeight: b.checked ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                Bs. {b.value.toFixed(0)}
                              </span>
                            </label>
                          ))}

                          {/* Bono Antigüedad */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" checked={benAntiguedad} onChange={e => { setBenAntiguedad(e.target.checked) }}
                                style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Bono Antiguedad</span>
                              <input type="number" min={0} max={100} value={pctAntiguedad} onChange={e => { setPctAntiguedad(Number(e.target.value)) }}
                                style={{ width: '52px', padding: '3px 6px', border: '1px solid #C8D4CB', borderRadius: '6px', fontSize: '12px', fontFamily: "'Inter', sans-serif", outline: 'none' }} />
                              <span style={{ fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>%</span>
                            </div>
                            <span style={{ fontSize: '12px', color: benAntiguedad ? '#1A7A4A' : '#5E6B62', fontWeight: benAntiguedad ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              Bs. {(sueldoAdmin * pctAntiguedad / 100).toFixed(0)}
                            </span>
                          </div>

                          {/* Subsidio Frontera */}
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" checked={benFrontera} onChange={e => { setBenFrontera(e.target.checked) }}
                                style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Subsidio Frontera</span>
                            </div>
                            <span style={{ fontSize: '12px', color: benFrontera ? '#1A7A4A' : '#5E6B62', fontWeight: benFrontera ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              Bs. {(sueldoAdmin * 0.20).toFixed(0)}
                            </span>
                          </label>

                          {/* Bono Producción */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" checked={benProduccion} onChange={e => { setBenProduccion(e.target.checked) }}
                                style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Bono Produccion</span>
                              <input type="number" min={0} value={montoProduccion} onChange={e => { setMontoProduccion(Number(e.target.value)) }}
                                style={{ width: '72px', padding: '3px 6px', border: '1px solid #C8D4CB', borderRadius: '6px', fontSize: '12px', fontFamily: "'Inter', sans-serif", outline: 'none' }} />
                              <span style={{ fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Bs/mes</span>
                            </div>
                            <span style={{ fontSize: '12px', color: benProduccion ? '#1A7A4A' : '#5E6B62', fontWeight: benProduccion ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              Bs. {montoProduccion.toFixed(0)}
                            </span>
                          </div>

                          {/* Póliza Accidentes Personales */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <input type="checkbox" checked={benPolizaAcc} onChange={e => { setBenPolizaAcc(e.target.checked) }}
                                style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>Poliza Acc.</span>
                              <input type="number" min={0} value={montoPolizaAcc} onChange={e => { setMontoPolizaAcc(Number(e.target.value)) }}
                                style={{ width: '72px', padding: '3px 6px', border: '1px solid #C8D4CB', borderRadius: '6px', fontSize: '12px', fontFamily: "'Inter', sans-serif", outline: 'none' }} />
                              <span style={{ fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Bs/año</span>
                            </div>
                            <span style={{ fontSize: '12px', color: benPolizaAcc ? '#1A7A4A' : '#5E6B62', fontWeight: benPolizaAcc ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              Bs. {(montoPolizaAcc / 12).toFixed(0)}
                            </span>
                          </div>

                          {/* Póliza Responsabilidad Civil */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <input type="checkbox" checked={benPolizaRC} onChange={e => { setBenPolizaRC(e.target.checked) }}
                                style={{ width: '15px', height: '15px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', color: '#0D1117', fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>Poliza RC</span>
                              <input type="number" min={0} value={montoPolizaRC} onChange={e => { setMontoPolizaRC(Number(e.target.value)) }}
                                style={{ width: '72px', padding: '3px 6px', border: '1px solid #C8D4CB', borderRadius: '6px', fontSize: '12px', fontFamily: "'Inter', sans-serif", outline: 'none' }} />
                              <span style={{ fontSize: '11px', color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Bs/año</span>
                            </div>
                            <span style={{ fontSize: '12px', color: benPolizaRC ? '#1A7A4A' : '#5E6B62', fontWeight: benPolizaRC ? 600 : 400, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              Bs. {(montoPolizaRC / 12).toFixed(0)}
                            </span>
                          </div>

                          {/* Total beneficios */}
                          <div style={{ borderTop: '1px solid #C8D4CB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', fontFamily: "'Inter', sans-serif" }}>Beneficios por administradora:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A7A4A', fontFamily: "'Nunito', sans-serif" }}>Bs. {totalBeneficios.toFixed(0)}/mes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Visitas diarias */}
                <div style={{ backgroundColor: visitasActivo ? '#E8F4F0' : '#F4F7F5', borderRadius: '12px', padding: '16px', border: `1px solid ${visitasActivo ? '#0D9E6E' : '#C8D4CB'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: visitasActivo ? '12px' : '0' }}>
                    <input type="checkbox" checked={visitasActivo} onChange={e => { setVisitasActivo(e.target.checked) }}
                      style={{ width: '18px', height: '18px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Visitas diarias</span>
                  </label>
                  {visitasActivo && (
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Dias de visita al mes</label>
                      <input type="number" min={1} max={31} value={diasVisita} onChange={e => { setDiasVisita(Number(e.target.value)) }} style={inputStyle} />
                    </div>
                  )}
                </div>
              </div>

              {/* Utilidad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Porcentaje de utilidad (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={utilidadPct}
                    onChange={e => setUtilidadPct(Number(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Utilidad adicional (Bs.)</label>
                  <input type="number" min={0} value={utilidadAdicional}
                    onChange={e => setUtilidadAdicional(Number(e.target.value))} style={inputStyle} />
                </div>
              </div>

              {/* Desglose */}
              <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', marginBottom: '10px', fontFamily: "'Inter', sans-serif" }}>Desglose del precio</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
                  {adminActivo && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#5E6B62' }}>Administradora (sueldo)</span>
                        <span style={{ fontWeight: 600 }}>Bs. {sueldoAdmin.toLocaleString('es-BO')}</span>
                      </div>
                      {totalBeneficios > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#5E6B62' }}>Beneficios salariales</span>
                          <span style={{ fontWeight: 600 }}>Bs. {totalBeneficios.toFixed(0)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {visitasActivo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5E6B62' }}>Visitas diarias ({diasVisita}d)</span>
                      <span style={{ fontWeight: 600 }}>Bs. {((3300 / 30) * diasVisita).toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#5E6B62' }}>App DOMIA</span>
                    <span style={{ fontWeight: 600 }}>Bs. 350</span>
                  </div>
                  {utilidadPct > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5E6B62' }}>Utilidad ({utilidadPct}%)</span>
                      <span style={{ fontWeight: 600 }}>Bs. {(totalCostosBase * utilidadPct / 100).toFixed(0)}</span>
                    </div>
                  )}
                  {utilidadAdicional > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5E6B62' }}>Utilidad adicional</span>
                      <span style={{ fontWeight: 600 }}>Bs. {utilidadAdicional.toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#1A7A4A', fontSize: '15px', fontFamily: "'Nunito', sans-serif" }}>PRECIO FINAL</span>
                    <span style={{ fontWeight: 800, color: '#1A7A4A', fontSize: '18px', fontFamily: "'Nunito', sans-serif" }}>Bs. {precioCalc.toLocaleString('es-BO')}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Notas</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Error */}
              {saveMutation.error && (
                <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#B83232', marginBottom: '16px', fontFamily: "'Inter', sans-serif" }}>
                  {(saveMutation.error as Error).message}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={saveMutation.isPending} style={{ flex: 1, padding: '14px', backgroundColor: saveMutation.isPending ? '#5E6B62' : '#1A7A4A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: saveMutation.isPending ? 'not-allowed' : 'pointer' }}>
                  {saveMutation.isPending ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear propuesta'}
                </button>
                <button type="button" onClick={resetForm} style={{ padding: '14px 24px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
