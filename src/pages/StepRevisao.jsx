import { useState } from 'react'
import { Download, FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { GROUPS } from '../data/formSchema'
import { calcFormScore, calcGroupScore, scoreLabel, scoreBg, missingJustifications } from '../utils/scoring'
import { buildExportJson, downloadJson } from '../utils/jsonExport'
import { generatePDF } from '../utils/pdfExport'

export default function StepRevisao({ state }) {
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const formScore = calcFormScore(state.answers, state.skippedGroups || [])
  const missing = missingJustifications(state.answers, state.justificativas)

  const filename = `FCT_${state.cabecalho.num_amostra || 'sem-numero'}_${state.cabecalho.data_amostra || new Date().toISOString().slice(0, 10)}`

  async function handleExport() {
    setExporting(true)
    setDone(false)
    try {
      const jsonData = buildExportJson(state)
      downloadJson(jsonData, `${filename}.json`)
      await new Promise((r) => setTimeout(r, 300))
      const doc = await generatePDF(state)
      doc.save(`${filename}.pdf`)
      setDone(true)
    } catch (err) {
      console.error('Export error:', err)
      alert('Erro ao gerar os arquivos. Verifique o console para detalhes.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="bg-blue-800 text-white px-4 py-3">
        <h2 className="text-base font-bold">Revisão e Exportação</h2>
        <p className="text-xs text-blue-200 mt-0.5">Verifique o resultado e exporte o relatório (PDF + JSON)</p>
      </div>

      {missing.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Justificativas pendentes</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Os itens {missing.join(', ')} estão com "NÃO ATENDE" mas sem justificativa.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-4 py-2">
            <p className="text-sm font-bold">Pontuação por Grupo</p>
          </div>
          {GROUPS.map((g) => {
            const skipped = (state.skippedGroups || []).includes(g.id)
            const s = skipped ? null : calcGroupScore(g.id, state.answers)
            return (
              <div key={g.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-700 flex-1 pr-2">{g.label}</span>
                {skipped ? (
                  <span className="text-xs text-slate-400 italic">N/A</span>
                ) : s ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${scoreBg(s.ratio)} rounded-full`} style={{ width: `${Math.round(s.ratio * 100)}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${scoreBg(s.ratio).replace('bg-', 'text-')}`}>
                      {scoreLabel(s.ratio)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            )
          })}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
            <span className="text-sm font-bold text-slate-800">Conceito do Formulário</span>
            <span className={`text-lg font-black ${formScore.ratio !== null ? scoreBg(formScore.ratio).replace('bg-', 'text-') : 'text-slate-400'}`}>
              {scoreLabel(formScore.ratio)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-4 py-2">
            <p className="text-sm font-bold">Dados do Cabeçalho</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2 text-xs">
            {[
              ['Fiscal', state.cabecalho.fiscal],
              ['Nº Amostra', state.cabecalho.num_amostra],
              ['Endereço', state.cabecalho.endereco],
              ['Coordenadas', state.cabecalho.coordenadas],
              ['Equipe Fiscalizada', state.cabecalho.equipe_fiscalizada],
              ['Data Execução', state.cabecalho.data_execucao],
              ['Início Fiscalização', state.cabecalho.inicio_fiscalizacao],
              ['Fim Fiscalização', state.cabecalho.fim_fiscalizacao],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-slate-400 font-semibold">{k}</p>
                <p className="text-slate-700 truncate">{v || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-700">Fotos anexadas</span>
          <span className="text-sm font-bold text-blue-700">{state.fotos.length} foto{state.fotos.length !== 1 ? 's' : ''}</span>
        </div>

        {done && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Arquivos exportados com sucesso!</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-3 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg disabled:opacity-60 touch-manipulation"
        >
          {exporting ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
          {exporting ? 'Gerando...' : 'Exportar PDF + JSON'}
        </button>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            O relatório é gerado no próprio dispositivo, sem envio de dados para servidores.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500"><FileText size={12} /> Relatório.pdf</span>
            <span className="flex items-center gap-1 text-xs text-slate-500"><FileText size={12} /> Dados.json</span>
          </div>
        </div>
      </div>
    </div>
  )
}
