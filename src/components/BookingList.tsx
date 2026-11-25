import { useState } from "react"
import type { Service } from "../App"
import {
  BOOKING_STATUS_LABELS,
  canCancelBooking,
  getBookingDateTime,
  getBookingStatus,
  type Booking,
  type BookingStatus,
} from "../schedule"

const PROVIDER_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "rejected",
  "completed",
]

const STATUS_STYLES: Record<BookingStatus, {
  backgroundColor: string
  color: string
}> = {
  pending: { backgroundColor: "#fffbeb", color: "#a16207" },
  confirmed: { backgroundColor: "#eff6ff", color: "#1d4ed8" },
  rejected: { backgroundColor: "#fef2f2", color: "#b91c1c" },
  completed: { backgroundColor: "#f0fdf4", color: "#15803d" },
  cancelled: { backgroundColor: "#f3f4f6", color: "#4b5563" },
}

interface Props {
  bookings: Booking[]
  services: Service[]
  perspective: "client" | "provider"
  onCancelBooking: (bookingId: string) => string | null
  onUpdateStatus?: (bookingId: string, status: BookingStatus) => string | null
  onSelectBooking?: (booking: Booking) => void
  emptyMessage?: string
  emptyDescription?: string
}

export default function BookingList({
  bookings,
  services,
  perspective,
  onCancelBooking,
  onUpdateStatus,
  onSelectBooking,
  emptyMessage = "No tienes reservas registradas.",
  emptyDescription = "Las próximas reservas aparecerán en esta sección.",
}: Props) {
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [draftStatuses, setDraftStatuses] =
    useState<Record<string, BookingStatus>>({})

  const sortedBookings = [...bookings].sort(
    (first, second) =>
      getBookingDateTime(first).getTime() -
      getBookingDateTime(second).getTime(),
  )

  const getServiceName = (booking: Booking) =>
    booking.serviceName ??
    services.find((service) => service.id === booking.serviceId)?.name ??
    "Servicio reservado"

  const confirmCancellation = () => {
    if (!pendingBooking) return
    const error = onCancelBooking(pendingBooking.id)
    if (error) {
      setFeedback({ type: "error", message: error })
      setPendingBooking(null)
      return
    }

    setFeedback({
      type: "success",
      message:
        "La reserva fue cancelada correctamente y el turno volvió a estar disponible.",
    })
    setPendingBooking(null)
  }

  const saveStatus = (booking: Booking) => {
    if (!onUpdateStatus) return
    const nextStatus = draftStatuses[booking.id] ?? getBookingStatus(booking)
    const error = onUpdateStatus(booking.id, nextStatus)
    if (error) {
      setFeedback({ type: "error", message: error })
      return
    }
    setFeedback({
      type: "success",
      message: `El estado de la reserva se actualizó a “${BOOKING_STATUS_LABELS[nextStatus]}”.`,
    })
  }

  return (
    <>
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 mb-5 text-sm ${
            feedback.type === "success" ? "text-green-800" : "text-red-700"
          }`}
          style={{
            backgroundColor:
              feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: feedback.type === "success" ? "#bbf7d0" : "#fecaca",
          }}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}

      {sortedBookings.length === 0 ? (
        <div
          className="rounded-2xl border bg-white p-8 text-center"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="font-bold text-gray-900">{emptyMessage}</p>
          <p className="text-sm text-gray-500 mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBookings.map((booking) => {
            const bookingDate = getBookingDateTime(booking)
            const isPast = bookingDate <= new Date()
            const canCancel = canCancelBooking(booking)
            const serviceName = getServiceName(booking)
            const status = getBookingStatus(booking)
            const draftStatus = draftStatuses[booking.id] ?? status
            const isCancelled = status === "cancelled"

            return (
              <article
                key={booking.id}
                className="rounded-2xl border bg-white p-5"
                style={{
                  borderColor: "#e5e7eb",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          ...STATUS_STYLES[status],
                        }}
                      >
                        {BOOKING_STATUS_LABELS[status]}
                      </span>
                      <span className="text-xs text-gray-400">
                        Código {booking.id}
                      </span>
                    </div>
                    <h3
                      className="font-extrabold text-gray-900"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      {serviceName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {bookingDate.toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {booking.time}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {perspective === "client"
                        ? `Proveedor: ${booking.provider}`
                        : `Cliente: ${booking.clientName ?? "Cliente registrado"}`}
                    </p>
                  </div>

                  {perspective === "provider" && (
                    <div className="w-full lg:w-64 shrink-0">
                      <label
                        className="block text-sm font-semibold text-gray-700 mb-1.5"
                        htmlFor={`booking-status-${booking.id}`}
                      >
                        Estado
                      </label>
                      <div className="flex gap-2">
                        <select
                          id={`booking-status-${booking.id}`}
                          value={draftStatus}
                          disabled={isCancelled}
                          onChange={(event) =>
                            setDraftStatuses((current) => ({
                              ...current,
                              [booking.id]: event.target.value as BookingStatus,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm text-gray-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                          style={{ borderColor: "#d1d5db" }}
                        >
                          {isCancelled ? (
                            <option value="cancelled">Cancelada</option>
                          ) : (
                            PROVIDER_STATUSES.map((option) => (
                              <option key={option} value={option}>
                                {BOOKING_STATUS_LABELS[option]}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          disabled={isCancelled || draftStatus === status}
                          onClick={() => saveStatus(booking)}
                          className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed"
                          style={{
                            backgroundColor:
                              isCancelled || draftStatus === status
                                ? "#9ca3af"
                                : "#2563eb",
                          }}
                        >
                          Guardar
                        </button>
                      </div>
                      {isCancelled && (
                        <p className="mt-2 text-xs text-gray-500">
                          Las reservas canceladas no se pueden editar.
                        </p>
                      )}
                    </div>
                  )}

                  {perspective === "client" && (
                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end shrink-0">
                      {onSelectBooking && (
                        <button
                          type="button"
                          onClick={() => onSelectBooking(booking)}
                          className="w-full lg:w-auto px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors"
                          style={{
                            color: "#1d4ed8",
                            borderColor: "#bfdbfe",
                            backgroundColor: "#eff6ff",
                          }}
                        >
                          Ver detalle
                        </button>
                      )}
                      {!isPast &&
                        (status === "pending" || status === "confirmed") && (
                          <>
                            <button
                              type="button"
                              disabled={!canCancel}
                              onClick={() => setPendingBooking(booking)}
                              className="w-full lg:w-auto px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors"
                              style={{
                                color: canCancel ? "#dc2626" : "#9ca3af",
                                borderColor: canCancel ? "#fecaca" : "#e5e7eb",
                                backgroundColor: canCancel
                                  ? "white"
                                  : "#f9fafb",
                                cursor: canCancel ? "pointer" : "not-allowed",
                              }}
                            >
                              Cancelar reserva
                            </button>
                            {!canCancel &&
                              (status === "pending" ||
                                status === "confirmed") && (
                                <p
                                  className="text-xs text-amber-700 mt-2 max-w-xs"
                                  role="status"
                                >
                                  No se puede cancelar porque faltan 24 horas o
                                  menos para el servicio.
                                </p>
                              )}
                          </>
                        )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {pendingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,24,39,0.55)" }}
            onClick={() => setPendingBooking(null)}
          />
          <div
            className="relative bg-white rounded-2xl border w-full max-w-md p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m8 8 6 6m0-6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2
              id="cancel-booking-title"
              className="text-xl font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              ¿Cancelar reserva?
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Cancelarás la reserva de{" "}
              <strong>{getServiceName(pendingBooking)}</strong> para el{" "}
              {getBookingDateTime(pendingBooking).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              a las {pendingBooking.time}. El turno se liberará para otros
              clientes.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingBooking(null)}
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-600"
                style={{ borderColor: "#d1d5db" }}
              >
                Conservar reserva
              </button>
              <button
                type="button"
                onClick={confirmCancellation}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#dc2626" }}
              >
                Sí, cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
