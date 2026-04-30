import jsPDF from 'jspdf'
import altrionLogoSrc from '@/assets/altrion-logo.jpg'

/* ─── Colores ALTRION ─── */
const C = {
  fondoPortada: '#0D1B2A',
  encabezadoTabla: '#1A4A7A',
  acentoAzul: '#2980B9',
  dorado: '#C9A84C',
  textoCuerpo: '#4A4A4A',
  filasPares: '#F5F5F5',
  verde: '#1D9E75',
  rojo: '#C0392B',
  fondoTotales: '#0D1B2A',
  blanco: '#FFFFFF',
  grisLabel: '#8899AA',
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function formatBs(n: number) {
  return 'Bs. ' + n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface SaldoCuenta {
  id: string; codigo: string; nombre: string; tipo: string; nivel: number
  debe: number; haber: number; saldo: number
}

export interface ExportData {
  condominioNombre: string
  hasta: string
  saldos: SaldoCuenta[]
  isLeaf: (codigo: string) => boolean
  resultado: number
  totalActivos: number; totalPasivos: number; totalPatrimonio: number
  totalIngresos: number; totalGastos: number
  todosConMov: SaldoCuenta[]; totalDebeSumas: number; totalHaberSumas: number
  entradasCaja: number; entradasBanco: number; salidasCaja: number; salidasBanco: number
  egresosGastos: number; totalEntradas: number; totalSalidas: number; saldoDisponible: number
  gastosDetalle: SaldoCuenta[]
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/* ─── Helpers de dibujo ─── */
function setColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRgb(hex))
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, hex: string) {
  doc.setFillColor(...hexToRgb(hex))
  doc.rect(x, y, w, h, 'F')
}

function drawLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, hex: string, width = 0.5) {
  doc.setDrawColor(...hexToRgb(hex))
  doc.setLineWidth(width)
  doc.line(x1, y1, x2, y2)
}

// Landscape A4 dimensions
const PW = 297 // A4 landscape width mm
const PH = 210 // A4 landscape height mm
const ML = 18  // margin left
const MR = 18  // margin right
const CW = PW - ML - MR // content width

function addHeader(doc: jsPDF, logo: HTMLImageElement, sectionName: string) {
  doc.addImage(logo, 'JPEG', ML, 10, 22, 22 * (logo.height / logo.width))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.grisLabel)
  doc.text(sectionName.toUpperCase(), PW - MR, 20, { align: 'right' })
  drawLine(doc, ML, 34, PW - MR, 34, C.dorado, 1)
}

function addFooter(doc: jsPDF, referencia: string, pagina: number) {
  drawLine(doc, ML, PH - 18, PW - MR, PH - 18, '#D4D4D4', 0.3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, C.grisLabel)
  doc.text(`ALTRION S.R.L. — Reporte Contable Confidencial | ${referencia}`, ML, PH - 13)
  doc.text(`Pagina ${pagina}`, PW - MR, PH - 13, { align: 'right' })
}

function createDoc() {
  return new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
}

function parseFecha(hasta: string) {
  const fechaCorte = new Date(hasta + 'T12:00:00')
  const mes = MESES[fechaCorte.getMonth()]
  const anio = fechaCorte.getFullYear()
  const periodo = `${mes} ${anio}`
  const condoSlug = (nombre: string) => nombre.replace(/\s+/g, '')
  const referencia = `RPT-${anio}-${String(fechaCorte.getMonth() + 1).padStart(2, '0')}`
  return { fechaCorte, mes, anio, periodo, condoSlug, referencia }
}

