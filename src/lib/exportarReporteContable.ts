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

interface ExportData {
  condominioNombre: string
  hasta: string
  saldos: SaldoCuenta[]
  isLeaf: (codigo: string) => boolean
  resultado: number
  // Pre-calculated totals
  totalActivos: number; totalPasivos: number; totalPatrimonio: number
  totalIngresos: number; totalGastos: number
  // Sumas y saldos
  todosConMov: SaldoCuenta[]; totalDebeSumas: number; totalHaberSumas: number
  // Flujo
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

const PW = 210 // A4 width mm
const PH = 297 // A4 height mm
const ML = 18  // margin left
const MR = 18  // margin right
const CW = PW - ML - MR // content width

function addHeader(doc: jsPDF, logo: HTMLImageElement, sectionName: string) {
  doc.addImage(logo, 'JPEG', ML, 12, 22, 22 * (logo.height / logo.width))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.grisLabel)
  doc.text(sectionName.toUpperCase(), PW - MR, 20, { align: 'right' })
  drawLine(doc, ML, 28, PW - MR, 28, C.dorado, 1)
}

function addFooter(doc: jsPDF, referencia: string, pagina: number) {
  drawLine(doc, ML, PH - 18, PW - MR, PH - 18, '#D4D4D4', 0.3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, C.grisLabel)
  doc.text(`ALTRION S.R.L. — Reporte Contable Confidencial | ${referencia}`, ML, PH - 13)
  doc.text(`Pagina ${pagina}`, PW - MR, PH - 13, { align: 'right' })
}

