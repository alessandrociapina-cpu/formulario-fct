import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const BORDER_COLORS = {
  blue: 'border-blue-100', emerald: 'border-emerald-100', amber: 'border-amber-100',
  orange: 'border-orange-100', red: 'border-red-100', slate: 'border-slate-200', purple: 'border-purple-100',
}
const BADGE_COLORS = {
  blue: 'bg-blue-50 text-blue-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700', red: 'bg-red-50 text-red-700', slate: 'bg-slate-100 text-slate-600', purple: 'bg-purple-50 text-purple-700',
}

export default function EvalItem({ item, value, justificativa, observacao, onChange, onJustify, onObs, groupColor, disabled }) {
  const [showObs, setShowObs] = useState(false)
  const borderColor = BORDER_COLORS[groupColor] || 'border-slate-100'
  const badgeColor = BADGE_COLORS[groupColor] || 'bg-slate-50 text-slate-700'
  const isEval = item.type === 'eval'
  const isInfo = item.type === 'info'
  const showJustify = item.justify && value === '0'
  const missingJustify = showJustify && !justificativa?.trim()

  return (
    <div className={`border-b ${borderColor} last:border-b-0 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor} mt-0.5`}>{item.id}</span>
          <div className="flex-1">
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.text}</p>
            <span className="inline-block mt-1 text-[10px] text-slate-400 font-normal">
              {isInfo ? 'Informativo' : `Peso: ${item.peso}`}
            </span>
          </div>
        </div>

        {isEval && (
          <div className="flex gap-2">
            <button className={`eval-btn-atende ${value === '1' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === '1' ? null : '1')}>✓ ATENDE</button>
            <button className={`eval-btn-nao ${value === '0' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === '0' ? null : '0')}>✗ NÃO ATENDE</button>
            <button className={`eval-btn-na ${value === 'X' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === 'X' ? null : 'X')}>N/A</button>
          </div>
        )}

        {isInfo && (
          <input
            type="text"
            className="field-input"
            placeholder="Informe aqui..."
            value={value || ''}
            onChange={e => onChange(item.id, e.target.value || null)}
          />
        )}

        {showJustify && (
          <div className="mt-2">
            <label className="text-xs font-semibold text-red-600 block mb-1">⚠ Justificativa obrigatória:</label>
            <textarea
              className={`field-input min-h-[72px] resize-none ${missingJustify ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Descreva o motivo de não atendimento..."
              value={justificativa || ''}
              onChange={e => onJustify(item.id, e.target.value)}
            />
          </div>
        )}

        {isEval && (
          <button className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowObs(!showObs)}>
            {showObs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Observações {observacao ? '(preenchido)' : '(opcional)'}
          </button>
        )}

        {showObs && (
          <textarea
            className="field-input mt-1 min-h-[60px] resize-none text-xs"
            placeholder="Observações adicionais..."
            value={observacao || ''}
            onChange={e => onObs(item.id, e.target.value)}
          />
        )}
      </div>
    </div>
  )
}
