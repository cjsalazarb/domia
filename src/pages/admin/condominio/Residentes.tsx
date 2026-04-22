import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useResidentes, type CreateResidenteInput } from '@/hooks/useResidentes'
import { crearUsuarioResidente } from '@/lib/crearUsuarioResidente'
import AdminLayout from '@/components/layout/AdminLayout'
import ListaResidentes from './Residentes/ListaResidentes'
import FormResidente from './Residentes/FormResidente'
import DetalleResidente from './Residentes/DetalleResidente'
import ImportarResidentes from './Residentes/ImportarResidentes'

type View = 'lista' | 'nuevo' | 'editar' | 'detalle' | 'importar'

export default function Residentes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { residentes, isLoading, createResidente, updateResidente } = useResidentes(id || '')

  const [view, setView] = useState<View>('lista')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [creandoUsuario, setCreandoUsuario] = useState(false)
  const [usuarioCreado, setUsuarioCreado] = useState<{ email: string; emailSent: boolean } | null>(null)

  const { data: condominio } = useQuery({
    queryKey: ['condominio-nombre', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('condominios')
        .select('nombre')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as { nombre: string }
    },
    enabled: !!id,
  })

  if (!id) return null

  const selectedResidente = selectedId ? residentes.find(r => r.id === selectedId) : null
  const propietarios = residentes.filter(r => r.tipo === 'propietario' && r.estado === 'activo')

  const handleCreate = async (input: CreateResidenteInput) => {
    setFormError('')
    setUsuarioCreado(null)
    try {
      const residente = await createResidente.mutateAsync(input)

      // Si tiene email, crear usuario automáticamente
      if (input.email && residente?.id) {
        setCreandoUsuario(true)
        const result = await crearUsuarioResidente({
          email: input.email,
          nombre: input.nombre,
          apellido: input.apellido,
          tipo: input.tipo,
          condominio_id: id!,
          condominio_nombre: condominio?.nombre || '',
          residente_id: residente.id,
        })
        setCreandoUsuario(false)

        if (result.success) {
          setUsuarioCreado({ email: input.email, emailSent: result.email_sent || false })
        } else {
          // Residente creado pero usuario falló — no es error fatal
          setFormError(`Residente creado, pero no se pudo crear el usuario: ${result.error}`)
          return
        }
      }

      setView('lista')
    } catch (err) {
      console.error('Error creando residente:', err)
      setCreandoUsuario(false)
      setFormError(err instanceof Error ? err.message : 'Error al crear residente')
    }
  }

  const handleUpdate = async (input: CreateResidenteInput) => {
    if (!selectedId) return
    setFormError('')
    try {
      await updateResidente.mutateAsync({ id: selectedId, updates: input })
      setView('lista')
      setSelectedId(null)
    } catch (err) {
      console.error('Error actualizando residente:', err)
      setFormError(err instanceof Error ? err.message : 'Error al actualizar residente')
    }
  }

  return (
    <AdminLayout title="Residentes" condominioId={id}>
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'lista' && (
          <>
            {usuarioCreado && (
              <div style={{ backgroundColor: '#E8F4F0', border: '1px solid #1A7A4A30', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A' }}>
                  Usuario creado para <strong>{usuarioCreado.email}</strong>
                  {usuarioCreado.emailSent ? ' — email de bienvenida enviado' : ' — email no enviado (verificar configuración Resend)'}
                </div>
                <button onClick={() => setUsuarioCreado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A7A4A', fontSize: '16px', padding: '0 4px' }}>×</button>
              </div>
            )}
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1A7A4A', padding: 0, marginBottom: '16px' }}>
              ← Volver
            </button>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 700, color: '#0D1117', margin: '0 0 4px' }}>
              Residentes · {condominio?.nombre || 'Condominio'}
            </h1>
            <p style={{ color: '#5E6B62', fontSize: '14px', marginBottom: '24px' }}>
              {residentes.filter(r => r.tipo === 'propietario').length} propietarios · {residentes.filter(r => r.tipo === 'inquilino').length} inquilinos
            </p>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#5E6B62' }}>Cargando...</div>
            ) : (
              <ListaResidentes
                residentes={residentes}
                condominioId={id}
                onNuevo={() => setView('nuevo')}
                onImportar={() => setView('importar')}
                onDetalle={(rid) => { setSelectedId(rid); setView('detalle') }}
                onEditar={(rid) => { setSelectedId(rid); setView('editar') }}
                onRegistrarPago={(rid) => { setSelectedId(rid); setView('detalle') }}
              />
            )}
          </>
        )}

        {view === 'nuevo' && (
          <FormResidente
            condominioId={id}
            propietarios={propietarios}
            onSave={handleCreate}
            onCancel={() => { setView('lista'); setFormError(''); setUsuarioCreado(null) }}
            saving={createResidente.isPending || creandoUsuario}
            savingLabel={creandoUsuario ? 'Creando usuario y enviando email...' : undefined}
            error={formError}
          />
        )}

        {view === 'editar' && selectedResidente && (
          <FormResidente
            condominioId={id}
            residente={selectedResidente}
            propietarios={propietarios}
            onSave={handleUpdate}
            onCancel={() => { setView('lista'); setSelectedId(null); setFormError('') }}
            saving={updateResidente.isPending}
            error={formError}
          />
        )}

        {view === 'detalle' && selectedResidente && (
          <DetalleResidente
            residente={selectedResidente}
            onBack={() => { setView('lista'); setSelectedId(null) }}
            onEditar={() => setView('editar')}
          />
        )}

        {view === 'importar' && (
          <ImportarResidentes
            condominioId={id}
            condominioNombre={condominio?.nombre || ''}
            onBack={() => setView('lista')}
            onComplete={() => setView('lista')}
          />
        )}
      </div>
    </AdminLayout>
  )
}
