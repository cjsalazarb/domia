import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generarTemplateCondominio, parsearExcel, type FilaExcel } from '@/lib/generarTemplateExcel'

type EstadoFila = 'ok' | 'advertencia' | 'error'

interface FilaValidada extends FilaExcel {
  estado: EstadoFila
  errores: string[]
  unidad_id: string | null
}

interface ResultadoImport {
  exitosos: number
  fallidos: number
  errores: { fila: number; unidad: string; error: string }[]
}

interface Props {
  condominioId: string
  condominioNombre: string
  onBack: () => void
  onComplete: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ImportarResidentes({ condominioId, condominioNombre, onBack, onComplete }: Props) {
  const [filas, setFilas] = useState<FilaValidada[]>([])
  const [archivo, setArchivo] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImport | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: unidades } = useQuery({
    queryKey: ['unidades', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, numero, tipo, piso')
        .eq('condominio_id', condominioId)
        .eq('activa', true)
        .order('numero')
      if (error) throw error
      return data as { id: string; numero: string; tipo: string; piso: number | null }[]
    },
  })

  const { data: residentes } = useQuery({
    queryKey: ['residentes-ci', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residentes')
        .select('ci')
        .eq('condominio_id', condominioId)
        .not('ci', 'is', null)
      if (error) throw error
      return data as { ci: string }[]
    },
  })

  const cisExistentes = new Set((residentes || []).map(r => r.ci))

