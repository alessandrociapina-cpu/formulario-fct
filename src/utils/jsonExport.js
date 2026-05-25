import { GROUPS } from '../data/formSchema'
import { calcGroupScore, calcFormScore, getGroupItems } from './scoring'

export function buildExportJson(state) {
  const { cabecalho, answers, justificativas, observacoes, fotos, vistoriaId, skippedGroups = [] } = state
  const formScore = calcFormScore(answers, skippedGroups)

  const grupos = GROUPS.map(g => {
    const skipped = skippedGroups.includes(g.id)
    const score = skipped ? null : calcGroupScore(g.id, answers)
    const allItems = getGroupItems(g)
    return {
      id: g.id,
      nome: g.label,
      naoVistoriado: skipped,
      conceito: score ? Math.round(score.ratio * 100) / 100 : null,
      pontos: score?.achieved ?? null,
      pontosMax: score?.maxPossible ?? null,
      subgrupos: g.subgroups ? g.subgroups.map(sg => ({
        id: sg.id,
        label: sg.label,
        itens: sg.items.map(item => ({
          id: item.id,
          texto: item.text,
          peso: item.peso,
          tipo: item.type,
          avaliacao: answers[item.id] ?? null,
          justificativa: justificativas[item.id] ?? null,
          observacao: observacoes[item.id] ?? null,
        })),
      })) : [],
    }
  })

  return {
    meta: { versao: '1.0', geradoEm: new Date().toISOString(), vistoriaId },
    cabecalho,
    grupos,
    conceitoFormulario: formScore.ratio !== null ? Math.round(formScore.ratio * 100) / 100 : null,
    pontosTotal: formScore.achieved,
    pontosMaxTotal: formScore.maxPossible,
    fotos: fotos.map(f => ({
      id: f.id,
      nome: f.name,
      lat: f.lat ?? null,
      lon: f.lon ?? null,
      dataHora: f.datetime ? (f.datetime instanceof Date ? f.datetime.toISOString() : f.datetime) : null,
    })),
  }
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
