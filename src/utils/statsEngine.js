export async function parseFiles(files) {
  const reports = []
  for (const file of files) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data?.cabecalho && Array.isArray(data?.grupos)) {
        reports.push(data)
      }
    } catch {}
  }
  return reports
}

export function calcStats(reports) {
  if (!reports.length) return null

  const total = reports.length
  const comConceito = reports.filter((r) => r.conceitoFormulario !== null && r.conceitoFormulario !== undefined)

  const mediaGeral = comConceito.length
    ? comConceito.reduce((acc, r) => acc + r.conceitoFormulario, 0) / comConceito.length
    : null

  const aprovadas = comConceito.filter((r) => r.conceitoFormulario >= 0.8).length
  const regulares = comConceito.filter((r) => r.conceitoFormulario >= 0.6 && r.conceitoFormulario < 0.8).length
  const reprovadas = comConceito.filter((r) => r.conceitoFormulario < 0.6).length

  const NOMES_GRUPO = {
    1: 'Equipes e Segurança',
    2: 'Valas',
    3: 'Ligação Água / Esgoto',
    4: 'Reparo',
    5: 'Reaterro',
    6: 'Leito Não Pavimentado',
    7: 'Pavimentação',
  }
  const porGrupo = [1, 2, 3, 4, 5, 6, 7].map((gid) => {
    const dados = reports
      .flatMap((r) => r.grupos || [])
      .filter((g) => g.id === gid && !g.naoVistoriado && g.conceito !== null && g.conceito !== undefined)
    const media = dados.length ? dados.reduce((acc, g) => acc + g.conceito, 0) / dados.length : null
    return { id: gid, nome: NOMES_GRUPO[gid], media, count: dados.length }
  })

  const byContratada = {}
  for (const r of comConceito) {
    const key = r.cabecalho?.contrato_fiscalizada?.trim() || 'Não informado'
    if (!byContratada[key]) byContratada[key] = []
    byContratada[key].push(r.conceitoFormulario)
  }
  const porContratada = Object.entries(byContratada)
    .map(([nome, scores]) => ({
      nome,
      media: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 15)

  const byDate = {}
  for (const r of comConceito) {
    const date = r.cabecalho?.data_amostra || r.meta?.geradoEm?.slice(0, 10) || 'desconhecida'
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(r.conceitoFormulario)
  }
  const evolucao = Object.entries(byDate)
    .map(([data, scores]) => ({
      data,
      media: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => a.data.localeCompare(b.data))

  const itemStats = {}
  for (const r of reports) {
    for (const g of r.grupos || []) {
      if (g.naoVistoriado) continue
      for (const sg of g.subgrupos || []) {
        for (const item of sg.itens || []) {
          if (item.tipo !== 'eval' || item.peso === 0) continue
          if (!itemStats[item.id]) itemStats[item.id] = { texto: item.texto, peso: item.peso, scores: [] }
          if (item.avaliacao === '1') itemStats[item.id].scores.push(1)
          else if (item.avaliacao === '0') itemStats[item.id].scores.push(0)
        }
      }
    }
  }
  const itensProblematicos = Object.entries(itemStats)
    .filter(([, v]) => v.scores.length > 0)
    .map(([id, v]) => ({
      id,
      texto: v.texto,
      peso: v.peso,
      media: v.scores.reduce((a, b) => a + b, 0) / v.scores.length,
      total: v.scores.length,
    }))
    .sort((a, b) => a.media - b.media)
    .slice(0, 10)

  return { total, mediaGeral, aprovadas, regulares, reprovadas, porGrupo, porContratada, evolucao, itensProblematicos }
}