function addPortada(doc: jsPDF, logo: HTMLImageElement, data: ExportData, titulo: string, f: ReturnType<typeof parseFecha>) {
  fillRect(doc, 0, 0, PW, PH, C.fondoPortada)

  const logoW = 50
  const logoH = logoW * (logo.height / logo.width)
  doc.addImage(logo, 'JPEG', (PW - logoW) / 2, 35, logoW, logoH)

  const lineY = 35 + logoH + 12
  drawLine(doc, (PW - 40) / 2, lineY, (PW + 40) / 2, lineY, C.dorado, 1.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  setColor(doc, C.blanco)
  doc.text(titulo.toUpperCase(), PW / 2, lineY + 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  setColor(doc, C.acentoAzul)
  doc.text('Modulo Contable Integral — DOMIA', PW / 2, lineY + 25, { align: 'center' })

  const sepY = PH - 55
  drawLine(doc, ML, sepY, PW - MR, sepY, C.dorado, 0.5)

  const blocks = [
    { label: 'CONDOMINIO', value: data.condominioNombre },
    { label: 'PERIODO', value: f.periodo },
    { label: 'FECHA DE CORTE', value: f.fechaCorte.toLocaleDateString('es-BO') },
    { label: 'REFERENCIA', value: f.referencia },
  ]
  const bw = CW / 4
  blocks.forEach((b, i) => {
    const bx = ML + i * bw
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(doc, C.grisLabel)
    doc.text(b.label, bx + bw / 2, sepY + 14, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setColor(doc, C.blanco)
    doc.text(b.value, bx + bw / 2, sepY + 22, { align: 'center' })
  })
}

/* ════════════════════════════════════════════════════
   Individual report generators
   ════════════════════════════════════════════════════ */

export async function exportarBalanceGeneral(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_BalanceGeneral_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  addPortada(doc, logo, data, 'Balance General', f)

  doc.addPage()
  addHeader(doc, logo, 'Balance General')
  addFooter(doc, f.referencia, 2)

  let y = 42
  const activos = data.saldos.filter(s => s.tipo === 'activo' && s.nivel >= 2)
  const pasivos = data.saldos.filter(s => s.tipo === 'pasivo' && s.nivel >= 2)
  const patrimonio = data.saldos.filter(s => s.tipo === 'patrimonio' && s.nivel >= 2)

  function drawSection(items: SaldoCuenta[], title: string, totalLabel: string, total: number, totalColor: string) {
    fillRect(doc, ML, y, CW, 7, C.fondoTotales)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(title, ML + 4, y + 5)
    y += 9

    items.forEach((s, i) => {
      if (y > PH - 30) {
        doc.addPage()
        addHeader(doc, logo, 'Balance General (cont.)')
        addFooter(doc, f.referencia, doc.getNumberOfPages())
        y = 42
      }
      const leaf = data.isLeaf(s.codigo)
      if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)
      doc.setFont('helvetica', leaf ? 'normal' : 'bold')
      doc.setFontSize(8)
      setColor(doc, C.grisLabel)
      doc.text(s.codigo, ML + 4, y + 4.5)
      setColor(doc, C.textoCuerpo)
      doc.text(s.nombre, ML + (leaf ? 28 : 20), y + 4.5)
      if (leaf) {
        const displayVal = s.codigo === '3.2' ? data.resultado : s.saldo
        doc.text(formatBs(displayVal), PW - MR - 4, y + 4.5, { align: 'right' })
      }
      y += 6.5
    })

    fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(totalLabel, ML + 4, y + 5.5)
    setColor(doc, totalColor)
    doc.text(formatBs(total), PW - MR - 4, y + 5.5, { align: 'right' })
    y += 11
  }

  drawSection(activos, 'ACTIVO', 'TOTAL ACTIVO', data.totalActivos, C.verde)
  drawSection(pasivos, 'PASIVO', 'TOTAL PASIVO', data.totalPasivos, '#E8A040')
  drawSection(patrimonio, 'PATRIMONIO', 'TOTAL PATRIMONIO', data.totalPatrimonio, C.blanco)

  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.blanco)
  doc.text('PASIVO + PATRIMONIO', ML + 4, y + 6.5)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalPasivos + data.totalPatrimonio), PW - MR - 4, y + 6.5, { align: 'right' })

  doc.save(fileName)
}

