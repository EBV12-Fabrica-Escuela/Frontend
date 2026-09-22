import { useState } from 'react'
import { Service } from '../App'

interface Props {
  service: Service
  date: Date
  time: string
  observations: string
  onObservationsChange: (val: string) => void
  onConfirm: (simulateSlotTaken: boolean) => void
  onBack: () => void
}

function PoliciesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="policies-title"
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: '#f3f4f6' }}
        >
          <h2
            id="policies-title"
            className="text-lg font-bold text-gray-900"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Políticas de cancelación
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            aria-label="Cerrar políticas de cancelación"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 text-sm text-gray-600 leading-relaxed">
          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              1. Cancelación gratuita
            </h3>
            <p>
              Puedes cancelar tu reserva sin costo alguno si lo haces con al menos{' '}
              <strong>24 horas de anticipación</strong> a la hora programada del servicio.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              2. Cancelación tardía
            </h3>
            <p>
              Las cancelaciones realizadas entre 12 y 24 horas antes del servicio tendrán un cargo
              del <strong>30% del valor total</strong>. Este monto se descontará del reembolso o
              se cobrará como penalidad.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              3. No presentación (No-show)
            </h3>
            <p>
              Si el cliente no se encuentra disponible en el momento acordado sin previo aviso, se
              cobrará el <strong>100% del valor del servicio</strong>.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              4. Reagendamiento
            </h3>
            <p>
              Puedes reagendar tu cita sin costo hasta <strong>48 horas antes</strong> del servicio.
              Solo se permite un reagendamiento por reserva.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              5. Reembolsos
            </h3>
            <p>
              Los reembolsos aplicables se procesarán en un plazo de <strong>5 a 10 días hábiles</strong>{' '}
              a través del mismo medio de pago utilizado.
            </p>
          </div>

          <div
            className="p-3 rounded-xl text-xs"
            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
          >
            Para solicitudes de cancelación o reagendamiento, contáctanos al{' '}
            <strong>soporte@serviplus.co</strong> o al{' '}
            <strong>+57 (601) 234-5678</strong>. Horario de atención: lunes a viernes 8:00 AM – 6:00 PM.
          </div>
        </div>

        <div className="p-6 border-t" style={{ borderColor: '#f3f4f6' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: '#2563eb' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SummaryScreen({
  service,
  date,
  time,
  observations,
  onObservationsChange,
  onConfirm,
  onBack,
}: Props) {
  const [policiesAccepted, setPoliciesAccepted] = useState(false)
  const [showPolicies, setShowPolicies] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [simulateSlotTaken, setSimulateSlotTaken] = useState(false)

  const formattedDate = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleConfirm = () => {
    if (!policiesAccepted || isConfirming) return
    setIsConfirming(true)
    setTimeout(() => {
      setIsConfirming(false)
      onConfirm(simulateSlotTaken)
    }, 1500)
  }

  return (
    <>
      {showPolicies && <PoliciesModal onClose={() => setShowPolicies(false)} />}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <nav aria-label="Progreso de reserva" className="mb-8">
          <ol className="flex items-center gap-3">
            <li>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: '#16a34a', color: 'white' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7l3 3L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-700 hidden sm:block">Servicio</span>
              </div>
            </li>
            <li aria-hidden="true" className="text-gray-300 text-lg select-none">→</li>
            <li>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: '#16a34a', color: 'white' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7l3 3L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-700 hidden sm:block">Fecha y hora</span>
              </div>
            </li>
            <li aria-hidden="true" className="text-gray-300 text-lg select-none">→</li>
            <li>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  aria-current="step"
                >
                  3
                </div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: '#2563eb' }}>
                  Confirmación
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <h1
          className="text-3xl font-extrabold text-gray-900 mb-2"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Confirma tu reserva
        </h1>
        <p className="text-gray-500 mb-8">
          Revisa los detalles antes de confirmar. Una vez confirmada recibirás un comprobante.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Details */}
          <div className="flex-1 space-y-5">
            {/* Service detail card */}
            <div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <h2
                className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4"
              >
                Detalle del servicio
              </h2>
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                  style={{ backgroundColor: '#dbeafe' }}
                >
                  <img
                    src={service.image}
                    alt={`Imagen de ${service.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="font-bold text-gray-900 text-base"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">{service.provider}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                  >
                    {service.category}
                  </span>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Fecha</dt>
                  <dd className="text-sm font-semibold text-gray-900 capitalize">{formattedDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Horario</dt>
                  <dd className="text-sm font-semibold text-gray-900">{time}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Duración</dt>
                  <dd className="text-sm font-semibold text-gray-900">{service.duration}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Costo total</dt>
                  <dd className="text-sm font-bold" style={{ color: '#2563eb' }}>{service.price}</dd>
                </div>
              </dl>
            </div>

            {/* Observations */}
            <div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <label
                htmlFor="observations"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Observaciones para el proveedor{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Agrega instrucciones especiales, indicaciones de acceso o cualquier información relevante.
              </p>
              <textarea
                id="observations"
                value={observations}
                onChange={e => onObservationsChange(e.target.value)}
                placeholder="Ej: El apartamento está en el piso 5, puerta azul. Tengo mascotas..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none transition-all"
                style={{ borderColor: '#d1d5db', outline: 'none' }}
                onFocus={e => {
                  ;(e.target as HTMLElement).style.borderColor = '#2563eb'
                  ;(e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                }}
                onBlur={e => {
                  ;(e.target as HTMLElement).style.borderColor = '#d1d5db'
                  ;(e.target as HTMLElement).style.boxShadow = 'none'
                }}
                aria-label="Observaciones opcionales para el proveedor"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{observations.length}/500</p>
            </div>
          </div>

          {/* Right: Confirm panel */}
          <div className="lg:w-80 shrink-0 space-y-4">
            {/* Cost summary */}
            <div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              aria-label="Resumen de costos"
            >
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Resumen de pago
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{service.name}</span>
                  <span>{service.price}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Comisión plataforma</span>
                  <span>Incluida</span>
                </div>
              </div>
              <div
                className="flex justify-between font-bold text-base pt-3 mt-3"
                style={{ borderTop: '1px solid #f3f4f6' }}
              >
                <span className="text-gray-900">Total</span>
                <span style={{ color: '#2563eb' }}>{service.price}</span>
              </div>
            </div>

            {/* Policies checkbox */}
            <div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start gap-3">
                <input
                  id="policies"
                  type="checkbox"
                  checked={policiesAccepted}
                  onChange={e => setPoliciesAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded"
                  style={{ accentColor: '#2563eb' }}
                  aria-required="true"
                  aria-describedby="policies-desc"
                />
                <label id="policies-desc" htmlFor="policies" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  Confirmo que he leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setShowPolicies(true)}
                    className="font-semibold underline transition-colors"
                    style={{ color: '#2563eb' }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLElement).style.color = '#1d4ed8'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLElement).style.color = '#2563eb'
                    }}
                    aria-haspopup="dialog"
                  >
                    términos y políticas de cancelación
                  </button>
                </label>
              </div>

              {!policiesAccepted && (
                <p className="text-xs text-gray-400 mt-2 ml-7">
                  Debes aceptar las políticas para continuar
                </p>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!policiesAccepted || isConfirming}
              className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor:
                  !policiesAccepted || isConfirming ? '#d1d5db' : '#2563eb',
                cursor:
                  !policiesAccepted || isConfirming ? 'not-allowed' : 'pointer',
              }}
              aria-disabled={!policiesAccepted}
              aria-busy={isConfirming}
              onMouseEnter={e => {
                if (policiesAccepted && !isConfirming)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={e => {
                if (policiesAccepted && !isConfirming)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
              }}
            >
              {isConfirming ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"
                    aria-hidden="true"
                  />
                  Procesando reserva...
                </>
              ) : (
                'Confirmar reserva'
              )}
            </button>

            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl text-sm font-semibold border transition-all text-gray-600 hover:bg-gray-50"
              style={{ borderColor: '#d1d5db' }}
            >
              Modificar fecha u horario
            </button>

            {/* Demo: simulate slot taken */}
            <div
              className="p-3 rounded-xl text-xs"
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}
            >
              <p className="font-semibold text-amber-700 mb-1">🎮 Demo: Simular turno ocupado</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateSlotTaken}
                  onChange={e => setSimulateSlotTaken(e.target.checked)}
                  className="w-3 h-3"
                  style={{ accentColor: '#d97706' }}
                />
                <span className="text-amber-700">Activar este escenario al confirmar</span>
              </label>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
