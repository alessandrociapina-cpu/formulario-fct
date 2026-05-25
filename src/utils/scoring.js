import { GROUPS } from '../data/formSchema'

export function getGroupItems(group) {
  if (group.subgroups) return group.subgroups.flatMap(sg => sg.items)
  return group.items || []
}

export function calcGroupScore(groupId, answers) {
  const group = GROUPS.find(g => g.id === groupId)
  if (!group) return null
  const allItems = getGroupItems(group)
  const eligible = allItems.filter(item => item.peso > 0 && answers[item.id] !== 'X')
  if (eligible.length === 0) return null
  const achieved = eligible.reduce((acc, item) => {
    const nota = answers[item.id] === '1' ? 1 : 0
    return acc + item.peso * nota
  }, 0)
  const maxPossible = eligible.reduce((acc, item) => acc + item.peso, 0)
  return { achieved, maxPossible, ratio: maxPossible > 0 ? achieved / maxPossible : null }
}

export function calcFormScore(answers, skippedGroups = []) {
  const groupScores = GROUPS.map(g => ({
    id: g.id,
    score: skippedGroups.includes(g.id) ? null : calcGroupScore(g.id, answers),
  }))
  const evaluated = groupScores.filter(g => g.score !== null)
  if (evaluated.length === 0) return { groupScores, achieved: 0, maxPossible: 0, ratio: null }
  const totalAchieved = evaluated.reduce((acc, g) => acc + g.score.achieved, 0)
  const totalMax = evaluated.reduce((acc, g) => acc + g.score.maxPossible, 0)
  return { groupScores, achieved: totalAchieved, maxPossible: totalMax, ratio: totalMax > 0 ? totalAchieved / totalMax : null }
}

export function scoreLabel(ratio) {
  if (ratio === null) return '—'
  return `${Math.round(ratio * 100)}%`
}

export function scoreColor(ratio) {
  if (ratio === null) return 'text-slate-400'
  if (ratio >= 0.8) return 'text-emerald-600'
  if (ratio >= 0.6) return 'text-amber-600'
  return 'text-red-600'
}

export function scoreBg(ratio) {
  if (ratio === null) return 'bg-slate-200'
  if (ratio >= 0.8) return 'bg-emerald-500'
  if (ratio >= 0.6) return 'bg-amber-500'
  return 'bg-red-500'
}

export function missingJustifications(answers, justificativas) {
  const missing = []
  GROUPS.forEach(g => {
    const items = getGroupItems(g)
    items.forEach(item => {
      if (item.justify && answers[item.id] === '0') {
        if (!(justificativas[item.id] || '').trim()) missing.push(item.id)
      }
    })
  })
  return missing
}
