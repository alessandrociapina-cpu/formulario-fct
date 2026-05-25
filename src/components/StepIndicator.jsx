import { STEP_LABELS } from '../data/formSchema'
import { calcGroupScore, scoreLabel, scoreBg } from '../utils/scoring'

export default function StepIndicator({ currentStep, onNavigate, answers }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {STEP_LABELS.map((label, i) => {
          const isActive = i === currentStep
          const isDone = i < currentStep
          let groupScore = null
          // Steps 2-8 correspond to groups 1-7
          if (i >= 2 && i <= 8) {
            groupScore = calcGroupScore(i - 1, answers)
          }
          return (
            <button key={i} onClick={() => onNavigate(i)} className={`flex flex-col items-center px-2.5 py-2 min-w-[60px] transition-colors touch-manipulation ${isActive ? 'border-b-2 border-blue-600 text-blue-700' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-slate-300 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
              <span className="text-[9px] font-medium leading-tight text-center">{label}</span>
              {groupScore !== null && (
                <span className={`mt-0.5 text-[8px] font-bold px-1 py-0.5 rounded-full text-white ${scoreBg(groupScore.ratio)}`}>{scoreLabel(groupScore.ratio)}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
