import { useState } from "react"
import { Service } from "../App"
import {
  BlockedSlot,
  Booking,
  displayTimeToMinutes,
  formatDateKey,
  formatSlot,
  getSlotAvailabilities,
  isSlotOccupied,
  ProviderSchedule,
  timeToMinutes,
} from "../schedule"

interface Props {
  service: Service
  selectedDate: Date | null
  selectedTime: string | null
  onDateChange: (date: Date | null) => void
  onTimeChange: (time: string | null) => void
  onContinue: () => void
  onBack: () => void
  schedule?: ProviderSchedule
  bookings?: Booking[]
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const TIME_SLOTS = ["08:00 AM", "10:00 AM", "02:00 PM", "04:00 PM"]

// Days fully booked (red) — day number only
const FULL_DAYS = [10, 14, 18, 22, 25]
// Non-working days / holidays (gray)
const HOLIDAY_DAYS = [19]

type DayStatus = "past" | "today" | "available" | "full" | "holiday" | "unavailable" | "selected"

function getDayStatus(
  year: number,
  month: number,
  day: number,
  selectedDate: Date | null,
  schedule?: ProviderSchedule,
): DayStatus {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const date = new Date(year, month, day)

  if (date < now) return "past"

  if (schedule) {
    const daySchedule = schedule.days.find(
      (item) => item.dayOfWeek === date.getDay(),
    )
    if (
      !daySchedule?.active ||
      schedule.exceptions.includes(formatDateKey(date))
    ) {
      return "unavailable"
    }
  }

  if (selectedDate) {
    const sel = new Date(selectedDate)
    sel.setHours(0, 0, 0, 0)
    if (date.getTime() === sel.getTime()) return "selected"
  }

  // Holiday check (apply for any month for demo purposes)
  if (HOLIDAY_DAYS.includes(day)) return "holiday"

  // Full/booked check
  if (FULL_DAYS.includes(day)) return "full"

  return "available"
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
          backgroundColor: done ? "#16a34a" : active ? "#2563eb" : "#e5e7eb",
          color: done || active ? "white" : "#6b7280",
        }}
        aria-current={active ? "step" : undefined}
      >
        {done ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8l3.5 3.5L13 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className="text-sm font-medium hidden sm:block"
        style={{ color: active ? "#2563eb" : done ? "#16a34a" : "#6b7280" }}
      >
        {label}
      </span>
    </div>
  )
}

type AgendaSlotStatus = "available" | "reserved" | "blocked" | "past"

interface ProviderAgendaProps {
  schedule: ProviderSchedule
  bookings: Booking[]
  onBlockedSlotsChange: (blockedSlots: BlockedSlot[]) => void
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  const offset = start.getDay() === 0 ? -6 : 1 - start.getDay()
  start.setDate(start.getDate() + offset)
  start.setHours(0, 0, 0, 0)
  return start
}

function getAgendaSlots(schedule: ProviderSchedule, date: Date) {
  const day = schedule.days.find((item) => item.dayOfWeek === date.getDay())
  if (!day?.active) return []

  const slots: string[] = []
  for (
    let minutes = timeToMinutes(day.start);
    minutes + 120 <= timeToMinutes(day.end);
    minutes += 120
  ) {
    slots.push(formatSlot(minutes))
  }
  return slots
}

