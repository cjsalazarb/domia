import * as XLSX from 'xlsx'

interface IngresoCondo {
  nombre: string
  unidades: number
  cobrado: number
  pendiente: number
  cobranza: number
}

interface GastoCondo {
  nombre: string
  limpieza?: number
  mantenimiento?: number
  personal?: number
  servicios?: number
  otros?: number
  total: number
}

interface Deudor {
  nombre: string
  condominio: string
  deuda: number
  meses: number
}

export function exportarExcelGlobal(
  ingresos: IngresoCondo[],
  gastos: GastoCondo[],
  deudores: Deudor[],
  periodo: string
) {
  const wb = XLSX.utils.book_new()

  // Hoja Ingresos por Condominio
  const ingresosData = ingresos.map(i => ({
    'Condominio': i.nombre,
    'Unidades': i.unidades,
    'Cobrado (Bs.)': i.cobrado,
    'Pendiente (Bs.)': i.pendiente,
    '% Cobranza': i.cobranza,
  }))
  // Add total row
  ingresosData.push({
    'Condominio': 'TOTAL',
    'Unidades': ingresos.reduce((s, i) => s + i.unidades, 0),
    'Cobrado (Bs.)': ingresos.reduce((s, i) => s + i.cobrado, 0),
    'Pendiente (Bs.)': ingresos.reduce((s, i) => s + i.pendiente, 0),
    '% Cobranza': 0,
  })
  const wsIngresos = XLSX.utils.json_to_sheet(ingresosData)
  wsIngresos['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos por Condominio')

  // Hoja Gastos por Condominio
  const gastosData = gastos.map(g => ({
    'Condominio': g.nombre,
    'Limpieza (Bs.)': g.limpieza || 0,
    'Mantenimiento (Bs.)': g.mantenimiento || 0,
    'Personal (Bs.)': g.personal || 0,
    'Otros (Bs.)': (g.servicios || 0) + (g.otros || 0),
    'Total (Bs.)': g.total,
  }))
  gastosData.push({
    'Condominio': 'TOTAL',
    'Limpieza (Bs.)': gastos.reduce((s, g) => s + (g.limpieza || 0), 0),
    'Mantenimiento (Bs.)': gastos.reduce((s, g) => s + (g.mantenimiento || 0), 0),
    'Personal (Bs.)': gastos.reduce((s, g) => s + (g.personal || 0), 0),
    'Otros (Bs.)': gastos.reduce((s, g) => s + (g.servicios || 0) + (g.otros || 0), 0),
    'Total (Bs.)': gastos.reduce((s, g) => s + g.total, 0),
  })
  const wsGastos = XLSX.utils.json_to_sheet(gastosData)
  wsGastos['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos por Condominio')

  // Hoja Deudores
  if (deudores.length > 0) {
    const deudoresData = deudores.map((d, i) => ({
      '#': i + 1,
      'Residente': d.nombre,
      'Condominio': d.condominio,
      'Meses Adeudados': d.meses,
      'Deuda Total (Bs.)': d.deuda,
    }))
    const wsDeudores = XLSX.utils.json_to_sheet(deudoresData)
    wsDeudores['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsDeudores, 'Top Deudores')
  }

  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Reporte_Global_DOMIA_${periodo.replace(/\s+/g, '_')}_${fecha}.xlsx`)
}
