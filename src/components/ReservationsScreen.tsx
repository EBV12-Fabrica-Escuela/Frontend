import { useState } from "react"
import type { Service } from "../App"
import {
  BOOKING_STATUS_LABELS,
  getBookingDateTime,
  getBookingStatus,
  type Booking,
} from "../schedule"
import BookingList from "./BookingList"

type ReservationView = "active" | "history"

interface Props {
  bookings: Booking[]
  services: Service[]
  onCancelBooking: (bookingId: string) => string | null
  onBack: () => void
}

export default function ReservationsScreen({
  bookings,
  services,
  onCancelBooking,
  onBack,
}: Props) {
  const [view, setView] = useState<ReservationView>("active")
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  )

  const activeBookings = bookings.filter((booking) => {
    const status = getBookingStatus(booking)
    return status === "pending" || status === "confirmed"
  })
  const historicalBookings = bookings.filter((booking) => {
    const status = getBookingStatus(booking)
    return (
      status === "completed" || status === "cancelled" || status === "rejected"
    )
  })
  const visibleBookings =
    view === "active" ? activeBookings : historicalBookings
  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ?? null
  const selectedService = selectedBooking
    ? services.find((service) => service.id === selectedBooking.serviceId)
    : null

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 fade-in">
      <button
        type="button"
        onClick={onBack}
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
            d="M9 2 4 7l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver al inicio
      </button>

      <div className="mb-8">
        <div
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold mb-4"
          style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
        >
          Mi actividad
        </div>
        <h1
          className="text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Mis reservas
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Consulta el estado actualizado de tus reservas y revisa todos sus
          detalles.
        </p>
      </div>

      {bookings.length === 0 ? (
        <section
          className="rounded-2xl border bg-white px-6 py-12 text-center"
          style={{
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
          aria-labelledby="no-reservations-title"
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="5.5"
                width="16"
                height="14"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 3.5v4M16 3.5v4M4 10h16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2
            id="no-reservations-title"
            className="text-lg font-extrabold text-gray-900"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Aún no tienes reservas registradas
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            Cuando reserves un servicio, podrás consultar aquí su estado, fecha
            y todos los detalles de la atención.
          </p>
        </section>
      ) : (
        <>
          <div
            className="mb-6 inline-flex w-full rounded-xl border bg-white p-1 sm:w-auto"
            style={{ borderColor: "#e5e7eb" }}
            role="tablist"
            aria-label="Filtrar reservas"
          >
            {([
              {
                id: "active",
                label: "Reservas activas",
                count: activeBookings.length,
              },
              {
                id: "history",
                label: "Historial",
                count: historicalBookings.length,
              },
            ] as const).map((tab) => {
              const selected = view === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setView(tab.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors sm:flex-none"
                  style={{
                    backgroundColor: selected ? "#2563eb" : "transparent",
                    color: selected ? "white" : "#4b5563",
                  }}
                >
                  {tab.label}
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: selected
                        ? "rgba(255,255,255,0.2)"
                        : "#f3f4f6",
                      color: selected ? "white" : "#6b7280",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <BookingList
            bookings={visibleBookings}
            services={services}
            perspective="client"
            onCancelBooking={onCancelBooking}
            onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
            emptyMessage={
              view === "active"
                ? "No tienes reservas activas."
                : "Tu historial de reservas está vacío."
            }
            emptyDescription={
              view === "active"
                ? "Las reservas pendientes o confirmadas aparecerán aquí."
                : "Las reservas completadas, canceladas o rechazadas aparecerán aquí."
            }
          />
        </>
      )}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,24,39,0.55)" }}
            onClick={() => setSelectedBookingId(null)}
          />
          <section
            className="relative w-full max-w-lg rounded-2xl border bg-white p-6 sm:p-7"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-detail-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Detalle de la reserva
                </p>
                <h2
                  id="reservation-detail-title"
                  className="mt-1 text-2xl font-extrabold text-gray-900"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {selectedBooking.serviceName ??
                    selectedService?.name ??
                    "Servicio reservado"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar detalle"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Proveedor
                </dt>
                <dd className="mt-1 text-sm font-bold text-gray-900">
                  {selectedBooking.provider}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </dt>
                <dd className="mt-1 text-sm font-bold text-gray-900">
                  {BOOKING_STATUS_LABELS[getBookingStatus(selectedBooking)]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </dt>
                <dd className="mt-1 text-sm font-bold capitalize text-gray-900">
                  {getBookingDateTime(selectedBooking).toLocaleDateString(
                    "es-CO",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hora
                </dt>
                <dd className="mt-1 text-sm font-bold text-gray-900">
                  {selectedBooking.time}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Precio
                </dt>
                <dd className="mt-1 text-base font-extrabold text-gray-900">
                  {selectedBooking.servicePrice ??
                    selectedService?.price ??
                    "Precio no disponible"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: "#2563eb" }}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
