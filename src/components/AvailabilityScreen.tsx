import { useState } from 'react'
import { Service } from '../App'
import { AvailabilitySlot } from '../services/api'

interface Props {
  service: Service
  selectedDate: Date | null
  selectedTime: string | null
  onDateChange: (date: Date | null) => void
  slots: AvailabilitySlot[]
  loading: boolean
  error: string
  onTimeChange: (time: string | null, slot: AvailabilitySlot | null) => void
  onContinue: () => void
  onBack: () => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
type DayStatus = 'past' | 'today' | 'available' | 'full' | 'holiday' | 'selected'

function getDayStatus(year: number, month: number, day: number, selectedDate: Date | null): DayStatus {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const date = new Date(year, month, day)

  if (selectedDate) {
    const sel = new Date(selectedDate)
    sel.setHours(0, 0, 0, 0)
    if (date.getTime() === sel.getTime()) return 'selected'
  }

  if (date < now) return 'past'

  return 'available'
}

function ProgressStep({
  step,
  label,
  active,
  done,
}: {
  step: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all"
        style={{
          backgroundColor: done ? '#16a34a' : active ? '#2563eb' : '#e5e7eb',
          color: done || active ? 'white' : '#6b7280',
        }}
        aria-current={active ? 'step' : undefined}
      >
        {done ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className="text-sm font-medium hidden sm:block"
        style={{ color: active ? '#2563eb' : done ? '#16a34a' : '#6b7280' }}
      >
        {label}
      </span>
    </div>
  )
}

export default function AvailabilityScreen({
  service,
  selectedDate,
  selectedTime,
  slots,
  loading,
  error,
  onDateChange,
  onTimeChange,
  onContinue,
  onBack,
}: Props) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  const handleDayClick = (day: number, status: DayStatus) => {
    if (status === 'past' || status === 'full' || status === 'holiday') return
    const newDate = new Date(calYear, calMonth, day)
    if (status === 'selected') {
      onDateChange(null)
      onTimeChange(null, null)
    } else {
      onDateChange(newDate)
      onTimeChange(null, null)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Determine if prev month nav should be disabled
  const isPrevDisabled =
    calYear === today.getFullYear() && calMonth === today.getMonth()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress */}
      <nav aria-label="Progreso de reserva" className="mb-8">
        <ol className="flex items-center gap-3">
          <li className="flex items-center gap-2">
            <ProgressStep step={1} label="Servicio" active={false} done={true} />
          </li>
          <li aria-hidden="true" className="text-gray-300 text-lg select-none">→</li>
          <li className="flex items-center gap-2">
            <ProgressStep step={2} label="Fecha y hora" active={true} done={false} />
          </li>
          <li aria-hidden="true" className="text-gray-300 text-lg select-none">→</li>
          <li className="flex items-center gap-2">
            <ProgressStep step={3} label="Confirmación" active={false} done={false} />
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Service summary */}
        <aside className="lg:w-80 shrink-0">
          <div
            className="bg-white rounded-2xl border p-5 sticky top-24"
            style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            aria-label="Resumen del servicio seleccionado"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Servicio seleccionado
            </h2>
            <div className="rounded-xl overflow-hidden mb-4" style={{ height: '140px', backgroundColor: '#dbeafe' }}>
              <img
                src={service.image}
                alt={`Imagen de ${service.name}`}
                className="w-full h-full object-cover"
              />
            </div>
            <h3
              className="font-bold text-gray-900 text-base mb-1"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {service.name}
            </h3>
            <p className="text-sm text-gray-500 mb-3">{service.provider}</p>

            <div className="space-y-2 border-t pt-3" style={{ borderColor: '#f3f4f6' }}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Categoría</span>
                <span className="font-medium text-gray-700">{service.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duración</span>
                <span className="font-medium text-gray-700">{service.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio</span>
                <span className="font-bold" style={{ color: '#2563eb' }}>{service.price}</span>
              </div>
            </div>

            {selectedDate && (
              <div
                className="mt-4 p-3 rounded-xl text-sm"
                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <p className="font-semibold text-green-800 mb-0.5">📅 Fecha seleccionada</p>
                <p className="text-green-700 capitalize text-xs leading-relaxed">{formatDate(selectedDate)}</p>
                {selectedTime && (
                  <p className="mt-1 font-semibold text-green-800">🕐 {selectedTime}</p>
                )}
              </div>
            )}

            <button
              onClick={onBack}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cambiar servicio
            </button>
          </div>
        </aside>

        {/* Right: Calendar + Time slots */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <h2
              className="text-xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Selecciona una fecha
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Elige un día disponible y luego un horario
            </p>

            {/* Calendar header */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                disabled={isPrevDisabled}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  color: isPrevDisabled ? '#d1d5db' : '#374151',
                  cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isPrevDisabled ? 'transparent' : undefined,
                }}
                onMouseEnter={e => {
                  if (!isPrevDisabled)
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
                aria-label="Mes anterior"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <h3
                className="font-bold text-gray-900 text-base"
                style={{ fontFamily: 'Nunito, sans-serif' }}
                aria-live="polite"
              >
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>

              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-gray-700"
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
                aria-label="Mes siguiente"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-2" role="row">
              {DAY_NAMES.map(d => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold py-1"
                  style={{ color: '#6b7280' }}
                  aria-hidden="true"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              className="grid grid-cols-7 gap-1"
              role="grid"
              aria-label={`Calendario ${MONTH_NAMES[calMonth]} ${calYear}`}
            >
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} aria-hidden="true" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const status = getDayStatus(calYear, calMonth, day, selectedDate)
                const isClickable = status === 'available' || status === 'today' || status === 'selected'

                let bg = 'transparent'
                let color = '#111827'
                let border = 'transparent'
                let cursor = isClickable ? 'pointer' : 'not-allowed'
                let textDecoration = 'none'
                let ariaLabel = `${day} de ${MONTH_NAMES[calMonth]}`

                if (status === 'selected') {
                  bg = '#2563eb'
                  color = 'white'
                  border = '#2563eb'
                  ariaLabel += ' — Seleccionado'
                } else if (status === 'available' || status === 'today') {
                  bg = '#f0fdf4'
                  color = '#15803d'
                  border = '#bbf7d0'
                  ariaLabel += ' — Disponible'
                } else if (status === 'full') {
                  bg = '#fef2f2'
                  color = '#b91c1c'
                  border = '#fecaca'
                  textDecoration = 'line-through'
                  cursor = 'not-allowed'
                  ariaLabel += ' — Agotado'
                } else if (status === 'past' || status === 'holiday') {
                  bg = '#f9fafb'
                  color = '#9ca3af'
                  border = '#f3f4f6'
                  cursor = 'not-allowed'
                  ariaLabel +=
                    status === 'holiday' ? ' — Festivo' : ' — Fecha pasada'
                }

                return (
                  <button
                    key={day}
                    role="gridcell"
                    aria-label={ariaLabel}
                    aria-disabled={!isClickable}
                    aria-selected={status === 'selected'}
                    disabled={!isClickable}
                    onClick={() => handleDayClick(day, status)}
                    className="aspect-square rounded-lg text-sm font-semibold flex items-center justify-center transition-all relative"
                    style={{
                      backgroundColor: bg,
                      color,
                      border: `1px solid ${border}`,
                      textDecoration,
                      cursor,
                      fontSize: '13px',
                    }}
                    onMouseEnter={e => {
                      if (isClickable && status !== 'selected') {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = status === 'available' || status === 'today' ? '#dcfce7' : bg
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (status !== 'selected') {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = bg
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      }
                    }}
                  >
                    {day}
                    {status === 'full' && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: '#ef4444' }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div
              className="flex flex-wrap gap-4 mt-5 pt-4 text-xs"
              style={{ borderTop: '1px solid #f3f4f6' }}
              aria-label="Leyenda del calendario"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{ backgroundColor: '#2563eb', border: '1px solid #2563eb' }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Seleccionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Agotado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">No disponible / Festivo</span>
              </div>
            </div>
          </div>

          {/* Time slots — shown only after date selection */}
          {selectedDate && (
            <div
              className="bg-white rounded-2xl border p-6 mt-5 fade-in"
              style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              aria-live="polite"
            >
              <h2
                className="text-lg font-bold text-gray-900 mb-1"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Horarios disponibles
              </h2>
              <p className="text-sm text-gray-500 mb-4 capitalize">
                {formatDate(selectedDate)}
              </p>

              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                role="group"
                aria-label="Seleccionar horario"
              >
                {loading && <p className="col-span-full text-sm text-gray-500">Consultando disponibilidad...</p>}
                {error && <p className="col-span-full text-sm text-red-600" role="alert">{error}</p>}
                {!loading && !error && slots.filter(slot => slot.disponible).map(slot => {
                  const label = `${slot.horaInicio.slice(0, 5)} - ${slot.horaFin.slice(0, 5)}`
                  const isSelected = selectedTime === label
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onTimeChange(isSelected ? null : label, isSelected ? null : slot)}
                      className="py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1"
                      style={{
                        backgroundColor: isSelected ? '#2563eb' : 'white',
                        borderColor: isSelected ? '#2563eb' : '#e5e7eb',
                        color: isSelected ? 'white' : '#374151',
                      }}
                      aria-pressed={isSelected}
                      aria-label={`Horario ${label}${isSelected ? ' — Seleccionado' : ''}`}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          ;(e.currentTarget as HTMLElement).style.borderColor = '#2563eb'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff'
                          ;(e.currentTarget as HTMLElement).style.color = '#2563eb'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          ;(e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'white'
                          ;(e.currentTarget as HTMLElement).style.color = '#374151'
                        }
                      }}
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <span className="text-xs font-medium opacity-80">Seleccionado</span>
                      )}
                    </button>
                  )
                })}
                {!loading && !error && slots.filter(slot => slot.disponible).length === 0 && (
                  <p className="col-span-full text-sm text-gray-500">No hay horarios disponibles para esta fecha.</p>
                )}
              </div>
            </div>
          )}

          {/* Continue button */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onBack}
              className="px-5 py-3 rounded-xl text-sm font-semibold border transition-all text-gray-600 hover:bg-gray-50"
              style={{ borderColor: '#d1d5db' }}
            >
              Volver al catálogo
            </button>
            <button
              onClick={onContinue}
              disabled={!selectedTime}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                backgroundColor: selectedTime ? '#2563eb' : '#d1d5db',
                cursor: selectedTime ? 'pointer' : 'not-allowed',
              }}
              aria-disabled={!selectedTime}
              aria-label={
                selectedTime
                  ? 'Continuar con la reserva'
                  : 'Selecciona un horario para continuar'
              }
              onMouseEnter={e => {
                if (selectedTime)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={e => {
                if (selectedTime)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
              }}
            >
              {selectedTime ? 'Continuar con la reserva →' : 'Selecciona un horario'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
