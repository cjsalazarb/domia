import { useState } from 'react'
import { usePlanCuentas, useSaldosCuentas } from '@/hooks/useContabilidad'

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

const tipoOpciones: { value: string; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'patrimonio', label: 'Patrimonio' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' },
]

const inputStyle = { padding: '8px 12px', border: '1px solid #C8D4CB', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' as const, width: '100%' }
const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 500, color: '#0D1117', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }

export default function PlanCuentas({ condominioId }: { condominioId: string }) {
  const { cuentas, isLoading, crearCuenta, editarCuenta, desactivarCuenta } = usePlanCuentas(condominioId)
  const { saldos } = useSaldosCuentas(condominioId)

  // Modal nueva cuenta
  const [showModal, setShowModal] = useState(false)
  const [newCodigo, setNewCodigo] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [newTipo, setNewTipo] = useState<string>('gasto')
  const [newNivel, setNewNivel] = useState<number>(3)
  const [modalError, setModalError] = useState('')

  // Editar nombre
  const [editId, setEditId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')

  // Error general
  const [actionError, setActionError] = useState('')

  if (isLoading) return <p style={{ color: '#5E6B62' }}>Cargando plan de cuentas...</p>

  const cuentasActivas = cuentas.filter(c => c.activa !== false)
  const cuentasInactivas = cuentas.filter(c => c.activa === false)

  function validarNuevaCuenta(): string | null {
    if (!newCodigo.trim()) return 'El codigo es obligatorio'
    if (!newNombre.trim()) return 'El nombre es obligatorio'
    // Codigo duplicado
    if (cuentas.some(c => c.codigo === newCodigo.trim())) return `Ya existe una cuenta con codigo ${newCodigo}`
    // Validar que el padre exista (si nivel > 1)
    if (newNivel > 1) {
      const partes = newCodigo.trim().split('.')
      if (partes.length < 2) return 'El codigo debe tener formato jerarquico (ej: 5.9)'
      const codigoPadre = partes.slice(0, -1).join('.')
      if (!cuentas.some(c => c.codigo === codigoPadre)) return `No existe cuenta padre con codigo ${codigoPadre}`
    }
    return null
  }

  function handleCrear() {
    const err = validarNuevaCuenta()
    if (err) { setModalError(err); return }
    setModalError('')
    crearCuenta.mutate(
      { codigo: newCodigo.trim(), nombre: newNombre.trim(), tipo: newTipo as any, nivel: newNivel },
      {
        onSuccess: () => { setShowModal(false); setNewCodigo(''); setNewNombre(''); setNewTipo('gasto'); setNewNivel(3); setModalError('') },
        onError: (e) => setModalError(e instanceof Error ? e.message : 'Error al crear cuenta'),
      }
    )
  }

  function handleEditar(id: string) {
    if (!editNombre.trim()) return
    editarCuenta.mutate(
      { id, nombre: editNombre.trim() },
      { onSuccess: () => setEditId(null), onError: (e) => setActionError(e instanceof Error ? e.message : 'Error al editar') }
    )
  }

  function handleDesactivar(id: string, codigo: string) {
    setActionError('')
    // Validar saldo != 0
    const saldoCuenta = saldos.find((s: any) => s.id === id)
    if (saldoCuenta && Math.abs(saldoCuenta.saldo) >= 0.01) {
      setActionError(`No se puede desactivar "${codigo}" — tiene saldo Bs. ${Number(saldoCuenta.saldo).toFixed(2)}`)
      return
    }
    // Validar hijos activos
    const hijosActivos = cuentas.filter(c => c.activa !== false && c.codigo.startsWith(codigo + '.') && c.codigo !== codigo)
    if (hijosActivos.length > 0) {
      setActionError(`No se puede desactivar "${codigo}" — tiene ${hijosActivos.length} cuenta(s) hija(s) activa(s)`)
      return
    }
    desactivarCuenta.mutate(id, {
      onError: (e) => setActionError(e instanceof Error ? e.message : 'Error al desactivar'),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: '#0D1117', margin: 0 }}>
          Plan de Cuentas
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#5E6B62' }}>{cuentasActivas.length} cuentas activas</span>
          <button onClick={() => { setShowModal(true); setModalError('') }}
            style={{ padding: '8px 16px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            + Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Error banner */}
      {actionError && (
        <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {actionError}
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B83232', fontWeight: 700, fontSize: '14px' }}>x</button>
        </div>
      )}

      {/* Modal nueva cuenta */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700, color: '#0D1117', margin: '0 0 16px' }}>Nueva Cuenta Contable</h3>

            {modalError && (
              <div style={{ backgroundColor: '#FCEAEA', borderLeft: '3px solid #B83232', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#B83232', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
                {modalError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Codigo *</label>
              <input value={newCodigo} onChange={e => setNewCodigo(e.target.value)} placeholder="Ej: 5.9 o 5.9.1" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Nombre de la cuenta *</label>
              <input value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Ej: Gastos Tributarios" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select value={newTipo} onChange={e => setNewTipo(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}>
                  {tipoOpciones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nivel</label>
                <select value={newNivel} onChange={e => setNewNivel(Number(e.target.value))} style={{ ...inputStyle, backgroundColor: 'white' }}>
                  <option value={1}>1 — Grupo</option>
                  <option value={2}>2 — Subgrupo</option>
                  <option value={3}>3 — Cuenta detalle</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setModalError('') }}
                style={{ padding: '8px 16px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleCrear} disabled={crearCuenta.isPending}
                style={{ padding: '8px 16px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {crearCuenta.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de cuentas activas */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8F4F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4F7F5' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Codigo</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cuenta</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nivel</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#5E6B62', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '140px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuentasActivas.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F4F7F5' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: c.nivel <= 2 ? 700 : 400, color: c.nivel === 1 ? '#0D1117' : '#333' }}>
                  {c.codigo}
                </td>
                <td style={{ padding: '10px 16px', paddingLeft: `${16 + (c.nivel - 1) * 20}px`, fontWeight: c.nivel <= 2 ? 700 : 400, color: c.nivel === 1 ? '#0D1117' : '#333' }}>
                  {editId === c.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                        style={{ ...inputStyle, width: 'auto', flex: 1, padding: '4px 8px', fontSize: '12px' }}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditar(c.id); if (e.key === 'Escape') setEditId(null) }}
                        autoFocus />
                      <button onClick={() => handleEditar(c.id)} style={{ padding: '3px 8px', backgroundColor: '#0D9E6E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>OK</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '3px 8px', backgroundColor: '#F4F7F5', color: '#5E6B62', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>x</button>
                    </div>
                  ) : c.nombre}
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
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button onClick={() => { setEditId(c.id); setEditNombre(c.nombre) }}
                      style={{ padding: '3px 8px', backgroundColor: '#EBF4FF', color: '#0D4A8F', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                      Editar
                    </button>
                    <button onClick={() => handleDesactivar(c.id, c.codigo)}
                      style={{ padding: '3px 8px', backgroundColor: '#FEF9EC', color: '#C07A2E', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cuentas inactivas */}
      {cuentasInactivas.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 600, color: '#5E6B62', marginBottom: '8px' }}>
            Cuentas Inactivas ({cuentasInactivas.length})
          </h3>
          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E8E8' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#999' }}>
              <tbody>
                {cuentasInactivas.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '8px 16px', paddingLeft: `${16 + (c.nivel - 1) * 20}px` }}>{c.nombre}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', backgroundColor: '#F0F0F0', color: '#999' }}>Inactiva</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
