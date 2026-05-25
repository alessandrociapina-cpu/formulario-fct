import { useRef, useState } from 'react'
import { Camera, Trash2, MapPin, Clock, Image } from 'lucide-react'
import { extractPhotoMeta, formatCoordinates, formatExifDate, resizeImageToDataUrl } from '../utils/exifExtract'

export default function StepFotos({ fotos, onAddFotos, onRemoveFoto, onGpsDetected }) {
  const inputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [gpsPrompt, setGpsPrompt] = useState(null)

  async function handleFiles(files) {
    setProcessing(true)
    const newFotos = []
    let firstGps = null

    for (const file of Array.from(files)) {
      const meta = await extractPhotoMeta(file)
      const dataUrl = await resizeImageToDataUrl(file)
      const foto = {
        id: `foto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        dataUrl,
        lat: meta.lat,
        lon: meta.lon,
        datetime: meta.datetime,
      }
      newFotos.push(foto)
      if (!firstGps && meta.lat && meta.lon) firstGps = meta
    }

    onAddFotos(newFotos)

    if (firstGps && firstGps.lat) {
      setGpsPrompt({
        coords: formatCoordinates(firstGps.lat, firstGps.lon),
        date: formatExifDate(firstGps.datetime),
        raw: firstGps,
      })
    }

    setProcessing(false)
  }

  function acceptGps() {
    if (gpsPrompt) {
      onGpsDetected({ coords: gpsPrompt.coords, date: gpsPrompt.date })
      setGpsPrompt(null)
    }
  }

  return (
    <div>
      <div className="bg-blue-800 text-white px-4 py-3">
        <h2 className="text-base font-bold">Fotos da Fiscalização</h2>
        <p className="text-xs text-blue-200 mt-0.5">As coordenadas GPS e data serão extraídas automaticamente das fotos</p>
      </div>

      {gpsPrompt && (
        <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-blue-800 mb-1">📍 Dados detectados na foto</p>
          {gpsPrompt.coords && (
            <p className="text-xs text-blue-700"><MapPin size={11} className="inline mr-1" />{gpsPrompt.coords}</p>
          )}
          {gpsPrompt.date && (
            <p className="text-xs text-blue-700 mt-0.5"><Clock size={11} className="inline mr-1" />{gpsPrompt.date}</p>
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={acceptGps} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">
              Usar estes dados no formulário
            </button>
            <button onClick={() => setGpsPrompt(null)} className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg">
              Ignorar
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50 hover:bg-blue-100 transition-colors touch-manipulation"
        >
          {processing ? (
            <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera size={36} className="text-blue-400" />
          )}
          <span className="font-bold text-blue-700">{processing ? 'Processando...' : 'Adicionar Fotos'}</span>
          <span className="text-xs text-blue-500">Câmera ou galeria · GPS extraído automaticamente</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        />

        {fotos.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">{fotos.length} foto{fotos.length > 1 ? 's' : ''} adicionada{fotos.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((foto) => (
                <div key={foto.id} className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[4/3]">
                  {foto.dataUrl ? (
                    <img src={foto.dataUrl} alt={foto.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={24} className="text-slate-400" />
                    </div>
                  )}
                  {foto.lat && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 flex items-center gap-0.5 px-1 py-0.5">
                      <MapPin size={8} className="text-white" />
                      <span className="text-white text-[8px]">{foto.lat.toFixed(4)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onRemoveFoto(foto.id)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 shadow"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