export async function exportarEstadoResultados(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_EstadoResultados_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  addPortada(doc, logo, data, 'Estado de Resultados', f)

  doc.addPage()
  addHeader(doc, logo, 'Estado de Resultados')
  addFooter(doc, f.referencia, 2)

  let y = 42
  const ingresos = data.saldos.filter(s => s.tipo === 'ingreso' && s.nivel >= 2)
  const gastosCuentas = data.saldos.filter(s => s.tipo === 'gasto' && s.nivel >= 2)

  function drawSection(items: SaldoCuenta[], title: string, totalLabel: string, total: number, totalColor: string) {
    fillRect(doc, ML, y, CW, 7, C.fondoTotales)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(title, ML + 4, y + 5)
    y += 9

    items.forEach((s, i) => {
      if (y > PH - 30) {
        doc.addPage()
        addHeader(doc, logo, 'Estado de Resultados (cont.)')
        addFooter(doc, f.referencia, doc.getNumberOfPages())
        y = 42
      }
      const leaf = data.isLeaf(s.codigo)
      if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)
      doc.setFont('helvetica', leaf ? 'normal' : 'bold')
      doc.setFontSize(8)
      setColor(doc, C.grisLabel)
      doc.text(s.codigo, ML + 4, y + 4.5)
      setColor(doc, C.textoCuerpo)
      doc.text(s.nombre, ML + (leaf ? 28 : 20), y + 4.5)
      if (leaf) {
        doc.text(formatBs(s.saldo), PW - MR - 4, y + 4.5, { align: 'right' })
      }
      y += 6.5
    })

    fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(totalLabel, ML + 4, y + 5.5)
    setColor(doc, totalColor)
    doc.text(formatBs(total), PW - MR - 4, y + 5.5, { align: 'right' })
    y += 11
  }

  drawSection(ingresos, 'INGRESOS', 'TOTAL INGRESOS', data.totalIngresos, C.verde)
  drawSection(gastosCuentas, 'GASTOS', 'TOTAL GASTOS', data.totalGastos, C.rojo)

  const barColor = data.resultado >= 0 ? C.verde : C.rojo
  fillRect(doc, ML, y, CW, 10, barColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(doc, C.blanco)
  doc.text(`${data.resultado >= 0 ? 'SUPERAVIT' : 'DEFICIT'} DEL PERIODO`, ML + 4, y + 7)
  doc.text(formatBs(Math.abs(data.resultado)), PW - MR - 4, y + 7, { align: 'right' })

  doc.save(fileName)
}

export async function exportarSumasSaldos(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_SumasSaldos_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  addPortada(doc, logo, data, 'Balance de Sumas y Saldos', f)

  doc.addPage()
  addHeader(doc, logo, 'Balance de Sumas y Saldos')
  addFooter(doc, f.referencia, 2)

  let y = 42
  // Column headers — wider columns for landscape
  fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, C.blanco)
  doc.text('CODIGO', ML + 4, y + 5.5)
  doc.text('CUENTA', ML + 32, y + 5.5)
  doc.text('DEBE', PW - MR - 90, y + 5.5, { align: 'right' })
  doc.text('HABER', PW - MR - 48, y + 5.5, { align: 'right' })
  doc.text('SALDO', PW - MR - 4, y + 5.5, { align: 'right' })
  y += 9

  data.todosConMov.forEach((s, i) => {
    if (y > PH - 35) {
      doc.addPage()
      addHeader(doc, logo, 'Balance de Sumas y Saldos (cont.)')
      addFooter(doc, f.referencia, doc.getNumberOfPages())
      y = 42
    }
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, C.grisLabel)
    doc.text(s.codigo, ML + 4, y + 4.5)
    setColor(doc, C.textoCuerpo)
    doc.text(s.nombre, ML + 32, y + 4.5)
    doc.text(formatBs(s.debe), PW - MR - 90, y + 4.5, { align: 'right' })
    doc.text(formatBs(s.haber), PW - MR - 48, y + 4.5, { align: 'right' })
    setColor(doc, s.saldo >= 0 ? C.verde : C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(s.saldo), PW - MR - 4, y + 4.5, { align: 'right' })
    y += 6.5
  })

  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.blanco)
  doc.text('TOTALES', ML + 4, y + 6)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalDebeSumas), PW - MR - 90, y + 6, { align: 'right' })
  doc.text(formatBs(data.totalHaberSumas), PW - MR - 48, y + 6, { align: 'right' })

  const cuadra = Math.abs(data.totalDebeSumas - data.totalHaberSumas) < 0.01
  if (cuadra) {
    fillRect(doc, PW - MR - 30, y + 1.5, 26, 6, C.verde)
    setColor(doc, C.blanco)
    doc.setFontSize(8)
    doc.text('CUADRA', PW - MR - 17, y + 5.8, { align: 'center' })
  }
  y += 13

  if (cuadra) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    setColor(doc, C.verde)
    doc.text('Verificacion contable aprobada: Partida doble correcta.', ML, y)
  }

  doc.save(fileName)
}

