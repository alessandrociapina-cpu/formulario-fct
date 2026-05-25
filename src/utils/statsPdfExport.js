import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BLUE      = [0, 70, 127]
const LIGHT_BG  = [235, 241, 250]
const WHITE     = [255, 255, 255]
const DARK_GRAY = [80, 80, 80]
const GREEN     = [0, 140, 70]
const AMBER     = [180, 120, 0]
const RED_C     = [190, 30, 30]

function pct(ratio) {
  return ratio !== null && ratio !== undefined ? `${Math.round(ratio * 100)}%` : '—'
}

function ratioTextColor(ratio) {
  if (ratio === null || ratio === undefined) return DARK_GRAY
  if (ratio >= 0.8) return GREEN
  if (ratio >= 0.6) return AMBER
  return RED_C
}

function drawBar(doc, x, y, w, h, ratio) {
  doc.setFillColor(220, 220, 220)
  doc.rect(x, y, w, h, 'F')
  if (ratio !== null && ratio !== undefined && ratio > 0) {
    const fillW = Math.max(0.5, w * Math.min(ratio, 1))
    const color = ratio >= 0.8 ? [0, 150, 80] : ratio >= 0.6 ? [200, 140, 0] : [200, 40, 40]
    doc.setFillColor(...color)
    doc.rect(x, y, fillW, h, 'F')
  }
}

