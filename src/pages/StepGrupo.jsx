import { useState } from 'react'
import EvalItem from '../components/EvalItem'
import ScoreBar from '../components/ScoreBar'
import { calcGroupScore } from '../utils/scoring'
import { SERVICES, SERVICE_SUBGROUP_IDS } from '../data/formSchema'
import { SkipForward, ChevronDown, ChevronRight } from 'lucide-react'

const colorMap = {
  blue:    { header: 'bg-blue-800',    sub: 'text-blue-200',    skip: 'bg-blue-50 border-blue-200 text-blue-800',        toggle: 'bg-blue-600',    sgBorder: 'border-blue-300',   sgBg: 'bg-blue-50',    sgText: 'text-blue-900',   sgNa: 'border-blue-200 text-blue-700 hover:bg-blue-100' },
  emerald: { header: 'bg-emerald-800', sub: 'text-emerald-200', skip: 'bg-emerald-50 border-emerald-200 text-emerald-800', toggle: 'bg-emerald-600', sgBorder: 'border-emerald-300', sgBg: 'bg-emerald-50', sgText: 'text-emerald-900', sgNa: 'border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
  amber:   { header: 'bg-amber-700',   sub: 'text-amber-100',   skip: 'bg-amber-50 border-amber-200 text-amber-800',      toggle: 'bg-amber-600',   sgBorder: 'border-amber-300',  sgBg: 'bg-amber-50',   sgText: 'text-amber-900',  sgNa: 'border-amber-200 text-amber-700 hover:bg-amber-100' },
  orange:  { header: 'bg-orange-700',  sub: 'text-orange-100',  skip: 'bg-orange-50 border-orange-200 text-orange-800',   toggle: 'bg-orange-600',  sgBorder: 'border-orange-300', sgBg: 'bg-orange-50',  sgText: 'text-orange-900', sgNa: 'border-orange-200 text-orange-700 hover:bg-orange-100' },
  red:     { header: 'bg-red-800',     sub: 'text-red-200',     skip: 'bg-red-50 border-red-200 text-red-800',            toggle: 'bg-red-600',     sgBorder: 'border-red-300',    sgBg: 'bg-red-50',     sgText: 'text-red-900',    sgNa: 'border-red-200 text-red-700 hover:bg-red-100' },
  slate:   { header: 'bg-slate-700',   sub: 'text-slate-300',   skip: 'bg-slate-50 border-slate-200 text-slate-800',      toggle: 'bg-slate-600',   sgBorder: 'border-slate-300',  sgBg: 'bg-slate-100',  sgText: 'text-slate-800',  sgNa: 'border-slate-300 text-slate-600 hover:bg-slate-200' },
  purple:  { header: 'bg-purple-800',  sub: 'text-purple-200',  skip: 'bg-purple-50 border-purple-200 text-purple-800',   toggle: 'bg-purple-600',  sgBorder: 'border-purple-300', sgBg: 'bg-purple-50',  sgText: 'text-purple-900', sgNa: 'border-purple-200 text-purple-700 hover:bg-purple-100' },
}

function isSubgroupActive(sgId, selectedServices) {
  if (!SERVICE_SUBGROUP_IDS.has(sgId)) return true
  return SERVICES.some(svc => svc.subgroups.includes(sgId) && selectedServices.includes(svc.id))
}

export default function StepGrupo({ group, answers, justificativas, observacoes, onChange, onJustify, onObs, skipped, onSkip, selectedServices = [] }) {
  const score = skipped ? null : calcGroupScore(group.id, answers)
  const colors = colorMap[group.color] || colorMap.blue

  const [collapsedSgs, setCollapsedSgs] = useState(() => {
    const initial = {}
    group.subgroups?.forEach(sg => {
      initial[sg.id] = !isSubgroupActive(sg.id, selectedServices)
    })
    return initial
  })

  function handleSkipToggle() {
    onSkip(group.id, !skipped)
  }

  function toggleSg(sgId) {
    setCollapsedSgs(prev => ({ ...prev, [sgId]: !prev[sgId] }))
  }

  function markAllNa(sg) {
    sg.items.forEach(item => { if (item.type === 'eval') onChange(item.id, 'X') })
  }

  return (
    <div>
      <div className={`${colors.header} text-white px-4 py-3`}>
        <h2 className="text-base font-bold">{group.label}</h2>
        <p className={`text-xs ${colors.sub} mt-0.5`}>
          Avaliação: <strong>ATENDE (1)</strong> · <strong>NÃO ATENDE (0)</strong> · <strong>N/A (X)</strong>
        </p>
      </div>

      <div className={`mx-4 mt-3 mb-1 border rounded-xl p-3 flex items-center justify-between gap-3 ${colors.skip}`}>
        <div className="flex items-center gap-2">
          <SkipForward size={16} className="shrink-0" />
          <div>
            <p className="text-sm font-bold leading-tight">Não houve vistoria neste grupo</p>
            <p className="text-xs opacity-70 mt-0.5">Todos os itens serão definidos como N/A</p>
          </div>
        </div>
        <button
          onClick={handleSkipToggle}
          className={`relative inline-flex shrink-0 h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${skipped ? colors.toggle : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${skipped ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {!skipped && <ScoreBar score={score} label={`Conceito do Grupo ${group.id}`} />}

      {skipped ? (
        <div className="p-8 text-center text-slate-400">
          <SkipForward size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Grupo marcado como não vistoriado</p>
          <p className="text-xs mt-1">Todos os itens estão definidos como N/A e serão excluídos da pontuação</p>
        </div>
      ) : (
        <div className="bg-white">
          {group.subgroups ? (
            group.subgroups.map((sg) => {
              const isActive = isSubgroupActive(sg.id, selectedServices)
              const isCollapsed = collapsedSgs[sg.id]

              return (
                <div key={sg.id} className="border-b border-slate-100 last:border-b-0">
                  {/* Subgroup header */}
                  <div className={`border-l-4 ${colors.sgBorder} ${isActive ? colors.sgBg : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1 pl-2 pr-3 py-3">
                      {/* Collapse toggle */}
                      <button
                        onClick={() => toggleSg(sg.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 touch-manipulation py-0.5"
                      >
                        {isCollapsed
                          ? <ChevronRight size={16} className={isActive ? colors.sgText : 'text-slate-400'} />
                          : <ChevronDown size={16} className={isActive ? colors.sgText : 'text-slate-400'} />
                        }
                        <span className={`text-sm font-bold leading-tight text-left ${isActive ? colors.sgText : 'text-slate-400'}`}>
                          {sg.label}
                        </span>
                        {!isActive && (
                          <span className="text-[10px] italic text-slate-400 shrink-0 ml-1">não selecionado</span>
                        )}
                      </button>
                      {/* N/A todos button */}
                      <button
                        onClick={() => markAllNa(sg)}
                        className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors touch-manipulation ${colors.sgNa}`}
                      >
                        N/A todos
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-50">
                      {sg.items.map((item) => (
                        <EvalItem
                          key={item.id}
                          item={item}
                          value={answers[item.id]}
                          justificativa={justificativas[item.id]}
                          observacao={observacoes[item.id]}
                          onChange={onChange}
                          onJustify={onJustify}
                          onObs={onObs}
                          groupColor={group.color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="divide-y divide-slate-50">
              {(group.items || []).map((item) => (
                <EvalItem
                  key={item.id}
                  item={item}
                  value={answers[item.id]}
                  justificativa={justificativas[item.id]}
                  observacao={observacoes[item.id]}
                  onChange={onChange}
                  onJustify={onJustify}
                  onObs={onObs}
                  groupColor={group.color}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {score && !skipped && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-700">
            Conceito do Grupo: {score.achieved.toFixed(1)} / {score.maxPossible} pontos ({Math.round(score.ratio * 100)}%)
          </p>
        </div>
      )}
    </div>
  )
}
