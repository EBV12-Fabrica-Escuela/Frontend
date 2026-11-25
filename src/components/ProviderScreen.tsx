import type { AuthUser } from "./AuthScreen"
import type { Service } from "../App"
import {
  bookingBlocksSlot,
  getBookingDateTime,
  type Booking,
  type BookingStatus,
  type ProviderSchedule,
} from "../schedule"
import BookingList from "./BookingList"
import ProviderInsights from "./ProviderInsights"

interface Props {
  user: AuthUser
  services: Service[]
  bookings: Booking[]
  schedule: ProviderSchedule
  successMessage?: string
  onCreateService: () => void
  onViewService: (service: Service) => void
  onConfigureSchedule: () => void
  onBrowseServices: () => void
  onCancelBooking: (bookingId: string) => string | null
  onUpdateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
  ) => string | null
}

export default function ProviderScreen({
  user,
  services,
  bookings,
  schedule,
  successMessage,
  onCreateService,
  onViewService,
  onConfigureSchedule,
  onBrowseServices,
  onCancelBooking,
  onUpdateBookingStatus,
}: Props) {
  const upcomingBookings = bookings.filter(
    (booking) =>
      getBookingDateTime(booking) > new Date() && bookingBlocksSlot(booking),
  )
  const providerStats = [
    {
      label: "Reservas próximas",
      value: String(upcomingBookings.length),
      detail: "Esta semana",
    },
    {
      label: "Servicios activos",
      value: String(
        services.filter((service) => service.status !== "inactive").length,
      ),
      detail: "Disponibles en el catálogo",
    },
    {
      label: "Calificación",
      value: "4.9",
      detail: "Promedio de clientes",
    },
  ]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      {successMessage && (
        <div
          className="rounded-xl border px-4 py-3 mb-6 text-sm text-green-800 flex items-center gap-2"
          style={{
            backgroundColor: "#f0fdf4",
            borderColor: "#bbf7d0",
          }}
          role="status"
          aria-live="polite"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 9.5 7 13l7.5-8"
              stroke="#16a34a"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <div className="mb-8">
        <div
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold mb-4"
          style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
        >
          Panel de proveedor
        </div>
        <h1
          className="text-3xl font-extrabold text-gray-900 mb-2"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Bienvenida, {user.name}
        </h1>
        <p className="text-gray-500">
          Consulta el estado general de tus servicios y próximas reservas.
        </p>
        <button
          type="button"
          onClick={onCreateService}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: "#2563eb" }}
          onMouseEnter={(event) => {
            ;(event.currentTarget as HTMLElement).style.backgroundColor =
              "#1d4ed8"
          }}
          onMouseLeave={(event) => {
            ;(event.currentTarget as HTMLElement).style.backgroundColor =
              "#2563eb"
          }}
        >
          Crear servicio
        </button>
        <button
          type="button"
          onClick={onConfigureSchedule}
          className="mt-5 ml-3 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
          style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
        >
          Configurar horarios
        </button>
        <button
          type="button"
          onClick={onBrowseServices}
          className="mt-5 ml-3 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
          style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
        >
          Explorar servicios
        </button>
      </div>

      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
        aria-label="Resumen de actividad"
      >
        {providerStats.map((stat) => (
          <article
            key={stat.label}
            className="bg-white rounded-2xl border p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <p className="text-sm font-semibold text-gray-500 mb-2">
              {stat.label}
            </p>
            <p
              className="text-3xl font-extrabold mb-1"
              style={{ color: "#2563eb", fontFamily: "Nunito, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      <ProviderInsights
        services={services}
        bookings={bookings}
        schedule={schedule}
      />

      <section className="mb-8" aria-labelledby="provider-bookings-title">
        <h2
          id="provider-bookings-title"
          className="text-xl font-bold text-gray-900 mb-1"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Reservas de tus servicios
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Gestiona el estado de las reservas de tus servicios.
        </p>
        <BookingList
          bookings={bookings}
          services={services}
          perspective="provider"
          onCancelBooking={onCancelBooking}
          onUpdateStatus={onUpdateBookingStatus}
          emptyMessage="Aún no tienes reservas para tus servicios."
        />
      </section>

      <section className="mt-8" aria-labelledby="provider-services-title">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2
              id="provider-services-title"
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Mis servicios
            </h2>
            <p className="text-sm text-gray-500">
              Consulta los servicios creados con tu cuenta.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateService}
            className="hidden sm:block px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
            style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
          >
            Crear servicio
          </button>
        </div>

        {services.length === 0 ? (
          <div
            className="bg-white rounded-2xl border p-8 text-center"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              className="font-bold text-gray-900 mb-1"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Aún no has creado servicios
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Crea tu primer servicio para comenzar a ofrecerlo a clientes.
            </p>
            <button
              type="button"
              onClick={onCreateService}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#2563eb" }}
            >
              Crear mi primer servicio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((service) => (
              <article
                key={service.id}
                className="bg-white rounded-2xl border p-5"
                style={{
                  borderColor: "#e5e7eb",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {service.category}
                    </p>
                    <h3
                      className="font-bold text-gray-900"
                      style={{ fontFamily: "Nunito, sans-serif" }}
                    >
                      {service.name}
                    </h3>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor:
                        service.status === "inactive" ? "#f3f4f6" : "#f0fdf4",
                      color:
                        service.status === "inactive" ? "#6b7280" : "#15803d",
                    }}
                  >
                    {service.status === "inactive" ? "Inactivo" : "Activo"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="font-bold" style={{ color: "#2563eb" }}>
                    {service.price}
                  </span>
                  <span className="text-xs text-gray-500">
                    {service.duration}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewService(service)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
                >
                  Ver detalle
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
