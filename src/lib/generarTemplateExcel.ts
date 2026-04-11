import * as XLSX from 'xlsx'

interface UnidadTemplate {
  numero: string
  tipo: string
  piso: number | null
}

export function generarTemplateCondominio(
  condominioNombre: string,
  unidades: UnidadTemplate[]
) {
  const wb = XLSX.utils.book_new()

  const rows = unidades.map(u => ({
    'N\u00b0 Unidad': u.numero,
    'Tipo Unidad': u.tipo,
    'Piso': u.piso ?? '',
    'Nombre Propietario': '',
    'Apellido Propietario': '',
    'CI': '',
    'Tel\u00e9fono': '',
    'Email': '',
    'Nombre Inquilino': '',
    'Apellido Inquilino': '',
    'CI Inquilino': '',
    'Tel\u00e9fono Inquilino': '',
    'Email Inquilino': '',
    'Pagador Cuota': 'propietario',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, // N° Unidad
    { wch: 18 }, // Tipo Unidad
    { wch: 6 },  // Piso
    { wch: 22 }, // Nombre Propietario
    { wch: 22 }, // Apellido Propietario
    { wch: 14 }, // CI
    { wch: 14 }, // Teléfono
    { wch: 28 }, // Email
    { wch: 22 }, // Nombre Inquilino
    { wch: 22 }, // Apellido Inquilino
    { wch: 14 }, // CI Inquilino
    { wch: 14 }, // Teléfono Inquilino
    { wch: 28 }, // Email Inquilino
    { wch: 18 }, // Pagador Cuota
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Residentes')

  const fecha = new Date().toISOString().split('T')[0]
  const nombre = condominioNombre.replace(/\s+/g, '_')
  XLSX.writeFile(wb, `Template_${nombre}_${fecha}.xlsx`)
}

export interface FilaExcel {
  numero_unidad: string
  tipo_unidad: string
  piso: string
  nombre_propietario: string
  apellido_propietario: string
  ci: string
  telefono: string
  email: string
  nombre_inquilino: string
  apellido_inquilino: string
  ci_inquilino: string
  telefono_inquilino: string
  email_inquilino: string
  pagador_cuota: string
}

export function parsearExcel(file: File): Promise<FilaExcel[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        const filas: FilaExcel[] = json.map(row => ({
          numero_unidad: String(row['N\u00b0 Unidad'] ?? '').trim(),
          tipo_unidad: String(row['Tipo Unidad'] ?? '').trim(),
          piso: String(row['Piso'] ?? '').trim(),
          nombre_propietario: String(row['Nombre Propietario'] ?? '').trim(),
          apellido_propietario: String(row['Apellido Propietario'] ?? '').trim(),
          ci: String(row['CI'] ?? '').trim(),
          telefono: String(row['Tel\u00e9fono'] ?? '').trim(),
          email: String(row['Email'] ?? '').trim(),
          nombre_inquilino: String(row['Nombre Inquilino'] ?? '').trim(),
          apellido_inquilino: String(row['Apellido Inquilino'] ?? '').trim(),
          ci_inquilino: String(row['CI Inquilino'] ?? '').trim(),
          telefono_inquilino: String(row['Tel\u00e9fono Inquilino'] ?? '').trim(),
          email_inquilino: String(row['Email Inquilino'] ?? '').trim(),
          pagador_cuota: String(row['Pagador Cuota'] ?? 'propietario').trim().toLowerCase(),
        }))

        resolve(filas)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsArrayBuffer(file)
  })
}
