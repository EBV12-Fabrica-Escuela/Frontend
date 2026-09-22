interface Props {
  onChooseAnotherTime: () => void
}

export default function SlotTakenScreen({ onChooseAnotherTime }: Props) {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 fade-in">
      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: '#e5e7eb', boxShadow: '0 4px 24px rgba(239,68,68,0.10)' }}
        role="alert"
        aria-live="assertive"
      >
        {/* Red top bar */}
        <div
          className="h-2"
          style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444)' }}
          aria-hidden="true"
        />

        <div className="p-8 text-center">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#fef2f2', border: '4px solid #fecaca' }}
            aria-hidden="true"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#dc2626" strokeWidth="2.5" />
              <path
                d="M20 12v10M20 27v1"
                stroke="#dc2626"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1
            className="text-2xl font-extrabold text-gray-900 mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Este horario acaba de ser reservado
          </h1>

          <p className="text-gray-500 mb-2 leading-relaxed">
            Lo sentimos, otro usuario reservó este horario justo en este momento.
          </p>
          <p className="text-gray-500 mb-8 leading-relaxed">
            No te preocupes — tu información está guardada. Solo necesitas seleccionar otro horario disponible.
          </p>

          <div
            className="rounded-xl p-4 mb-7 text-sm text-left"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <div className="flex items-start gap-2 text-red-700">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="#dc2626" strokeWidth="1.4" />
                <path d="M8 5v4M8 10.5v.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span>
                <strong>Horario no disponible:</strong> El turno seleccionado ya fue tomado. Por favor elige otro.
              </span>
            </div>
          </div>

          <button
            onClick={onChooseAnotherTime}
            className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: '#2563eb' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8a5 5 0 1010 0 5 5 0 00-10 0z" stroke="white" strokeWidth="1.4" />
              <path d="M8 5.5V8l2 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Elegir otro horario
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Tu servicio y observaciones siguen guardados
          </p>
        </div>
      </div>
    </main>
  )
}
