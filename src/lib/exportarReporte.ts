import * as XLSX from 'xlsx'

interface IngresoRow {
  periodo: string
  unidad: string
  residente: string
  monto: number
  estado: string
}

interface EgresoRow {
  fecha: string
  categoria: string
  descripcion: string
  monto: number
  proveedor: string
}

interface MorosoRow {
  residente: string
  unidad: string
  meses: number
  deuda: number
}

export function exportarExcel(
  ingresos: IngresoRow[],
  egresos: EgresoRow[],
  morosos: MorosoRow[],
  condominioNombre: string
) {
  const wb = XLSX.utils.book_new()

  // Hoja Ingresos
  const ingresosData = ingresos.map(i => ({
    'Período': i.periodo,
    'Unidad': i.unidad,
    'Residente': i.residente,
    'Monto (Bs.)': i.monto,
    'Estado': i.estado,
  }))
  const wsIngresos = XLSX.utils.json_to_sheet(ingresosData)
  wsIngresos['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos')

  // Hoja Egresos
  const egresosData = egresos.map(e => ({
    'Fecha': e.fecha,
    'Categoría': e.categoria,
    'Descripción': e.descripcion,
    'Monto (Bs.)': e.monto,
    'Proveedor': e.proveedor,
  }))
  const wsEgresos = XLSX.utils.json_to_sheet(egresosData)
  wsEgresos['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsEgresos, 'Egresos')

  // Hoja Morosos
  const morososData = morosos.map(m => ({
    'Residente': m.residente,
    'Unidad': m.unidad,
    'Meses Adeudados': m.meses,
    'Deuda Total (Bs.)': m.deuda,
  }))
  const wsMorosos = XLSX.utils.json_to_sheet(morososData)
  wsMorosos['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsMorosos, 'Morosos')

  // Download
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Reporte_${condominioNombre.replace(/\s+/g, '_')}_${fecha}.xlsx`)
}