function sectionHeader(doc, label, x, y, w) {
  doc.setFillColor(...BLUE)
  doc.rect(x, y, w, 5.5, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text(label, x + 2.5, y + 3.8)
  return y + 5.5
}

export function generateStatsPDF(stats, reportCount) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW   = 210
  const ML   = 10
  const MR   = 10
  const CW   = PW - ML - MR
  const now  = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  let curY   = 10

  // ── Título ──────────────────────────────────────────
  doc.setFillColor(...BLUE)
  doc.rect(ML, curY, CW, 9, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('PAINEL DE ESTATÍSTICAS — FCT Vistoria', PW / 2, curY + 6, { align: 'center' })
  curY += 9

  doc.setFillColor(...LIGHT_BG)
  doc.rect(ML, curY, CW, 6, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(
    `Gerado em: ${now}   ·   ${reportCount} relatório${reportCount !== 1 ? 's' : ''} analisado${reportCount !== 1 ? 's' : ''}`,
    ML + 2, curY + 4
  )
  curY += 6 + 5

  // ── Cards de resumo ──────────────────────────────────
  const cardW = (CW - 4) / 3
  const cardH = 16
  const taxa  = stats.total > 0 ? stats.aprovadas / stats.total : 0
  const cards = [
    { label: 'Total de Vistorias', value: String(stats.total), color: BLUE },
    { label: 'Média Geral', value: pct(stats.mediaGeral), color: ratioTextColor(stats.mediaGeral) },
    { label: 'Taxa de Aprovação', value: pct(taxa), color: [0, 130, 65] },
  ]

  cards.forEach((card, i) => {
    const cx = ML + i * (cardW + 2)
    doc.setFillColor(...card.color)
    doc.rect(cx, curY, cardW, cardH, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, cx + cardW / 2, curY + 9.5, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, cx + cardW / 2, curY + 13.5, { align: 'center' })
  })
  curY += cardH + 6

  // ── Distribuição ─────────────────────────────────────
  curY = sectionHeader(doc, 'DISTRIBUIÇÃO DE RESULTADOS', ML, curY, CW)
  const distRows = [
    { label: 'Aprovadas  (≥ 80%)',  n: stats.aprovadas },
    { label: 'Regulares  (60–79%)', n: stats.regulares },
    { label: 'Reprovadas (< 60%)',  n: stats.reprovadas },
  ].map((d) => {
    const r = stats.total > 0 ? d.n / stats.total : 0
    return [d.label, String(d.n), pct(r), '']
  })
  const distRatios = [
    stats.total > 0 ? stats.aprovadas / stats.total : 0,
    stats.total > 0 ? stats.regulares / stats.total : 0,
    stats.total > 0 ? stats.reprovadas / stats.total : 0,
  ]

  autoTable(doc, {
    startY: curY, margin: { left: ML, right: MR },
    head: [['Resultado', 'Qtd.', '%', 'Distribuição visual']],
    body: distRows,
    theme: 'grid',
    headStyles: { fillColor: LIGHT_BG, textColor: DARK_GRAY, fontStyle: 'bold', fontSize: 7, cellPadding: 1.8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }, 3: { cellWidth: CW - 101 } },
    didDrawCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        const BAR_H = 3.5
        const bx = data.cell.x + 2
        const by = data.cell.y + (data.cell.height - BAR_H) / 2
        drawBar(doc, bx, by, data.cell.width - 4, BAR_H, distRatios[data.row.index])
      }
    },
  })
  curY = doc.lastAutoTable.finalY + 5

  // ── Conceito por grupo ────────────────────────────────
  curY = sectionHeader(doc, 'CONCEITO POR GRUPO', ML, curY, CW)
  autoTable(doc, {
    startY: curY, margin: { left: ML, right: MR },
    head: [['Grupo', 'Avaliações', 'Média', 'Barra de conceito']],
    body: stats.porGrupo.map((g) => [
      g.nome,
      g.count > 0 ? String(g.count) : '—',
      { content: pct(g.media), styles: { textColor: ratioTextColor(g.media), fontStyle: 'bold' } },
      '',
    ]),
    theme: 'grid',
    headStyles: { fillColor: LIGHT_BG, textColor: DARK_GRAY, fontStyle: 'bold', fontSize: 7, cellPadding: 1.8 },
    styles: { fontSize: 7, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 72 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: CW - 117 } },
    didDrawCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        const g = stats.porGrupo[data.row.index]
        const BAR_H = 3.5
        const bx = data.cell.x + 2
        const by = data.cell.y + (data.cell.height - BAR_H) / 2
        drawBar(doc, bx, by, data.cell.width - 4, BAR_H, g.media)
      }
    },
  })
  curY = doc.lastAutoTable.finalY + 5

  // ── Ranking por contratada ────────────────────────────
  if (stats.porContratada.length > 0) {
    curY = sectionHeader(doc, 'RANKING POR CONTRATADA', ML, curY, CW)
    autoTable(doc, {
      startY: curY, margin: { left: ML, right: MR },
      head: [['#', 'Contratada', 'Vistorias', 'Média', 'Barra']],
      body: stats.porContratada.map((c, i) => [
        String(i + 1),
        c.nome,
        String(c.count),
        { content: pct(c.media), styles: { textColor: ratioTextColor(c.media), fontStyle: 'bold' } },
        '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: LIGHT_BG, textColor: DARK_GRAY, fontStyle: 'bold', fontSize: 7, cellPadding: 1.8 },
      styles: { fontSize: 6.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 88 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: CW - 136 } },
      didDrawCell(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const c = stats.porContratada[data.row.index]
          const BAR_H = 3.5
          const bx = data.cell.x + 2
          const by = data.cell.y + (data.cell.height - BAR_H) / 2
          drawBar(doc, bx, by, data.cell.width - 4, BAR_H, c.media)
        }
      },
    })
    curY = doc.lastAutoTable.finalY + 5
  }

  // ── Evolução temporal ─────────────────────────────────
  if (stats.evolucao.length > 0) {
    curY = sectionHeader(doc, 'EVOLUÇÃO TEMPORAL', ML, curY, CW)
    autoTable(doc, {
      startY: curY, margin: { left: ML, right: MR },
      head: [['Data da Amostra', 'Vistorias', 'Média', 'Resultado']],
      body: stats.evolucao.map((d) => {
        const label = d.media >= 0.8 ? 'Aprovado' : d.media >= 0.6 ? 'Regular' : 'Reprovado'
        return [
          d.data,
          String(d.count),
          { content: pct(d.media), styles: { textColor: ratioTextColor(d.media), fontStyle: 'bold' } },
          { content: label, styles: { textColor: ratioTextColor(d.media), fontStyle: 'bold' } },
        ]
      }),
      theme: 'grid',
      headStyles: { fillColor: LIGHT_BG, textColor: DARK_GRAY, fontStyle: 'bold', fontSize: 7, cellPadding: 1.8 },
      styles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 22, halign: 'center' }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: CW - 79 } },
    })
    curY = doc.lastAutoTable.finalY + 5
  }

  // ── Itens mais problemáticos ──────────────────────────
  if (stats.itensProblematicos.length > 0) {
    curY = sectionHeader(doc, 'ITENS MAIS PROBLEMÁTICOS (menor taxa de conformidade)', ML, curY, CW)
    autoTable(doc, {
      startY: curY, margin: { left: ML, right: MR },
      head: [['Item', 'Descrição', 'Peso', 'Aval.', 'Taxa', 'Barra']],
      body: stats.itensProblematicos.map((item) => [
        item.id,
        item.texto,
        String(item.peso),
        String(item.total),
        { content: pct(item.media), styles: { textColor: ratioTextColor(item.media), fontStyle: 'bold' } },
        '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: LIGHT_BG, textColor: DARK_GRAY, fontStyle: 'bold', fontSize: 7, cellPadding: 1.8 },
      styles: { fontSize: 6, cellPadding: 1.8, overflow: 'linebreak' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 98 }, 2: { cellWidth: 12, halign: 'center' }, 3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 18, halign: 'center' }, 5: { cellWidth: CW - 152 } },
      didDrawCell(data) {
        if (data.column.index === 5 && data.section === 'body') {
          const item = stats.itensProblematicos[data.row.index]
          const BAR_H = 3
          const bx = data.cell.x + 2
          const by = data.cell.y + (data.cell.height - BAR_H) / 2
          drawBar(doc, bx, by, data.cell.width - 4, BAR_H, item.media)
        }
      },
    })
  }

  // ── Rodapé em todas as páginas ────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(
      `FCT Vistoria — Painel de Estatísticas — ${now} — pág. ${p}/${totalPages}`,
      PW / 2, 291, { align: 'center' }
    )
  }

  return doc
}