function getAgendaSlotStatus(
  schedule: ProviderSchedule,
  bookings: Booking[],
  date: Date,
  time: string,
): {
  status: AgendaSlotStatus
  reason?: string
  specificBlock?: BlockedSlot
} {
  const dateKey = formatDateKey(date)
  const slotStart = displayTimeToMinutes(time)
  const slotDate = new Date(date)
  slotDate.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0)
  if (slotDate < new Date()) return { status: "past" }

  if (isSlotOccupied(schedule.provider, date, time, 2, bookings)) {
    return { status: "reserved" }
  }

  const specificBlock = (schedule.blockedSlots ?? []).find(
    (item) => item.date === dateKey && item.time === time,
  )
  if (specificBlock) {
    return {
      status: "blocked",
      reason: specificBlock.reason,
      specificBlock,
    }
  }

  const day = schedule.days.find((item) => item.dayOfWeek === date.getDay())
  const overlapsBreak = day?.breaks.some((item) => {
    const breakStart = timeToMinutes(item.start)
    const breakEnd = timeToMinutes(item.end)
    return slotStart < breakEnd && slotStart + 120 > breakStart
  })
  if (schedule.exceptions.includes(dateKey)) {
    return { status: "blocked", reason: "Fecha marcada como excepción" }
  }
  if (overlapsBreak) {
    return { status: "blocked", reason: "Descanso habitual" }
  }

  return { status: "available" }
}

