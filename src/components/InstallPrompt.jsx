import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

const DISMISSED_KEY = 'pwa-dismissed-at'
const COOLDOWN_MS   = 7 * 24 * 60 * 60 * 1000   // 7 dias

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function wasDismissedRecently() {
  try {
    const t = localStorage.getItem(DISMISSED_KEY)
    return t ? Date.now() - Number(t) < COOLDOWN_MS : false
  } catch { return false }
}

export default function InstallPrompt() {
  const [prompt,    setPrompt]    = useState(() => window.__pwaPrompt || null)
  const [dismissed, setDismissed] = useState(wasDismissedRecently)
  const [installed, setInstalled] = useState(isStandalone)
  const ios = isIOS()

  useEffect(() => {
    if (isStandalone()) return

    function onPrompt(e) {
      e.preventDefault()
      window.__pwaPrompt = e
      setPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      window.__pwaPrompt = null
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {}
  }

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
    window.__pwaPrompt = null
  }

  if (installed || dismissed) return null
  if (!ios && !prompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 max-w-lg mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">

        {/* Cabeçalho */}
        <div className="bg-blue-700 px-4 py-2.5 flex items-center justify-between">
          <span className="text-white text-xs font-bold tracking-wide">
            Instalar FCT Vistoria
          </span>
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors touch-manipulation"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-4 py-3 flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}icons/pwa-192x192.png`}
            className="w-12 h-12 rounded-xl shrink-0 shadow-sm"
            alt="FCT Vistoria"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Adicionar à tela inicial</p>
            {ios ? (
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                No Safari, toque em <strong>Compartilhar</strong> (□↑) na barra inferior
                e depois em <strong>&quot;Adicionar à Tela de Início&quot;</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Funciona offline · abre direto sem navegador
              </p>
            )}
          </div>
          {!ios && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all touch-manipulation whitespace-nowrap shrink-0 shadow"
            >
              <Download size={13} /> Instalar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
