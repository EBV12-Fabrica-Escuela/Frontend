import { Service } from '../App'

interface Props {
  service: Service
  date: Date
  time: string
  bookingCode: string
  onViewReservations: () => void
  onBackToCatalog: () => void
}

export default function ConfirmedScreen({
  service,
  date,
  time,
  bookingCode,
  onViewReservations,
  onBackToCatalog,
}: Props) {
  const formattedDate = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleDownload = () => {
    const content = `COMPROBANTE DE RESERVA - ServiPlus\n` +
      `=======================================\n` +
      `Código de reserva: ${bookingCode}\n` +
      `Servicio: ${service.name}\n` +
      `Proveedor: ${service.provider}\n` +
      `Fecha: ${formattedDate}\n` +
      `Horario: ${time}\n` +
      `Duración: ${service.duration}\n` +
      `Costo total: ${service.price}\n` +
      `=======================================\n` +
      `Generado por ServiPlus el ${new Date().toLocaleDateString('es-CO')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprobante-${bookingCode}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 fade-in">
      {/* Success card */}
      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: '#e5e7eb', boxShadow: '0 4px 24px rgba(22,163,74,0.10)' }}
        role="status"
        aria-live="polite"
      >
        {/* Green top bar */}
        <div
          className="h-2"
          style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}
          aria-hidden="true"
        />

        <div className="p-8 sm:p-10">
          {/* Icon + title */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: '#f0fdf4', border: '4px solid #bbf7d0' }}
              aria-hidden="true"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M8 20l8 8L32 12"
                  stroke="#16a34a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1
              className="text-3xl font-extrabold text-gray-900 mb-2"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              ¡Reserva confirmada!
            </h1>
            <p className="text-gray-500">
              Tu reserva fue procesada exitosamente
            </p>
          </div>

          {/* Booking code */}
          <div
            className="rounded-xl p-4 text-center mb-6"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
            aria-label={`Código de reserva: ${bookingCode}`}
          >
            <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-1">
              Código de reserva
            </p>
            <p
              className="text-2xl font-black tracking-widest"
              style={{ fontFamily: 'Nunito, sans-serif', color: '#15803d' }}
            >
              {bookingCode}
            </p>
          </div>

          {/* Details */}
          <div
            className="rounded-xl border divide-y text-sm mb-6"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div className="flex items-center gap-3 p-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#eff6ff' }}
                aria-hidden="true"
              >
                🛠
              </span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Servicio</p>
                <p className="font-semibold text-gray-900">{service.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#eff6ff' }}
                aria-hidden="true"
              >
                🏢
              </span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Proveedor</p>
                <p className="font-semibold text-gray-900">{service.provider}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#eff6ff' }}
                aria-hidden="true"
              >
                📅
              </span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Fecha y horario</p>
                <p className="font-semibold text-gray-900 capitalize">{formattedDate}</p>
                <p className="text-gray-600">{time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#eff6ff' }}
                aria-hidden="true"
              >
                ⏱
              </span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Duración estimada</p>
                <p className="font-semibold text-gray-900">{service.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#eff6ff' }}
                aria-hidden="true"
              >
                💳
              </span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Costo total</p>
                <p className="font-bold text-lg" style={{ color: '#2563eb', fontFamily: 'Nunito, sans-serif' }}>
                  {service.price}
                </p>
              </div>
            </div>
          </div>

          {/* Notification message */}
          <div
            className="rounded-xl p-4 mb-6 text-sm"
            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
            role="note"
          >
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="text-base mt-0.5">📧</span>
              <div>
                <p className="font-semibold text-blue-800 mb-0.5">Comprobante enviado</p>
                <p className="text-blue-700 leading-relaxed">
                  Hemos enviado el comprobante de tu reserva a tu correo electrónico y al proveedor{' '}
                  <strong>{service.provider}</strong>. Revisa tu bandeja de entrada.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onViewReservations}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2563eb' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="white" strokeWidth="1.4" />
                <path d="M5 3V2M11 3V2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M2 7h12" stroke="white" strokeWidth="1.4" />
              </svg>
              Ver mis reservas
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50"
              style={{ borderColor: '#d1d5db' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Descargar comprobante
            </button>
          </div>

          <button
            onClick={onBackToCatalog}
            className="w-full mt-3 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    </main>
  )
}
