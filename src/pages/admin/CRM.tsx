import { useState } from 'react'
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

function calcularPrecio(visitasActivo: boolean, diasVisita: number, adminActivo: boolean, sueldoAdmin: number): number {
  const costoVisitas = visitasActivo ? (3300 / 30) * diasVisita : 0
  const costoAdmin = adminActivo ? sueldoAdmin : 0
  return 350 + costoVisitas + costoAdmin
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
  const [precioFinal, setPrecioFinal] = useState(350)
  const [notas, setNotas] = useState('')

  const precioCalc = calcularPrecio(visitasActivo, diasVisita, adminActivo, sueldoAdmin)

  // Sync precioFinal when params change (only if user hasn't manually overridden)
  const [precioManual, setPrecioManual] = useState(false)
  const precioMostrado = precioManual ? precioFinal : precioCalc

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
    setPrecioFinal(350)
    setPrecioManual(false)
    setNotas('')
  }

  function abrirEditar(p: Propuesta) {
    setEditando(p)
    setNombreProspecto(p.nombre_prospecto)
    setTelefono(p.telefono || '')
    setEmail(p.email || '')
    setNombreCondominio(p.nombre_condominio)
    setDireccion(p.direccion || '')
    setCiudad(p.ciudad || '')
    setNumDptos(p.num_departamentos)
    const dias = p.visitas_semanales > 0 ? p.visitas_semanales : 10
    setVisitasActivo(p.visitas_semanales > 0)
    setDiasVisita(dias)
    setAdminActivo(false)
    setSueldoAdmin(3000)
    setPrecioFinal(p.precio_final)
    setPrecioManual(true)
    setNotas(p.notas || '')
    setVista('form')
  }

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
      precio_calculado: precioCalc,
      precio_final: precioMostrado,
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
                    <input type="checkbox" checked={adminActivo} onChange={e => { setAdminActivo(e.target.checked); setPrecioManual(false) }}
                      style={{ width: '18px', height: '18px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Administradora</span>
                  </label>
                  {adminActivo && (
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Sueldo mensual (Bs.)</label>
                      <input type="number" min={0} value={sueldoAdmin} onChange={e => { setSueldoAdmin(Number(e.target.value)); setPrecioManual(false) }} style={inputStyle} />
                    </div>
                  )}
                </div>

                {/* Visitas diarias */}
                <div style={{ backgroundColor: visitasActivo ? '#E8F4F0' : '#F4F7F5', borderRadius: '12px', padding: '16px', border: `1px solid ${visitasActivo ? '#0D9E6E' : '#C8D4CB'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: visitasActivo ? '12px' : '0' }}>
                    <input type="checkbox" checked={visitasActivo} onChange={e => { setVisitasActivo(e.target.checked); setPrecioManual(false) }}
                      style={{ width: '18px', height: '18px', accentColor: '#0D9E6E', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0D1117', fontFamily: "'Inter', sans-serif" }}>Visitas diarias</span>
                  </label>
                  {visitasActivo && (
                    <div>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>Dias de visita al mes</label>
                      <input type="number" min={1} max={31} value={diasVisita} onChange={e => { setDiasVisita(Number(e.target.value)); setPrecioManual(false) }} style={inputStyle} />
                    </div>
                  )}
                </div>
              </div>

              {/* Desglose */}
              <div style={{ backgroundColor: '#F4F7F5', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5E6B62', marginBottom: '10px', fontFamily: "'Inter', sans-serif" }}>Desglose del precio</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
                  {adminActivo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#5E6B62' }}>Administradora</span>
                      <span style={{ fontWeight: 600 }}>Bs. {sueldoAdmin.toLocaleString('es-BO')}</span>
                    </div>
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
                  <div style={{ height: '1px', backgroundColor: '#C8D4CB', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#1A7A4A', fontSize: '15px', fontFamily: "'Nunito', sans-serif" }}>TOTAL</span>
                    <span style={{ fontWeight: 800, color: '#1A7A4A', fontSize: '18px', fontFamily: "'Nunito', sans-serif" }}>Bs. {precioCalc.toLocaleString('es-BO')}</span>
                  </div>
                </div>
              </div>

              {/* Precio final override */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Precio final (puedes ajustar manualmente)</label>
                <input type="number" min={0} value={precioMostrado} onChange={e => { setPrecioFinal(Number(e.target.value)); setPrecioManual(true) }} style={{ ...inputStyle, fontWeight: 700, fontSize: '16px', color: '#1A7A4A' }} />
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