export function ProviderAvailabilityAgenda({
  schedule,
  bookings,
  onBlockedSlotsChange,
}: ProviderAgendaProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [view, setView] = useState<"week" | "month">("week")
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [monthDate, setMonthDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)
  const [pendingSlot, setPendingSlot] = useState<{
    date: Date
    time: string
    action: "block" | "unblock"
  } | null>(null)
  const [reason, setReason] = useState("")
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  const openSlotAction = (date: Date, time: string) => {
    const slot = getAgendaSlotStatus(schedule, bookings, date, time)
    if (slot.status === "past") {
      setAlert({
        type: "error",
        message: "No puedes modificar franjas de fechas u horas pasadas.",
      })
      return
    }
    if (slot.status === "reserved") {
      setAlert({
        type: "error",
        message:
          "Conflicto: esta franja ya está reservada por un cliente y no puede bloquearse.",
      })
      return
    }
    if (slot.status === "blocked" && !slot.specificBlock) {
      setAlert({
        type: "info",
        message:
          "Esta franja está bloqueada por un descanso o una excepción. Modifica esa regla en la configuración habitual.",
      })
      return
    }

    const day = schedule.days.find((item) => item.dayOfWeek === date.getDay())
    const slotMinutes = displayTimeToMinutes(time)
    const insideWorkingHours =
      Boolean(day?.active) &&
      slotMinutes >= timeToMinutes(day?.start ?? "00:00") &&
      slotMinutes + 120 <= timeToMinutes(day?.end ?? "00:00")
    if (slot.status === "blocked" && !insideWorkingHours) {
      setAlert({
        type: "error",
        message:
          "Solo puedes habilitar franjas dentro del horario de atención habitual.",
      })
      return
    }

    setReason(slot.specificBlock?.reason ?? "")
    setPendingSlot({
      date,
      time,
      action: slot.status === "blocked" ? "unblock" : "block",
    })
    setAlert(null)
  }

  const applySlotAction = () => {
    if (!pendingSlot) return
    const dateKey = formatDateKey(pendingSlot.date)
    const currentBlocks = schedule.blockedSlots ?? []
    const nextBlocks =
      pendingSlot.action === "block"
        ? [
            ...currentBlocks.filter(
              (item) =>
                !(item.date === dateKey && item.time === pendingSlot.time),
            ),
            {
              date: dateKey,
              time: pendingSlot.time,
              reason: reason.trim() || undefined,
            },
          ]
        : currentBlocks.filter(
            (item) =>
              !(item.date === dateKey && item.time === pendingSlot.time),
          )

    onBlockedSlotsChange(nextBlocks)
    setAlert({
      type: "success",
      message:
        pendingSlot.action === "block"
          ? "La franja quedó bloqueada. Guarda los cambios para confirmar."
          : "La franja quedó disponible. Guarda los cambios para confirmar.",
    })
    setPendingSlot(null)
    setReason("")
  }

  const renderSlot = (date: Date, time: string, compact = false) => {
    const { status, reason: blockReason } = getAgendaSlotStatus(
      schedule,
      bookings,
      date,
      time,
    )
    const styles: Record<AgendaSlotStatus, {
      background: string
      border: string
      color: string
      label: string
    }> = {
      available: {
        background: "#f0fdf4",
        border: "#86efac",
        color: "#166534",
        label: "Disponible",
      },
      reserved: {
        background: "#eff6ff",
        border: "#93c5fd",
        color: "#1d4ed8",
        label: "Reservada",
      },
      blocked: {
        background: "#fff7ed",
        border: "#fdba74",
        color: "#c2410c",
        label: "Bloqueada",
      },
      past: {
        background: "#f9fafb",
        border: "#e5e7eb",
        color: "#9ca3af",
        label: "Pasada",
      },
    }
    const style = styles[status]

    return (
      <button
        key={`${formatDateKey(date)}-${time}`}
        type="button"
        disabled={status === "past"}
        onClick={() => openSlotAction(date, time)}
        className={`w-full rounded-lg border text-left transition-all ${
          compact ? "px-2 py-2" : "px-3 py-2.5"
        }`}
        style={{
          backgroundColor: style.background,
          borderColor: style.border,
          color: style.color,
          cursor: status === "past" ? "not-allowed" : "pointer",
          opacity: status === "past" ? 0.7 : 1,
        }}
        aria-disabled={status === "past" || status === "reserved"}
        aria-label={`${time}, ${style.label}${
          blockReason ? `, motivo: ${blockReason}` : ""
        }`}
      >
        <span className="block text-xs font-bold">{time}</span>
        <span className="block text-[11px] mt-0.5">{style.label}</span>
        {status === "blocked" && blockReason && (
          <span className="block text-[10px] mt-1 truncate" title={blockReason}>
            {blockReason}
          </span>
        )}
      </button>
    )
  }

  const weekDates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  )
  const monthYear = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const daysInMonth = new Date(monthYear, month + 1, 0).getDate()
  const firstDay = new Date(monthYear, month, 1).getDay()
  const selectedSlots = getAgendaSlots(schedule, selectedDate)

  return (
    <section
      className="bg-white rounded-2xl border p-5 sm:p-6 mb-8"
      style={{
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      aria-labelledby="provider-agenda-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h2
            id="provider-agenda-title"
            className="text-xl font-extrabold text-gray-900"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Vista de agenda
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consulta reservas y bloquea franjas específicas de tu horario.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl p-1 self-start"
          style={{ backgroundColor: "#f3f4f6" }}
          role="group"
          aria-label="Vista de agenda"
        >
          {(["week", "month"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: view === option ? "white" : "transparent",
                color: view === option ? "#111827" : "#6b7280",
                boxShadow:
                  view === option ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {option === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs mb-5" aria-label="Leyenda">
        {[
          ["#f0fdf4", "#86efac", "Disponible"],
          ["#eff6ff", "#93c5fd", "Reservada por cliente"],
          ["#fff7ed", "#fdba74", "Bloqueada"],
        ].map(([background, border, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded"
              style={{
                backgroundColor: background,
                border: `1px solid ${border}`,
              }}
              aria-hidden="true"
            />
            <span className="font-medium text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {alert && (
        <div
          className="rounded-xl border px-4 py-3 mb-5 text-sm"
          style={{
            backgroundColor:
              alert.type === "success"
                ? "#f0fdf4"
                : alert.type === "error"
                  ? "#fef2f2"
                  : "#eff6ff",
            borderColor:
              alert.type === "success"
                ? "#bbf7d0"
                : alert.type === "error"
                  ? "#fecaca"
                  : "#bfdbfe",
            color:
              alert.type === "success"
                ? "#166534"
                : alert.type === "error"
                  ? "#b91c1c"
                  : "#1d4ed8",
          }}
          role={alert.type === "error" ? "alert" : "status"}
        >
          {alert.message}
        </div>
      )}

      {view === "week" ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
              className="px-3 py-2 rounded-lg border text-sm font-semibold text-gray-600"
              style={{ borderColor: "#d1d5db" }}
            >
              Semana anterior
            </button>
            <p className="text-sm font-bold text-gray-800">
              {weekDates[0].toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
              })}{" "}
              –{" "}
              {weekDates[6].toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
              className="px-3 py-2 rounded-lg border text-sm font-semibold text-gray-600"
              style={{ borderColor: "#d1d5db" }}
            >
              Semana siguiente
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map((date) => {
              const slots = getAgendaSlots(schedule, date)
              return (
                <article
                  key={formatDateKey(date)}
                  className="rounded-xl border p-3"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <p className="text-xs font-bold text-gray-900 capitalize">
                    {date.toLocaleDateString("es-CO", { weekday: "short" })}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {date.toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <div className="space-y-2">
                    {slots.length > 0 ? (
                      slots.map((time) => renderSlot(date, time, true))
                    ) : (
                      <p className="text-xs text-gray-400 py-2">Sin atención</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() =>
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              className="px-3 py-2 rounded-lg border text-sm font-semibold text-gray-600"
              style={{ borderColor: "#d1d5db" }}
            >
              Mes anterior
            </button>
            <p className="font-bold text-gray-900 capitalize">
              {monthDate.toLocaleDateString("es-CO", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <button
              type="button"
              onClick={() =>
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              className="px-3 py-2 rounded-lg border text-sm font-semibold text-gray-600"
              style={{ borderColor: "#d1d5db" }}
            >
              Mes siguiente
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAY_NAMES.map((day) => (
              <span
                key={day}
                className="text-center text-xs font-semibold text-gray-500 py-1"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: firstDay }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = new Date(monthYear, month, index + 1)
              const slots = getAgendaSlots(schedule, date)
              const statuses = slots.map(
                (time) =>
                  getAgendaSlotStatus(schedule, bookings, date, time).status,
              )
              const isSelected =
                formatDateKey(date) === formatDateKey(selectedDate)
              const summaryColor = statuses.includes("reserved")
                ? "#2563eb"
                : statuses.includes("blocked")
                  ? "#f97316"
                  : statuses.includes("available")
                    ? "#16a34a"
                    : "#d1d5db"
              return (
                <button
                  key={formatDateKey(date)}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className="aspect-square rounded-lg border text-sm font-semibold relative"
                  style={{
                    borderColor: isSelected ? "#2563eb" : "#e5e7eb",
                    backgroundColor: isSelected ? "#eff6ff" : "white",
                    color: date < today ? "#9ca3af" : "#374151",
                  }}
                  aria-pressed={isSelected}
                >
                  {index + 1}
                  {slots.length > 0 && (
                    <span
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: summaryColor }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "#e5e7eb" }}
          >
            <h3 className="font-bold text-gray-900 mb-3 capitalize">
              {selectedDate.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            {selectedSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedSlots.map((time) => renderSlot(selectedDate, time))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay horario de atención configurado para este día.
              </p>
            )}
          </div>
        </>
      )}

      {pendingSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,24,39,0.55)" }}
            onClick={() => setPendingSlot(null)}
          />
          <div
            className="relative bg-white rounded-2xl border w-full max-w-md p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-action-title"
          >
            <h2
              id="slot-action-title"
              className="text-xl font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {pendingSlot.action === "block"
                ? "Bloquear franja"
                : "Desbloquear franja"}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {pendingSlot.date.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              a las {pendingSlot.time}.
            </p>
            <label
              htmlFor="block-reason"
              className="block text-sm font-semibold text-gray-700 mt-5 mb-1.5"
            >
              Motivo opcional
            </label>
            <input
              id="block-reason"
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej. Descanso o compromiso personal"
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: "#d1d5db" }}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingSlot(null)}
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-600"
                style={{ borderColor: "#d1d5db" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applySlotAction}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{
                  backgroundColor:
                    pendingSlot.action === "block" ? "#ea580c" : "#16a34a",
                }}
              >
                {pendingSlot.action === "block"
                  ? "Guardar bloqueo"
                  : "Confirmar disponibilidad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function AvailabilityScreen({
  service,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onContinue,
  onBack,
  schedule,
  bookings = [],
}: Props) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const slotAvailabilities = selectedDate
    ? schedule
      ? getSlotAvailabilities(
          schedule,
          selectedDate,
          service.durationHours,
          bookings,
        )
      : TIME_SLOTS.map((time) => ({
          time,
          available: !isSlotOccupied(
            service.provider,
            selectedDate,
            time,
            service.durationHours,
            bookings,
          ),
          reason: isSlotOccupied(
            service.provider,
            selectedDate,
            time,
            service.durationHours,
            bookings,
          )
            ? "occupied" as const
            : undefined,
        }))
    : []
  const hasAvailableSlots = slotAvailabilities.some((slot) => slot.available)
  const isSelectedSlotAvailable = slotAvailabilities.some(
    (slot) => slot.time === selectedTime && slot.available,
  )

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear((y) => y - 1)
    } else {
      setCalMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear((y) => y + 1)
    } else {
      setCalMonth((m) => m + 1)
    }
  }

  const handleDayClick = (day: number, status: DayStatus) => {
    if (
      status === "past" ||
      status === "full" ||
      status === "holiday" ||
      status === "unavailable"
    )
      return
    const newDate = new Date(calYear, calMonth, day)
    if (status === "selected") {
      onDateChange(null)
      onTimeChange(null)
    } else {
      onDateChange(newDate)
      onTimeChange(null)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
            <ProgressStep
              step={1}
              label="Servicio"
              active={false}
              done={true}
            />
          </li>
          <li aria-hidden="true" className="text-gray-300 text-lg select-none">
            →
          </li>
          <li className="flex items-center gap-2">
            <ProgressStep
              step={2}
              label="Fecha y hora"
              active={true}
              done={false}
            />
          </li>
          <li aria-hidden="true" className="text-gray-300 text-lg select-none">
            →
          </li>
          <li className="flex items-center gap-2">
            <ProgressStep
              step={3}
              label="Confirmación"
              active={false}
              done={false}
            />
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Service summary */}
        <aside className="lg:w-80 shrink-0">
          <div
            className="bg-white rounded-2xl border p-5 sticky top-24"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            aria-label="Resumen del servicio seleccionado"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Servicio seleccionado
            </h2>
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{ height: "140px", backgroundColor: "#dbeafe" }}
            >
              <img
                src={service.image}
                alt={`Imagen de ${service.name}`}
                className="w-full h-full object-cover"
              />
            </div>
            <h3
              className="font-bold text-gray-900 text-base mb-1"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {service.name}
            </h3>
            <p className="text-sm text-gray-500 mb-3">{service.provider}</p>

            <div
              className="space-y-2 border-t pt-3"
              style={{ borderColor: "#f3f4f6" }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Categoría</span>
                <span className="font-medium text-gray-700">
                  {service.category}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duración</span>
                <span className="font-medium text-gray-700">
                  {service.duration}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio</span>
                <span className="font-bold" style={{ color: "#2563eb" }}>
                  {service.price}
                </span>
              </div>
            </div>

            {selectedDate && (
              <div
                className="mt-4 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <p className="font-semibold text-green-800 mb-0.5">
                  📅 Fecha seleccionada
                </p>
                <p className="text-green-700 capitalize text-xs leading-relaxed">
                  {formatDate(selectedDate)}
                </p>
                {selectedTime && (
                  <p className="mt-1 font-semibold text-green-800">
                    🕐 {selectedTime}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={onBack}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
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
              Cambiar servicio
            </button>
          </div>
        </aside>

        {/* Right: Calendar + Time slots */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-white rounded-2xl border p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              className="text-xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: "Nunito, sans-serif" }}
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
                  color: isPrevDisabled ? "#d1d5db" : "#374151",
                  cursor: isPrevDisabled ? "not-allowed" : "pointer",
                  backgroundColor: isPrevDisabled ? "transparent" : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isPrevDisabled)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#f3f4f6"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
                aria-label="Mes anterior"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 3L5 8l5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <h3
                className="font-bold text-gray-900 text-base"
                style={{ fontFamily: "Nunito, sans-serif" }}
                aria-live="polite"
              >
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>

              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-gray-700"
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#f3f4f6"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
                aria-label="Mes siguiente"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 3l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-2" role="row">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold py-1"
                  style={{ color: "#6b7280" }}
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
                const status = getDayStatus(
                  calYear,
                  calMonth,
                  day,
                  selectedDate,
                  schedule,
                )
                const isClickable =
                  status === "available" ||
                  status === "today" ||
                  status === "selected"

                let bg = "transparent"
                let color = "#111827"
                let border = "transparent"
                let cursor = isClickable ? "pointer" : "not-allowed"
                let textDecoration = "none"
                let ariaLabel = `${day} de ${MONTH_NAMES[calMonth]}`

                if (status === "selected") {
                  bg = "#2563eb"
                  color = "white"
                  border = "#2563eb"
                  ariaLabel += " — Seleccionado"
                } else if (status === "available" || status === "today") {
                  bg = "#f0fdf4"
                  color = "#15803d"
                  border = "#bbf7d0"
                  ariaLabel += " — Disponible"
                } else if (status === "full") {
                  bg = "#fef2f2"
                  color = "#b91c1c"
                  border = "#fecaca"
                  textDecoration = "line-through"
                  cursor = "not-allowed"
                  ariaLabel += " — Agotado"
                } else if (
                  status === "past" ||
                  status === "holiday" ||
                  status === "unavailable"
                ) {
                  bg = "#f9fafb"
                  color = "#9ca3af"
                  border = "#f3f4f6"
                  cursor = "not-allowed"
                  ariaLabel +=
                    status === "holiday"
                      ? " — Festivo"
                      : status === "unavailable"
                        ? " — No disponible"
                        : " — Fecha pasada"
                }

                return (
                  <button
                    key={day}
                    role="gridcell"
                    aria-label={ariaLabel}
                    aria-disabled={!isClickable}
                    aria-selected={status === "selected"}
                    disabled={!isClickable}
                    onClick={() => handleDayClick(day, status)}
                    className="aspect-square rounded-lg text-sm font-semibold flex items-center justify-center transition-all relative"
                    style={{
                      backgroundColor: bg,
                      color,
                      border: `1px solid ${border}`,
                      textDecoration,
                      cursor,
                      fontSize: "13px",
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable && status !== "selected") {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          status === "available" || status === "today"
                            ? "#dcfce7"
                            : bg
                        ;(e.currentTarget as HTMLElement).style.transform =
                          "scale(1.08)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (status !== "selected") {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          bg
                        ;(e.currentTarget as HTMLElement).style.transform =
                          "scale(1)"
                      }
                    }}
                  >
                    {day}
                    {status === "full" && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: "#ef4444" }}
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
              style={{ borderTop: "1px solid #f3f4f6" }}
              aria-label="Leyenda del calendario"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{
                    backgroundColor: "#2563eb",
                    border: "1px solid #2563eb",
                  }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Seleccionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">Agotado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded inline-block"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #f3f4f6",
                  }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 font-medium">
                  No disponible / Festivo
                </span>
              </div>
            </div>
          </div>

          {/* Time slots — shown only after date selection */}
          {selectedDate && (
            <div
              className="bg-white rounded-2xl border p-6 mt-5 fade-in"
              style={{
                borderColor: "#e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              aria-live="polite"
            >
              <h2
                className="text-lg font-bold text-gray-900 mb-1"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                Horarios disponibles
              </h2>
              <p className="text-sm text-gray-500 mb-4 capitalize">
                {formatDate(selectedDate)}
              </p>

              {slotAvailabilities.length > 0 && (
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  role="group"
                  aria-label="Seleccionar horario"
                >
                  {slotAvailabilities.map((slot) => {
                    const isSelected =
                      selectedTime === slot.time && slot.available
                    const isOccupied = slot.reason === "occupied"
                    const isBlocked = slot.reason === "blocked"
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() =>
                          onTimeChange(isSelected ? null : slot.time)
                        }
                        className="py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1"
                        style={{
                          backgroundColor: isSelected
                            ? "#2563eb"
                            : isOccupied
                              ? "#fef2f2"
                              : isBlocked
                                ? "#fff7ed"
                                : slot.available
                                  ? "white"
                                  : "#f9fafb",
                          borderColor: isSelected
                            ? "#2563eb"
                            : isOccupied
                              ? "#fecaca"
                              : isBlocked
                                ? "#fdba74"
                                : "#e5e7eb",
                          color: isSelected
                            ? "white"
                            : isOccupied
                              ? "#b91c1c"
                              : isBlocked
                                ? "#c2410c"
                                : slot.available
                                  ? "#374151"
                                  : "#9ca3af",
                          cursor: slot.available ? "pointer" : "not-allowed",
                        }}
                        aria-pressed={isSelected}
                        aria-label={`Horario ${slot.time}${
                          isSelected
                            ? " — Seleccionado"
                            : slot.available
                              ? " — Disponible"
                              : isOccupied
                                ? " — Ocupado"
                                : isBlocked
                                  ? " — Bloqueado por el proveedor"
                                  : " — No disponible"
                        }`}
                        onMouseEnter={(e) => {
                          if (slot.available && !isSelected) {
                            ;(e.currentTarget as HTMLElement).style.borderColor =
                              "#2563eb"
                            ;(e.currentTarget as HTMLElement).style.backgroundColor =
                              "#eff6ff"
                            ;(e.currentTarget as HTMLElement).style.color =
                              "#2563eb"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (slot.available && !isSelected) {
                            ;(e.currentTarget as HTMLElement).style.borderColor =
                              "#e5e7eb"
                            ;(e.currentTarget as HTMLElement).style.backgroundColor =
                              "white"
                            ;(e.currentTarget as HTMLElement).style.color =
                              "#374151"
                          }
                        }}
                      >
                        <span>{slot.time}</span>
                        {isSelected && (
                          <span className="text-xs font-medium opacity-80">
                            Seleccionado
                          </span>
                        )}
                        {!slot.available && (
                          <span className="text-xs font-medium">
                            {isOccupied
                              ? "Ocupado"
                              : isBlocked
                                ? "Bloqueado"
                                : "No disponible"}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {!hasAvailableSlots && (
                <div
                  className="rounded-xl p-4 text-sm text-gray-500 mt-3"
                  style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                  role="status"
                >
                  No hay turnos disponibles para la fecha seleccionada
                </div>
              )}
            </div>
          )}

          {/* Continue button */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onBack}
              className="px-5 py-3 rounded-xl text-sm font-semibold border transition-all text-gray-600 hover:bg-gray-50"
              style={{ borderColor: "#d1d5db" }}
            >
              Volver al catálogo
            </button>
            <button
              onClick={onContinue}
              disabled={!selectedTime || !isSelectedSlotAvailable}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                backgroundColor:
                  selectedTime && isSelectedSlotAvailable
                    ? "#2563eb"
                    : "#d1d5db",
                cursor:
                  selectedTime && isSelectedSlotAvailable
                    ? "pointer"
                    : "not-allowed",
              }}
              aria-disabled={!selectedTime || !isSelectedSlotAvailable}
              aria-label={
                selectedTime && isSelectedSlotAvailable
                  ? "Continuar con la reserva"
                  : "Selecciona un horario para continuar"
              }
              onMouseEnter={(e) => {
                if (selectedTime && isSelectedSlotAvailable)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#1d4ed8"
              }}
              onMouseLeave={(e) => {
                if (selectedTime && isSelectedSlotAvailable)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#2563eb"
              }}
            >
              {selectedTime && isSelectedSlotAvailable
                ? "Continuar con la reserva →"
                : "Selecciona un horario"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
