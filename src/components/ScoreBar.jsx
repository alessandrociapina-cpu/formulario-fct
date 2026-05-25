import { scoreBg, scoreLabel } from '../utils/scoring'

export default function ScoreBar({ score, label }) {
  if (!score) return null
  const pct = Math.round(score.ratio * 100)
  const bg = scoreBg(score.ratio)
  return (
    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-sm font-bold ${bg.replace('bg-', 'text-')}`}>{scoreLabel(score.ratio)} · {score.achieved.toFixed(1)} / {score.maxPossible} pts</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
