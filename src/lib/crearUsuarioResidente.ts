import { supabase } from './supabase'

interface CrearUsuarioParams {
  email: string
  nombre: string
  apellido: string
  tipo: 'propietario' | 'inquilino'
  condominio_id: string
  condominio_nombre: string
  residente_id: string
}

interface CrearUsuarioResult {
  success: boolean
  user_id?: string
  email_sent?: boolean
  error?: string
}

export async function crearUsuarioResidente(params: CrearUsuarioParams): Promise<CrearUsuarioResult> {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await supabase.functions.invoke('crear-usuario-residente', {
    body: params,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  if (response.error) {
    return { success: false, error: response.error.message }
  }

  return response.data as CrearUsuarioResult
}

export async function crearUsuariosEnLote(
  residentes: CrearUsuarioParams[],
  onProgress?: (completados: number, total: number) => void
): Promise<{
  exitosos: number
  fallidos: number
  emailsEnviados: number
  errores: { email: string; error: string }[]
}> {
  const result = { exitosos: 0, fallidos: 0, emailsEnviados: 0, errores: [] as { email: string; error: string }[] }
  const BATCH_SIZE = 10
  const DELAY_MS = 1000

  for (let i = 0; i < residentes.length; i += BATCH_SIZE) {
    const batch = residentes.slice(i, i + BATCH_SIZE)

    const promises = batch.map(async (r) => {
      const res = await crearUsuarioResidente(r)
      if (res.success) {
        result.exitosos++
        if (res.email_sent) result.emailsEnviados++
      } else {
        result.fallidos++
        result.errores.push({ email: r.email, error: res.error || 'Error desconocido' })
      }
    })

    await Promise.all(promises)
    onProgress?.(Math.min(i + BATCH_SIZE, residentes.length), residentes.length)

    // Delay between batches (except last)
    if (i + BATCH_SIZE < residentes.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  return result
}