export async function exportarLibroMayor(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_LibroMayor_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  addPortada(doc, logo, data, 'Libro Mayor', f)

  const cuentas = data.saldos.filter(s => s.nivel === 3 && (s.debe > 0 || s.haber > 0))

  doc.addPage()
  addHeader(doc, logo, 'Libro Mayor')
  addFooter(doc, f.referencia, 2)

  let y = 42

  // Table header
  fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, C.blanco)
  doc.text('CODIGO', ML + 4, y + 5.5)
  doc.text('CUENTA', ML + 32, y + 5.5)
  doc.text('DEBITOS', PW - MR - 90, y + 5.5, { align: 'right' })
  doc.text('CREDITOS', PW - MR - 48, y + 5.5, { align: 'right' })
  doc.text('SALDO', PW - MR - 4, y + 5.5, { align: 'right' })
  y += 9

  cuentas.forEach((s, i) => {
    if (y > PH - 30) {
      doc.addPage()
      addHeader(doc, logo, 'Libro Mayor (cont.)')
      addFooter(doc, f.referencia, doc.getNumberOfPages())
      y = 42
    }
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, C.grisLabel)
    doc.text(s.codigo, ML + 4, y + 4.5)
    setColor(doc, C.textoCuerpo)
    doc.text(s.nombre, ML + 32, y + 4.5)
    doc.text(formatBs(s.debe), PW - MR - 90, y + 4.5, { align: 'right' })
    doc.text(formatBs(s.haber), PW - MR - 48, y + 4.5, { align: 'right' })
    setColor(doc, s.saldo >= 0 ? C.verde : C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(s.saldo), PW - MR - 4, y + 4.5, { align: 'right' })
    y += 6.5
  })

  if (cuentas.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    setColor(doc, C.grisLabel)
    doc.text('No hay movimientos en el periodo.', PW / 2, y + 10, { align: 'center' })
  }

  doc.save(fileName)
}