  const validarFilas = useCallback((raw: FilaExcel[]): FilaValidada[] => {
    const unidadesMap = new Map((unidades || []).map(u => [u.numero, u]))
    const cisSeen = new Set<string>()

    return raw.map(fila => {
      const errores: string[] = []
      const u = unidadesMap.get(fila.numero_unidad)

      if (!fila.numero_unidad) {
        errores.push('N\u00b0 unidad vac\u00edo')
      } else if (!u) {
        errores.push(`Unidad "${fila.numero_unidad}" no existe`)
      }

      const tienePropietario = fila.nombre_propietario && fila.apellido_propietario
      const tieneInquilino = fila.nombre_inquilino && fila.apellido_inquilino

      if (!tienePropietario && !tieneInquilino) {
        errores.push('Debe tener al menos propietario o inquilino')
      }

      if (fila.email && !EMAIL_REGEX.test(fila.email)) {
        errores.push('Email propietario inv\u00e1lido')
      }
      if (fila.email_inquilino && !EMAIL_REGEX.test(fila.email_inquilino)) {
        errores.push('Email inquilino inv\u00e1lido')
      }

      if (fila.ci) {
        if (cisExistentes.has(fila.ci)) {
          errores.push(`CI "${fila.ci}" ya existe en el condominio`)
        }
        if (cisSeen.has(fila.ci)) {
          errores.push(`CI "${fila.ci}" duplicado en el archivo`)
        }
        cisSeen.add(fila.ci)
      }

      if (fila.ci_inquilino) {
        if (cisExistentes.has(fila.ci_inquilino)) {
          errores.push(`CI inquilino "${fila.ci_inquilino}" ya existe`)
        }
        if (cisSeen.has(fila.ci_inquilino)) {
          errores.push(`CI inquilino "${fila.ci_inquilino}" duplicado`)
        }
        cisSeen.add(fila.ci_inquilino)
      }

      if (fila.pagador_cuota && !['propietario', 'inquilino'].includes(fila.pagador_cuota)) {
        errores.push('Pagador cuota debe ser "propietario" o "inquilino"')
      }

      const advertencias = !tienePropietario && tieneInquilino
      let estado: EstadoFila = 'ok'
      if (errores.length > 0) estado = 'error'
      else if (advertencias || (!fila.email && tienePropietario) || (!fila.ci && tienePropietario)) estado = 'advertencia'

      return { ...fila, estado, errores, unidad_id: u?.id || null }
    })
  }, [unidades, cisExistentes])

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)')
      return
    }
    setArchivo(file.name)
    setResultado(null)
    try {
      const raw = await parsearExcel(file)
      setFilas(validarFilas(raw))
    } catch {
      alert('Error al leer el archivo Excel')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImportar = async () => {
    const validas = filas.filter(f => f.estado !== 'error')
    if (validas.length === 0) return

    setImporting(true)
    const result: ResultadoImport = { exitosos: 0, fallidos: 0, errores: [] }

    for (let i = 0; i < validas.length; i++) {
      const fila = validas[i]
      try {
        let propietarioDbId: string | null = null

        // Insert propietario if data present
        if (fila.nombre_propietario && fila.apellido_propietario) {
          const { data: prop, error: propErr } = await supabase
            .from('residentes')
            .insert({
              condominio_id: condominioId,
              unidad_id: fila.unidad_id!,
              tipo: 'propietario',
              nombre: fila.nombre_propietario,
              apellido: fila.apellido_propietario,
              ci: fila.ci || null,
              telefono: fila.telefono || null,
              email: fila.email || null,
              estado: 'activo',
            })
            .select('id')
            .single()

          if (propErr) throw new Error(propErr.message)
          propietarioDbId = prop.id
          result.exitosos++
        }

        // Insert inquilino if data present
        if (fila.nombre_inquilino && fila.apellido_inquilino) {
          const { error: inqErr } = await supabase
            .from('residentes')
            .insert({
              condominio_id: condominioId,
              unidad_id: fila.unidad_id!,
              tipo: 'inquilino',
              nombre: fila.nombre_inquilino,
              apellido: fila.apellido_inquilino,
              ci: fila.ci_inquilino || null,
              telefono: fila.telefono_inquilino || null,
              email: fila.email_inquilino || null,
              propietario_id: propietarioDbId,
              estado: 'activo',
            })

          if (inqErr) throw new Error(inqErr.message)
          result.exitosos++
        }

        // Update pagador_cuota on unidad if specified
        if (fila.pagador_cuota && fila.unidad_id) {
          await supabase
            .from('unidades')
            .update({ pagador_cuota: fila.pagador_cuota })
            .eq('id', fila.unidad_id)
        }
      } catch (err: unknown) {
        result.fallidos++
        result.errores.push({
          fila: i + 1,
          unidad: fila.numero_unidad,
          error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    setResultado(result)
    setImporting(false)
  }

  const descargarTemplate = () => {
    if (!unidades) return
    generarTemplateCondominio(condominioNombre, unidades)
  }

  const descargarErrores = () => {
    if (!resultado) return
    const text = resultado.errores.map(e => `Fila ${e.fila} (Unidad ${e.unidad}): ${e.error}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'errores_importacion.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalOk = filas.filter(f => f.estado === 'ok').length
  const totalWarn = filas.filter(f => f.estado === 'advertencia').length
  const totalErr = filas.filter(f => f.estado === 'error').length

  const ESTADO_COLOR: Record<EstadoFila, { bg: string; text: string }> = {
    ok: { bg: '#E8F4F0', text: '#1A7A4A' },
    advertencia: { bg: '#FFF8E1', text: '#C07A2E' },
    error: { bg: '#FCEAEA', text: '#B83232' },
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
        ← Volver a residentes
      </button>

      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
        Importar Residentes
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#5E6B62', marginBottom: '24px' }}>
        Carga masiva desde archivo Excel
      </p>

      {/* Resultado final */}
      {resultado && (
        <div style={{
          backgroundColor: resultado.fallidos > 0 ? '#FFF8E1' : '#E8F4F0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${resultado.fallidos > 0 ? '#E8C547' : '#1A7A4A'}30`,
        }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: '0 0 12px' }}>
            Importaci\u00f3n completada
          </h3>
          <div style={{ display: 'flex', gap: '24px', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
            <span style={{ color: '#1A7A4A', fontWeight: 600 }}>{resultado.exitosos} importados</span>
            {resultado.fallidos > 0 && (
              <span style={{ color: '#B83232', fontWeight: 600 }}>{resultado.fallidos} fallidos</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {resultado.errores.length > 0 && (
              <button onClick={descargarErrores} style={{
                padding: '8px 16px', backgroundColor: 'white', color: '#B83232', border: '1px solid #B83232', borderRadius: '10px',
                fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
              }}>
                Descargar log de errores
              </button>
            )}
            <button onClick={onComplete} style={{
              padding: '8px 16px', backgroundColor: '#1A7A4A', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            }}>
              Volver a residentes
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Download template */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E8F4F0',
            fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A7A4A',
          }}>1</span>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Descargar template Excel
          </h3>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#5E6B62', marginBottom: '14px', marginLeft: '40px' }}>
          El template incluye {unidades?.length || 0} unidades del condominio. Llena los datos de propietarios e inquilinos.
        </p>
        <div style={{ marginLeft: '40px' }}>
          <button onClick={descargarTemplate} disabled={!unidades?.length} style={{
            padding: '10px 20px', backgroundColor: '#0D4A8F', color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
            opacity: unidades?.length ? 1 : 0.5,
          }}>
            Descargar template .xlsx
          </button>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E8F4F0',
            fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A7A4A',
          }}>2</span>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
            Subir Excel llenado
          </h3>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            marginLeft: '40px',
            border: `2px dashed ${dragOver ? '#1A7A4A' : '#C8D4CB'}`,
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? '#E8F4F0' : '#FAFBFA',
            transition: 'all 0.2s',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', marginBottom: '4px' }}>
            {archivo || 'Arrastra el archivo aqu\u00ed o haz click'}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#5E6B62' }}>
            Formatos aceptados: .xlsx, .xls
          </div>
        </div>
      </div>

      {/* Step 3: Preview */}
      {filas.length > 0 && !resultado && (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E8F4F0',
              fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, color: '#1A7A4A',
            }}>3</span>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
              Vista previa y validaci\u00f3n
            </h3>
          </div>

          {/* Counters */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginLeft: '40px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1A7A4A', backgroundColor: '#E8F4F0', padding: '6px 12px', borderRadius: '8px' }}>
              {totalOk} listos
            </span>
            {totalWarn > 0 && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#C07A2E', backgroundColor: '#FFF8E1', padding: '6px 12px', borderRadius: '8px' }}>
                {totalWarn} con advertencias
              </span>
            )}
            {totalErr > 0 && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#B83232', backgroundColor: '#FCEAEA', padding: '6px 12px', borderRadius: '8px' }}>
                {totalErr} con errores
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ marginLeft: '40px', overflowX: 'auto' }}>
            <div style={{ minWidth: '800px' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '32px 80px 1fr 1fr 100px 1fr 1fr',
                padding: '10px 12px',
                backgroundColor: '#F4F7F5',
                borderRadius: '10px 10px 0 0',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#5E6B62',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                <span></span>
                <span>Unidad</span>
                <span>Propietario</span>
                <span>Email</span>
                <span>CI</span>
                <span>Inquilino</span>
                <span>Estado</span>
              </div>

              {filas.map((fila, i) => {
                const color = ESTADO_COLOR[fila.estado]
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 80px 1fr 1fr 100px 1fr 1fr',
                    padding: '10px 12px',
                    borderBottom: '1px solid #F0F0F0',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    backgroundColor: fila.estado === 'error' ? '#FFF5F5' : 'white',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '11px', color: '#5E6B62' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0D1117' }}>{fila.numero_unidad}</span>
                    <span style={{ color: '#0D1117' }}>
                      {fila.nombre_propietario ? `${fila.nombre_propietario} ${fila.apellido_propietario}` : '—'}
                    </span>
                    <span style={{ color: '#5E6B62', fontSize: '11px' }}>{fila.email || '—'}</span>
                    <span style={{ color: '#5E6B62', fontSize: '11px' }}>{fila.ci || '—'}</span>
                    <span style={{ color: '#0D1117' }}>
                      {fila.nombre_inquilino ? `${fila.nombre_inquilino} ${fila.apellido_inquilino}` : '—'}
                    </span>
                    <span>
                      {fila.errores.length > 0 ? (
                        <span title={fila.errores.join(', ')} style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 500, backgroundColor: color.bg, color: color.text,
                          cursor: 'help', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {fila.errores[0]}
                        </span>
                      ) : fila.estado === 'advertencia' ? (
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, backgroundColor: '#FFF8E1', color: '#C07A2E' }}>
                          Datos incompletos
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, backgroundColor: '#E8F4F0', color: '#1A7A4A' }}>
                          OK
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Import button */}
          <div style={{ marginTop: '20px', marginLeft: '40px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleImportar}
              disabled={importing || (totalOk + totalWarn) === 0}
              style={{
                padding: '12px 28px',
                backgroundColor: importing ? '#5E6B62' : '#1A7A4A',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                cursor: importing ? 'not-allowed' : 'pointer',
              }}
            >
              {importing ? 'Importando...' : `Importar ${totalOk + totalWarn} residentes`}
            </button>
            {totalErr > 0 && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#B83232', alignSelf: 'center', margin: 0 }}>
                {totalErr} fila{totalErr !== 1 ? 's' : ''} con errores ser\u00e1{totalErr !== 1 ? 'n' : ''} omitida{totalErr !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
