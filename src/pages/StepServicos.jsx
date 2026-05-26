import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { SERVICES } from '../data/formSchema'

const CATEGORIES = [
  'Ligações e Conexões',
  'Reparos',
  'Equipamentos Especiais',
  'Obras Civis',
  'Pavimentação',
]

const CATEGORY_COLORS = {
  'Ligações e Conexões':   { bg: 'bg-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', check: 'text-emerald-600' },
  'Reparos':               { bg: 'bg-red-700',     light: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     check: 'text-red-600' },
  'Equipamentos Especiais':{ bg: 'bg-blue-700',    light: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    check: 'text-blue-600' },
  'Obras Civis':           { bg: 'bg-amber-700',   light: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   check: 'text-amber-600' },
  'Pavimentação':          { bg: 'bg-purple-700',  light: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-800',  check: 'text-purple-600' },
}

export default function StepServicos({ selectedServices, onChange }) {
  const [collapsed, setCollapsed] = useState({})

  function toggle(id) {
    onChange(
      selectedServices.includes(id)
        ? selectedServices.filter(s => s !== id)
        : [...selectedServices, id]
    )
  }

  function toggleCategory(category) {
    const ids = SERVICES.filter(s => s.category === category).map(s => s.id)
    const allOn = ids.every(id => selectedServices.includes(id))
    if (allOn) {
      onChange(selectedServices.filter(id => !ids.includes(id)))
    } else {
      const next = [...selectedServices]
      ids.forEach(id => { if (!next.includes(id)) next.push(id) })
      onChange(next)
    }
  }

  function toggleCollapse(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div>
      <div className="bg-blue-800 text-white px-4 py-3">
        <h2 className="text-base font-bold">Serviços a Fiscalizar</h2>
        <p className="text-blue-300 text-xs mt-0.5">
          {selectedServices.length === 0
            ? 'Selecione os serviços presentes nesta vistoria'
            : `${selectedServices.length} serviço${selectedServices.length !== 1 ? 's' : ''} selecionado${selectedServices.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs text-blue-700 font-medium">
          Subgrupos não selecionados aparecerão colapsados nas etapas seguintes
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {CATEGORIES.map(cat => {
          const services = SERVICES.filter(s => s.category === cat)
          const selectedCount = services.filter(s => selectedServices.includes(s.id)).length
          const allOn = selectedCount === services.length
          const isCollapsed = collapsed[cat]
          const c = CATEGORY_COLORS[cat]

          return (
            <div key={cat}>
              {/* Category header */}
              <div className={`${c.bg} text-white`}>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleCollapse(cat)}
                    className="flex items-center gap-2 flex-1 text-left touch-manipulation"
                  >
                    {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    <span className="text-sm font-bold">{cat}</span>
                    <span className="text-[11px] font-normal opacity-80">
                      {selectedCount}/{services.length}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors touch-manipulation shrink-0"
                  >
                    {allOn ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>
              </div>

              {/* Service rows */}
              {!isCollapsed && (
                <div className={`${c.light}`}>
                  {services.map(svc => {
                    const isOn = selectedServices.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggle(svc.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 border-b ${c.border} last:border-b-0 touch-manipulation transition-colors ${isOn ? 'bg-white' : ''} active:opacity-70`}
                      >
                        {isOn
                          ? <CheckSquare size={20} className={c.check} />
                          : <Square size={20} className="text-slate-300" />
                        }
                        <span className={`text-sm font-medium flex-1 text-left ${isOn ? c.text : 'text-slate-500'}`}>
                          {svc.label}
                        </span>
                        {isOn && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.light} ${c.text} border ${c.border}`}>
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedServices.length === 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800 font-medium">
            ⚠ Nenhum serviço selecionado — todos os subgrupos condicionais aparecerão colapsados.
          </p>
        </div>
      )}

      <div className="p-4 pb-6">
        <p className="text-[11px] text-slate-400 text-center">
          Você pode ajustar a seleção voltando a esta tela a qualquer momento.
        </p>
      </div>
    </div>
  )
}