export async function exportarFlujoCaja(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_FlujoCaja_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  addPortada(doc, logo, data, 'Flujo de Caja', f)

  doc.addPage()
  addHeader(doc, logo, 'Flujo de Caja')
  addFooter(doc, f.referencia, 2)

  let y = 42
  // 3 summary cards
  const cards = [
    { label: 'TOTAL INGRESOS', valor: data.totalEntradas, color: C.verde },
    { label: 'TOTAL EGRESOS', valor: data.totalSalidas, color: C.rojo },
    { label: 'SALDO DISPONIBLE', valor: data.saldoDisponible, color: C.encabezadoTabla },
  ]
  const cardW = (CW - 8) / 3
  cards.forEach((c, i) => {
    const cx = ML + i * (cardW + 4)
    fillRect(doc, cx, y, cardW, 22, C.filasPares)
    drawLine(doc, cx, y, cx + cardW, y, c.color, 1.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(doc, C.grisLabel)
    doc.text(c.label, cx + cardW / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setColor(doc, c.color)
    doc.text(formatBs(c.valor), cx + cardW / 2, y + 17, { align: 'center' })
  })
  y += 30

  // Ingresos table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.textoCuerpo)
  doc.text('Detalle de Ingresos', ML, y)
  y += 5

  const ingresosRows = [
    { label: 'Cobros en efectivo (Caja)', monto: data.entradasCaja },
    { label: 'Cobros por transferencia/QR (Banco)', monto: data.entradasBanco },
  ]
  ingresosRows.forEach((r, i) => {
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 7, C.filasPares)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setColor(doc, C.textoCuerpo)
    doc.text(r.label, ML + 4, y + 5)
    setColor(doc, C.verde)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(r.monto), PW - MR - 4, y + 5, { align: 'right' })
    y += 7
  })
  fillRect(doc, ML, y, CW, 8, C.filasPares)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.verde)
  doc.text('TOTAL INGRESOS', ML + 4, y + 5.5)
  doc.text(formatBs(data.totalEntradas), PW - MR - 4, y + 5.5, { align: 'right' })
  y += 14

  // Egresos table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.textoCuerpo)
  doc.text('Detalle de Egresos', ML, y)
  y += 5

  const egresosRows: { label: string; monto: number }[] = []
  if (data.salidasCaja > 0) egresosRows.push({ label: 'Pagos en efectivo (Caja)', monto: data.salidasCaja })
  if (data.salidasBanco > 0) egresosRows.push({ label: 'Pagos bancarios', monto: data.salidasBanco })
  data.gastosDetalle.forEach(g => egresosRows.push({ label: g.nombre, monto: g.debe }))

  egresosRows.forEach((r, i) => {
    if (y > PH - 35) {
      doc.addPage()
      addHeader(doc, logo, 'Flujo de Caja (cont.)')
      addFooter(doc, f.referencia, doc.getNumberOfPages())
      y = 42
    }
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 7, C.filasPares)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setColor(doc, C.textoCuerpo)
    doc.text(r.label, ML + 4, y + 5)
    setColor(doc, C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(r.monto), PW - MR - 4, y + 5, { align: 'right' })
    y += 7
  })
  fillRect(doc, ML, y, CW, 8, C.filasPares)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.rojo)
  doc.text('TOTAL EGRESOS', ML + 4, y + 5.5)
  doc.text(formatBs(data.totalSalidas), PW - MR - 4, y + 5.5, { align: 'right' })
  y += 14

  // Saldo final bar
  fillRect(doc, ML, y, CW, 10, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.blanco)
  doc.text('SALDO DISPONIBLE (Caja + Banco)', ML + 4, y + 7)
  setColor(doc, C.verde)
  doc.setFontSize(12)
  doc.text(formatBs(data.saldoDisponible), PW - MR - 4, y + 7, { align: 'right' })

  doc.save(fileName)
}

/* ════════════════════════════════════════════════════
   Legacy: full report (all 5 in one PDF) — kept for backward compat
   ════════════════════════════════════════════════════ */
