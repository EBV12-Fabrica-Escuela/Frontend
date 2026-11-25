import { useMemo, useState } from "react"
import type { Service } from "../App"
import {
  BOOKING_STATUS_LABELS,
  bookingBlocksSlot,
  displayTimeToMinutes,
  formatDateKey,
  getBookingStatus,
  getSlotAvailabilities,
  type Booking,
  type BookingStatus,
  type ProviderSchedule,
} from "../schedule"

type InsightTab = "occupancy" | "usage"

const USAGE_STATUSES: BookingStatus[] = [
  "completed",
  "confirmed",
  "pending",
  "cancelled",
]

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "#a16207",
  confirmed: "#1d4ed8",
  rejected: "#b91c1c",
  completed: "#15803d",
  cancelled: "#4b5563",
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getDatesInRange(start: string, end: string) {
  if (!start || !end || end < start) return []
  const dates: Date[] = []
  const cursor = new Date(`${start}T12:00:00`)
  const finalDate = new Date(`${end}T12:00:00`)

  while (cursor <= finalDate && dates.length < 92) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function formatConsultationDate(date: Date) {
  return date.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface Props {
  services: Service[]
  bookings: Booking[]
  schedule: ProviderSchedule
}

export default function ProviderInsights({
  services,
  bookings,
  schedule,
}: Props) {
  const today = formatDateKey(new Date())
  const defaultEnd = formatDateKey(addDays(new Date(), 6))
  const [activeTab, setActiveTab] = useState<InsightTab>("occupancy")
  const [occupancyServiceId, setOccupancyServiceId] = useState(
    () => services[0]?.id ?? "",
  )
  const [occupancyStart, setOccupancyStart] = useState(today)
  const [occupancyEnd, setOccupancyEnd] = useState(defaultEnd)
  const [usageServiceIds, setUsageServiceIds] = useState<string[]>(() =>
    services.map((service) => service.id),
  )
  const [usageStart, setUsageStart] = useState(today)
  const [usageEnd, setUsageEnd] = useState(defaultEnd)

  const selectedOccupancyService =
    services.find((service) => service.id === occupancyServiceId) ?? services[0]
  const occupancyDates = getDatesInRange(occupancyStart, occupancyEnd)
  const occupancyRangeError =
    !occupancyStart || !occupancyEnd
      ? "Selecciona una fecha inicial y una fecha final."
      : occupancyEnd < occupancyStart
        ? "La fecha final debe ser igual o posterior a la fecha inicial."
        : occupancyDates.length >= 92
          ? "Selecciona un periodo máximo de 91 días."
          : ""

  const occupancyRows = useMemo(() => {
    if (!selectedOccupancyService || occupancyRangeError) return []

    return occupancyDates.flatMap((date) => {
      const dateKey = formatDateKey(date)
      return getSlotAvailabilities(
        schedule,
        date,
        selectedOccupancyService.durationHours,
        bookings,
      )
        .filter((slot) => slot.available || slot.reason === "occupied")
        .map((slot) => {
          const slotStart = displayTimeToMinutes(slot.time)
          const slotEnd =
            slotStart + selectedOccupancyService.durationHours * 60
          const occupiedBooking = bookings.find((booking) => {
            if (booking.date !== dateKey || !bookingBlocksSlot(booking)) {
              return false
            }
            const bookingStart = displayTimeToMinutes(booking.time)
            const bookingEnd = bookingStart + booking.durationHours * 60
            return slotStart < bookingEnd && slotEnd > bookingStart
          })

          return {
            id: `${dateKey}-${slot.time}`,
            date,
            time: slot.time,
            booking: occupiedBooking,
          }
        })
    })
  }, [
    bookings,
    occupancyDates,
    occupancyRangeError,
    schedule,
    selectedOccupancyService,
  ])

  const occupiedRows = occupancyRows.filter((row) => row.booking)
  const usageDates = getDatesInRange(usageStart, usageEnd)
  const usageRangeError =
    !usageStart || !usageEnd
      ? "Selecciona una fecha inicial y una fecha final."
      : usageEnd < usageStart
        ? "La fecha final debe ser igual o posterior a la fecha inicial."
        : usageDates.length >= 92
          ? "Selecciona un periodo máximo de 91 días."
          : ""
  const usageRows = services
    .filter((service) => usageServiceIds.includes(service.id))
    .map((service) => {
      const serviceBookings = bookings.filter((booking) => {
        const status = getBookingStatus(booking)
        return (
          booking.serviceId === service.id &&
          booking.date >= usageStart &&
          booking.date <= usageEnd &&
          USAGE_STATUSES.includes(status)
        )
      })
      const counts = Object.fromEntries(
        USAGE_STATUSES.map((status) => [
          status,
          serviceBookings.filter(
            (booking) => getBookingStatus(booking) === status,
          ).length,
        ]),
      ) as Record<BookingStatus, number>
      return { service, total: serviceBookings.length, counts }
    })
  const usageTotal = usageRows.reduce((total, row) => total + row.total, 0)

  const toggleUsageService = (serviceId: string) => {
    setUsageServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  if (services.length === 0) {
    return (
      <section
        className="mb-8 rounded-2xl border bg-white p-7 text-center"
        style={{ borderColor: "#e5e7eb" }}
        aria-labelledby="provider-insights-title"
      >
        <h2
          id="provider-insights-title"
          className="text-xl font-extrabold text-gray-900"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Consultas de actividad
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Crea al menos un servicio para consultar su ocupación y uso.
        </p>
      </section>
    )
  }

  return (
    <section
      className="mb-8 rounded-2xl border bg-white p-5 sm:p-7"
      style={{
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      aria-labelledby="provider-insights-title"
    >
      <div className="mb-6">
        <h2
          id="provider-insights-title"
          className="text-xl font-extrabold text-gray-900"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Consultas de actividad
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Analiza la disponibilidad y el uso de tus servicios.
        </p>
      </div>

      <div
        className="mb-6 inline-flex w-full rounded-xl bg-gray-100 p-1 sm:w-auto"
        role="tablist"
        aria-label="Tipo de consulta"
      >
        {[
          { id: "occupancy" as const, label: "Consulta de Ocupación" },
          { id: "usage" as const, label: "Uso de Servicios" },
        ].map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:flex-none"
              style={{
                backgroundColor: selected ? "white" : "transparent",
                color: selected ? "#1d4ed8" : "#6b7280",
                boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "occupancy" ? (
        <div role="tabpanel">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-gray-700">
              Servicio
              <select
                value={selectedOccupancyService?.id ?? ""}
                onChange={(event) => setOccupancyServiceId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-normal text-gray-900"
                style={{ borderColor: "#d1d5db" }}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Desde
              <input
                type="date"
                value={occupancyStart}
                onChange={(event) => setOccupancyStart(event.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal text-gray-900"
                style={{ borderColor: "#d1d5db" }}
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Hasta
              <input
                type="date"
                value={occupancyEnd}
                onChange={(event) => setOccupancyEnd(event.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal text-gray-900"
                style={{ borderColor: "#d1d5db" }}
              />
            </label>
          </div>

          {occupancyRangeError ? (
            <p
              className="mt-4 rounded-xl border px-4 py-3 text-sm text-red-700"
              style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
              role="alert"
            >
              {occupancyRangeError}
            </p>
          ) : (
            <>
              {occupiedRows.length === 0 && (
                <p
                  className="mt-5 rounded-xl border px-4 py-3 text-sm text-blue-800"
                  style={{
                    borderColor: "#bfdbfe",
                    backgroundColor: "#eff6ff",
                  }}
                  role="status"
                >
                  No hay turnos ocupados en el periodo seleccionado. Las franjas
                  mostradas están disponibles.
                </p>
              )}

              <div
                className="mt-5 overflow-hidden rounded-xl border"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div className="grid grid-cols-[1.3fr_0.8fr_1fr] bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <span>Fecha</span>
                  <span>Hora</span>
                  <span>Disponibilidad</span>
                </div>
                {occupancyRows.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay franjas configuradas para este servicio en el
                    periodo.
                  </p>
                ) : (
                  <div
                    className="max-h-96 divide-y overflow-y-auto"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    {occupancyRows.map((row) => {
                      const status = row.booking
                        ? getBookingStatus(row.booking)
                        : null
                      return (
                        <div
                          key={row.id}
                          className="grid grid-cols-[1.3fr_0.8fr_1fr] items-center px-4 py-3 text-sm"
                        >
                          <span className="capitalize text-gray-700">
                            {formatConsultationDate(row.date)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {row.time}
                          </span>
                          {status ? (
                            <span
                              className="w-fit rounded-full px-2.5 py-1 text-xs font-bold"
                              style={{
                                color: STATUS_COLORS[status],
                                backgroundColor: `${STATUS_COLORS[status]}12`,
                              }}
                            >
                              Ocupado · {BOOKING_STATUS_LABELS[status]}
                            </span>
                          ) : (
                            <span className="w-fit rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                              Disponible
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div role="tabpanel">
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700">
              Servicios incluidos
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {services.map((service) => {
                const checked = usageServiceIds.includes(service.id)
                return (
                  <label
                    key={service.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: checked ? "#93c5fd" : "#d1d5db",
                      backgroundColor: checked ? "#eff6ff" : "white",
                      color: checked ? "#1d4ed8" : "#4b5563",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUsageService(service.id)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {service.name}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Desde
              <input
                type="date"
                value={usageStart}
                onChange={(event) => setUsageStart(event.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal text-gray-900"
                style={{ borderColor: "#d1d5db" }}
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Hasta
              <input
                type="date"
                value={usageEnd}
                onChange={(event) => setUsageEnd(event.target.value)}
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal text-gray-900"
                style={{ borderColor: "#d1d5db" }}
              />
            </label>
          </div>

          {usageRangeError ? (
            <p
              className="mt-4 rounded-xl border px-4 py-3 text-sm text-red-700"
              style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
              role="alert"
            >
              {usageRangeError}
            </p>
          ) : usageServiceIds.length === 0 ? (
            <p
              className="mt-5 rounded-xl border px-4 py-3 text-sm text-blue-800"
              style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
              role="status"
            >
              Selecciona al menos un servicio para consultar sus reservas.
            </p>
          ) : usageTotal === 0 ? (
            <p
              className="mt-5 rounded-xl border px-4 py-3 text-sm text-blue-800"
              style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
              role="status"
            >
              No hay datos de uso para los servicios y el periodo seleccionados.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {usageRows.map(({ service, total, counts }) => (
                <article
                  key={service.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-extrabold text-gray-900">
                      {service.name}
                    </h3>
                    <span className="text-sm font-bold text-blue-700">
                      {total} {total === 1 ? "reserva" : "reservas"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {USAGE_STATUSES.map((status) => (
                      <div key={status} className="rounded-lg bg-gray-50 p-3">
                        <p
                          className="text-xl font-extrabold"
                          style={{ color: STATUS_COLORS[status] }}
                        >
                          {counts[status]}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-gray-500">
                          {BOOKING_STATUS_LABELS[status]}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
