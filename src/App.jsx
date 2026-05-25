import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'
import StepIndicator from './components/StepIndicator'
import HomeScreen from './pages/HomeScreen'
import StepCabecalho from './pages/StepCabecalho'
import StepFotos from './pages/StepFotos'
import StepGrupo from './pages/StepGrupo'
import StepRevisao from './pages/StepRevisao'
import PainelEstatisticas from './pages/PainelEstatisticas'
import { GROUPS } from './data/formSchema'
import { saveVistoria } from './utils/storage'

const TOTAL_STEPS = 10

function emptyState(id) {
  return {
    vistoriaId: id,
    currentStep: 0,
    cabecalho: {
      contrato_fiscalizada: '', num_amostra: '', unidade_executante: '',
      contrato_fiscalizadora: '', tss: '', equipe_fiscalizada: '',
      endereco: '', bairro: '', municipio: '', coordenadas: '',
      pde: '', cliente_telefone: '', data_amostra: '', num_os: '',
      fiscal: '', inicio_fiscalizacao: '', fim_fiscalizacao: '', data_execucao: '',
    },
    fotos: [],
    answers: {},
    justificativas: {},
    observacoes: {},
    skippedGroups: [],
  }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [formState, setFormState] = useState(null)
  const saveTimer = useRef(null)

  function debouncedSave(state) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveVistoria(state.vistoriaId, state).catch(() => {})
    }, 600)
  }

  function updateState(updater) {
    setFormState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      debouncedSave(next)
      return next
    })
  }

  function startNew(id) {
    setFormState(emptyState(id))
    setScreen('form')
  }

  function resumeVistoria(saved) {
    setFormState({ skippedGroups: [], ...saved })
    setScreen('form')
  }

  function goStep(step) {
    updateState({ currentStep: step })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nextStep() { goStep(Math.min(formState.currentStep + 1, TOTAL_STEPS - 1)) }
  function prevStep() { goStep(Math.max(formState.currentStep - 1, 0)) }

  const handleCabecalhoChange = useCallback((field, value) => {
    updateState((prev) => ({ ...prev, cabecalho: { ...prev.cabecalho, [field]: value } }))
  }, [])

  const handleAnswerChange = useCallback((itemId, value) => {
    updateState((prev) => ({ ...prev, answers: { ...prev.answers, [itemId]: value } }))
  }, [])

  const handleJustifyChange = useCallback((itemId, value) => {
    updateState((prev) => ({ ...prev, justificativas: { ...prev.justificativas, [itemId]: value } }))
  }, [])

  const handleObsChange = useCallback((itemId, value) => {
    updateState((prev) => ({ ...prev, observacoes: { ...prev.observacoes, [itemId]: value } }))
  }, [])

  const handleAddFotos = useCallback((newFotos) => {
    updateState((prev) => ({ ...prev, fotos: [...prev.fotos, ...newFotos] }))
  }, [])

  const handleRemoveFoto = useCallback((id) => {
    updateState((prev) => ({ ...prev, fotos: prev.fotos.filter((f) => f.id !== id) }))
  }, [])

  const handleGpsDetected = useCallback(({ coords, date }) => {
    updateState((prev) => ({
      ...prev,
      cabecalho: {
        ...prev.cabecalho,
        coordenadas: coords || prev.cabecalho.coordenadas,
        data_execucao: date || prev.cabecalho.data_execucao,
      },
    }))
  }, [])

  const handleSkipGroup = useCallback((groupId, skipped) => {
    updateState((prev) => ({
      ...prev,
      skippedGroups: skipped
        ? [...(prev.skippedGroups || []).filter((id) => id !== groupId), groupId]
        : (prev.skippedGroups || []).filter((id) => id !== groupId),
    }))
  }, [])

  if (screen === 'home') {
    return <HomeScreen onNew={startNew} onResume={resumeVistoria} onPainel={() => setScreen('painel')} />
  }

  if (screen === 'painel') {
    return <PainelEstatisticas onBack={() => setScreen('home')} />
  }

  if (!formState) return null

  const { currentStep } = formState
  const isFirst = currentStep === 0
  const isLast = currentStep === TOTAL_STEPS - 1

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <StepCabecalho cabecalho={formState.cabecalho} onChange={handleCabecalhoChange} />
      case 1:
        return (
          <StepFotos
            fotos={formState.fotos}
            onAddFotos={handleAddFotos}
            onRemoveFoto={handleRemoveFoto}
            onGpsDetected={handleGpsDetected}
          />
        )
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8: {
        const group = GROUPS[currentStep - 2]
        return (
          <StepGrupo
            group={group}
            answers={formState.answers}
            justificativas={formState.justificativas}
            observacoes={formState.observacoes}
            onChange={handleAnswerChange}
            onJustify={handleJustifyChange}
            onObs={handleObsChange}
            skipped={(formState.skippedGroups || []).includes(group.id)}
            onSkip={handleSkipGroup}
          />
        )
      }
      case 9:
        return <StepRevisao state={formState} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <div className="bg-blue-900 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-md">
        <button onClick={() => setScreen('home')} className="p-1 rounded-lg hover:bg-blue-800 transition-colors touch-manipulation">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{formState.cabecalho.endereco || 'Nova Vistoria FCT'}</p>
          <p className="text-blue-300 text-[10px]">
            {formState.cabecalho.num_amostra ? `Amostra nº ${formState.cabecalho.num_amostra}` : 'Amostra não informada'} · Salvo automaticamente
          </p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} onNavigate={goStep} answers={formState.answers} />

      <div className="bg-white min-h-[60vh]">{renderStep()}</div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <button
          onClick={prevStep}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-30 touch-manipulation hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        {!isLast && (
          <button
            onClick={nextStep}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-800 active:scale-95 transition-all touch-manipulation shadow"
          >
            Próximo <ArrowRight size={16} />
          </button>
        )}
        {isLast && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">
            Use o botão acima para exportar
          </div>
        )}
      </div>
    </div>
  )
}
