import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Condominio {
  id: string; nombre: string; direccion: string; ciudad: string; departamento: string;
  nit: string | null; telefono: string | null; email_contacto: string | null; logo_url: string | null;
  estado: string; admin_id: string | null; recargo_mora_porcentaje: number; notas: string | null;
  created_at: string;
}

export interface Edificio {
  id: string; condominio_id: string; nombre: string; numero_pisos: number; descripcion: string | null;
}

export interface Unidad {
  id: string; edificio_id: string; condominio_id: string; numero: string; piso: number | null;
  tipo: string; area_m2: number | null; pagador_cuota: string; activa: boolean; notas: string | null;
  edificios?: { nombre: string };
}

export interface Documento {
  id: string; condominio_id: string; nombre: string; tipo: string; url: string; created_at: string;
}

export function useCondominios() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['condominios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('condominios').select('*').order('nombre')
      if (error) throw error
      return data as Condominio[]
    },
  })

  const crear = useMutation({
    mutationFn: async (input: Partial<Condominio>) => {
      const { data, error } = await supabase.from('condominios').insert({ ...input, estado: 'activo' }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condominios'] }),
  })

  const actualizar = useMutation({
    mutationFn: async (p: { id: string; updates: Partial<Condominio> }) => {
      const { error } = await supabase.from('condominios').update(p.updates).eq('id', p.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condominios'] }),
  })

  return { condominios: query.data || [], isLoading: query.isLoading, crear, actualizar }
}

export function useEdificios(condominioId: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['edificios', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('edificios').select('*').eq('condominio_id', condominioId).order('nombre')
      if (error) throw error
      return data as Edificio[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: { nombre: string; numero_pisos: number; descripcion?: string }) => {
      const { error } = await supabase.from('edificios').insert({ ...input, condominio_id: condominioId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['edificios', condominioId] }),
  })

  return { edificios: query.data || [], isLoading: query.isLoading, crear }
}

export function useUnidades(condominioId: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['unidades', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('unidades').select('*, edificios(nombre)').eq('condominio_id', condominioId).order('numero')
      if (error) throw error
      return data as Unidad[]
    },
    enabled: !!condominioId,
  })

  const crear = useMutation({
    mutationFn: async (input: { edificio_id: string; numero: string; piso?: number; tipo: string; area_m2?: number; pagador_cuota?: string }) => {
      const { error } = await supabase.from('unidades').insert({ ...input, condominio_id: condominioId, activa: true, pagador_cuota: input.pagador_cuota || 'propietario' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unidades', condominioId] }),
  })

  return { unidades: query.data || [], isLoading: query.isLoading, crear }
}

export function useDocumentos(condominioId: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['documentos', condominioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('documentos_condominio').select('*').eq('condominio_id', condominioId).order('created_at', { ascending: false })
      if (error) throw error
      return data as Documento[]
    },
    enabled: !!condominioId,
  })

  const subir = useMutation({
    mutationFn: async (input: { nombre: string; tipo: string; file: File }) => {
      const path = `${condominioId}/${Date.now()}_${input.file.name}`
      const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, input.file)
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
      const { error } = await supabase.from('documentos_condominio').insert({ condominio_id: condominioId, nombre: input.nombre, tipo: input.tipo, url: urlData.publicUrl })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos', condominioId] }),
  })

  return { documentos: query.data || [], isLoading: query.isLoading, subir }
}
