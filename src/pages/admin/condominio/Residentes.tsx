import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useResidentes, type CreateResidenteInput } from '@/hooks/useResidentes'
import ListaResidentes from './Residentes/ListaResidentes'
import FormResidente from './Residentes/FormResidente'
import DetalleResidente from './Residentes/DetalleResidente'

type View = 'lista' | 'nuevo' | 'editar' | 'detalle'

export default function Residentes() {
  const { id } = useParams()
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { residentes, isLoading, createResidente, updateResidente } = useResidentes(id || '')

  const [view, setView] = useState<View>('lista')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!id) return null

  const selectedResidente = selectedId ? residentes.find(r => r.id === selectedId) : null
  const propietarios = residentes.filter(r => r.tipo === 'propietario' && r.estado === 'activo')

  const handleCreate = async (input: CreateResidenteInput) => {
    await createResidente.mutateAsync(input)
    setView('lista')
  }

  const handleUpdate = async (input: CreateResidenteInput) => {
    if (!selectedId) return
    await updateResidente.mutateAsync({ id: selectedId, updates: input })
    setView('lista')
    setSelectedId(null)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #1A7A4A, #0D9E6E)',
        padding: '20px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 }}>
            DOM<span style={{ opacity: 0.9 }}>IA</span>
          </span>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Residentes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px' }}>{profile?.nombre} {profile?.apellido}</span>
          <button
            onClick={() => { signOut(); navigate('/login') }}
            style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'lista' && (
          <>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
              ← Volver
            </button>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
              Gestión de Residentes
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
              Propietarios e inquilinos del condominio
            </p>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>
            ) : (
              <ListaResidentes
                residentes={residentes}
                onNuevo={() => setView('nuevo')}
                onDetalle={(rid) => { setSelectedId(rid); setView('detalle') }}
                onEditar={(rid) => { setSelectedId(rid); setView('editar') }}
              />
            )}
          </>
        )}

        {view === 'nuevo' && (
          <FormResidente
            condominioId={id}
            propietarios={propietarios}
            onSave={handleCreate}
            onCancel={() => setView('lista')}
            saving={createResidente.isPending}
          />
        )}

        {view === 'editar' && selectedResidente && (
          <FormResidente
            condominioId={id}
            residente={selectedResidente}
            propietarios={propietarios}
            onSave={handleUpdate}
            onCancel={() => { setView('lista'); setSelectedId(null) }}
            saving={updateResidente.isPending}
          />
        )}

        {view === 'detalle' && selectedResidente && (
          <DetalleResidente
            residente={selectedResidente}
            onBack={() => { setView('lista'); setSelectedId(null) }}
            onEditar={() => setView('editar')}
          />
        )}
      </div>
    </div>
  )
}
