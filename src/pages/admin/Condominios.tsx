import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCondominios } from '@/hooks/useCondominios'
import type { Condominio } from '@/hooks/useCondominios'
import AdminLayout from '@/components/layout/AdminLayout'
import ListaCondominios from './Condominios/ListaCondominios'
import FormCondominio from './Condominios/FormCondominio'
import ConfigurarCondominio from './Condominios/ConfigurarCondominio'

type View = 'lista' | 'nuevo' | 'editar' | 'configurar'

export default function Condominios() {
  const navigate = useNavigate()
  const { condominios, crear, actualizar } = useCondominios()
  const [view, setView] = useState<View>('lista')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = selectedId ? condominios.find(c => c.id === selectedId) : null

  const handleCreate = async (data: Partial<Condominio>) => {
    await crear.mutateAsync(data)
    setView('lista')
  }

  const handleUpdate = async (data: Partial<Condominio>) => {
    if (!selectedId) return
    await actualizar.mutateAsync({ id: selectedId, updates: data })
    setView('lista'); setSelectedId(null)
  }

  return (
    <AdminLayout title="Condominios">
      {view === 'lista' && (
        <ListaCondominios
          onNuevo={() => setView('nuevo')}
          onVer={(id) => navigate(`/admin/condominio/${id}/residentes`)}
          onEditar={(id) => { setSelectedId(id); setView('editar') }}
          onConfigurar={(id) => { setSelectedId(id); setView('configurar') }}
        />
      )}
      {view === 'nuevo' && (
        <FormCondominio onSave={handleCreate} onCancel={() => setView('lista')} saving={crear.isPending} />
      )}
      {view === 'editar' && selected && (
        <FormCondominio condominio={selected} onSave={handleUpdate} onCancel={() => { setView('lista'); setSelectedId(null) }} saving={actualizar.isPending} />
      )}
      {view === 'configurar' && selectedId && (
        <ConfigurarCondominio condominioId={selectedId} onBack={() => { setView('lista'); setSelectedId(null) }} />
      )}
    </AdminLayout>
  )
}
