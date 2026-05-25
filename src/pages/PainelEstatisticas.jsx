import { useState, useCallback } from 'react'
import { ChevronLeft, Upload, BarChart2, TrendingUp, AlertTriangle, Users, X, FileDown } from 'lucide-react'
import { parseFiles, calcStats } from '../utils/statsEngine'
import { generateStatsPDF } from '../utils/statsPdfExport'

function pct(ratio) {
  return ratio !== null && ratio !== undefined ? `${Math.round(ratio * 100)}%` : '—'
}

function ratioColor(ratio) {
  if (ratio === null || ratio === undefined) return 'bg-slate-300'
  if (ratio >= 0.8) return 'bg-emerald-500'
  if (ratio >= 0.6) return 'bg-amber-500'
  return 'bg-red-500'
}

function ratioText(ratio) {
  if (ratio === null || ratio === undefined) return 'text-slate-400'
  if (ratio >= 0.8) return 'text-emerald-600'
  if (ratio >= 0.6) return 'text-amber-600'
  return 'text-red-600'
}

function HBar({ ratio, label, sublabel }) {
  const w = ratio !== null && ratio !== undefined ? `${Math.round(ratio * 100)}%` : '0%'
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <span className="text-xs text-slate-700 font-medium truncate">{label}</span>
        <span className={`text-xs font-bold shrink-0 ${ratioText(ratio)}`}>{pct(ratio)}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${ratioColor(ratio)}`} style={{ width: w }} />
      </div>
      {sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function EvolucaoChart({ data }) {
  const MAX_H = 72
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-max pt-4">
        {data.map((d) => {
          const barH = Math.max(4, Math.round(d.media * MAX_H))
          const color = d.media >= 0.8 ? 'bg-emerald-500' : d.media >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
          return (
            <div key={d.data} className="flex flex-col items-center gap-1 shrink-0 w-10">
              <span className="text-[8px] text-slate-500 font-semibold">{Math.round(d.media * 100)}%</span>
              <div className={`w-full rounded-t-md ${color} opacity-90`} style={{ height: barH }} />
              <span className="text-[8px] text-slate-400 text-center leading-tight">{d.data.slice(5)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> ≥ 80% aprovado
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> 60–79% regular
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> &lt; 60% reprovado
        </span>
      </div>
    </div>
  )
}

export default function PainelEstatisticas({ onBack }) {
  const [reports, setReports] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function handleExportPDF() {
    if (!stats) return
    setExporting(true)
    try {
      const doc = generateStatsPDF(stats, reports.length)
      const date = new Date().toISOString().slice(0, 10)
      doc.save(`estatisticas-fct-${date}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  async function handleFiles(fileList) {
    setError('')
    const parsed = await parseFiles(Array.from(fileList))
    if (parsed.length === 0) {
      setError('Nenhum arquivo JSON válido (formato FCT Vistoria) encontrado.')
      return
    }
    setReports((prev) => {
      const existing = new Set(prev.map((r) => r.meta?.vistoriaId).filter(Boolean))
      const newOnes = parsed.filter((r) => !r.meta?.vistoriaId || !existing.has(r.meta.vistoriaId))
      return [...prev, ...newOnes]
    })
  }

  const onDrop = useCallback(async (e) => {
    e.preventDefault()
    setDragging(false)
    await handleFiles(e.dataTransfer.files)
  }, [])

  const stats = reports.length ? calcStats(reports) : null

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-md">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-blue-800 transition-colors touch-manipulation"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Painel de Estatísticas FCT</p>
          <p className="text-blue-300 text-[10px]">
            {reports.length > 0
              ? `${reports.length} relatório${reports.length > 1 ? 's' : ''} carregado${reports.length > 1 ? 's' : ''}`
              : 'Nenhum relatório carregado'}
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[10px] font-bold transition-colors touch-manipulation px-2.5 py-1.5 rounded-lg"
            >
              <FileDown size={12} /> {exporting ? 'Gerando…' : 'PDF'}
            </button>
            <button
              onClick={() => setReports([])}
              className="flex items-center gap-1 text-blue-300 hover:text-white text-[10px] font-medium transition-colors touch-manipulation px-2 py-1 rounded-lg hover:bg-blue-800"
            >
              <X size={12} /> Limpar
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'
          }`}
        >
          <Upload size={26} className="mx-auto mb-2 text-blue-400" />
          <p className="text-sm font-semibold text-slate-700 mb-0.5">Carregar relatórios JSON</p>
          <p className="text-xs text-slate-400 mb-3">Arraste arquivos aqui ou clique para selecionar</p>
          <label className="inline-block cursor-pointer bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-800 active:scale-95 transition-all touch-manipulation">
            Selecionar arquivos
            <input
              type="file"
              accept=".json"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          {reports.length > 0 && (
            <p className="text-emerald-600 text-xs mt-2 font-semibold">
              ✓ {reports.length} relatório{reports.length > 1 ? 's' : ''} carregado{reports.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!stats && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <BarChart2 size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">Carregue arquivos JSON para ver as estatísticas</p>
            <p className="text-xs text-slate-300 mt-1">Exporte vistorias do formulário FCT e importe aqui</p>
          </div>
        )}

        {stats && (
          <>
            {/* Resumo geral */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="text-2xl font-black text-blue-800">{stats.total}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Vistorias</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className={`text-2xl font-black ${ratioText(stats.mediaGeral)}`}>{pct(stats.mediaGeral)}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Média Geral</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="text-2xl font-black text-emerald-600">
                  {stats.total > 0 ? Math.round((stats.aprovadas / stats.total) * 100) : 0}%
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Aprovadas</p>
              </div>
            </div>

            {/* Distribuição */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-3">Distribuição de Resultados</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Aprovadas', sub: '≥ 80%', value: stats.aprovadas, bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
                  { label: 'Regulares', sub: '60 – 79%', value: stats.regulares, bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
                  { label: 'Reprovadas', sub: '< 60%', value: stats.reprovadas, bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' },
                ].map(({ label, sub, value, text, light }) => (
                  <div key={label} className={`${light} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${text}`}>{value}</p>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{label}</p>
                    <p className="text-[9px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conceito por grupo */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-500" />
                Conceito por Grupo
              </h2>
              {stats.porGrupo.map((g) => (
                <HBar
                  key={g.id}
                  ratio={g.media}
                  label={g.nome}
                  sublabel={g.count > 0 ? `${g.count} avaliação${g.count !== 1 ? 'ões' : ''}` : 'Sem dados'}
                />
              ))}
            </div>

            {/* Ranking por contratada */}
            {stats.porContratada.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-blue-500" />
                  Ranking por Contratada
                </h2>
                {stats.porContratada.map((c, i) => (
                  <HBar
                    key={c.nome}
                    ratio={c.media}
                    label={`${i + 1}. ${c.nome}`}
                    sublabel={`${c.count} vistoria${c.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Evolução temporal */}
            {stats.evolucao.length > 1 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-500" />
                  Evolução Temporal
                </h2>
                <p className="text-[10px] text-slate-400 mb-3">Média de conceito por data de amostra</p>
                <EvolucaoChart data={stats.evolucao} />
              </div>
            )}

            {/* Itens mais problemáticos */}
            {stats.itensProblematicos.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Itens Mais Problemáticos
                </h2>
                <p className="text-[10px] text-slate-400 mb-3">Itens com menor taxa de aprovação (apenas itens com peso &gt; 0)</p>
                <div className="space-y-3">
                  {stats.itensProblematicos.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className="text-[11px] text-slate-600 leading-snug flex-1">
                          <span className="font-semibold text-slate-800">{item.id}</span> — {item.texto}
                        </p>
                        <span className={`text-xs font-bold shrink-0 ${ratioText(item.media)}`}>{pct(item.media)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ratioColor(item.media)}`}
                          style={{ width: `${Math.round(item.media * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {item.total} avaliação{item.total !== 1 ? 'ões' : ''} · peso {item.peso}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão exportar PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-blue-800 active:scale-95 transition-all touch-manipulation shadow disabled:opacity-50"
            >
              <FileDown size={18} />
              {exporting ? 'Gerando PDF…' : 'Exportar Relatório em PDF'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