export async function exportarReporteContablePDF(data: ExportData) {
  const doc = createDoc()
  const logo = await loadImage(altrionLogoSrc)
  const f = parseFecha(data.hasta)
  const fileName = `DOMIA_Reporte_${f.condoSlug(data.condominioNombre)}_${f.mes}_${f.anio}.pdf`

  // Page 1: Cover
  addPortada(doc, logo, data, 'Reporte Contable', f)

  // Page 2: Balance General
  doc.addPage()
  addHeader(doc, logo, 'Balance General')
  addFooter(doc, f.referencia, 2)

  let y = 42
  const activos = data.saldos.filter(s => s.tipo === 'activo' && s.nivel >= 2)
  const pasivos = data.saldos.filter(s => s.tipo === 'pasivo' && s.nivel >= 2)
  const patrimonio = data.saldos.filter(s => s.tipo === 'patrimonio' && s.nivel >= 2)

  function drawSection(items: SaldoCuenta[], title: string, totalLabel: string, total: number, totalColor: string) {
    fillRect(doc, ML, y, CW, 7, C.fondoTotales)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(title, ML + 4, y + 5)
    y += 9

    items.forEach((s, i) => {
      if (y > PH - 30) {
        doc.addPage()
        addHeader(doc, logo, title + ' (cont.)')
        addFooter(doc, f.referencia, doc.getNumberOfPages())
        y = 42
      }
      const leaf = data.isLeaf(s.codigo)
      if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)
      doc.setFont('helvetica', leaf ? 'normal' : 'bold')
      doc.setFontSize(8)
      setColor(doc, C.grisLabel)
      doc.text(s.codigo, ML + 4, y + 4.5)
      setColor(doc, C.textoCuerpo)
      doc.text(s.nombre, ML + (leaf ? 28 : 20), y + 4.5)
      if (leaf) {
        const displayVal = s.codigo === '3.2' ? data.resultado : s.saldo
        doc.text(formatBs(displayVal), PW - MR - 4, y + 4.5, { align: 'right' })
      }
      y += 6.5
    })

    fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(totalLabel, ML + 4, y + 5.5)
    setColor(doc, totalColor)
    doc.text(formatBs(total), PW - MR - 4, y + 5.5, { align: 'right' })
    y += 11
  }

  drawSection(activos, 'ACTIVO', 'TOTAL ACTIVO', data.totalActivos, C.verde)
  drawSection(pasivos, 'PASIVO', 'TOTAL PASIVO', data.totalPasivos, '#E8A040')
  drawSection(patrimonio, 'PATRIMONIO', 'TOTAL PATRIMONIO', data.totalPatrimonio, C.blanco)

  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.blanco)
  doc.text('PASIVO + PATRIMONIO', ML + 4, y + 6.5)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalPasivos + data.totalPatrimonio), PW - MR - 4, y + 6.5, { align: 'right' })

  // Page 3: Estado de Resultados
  doc.addPage()
  addHeader(doc, logo, 'Estado de Resultados')
  addFooter(doc, f.referencia, 3)

  y = 42
  const ingresos = data.saldos.filter(s => s.tipo === 'ingreso' && s.nivel >= 2)
  const gastosCuentas = data.saldos.filter(s => s.tipo === 'gasto' && s.nivel >= 2)

  drawSection(ingresos, 'INGRESOS', 'TOTAL INGRESOS', data.totalIngresos, C.verde)
  drawSection(gastosCuentas, 'GASTOS', 'TOTAL GASTOS', data.totalGastos, C.rojo)

  const barColor = data.resultado >= 0 ? C.verde : C.rojo
  fillRect(doc, ML, y, CW, 10, barColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(doc, C.blanco)
  doc.text(`${data.resultado >= 0 ? 'SUPERAVIT' : 'DEFICIT'} DEL PERIODO`, ML + 4, y + 7)
  doc.text(formatBs(Math.abs(data.resultado)), PW - MR - 4, y + 7, { align: 'right' })

  // Page 4: Sumas y Saldos
  doc.addPage()
  addHeader(doc, logo, 'Balance de Sumas y Saldos')
  addFooter(doc, f.referencia, 4)

  y = 42
  fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, C.blanco)
  doc.text('CODIGO', ML + 4, y + 5.5)
  doc.text('CUENTA', ML + 32, y + 5.5)
  doc.text('DEBE', PW - MR - 90, y + 5.5, { align: 'right' })
  doc.text('HABER', PW - MR - 48, y + 5.5, { align: 'right' })
  doc.text('SALDO', PW - MR - 4, y + 5.5, { align: 'right' })
  y += 9

  data.todosConMov.forEach((s, i) => {
    if (y > PH - 35) {
      doc.addPage()
      addHeader(doc, logo, 'Balance de Sumas y Saldos (cont.)')
      addFooter(doc, f.referencia, doc.getNumberOfPages())
      y = 42
    }
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, C.grisLabel)
    doc.text(s.codigo, ML + 4, y + 4.5)
    setColor(doc, C.textoCuerpo)
    doc.text(s.nombre, ML + 32, y + 4.5)
    doc.text(formatBs(s.debe), PW - MR - 90, y + 4.5, { align: 'right' })
    doc.text(formatBs(s.haber), PW - MR - 48, y + 4.5, { align: 'right' })
    setColor(doc, s.saldo >= 0 ? C.verde : C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(s.saldo), PW - MR - 4, y + 4.5, { align: 'right' })
    y += 6.5
  })

  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.blanco)
  doc.text('TOTALES', ML + 4, y + 6)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalDebeSumas), PW - MR - 90, y + 6, { align: 'right' })
  doc.text(formatBs(data.totalHaberSumas), PW - MR - 48, y + 6, { align: 'right' })

  const cuadra = Math.abs(data.totalDebeSumas - data.totalHaberSumas) < 0.01
  if (cuadra) {
    fillRect(doc, PW - MR - 30, y + 1.5, 26, 6, C.verde)
    setColor(doc, C.blanco)
    doc.setFontSize(8)
    doc.text('CUADRA', PW - MR - 17, y + 5.8, { align: 'center' })
  }

  // Page 5: Flujo de Caja
  doc.addPage()
  addHeader(doc, logo, 'Flujo de Caja')
  addFooter(doc, f.referencia, 5)

  y = 42
  const cardsData = [
    { label: 'TOTAL INGRESOS', valor: data.totalEntradas, color: C.verde },
    { label: 'TOTAL EGRESOS', valor: data.totalSalidas, color: C.rojo },
    { label: 'SALDO DISPONIBLE', valor: data.saldoDisponible, color: C.encabezadoTabla },
  ]
  const cardW = (CW - 8) / 3
  cardsData.forEach((c, i) => {
    const cx = ML + i * (cardW + 4)
    fillRect(doc, cx, y, cardW, 22, C.filasPares)
    drawLine(doc, cx, y, cx + cardW, y, c.color, 1.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(doc, C.grisLabel)
    doc.text(c.label, cx + cardW / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setColor(doc, c.color)
    doc.text(formatBs(c.valor), cx + cardW / 2, y + 17, { align: 'center' })
  })
  y += 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.textoCuerpo)
  doc.text('Detalle de Ingresos', ML, y)
  y += 5

  const ingresosRowsF = [
    { label: 'Cobros en efectivo (Caja)', monto: data.entradasCaja },
    { label: 'Cobros por transferencia/QR (Banco)', monto: data.entradasBanco },
  ]
  ingresosRowsF.forEach((r, i) => {
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 7, C.filasPares)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setColor(doc, C.textoCuerpo)
    doc.text(r.label, ML + 4, y + 5)
    setColor(doc, C.verde)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(r.monto), PW - MR - 4, y + 5, { align: 'right' })
    y += 7
  })
  fillRect(doc, ML, y, CW, 8, C.filasPares)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.verde)
  doc.text('TOTAL INGRESOS', ML + 4, y + 5.5)
  doc.text(formatBs(data.totalEntradas), PW - MR - 4, y + 5.5, { align: 'right' })
  y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.textoCuerpo)
  doc.text('Detalle de Egresos', ML, y)
  y += 5

  const egresosRowsF: { label: string; monto: number }[] = []
  if (data.salidasCaja > 0) egresosRowsF.push({ label: 'Pagos en efectivo (Caja)', monto: data.salidasCaja })
  if (data.salidasBanco > 0) egresosRowsF.push({ label: 'Pagos bancarios', monto: data.salidasBanco })
  data.gastosDetalle.forEach(g => egresosRowsF.push({ label: g.nombre, monto: g.debe }))

  egresosRowsF.forEach((r, i) => {
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 7, C.filasPares)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setColor(doc, C.textoCuerpo)
    doc.text(r.label, ML + 4, y + 5)
    setColor(doc, C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(r.monto), PW - MR - 4, y + 5, { align: 'right' })
    y += 7
  })
  fillRect(doc, ML, y, CW, 8, C.filasPares)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.rojo)
  doc.text('TOTAL EGRESOS', ML + 4, y + 5.5)
  doc.text(formatBs(data.totalSalidas), PW - MR - 4, y + 5.5, { align: 'right' })
  y += 14

  fillRect(doc, ML, y, CW, 10, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.blanco)
  doc.text('SALDO DISPONIBLE (Caja + Banco)', ML + 4, y + 7)
  setColor(doc, C.verde)
  doc.setFontSize(12)
  doc.text(formatBs(data.saldoDisponible), PW - MR - 4, y + 7, { align: 'right' })

  doc.save(fileName)
}