export async function exportarReporteContablePDF(data: ExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const logo = await loadImage(altrionLogoSrc)

  const fechaCorte = new Date(data.hasta + 'T12:00:00')
  const mes = MESES[fechaCorte.getMonth()]
  const anio = fechaCorte.getFullYear()
  const periodo = `${mes} ${anio}`
  const condoSlug = data.condominioNombre.replace(/\s+/g, '')
  const referencia = `RPT-${anio}-${String(fechaCorte.getMonth() + 1).padStart(2, '0')}`
  const fileName = `DOMIA_Reporte_${condoSlug}_${mes}_${anio}.pdf`

  /* ════════ PÁGINA 1: PORTADA ════════ */
  fillRect(doc, 0, 0, PW, PH, C.fondoPortada)

  // Logo
  const logoW = 50
  const logoH = logoW * (logo.height / logo.width)
  doc.addImage(logo, 'JPEG', (PW - logoW) / 2, 65, logoW, logoH)

  // Línea dorada
  const lineY = 65 + logoH + 12
  drawLine(doc, (PW - 40) / 2, lineY, (PW + 40) / 2, lineY, C.dorado, 1.5)

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  setColor(doc, C.blanco)
  doc.text('REPORTE CONTABLE', PW / 2, lineY + 18, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  setColor(doc, C.acentoAzul)
  doc.text('Modulo Contable Integral — DOMIA', PW / 2, lineY + 28, { align: 'center' })

  // Línea separadora
  const sepY = PH - 80
  drawLine(doc, ML, sepY, PW - MR, sepY, C.dorado, 0.5)

  // 4 bloques info
  const blocks = [
    { label: 'CONDOMINIO', value: data.condominioNombre },
    { label: 'PERIODO', value: periodo },
    { label: 'FECHA DE CORTE', value: fechaCorte.toLocaleDateString('es-BO') },
    { label: 'REFERENCIA', value: referencia },
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

  /* ════════ PÁGINA 2: BALANCE GENERAL ════════ */
  doc.addPage()
  addHeader(doc, logo, 'Balance General')
  addFooter(doc, referencia, 2)

  let y = 36
  const activos = data.saldos.filter(s => s.tipo === 'activo' && s.nivel >= 2)
  const pasivos = data.saldos.filter(s => s.tipo === 'pasivo' && s.nivel >= 2)
  const patrimonio = data.saldos.filter(s => s.tipo === 'patrimonio' && s.nivel >= 2)

  function drawSection(items: SaldoCuenta[], title: string, totalLabel: string, total: number, totalColor: string) {
    // Section title
    fillRect(doc, ML, y, CW, 7, C.fondoTotales)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(doc, C.blanco)
    doc.text(title, ML + 4, y + 5)
    y += 9

    // Rows
    items.forEach((s, i) => {
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

    // Total row
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

  // Pasivo + Patrimonio bar
  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setColor(doc, C.blanco)
  doc.text('PASIVO + PATRIMONIO', ML + 4, y + 6.5)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalPasivos + data.totalPatrimonio), PW - MR - 4, y + 6.5, { align: 'right' })

  /* ════════ PÁGINA 3: ESTADO DE RESULTADOS ════════ */
  doc.addPage()
  addHeader(doc, logo, 'Estado de Resultados')
  addFooter(doc, referencia, 3)

  y = 36
  const ingresos = data.saldos.filter(s => s.tipo === 'ingreso' && s.nivel >= 2)
  const gastosCuentas = data.saldos.filter(s => s.tipo === 'gasto' && s.nivel >= 2)

  drawSection(ingresos, 'INGRESOS', 'TOTAL INGRESOS', data.totalIngresos, C.verde)
  drawSection(gastosCuentas, 'GASTOS', 'TOTAL GASTOS', data.totalGastos, C.rojo)

  // Superávit/Déficit bar
  const barColor = data.resultado >= 0 ? C.verde : C.rojo
  fillRect(doc, ML, y, CW, 10, barColor)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(doc, C.blanco)
  doc.text(`${data.resultado >= 0 ? 'SUPERAVIT' : 'DEFICIT'} DEL PERIODO`, ML + 4, y + 7)
  doc.text(formatBs(Math.abs(data.resultado)), PW - MR - 4, y + 7, { align: 'right' })

  /* ════════ PÁGINA 4: BALANCE DE SUMAS Y SALDOS ════════ */
  doc.addPage()
  addHeader(doc, logo, 'Balance de Sumas y Saldos')
  addFooter(doc, referencia, 4)

  y = 36
  // Column headers
  fillRect(doc, ML, y, CW, 8, C.encabezadoTabla)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(doc, C.blanco)
  doc.text('CODIGO', ML + 4, y + 5.5)
  doc.text('CUENTA', ML + 28, y + 5.5)
  doc.text('DEBE', PW - MR - 64, y + 5.5, { align: 'right' })
  doc.text('HABER', PW - MR - 34, y + 5.5, { align: 'right' })
  doc.text('SALDO', PW - MR - 4, y + 5.5, { align: 'right' })
  y += 9

  // Data rows
  data.todosConMov.forEach((s, i) => {
    if (y > PH - 35) {
      doc.addPage()
      addHeader(doc, logo, 'Balance de Sumas y Saldos (cont.)')
      addFooter(doc, referencia, 4)
      y = 36
    }
    if (i % 2 === 0) fillRect(doc, ML, y, CW, 6.5, C.filasPares)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, C.grisLabel)
    doc.text(s.codigo, ML + 4, y + 4.5)
    setColor(doc, C.textoCuerpo)
    doc.text(s.nombre, ML + 28, y + 4.5)
    doc.text(formatBs(s.debe), PW - MR - 64, y + 4.5, { align: 'right' })
    doc.text(formatBs(s.haber), PW - MR - 34, y + 4.5, { align: 'right' })
    setColor(doc, s.saldo >= 0 ? C.verde : C.rojo)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBs(s.saldo), PW - MR - 4, y + 4.5, { align: 'right' })
    y += 6.5
  })

  // Totals row
  fillRect(doc, ML, y, CW, 9, C.fondoTotales)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(doc, C.blanco)
  doc.text('TOTALES', ML + 4, y + 6)
  setColor(doc, C.verde)
  doc.text(formatBs(data.totalDebeSumas), PW - MR - 64, y + 6, { align: 'right' })
  doc.text(formatBs(data.totalHaberSumas), PW - MR - 34, y + 6, { align: 'right' })

  const cuadra = Math.abs(data.totalDebeSumas - data.totalHaberSumas) < 0.01
  if (cuadra) {
    fillRect(doc, PW - MR - 26, y + 1.5, 22, 6, C.verde)
    setColor(doc, C.blanco)
    doc.setFontSize(8)
    doc.text('CUADRA', PW - MR - 15, y + 5.8, { align: 'center' })
  }
  y += 13

  // Verification note
  if (cuadra) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    setColor(doc, C.verde)
    doc.text('Verificacion contable aprobada: Partida doble correcta.', ML, y)
  }

  /* ════════ PÁGINA 5: FLUJO DE CAJA ════════ */
  doc.addPage()
  addHeader(doc, logo, 'Flujo de Caja')
  addFooter(doc, referencia, 5)

  y = 36
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

  /* ─── Guardar ─── */
  doc.save(fileName)
}
