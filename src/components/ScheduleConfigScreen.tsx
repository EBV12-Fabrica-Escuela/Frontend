import { useState } from "react"
import { ProviderAvailabilityAgenda } from "./AvailabilityScreen"
import {
  BlockedSlot,
  Booking,
  bookingBlocksSlot,
  DaySchedule,
  displayTimeToMinutes,
  ProviderSchedule,
  ScheduleBreak,
  timeToMinutes,
} from "../schedule"

interface Props {
  schedule: ProviderSchedule
  bookings: Booking[]
  onSave: (schedule: ProviderSchedule) => void
  onCancel: () => void
}

function cloneSchedule(schedule: ProviderSchedule): ProviderSchedule {
  return {
    ...schedule,
    days: schedule.days.map((day) => ({
      ...day,
      breaks: day.breaks.map((item) => ({ ...item })),
    })),
    exceptions: [...schedule.exceptions],
    blockedSlots: (schedule.blockedSlots ?? []).map((item) => ({ ...item })),
  }
}

export default function ScheduleConfigScreen({
  schedule,
  bookings,
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(() => cloneSchedule(schedule))
  const [exceptionDate, setExceptionDate] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const updateDay = (dayOfWeek: number, update: Partial<DaySchedule>) => {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...update } : day,
      ),
    }))
    setSaved(false)
    setErrors((current) => ({ ...current, [`day-${dayOfWeek}`]: "" }))
  }

  const updateBreak = (
    dayOfWeek: number,
    breakId: string,
    update: Partial<ScheduleBreak>,
  ) => {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              breaks: day.breaks.map((item) =>
                item.id === breakId ? { ...item, ...update } : item,
              ),
            }
          : day,
      ),
    }))
    setSaved(false)
    setErrors((current) => ({ ...current, [`day-${dayOfWeek}`]: "" }))
  }

  const addBreak = (dayOfWeek: number) => {
    const newBreak: ScheduleBreak = {
      id: `break-${Date.now()}-${dayOfWeek}`,
      start: "12:00",
      end: "13:00",
    }
    const day = draft.days.find((item) => item.dayOfWeek === dayOfWeek)
    if (day) updateDay(dayOfWeek, { breaks: [...day.breaks, newBreak] })
  }

  const removeBreak = (dayOfWeek: number, breakId: string) => {
    const day = draft.days.find((item) => item.dayOfWeek === dayOfWeek)
    if (day) {
      updateDay(dayOfWeek, {
        breaks: day.breaks.filter((item) => item.id !== breakId),
      })
    }
  }

  const addException = () => {
    if (!exceptionDate) {
      setErrors((current) => ({
        ...current,
        exception: "Selecciona una fecha para agregar la excepción",
      }))
      return
    }
    const selectedException = new Date(`${exceptionDate}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedException < today) {
      setErrors((current) => ({
        ...current,
        exception: "No puedes bloquear una fecha pasada",
      }))
      return
    }
    if (
      bookings.some(
        (booking) =>
          booking.provider === draft.provider &&
          booking.date === exceptionDate &&
          bookingBlocksSlot(booking),
      )
    ) {
      setErrors((current) => ({
        ...current,
        exception:
          "Conflicto: esta fecha tiene reservas confirmadas y no puede bloquearse",
      }))
      return
    }
    if (draft.exceptions.includes(exceptionDate)) {
      setErrors((current) => ({
        ...current,
        exception: "Esta fecha ya está agregada como excepción",
      }))
      return
    }
    setDraft((current) => ({
      ...current,
      exceptions: [...current.exceptions, exceptionDate].sort(),
    }))
    setExceptionDate("")
    setErrors((current) => ({ ...current, exception: "" }))
    setSaved(false)
  }

  const updateBlockedSlots = (blockedSlots: BlockedSlot[]) => {
    setDraft((current) => ({ ...current, blockedSlots }))
    setSaved(false)
  }

  const removeException = (date: string) => {
    setDraft((current) => ({
      ...current,
      exceptions: current.exceptions.filter((item) => item !== date),
    }))
    setSaved(false)
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    draft.days.forEach((day) => {
      if (!day.active) return
      if (!day.start || !day.end) {
        nextErrors[`day-${day.dayOfWeek}`] =
          "Completa la hora de inicio y finalización"
        return
      }
      const start = timeToMinutes(day.start)
      const end = timeToMinutes(day.end)

      if (start >= end) {
        nextErrors[`day-${day.dayOfWeek}`] =
          "La hora de inicio debe ser anterior a la hora de finalización"
        return
      }

      const sortedBreaks = [...day.breaks].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
      )

      for (let index = 0; index < sortedBreaks.length; index += 1) {
        const current = sortedBreaks[index]
        if (!current.start || !current.end) {
          nextErrors[`day-${day.dayOfWeek}`] =
            "Completa el inicio y finalización de cada descanso"
          break
        }
        const breakStart = timeToMinutes(current.start)
        const breakEnd = timeToMinutes(current.end)

        if (breakStart >= breakEnd) {
          nextErrors[`day-${day.dayOfWeek}`] =
            "Cada descanso debe iniciar antes de finalizar"
          break
        }
        if (breakStart < start || breakEnd > end) {
          nextErrors[`day-${day.dayOfWeek}`] =
            "Los descansos deben estar dentro del horario laboral"
          break
        }
        const previous = sortedBreaks[index - 1]
        if (previous && timeToMinutes(previous.end) > breakStart) {
          nextErrors[`day-${day.dayOfWeek}`] =
            "Los períodos de descanso no pueden superponerse"
          break
        }
      }
    })

    const invalidBooking = bookings.find((booking) => {
      if (booking.provider !== draft.provider || !bookingBlocksSlot(booking)) {
        return false
      }
      const bookingDate = new Date(`${booking.date}T12:00:00`)
      const bookingStart = displayTimeToMinutes(booking.time)
      const bookingDateTime = new Date(`${booking.date}T00:00:00`)
      bookingDateTime.setMinutes(bookingStart)
      if (bookingDateTime < new Date()) return false
      const day = draft.days.find(
        (item) => item.dayOfWeek === bookingDate.getDay(),
      )
      if (!day?.active || draft.exceptions.includes(booking.date)) return true

      const bookingEnd = bookingStart + booking.durationHours * 60
      if (
        bookingStart < timeToMinutes(day.start) ||
        bookingEnd > timeToMinutes(day.end)
      ) {
        return true
      }

      const overlapsBreak = day.breaks.some((item) => {
        const breakStart = timeToMinutes(item.start)
        const breakEnd = timeToMinutes(item.end)
        return bookingStart < breakEnd && bookingEnd > breakStart
      })
      const overlapsBlock = (draft.blockedSlots ?? []).some((item) => {
        if (item.date !== booking.date) return false
        const blockStart = displayTimeToMinutes(item.time)
        return bookingStart < blockStart + 120 && bookingEnd > blockStart
      })
      return overlapsBreak || overlapsBlock
    })

    if (invalidBooking) {
      nextErrors.general =
        "No puedes guardar cambios que bloqueen una franja reservada por un cliente."
    }

    return nextErrors
  }

  const handleSave = () => {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSaved(false)
      return
    }
    setErrors({})
    onSave(cloneSchedule(draft))
    setSaved(true)
  }

  const formatException = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 fade-in">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 2L4 7l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver al panel
      </button>

      {saved && (
        <div
          className="rounded-xl p-4 mb-5 flex items-center gap-3"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
          role="status"
          aria-live="polite"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 10l4 4 8-8"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm font-semibold text-green-800">
            Los horarios fueron actualizados correctamente.
          </p>
        </div>
      )}

      <div className="mb-7">
        <div
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold mb-4"
          style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
        >
          Agenda del proveedor
        </div>
        <h1
          className="text-2xl font-extrabold text-gray-900 mb-1"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Configurar horarios
        </h1>
        <p className="text-sm text-gray-500">
          Define tu jornada, descansos y días sin atención.
        </p>
      </div>

      <ProviderAvailabilityAgenda
        schedule={draft}
        bookings={bookings}
        onBlockedSlotsChange={updateBlockedSlots}
      />

      {errors.general && (
        <div
          className="rounded-xl border px-4 py-3 mb-6 text-sm text-red-700"
          style={{
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
          }}
          role="alert"
        >
          {errors.general}
        </div>
      )}

      <section className="space-y-4 mb-8" aria-label="Horarios semanales">
        {draft.days.map((day) => (
          <article
            key={day.dayOfWeek}
            className="bg-white rounded-2xl border p-5"
            style={{
              borderColor: errors[`day-${day.dayOfWeek}`]
                ? "#fecaca"
                : "#e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="flex items-center gap-3 md:w-40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.active}
                  onChange={(event) =>
                    updateDay(day.dayOfWeek, { active: event.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                />
                <span className="font-semibold text-gray-900">{day.label}</span>
              </label>

              {day.active ? (
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div>
                    <label
                      htmlFor={`start-${day.dayOfWeek}`}
                      className="block text-xs font-semibold text-gray-500 mb-1"
                    >
                      Inicio
                    </label>
                    <input
                      id={`start-${day.dayOfWeek}`}
                      type="time"
                      value={day.start}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { start: event.target.value })
                      }
                      className="px-3 py-2.5 rounded-xl border text-sm"
                      style={{ borderColor: "#d1d5db" }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`end-${day.dayOfWeek}`}
                      className="block text-xs font-semibold text-gray-500 mb-1"
                    >
                      Finalización
                    </label>
                    <input
                      id={`end-${day.dayOfWeek}`}
                      type="time"
                      value={day.end}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { end: event.target.value })
                      }
                      className="px-3 py-2.5 rounded-xl border text-sm"
                      style={{ borderColor: "#d1d5db" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addBreak(day.dayOfWeek)}
                    className="md:self-end px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                    style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
                  >
                    Agregar descanso
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Día sin atención</p>
              )}
            </div>

            {day.active && day.breaks.length > 0 && (
              <div
                className="mt-4 pt-4 space-y-3"
                style={{ borderTop: "1px solid #f3f4f6" }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Descansos o pausas
                </p>
                {day.breaks.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      type="time"
                      value={item.start}
                      onChange={(event) =>
                        updateBreak(day.dayOfWeek, item.id, {
                          start: event.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-xl border text-sm"
                      style={{ borderColor: "#d1d5db" }}
                      aria-label={`Inicio de descanso del ${day.label}`}
                    />
                    <span className="text-sm text-gray-400">a</span>
                    <input
                      type="time"
                      value={item.end}
                      onChange={(event) =>
                        updateBreak(day.dayOfWeek, item.id, {
                          end: event.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-xl border text-sm"
                      style={{ borderColor: "#d1d5db" }}
                      aria-label={`Finalización de descanso del ${day.label}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeBreak(day.dayOfWeek, item.id)}
                      className="text-sm font-semibold text-red-600 px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors[`day-${day.dayOfWeek}`] && (
              <p
                className="mt-3 text-xs text-red-600 flex items-center gap-1"
                role="alert"
              >
                <span aria-hidden="true">⚠</span>{" "}
                {errors[`day-${day.dayOfWeek}`]}
              </p>
            )}
          </article>
        ))}
      </section>

      <section
        className="bg-white rounded-2xl border p-5 mb-6"
        style={{
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          className="text-lg font-bold text-gray-900 mb-1"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Excepciones de disponibilidad
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Agrega fechas específicas en las que no prestarás servicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={exceptionDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(event) => {
              setExceptionDate(event.target.value)
              setErrors((current) => ({ ...current, exception: "" }))
            }}
            className="px-4 py-3 rounded-xl border text-sm"
            style={{
              borderColor: errors.exception ? "#ef4444" : "#d1d5db",
            }}
            aria-label="Fecha sin atención"
            aria-invalid={!!errors.exception}
          />
          <button
            type="button"
            onClick={addException}
            className="px-5 py-3 rounded-xl text-sm font-semibold border"
            style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
          >
            Agregar excepción
          </button>
        </div>
        {errors.exception && (
          <p
            className="mt-2 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <span aria-hidden="true">⚠</span> {errors.exception}
          </p>
        )}

        {draft.exceptions.length > 0 && (
          <div className="mt-5 space-y-2">
            {draft.exceptions.map((date) => (
              <div
                key={date}
                className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                style={{ borderColor: "#e5e7eb" }}
              >
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {formatException(date)}
                </span>
                <button
                  type="button"
                  onClick={() => removeException(date)}
                  className="text-sm font-semibold text-red-600"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl text-sm font-semibold border"
          style={{ color: "#374151", borderColor: "#d1d5db" }}
        >
          Cancelar cambios
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ backgroundColor: "#2563eb" }}
        >
          Guardar cambios
        </button>
      </div>
    </main>
  )
}
