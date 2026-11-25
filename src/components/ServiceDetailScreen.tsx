import { useState } from "react"
import type { Service } from "../App"

interface Props {
  service: Service
  showCreatedConfirmation?: boolean
  showUpdatedConfirmation?: boolean
  onBack: () => void
  onEdit: () => void
  onDelete: () => string | null
}

export default function ServiceDetailScreen({
  service,
  showCreatedConfirmation = false,
  showUpdatedConfirmation = false,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const handleDelete = () => {
    const error = onDelete()
    if (error) {
      setDeleteError(error)
      return
    }
    setShowDeleteConfirmation(false)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 fade-in">
      {(showCreatedConfirmation || showUpdatedConfirmation) && (
        <div
          className="rounded-xl p-4 mb-5 flex items-start gap-3"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#dcfce7" }}
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M4 9l3 3 7-7"
                stroke="#16a34a"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              {showCreatedConfirmation
                ? "Servicio creado exitosamente"
                : "Servicio actualizado exitosamente"}
            </p>
            <p className="text-sm text-green-700">
              {showCreatedConfirmation
                ? "Ya puedes consultar la información registrada."
                : "Los cambios ya están visibles en tu panel y en el catálogo."}
            </p>
          </div>
        </div>
      )}

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
            d="M9 2L4 7l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a mis servicios
      </button>

      <article
        className="bg-white rounded-2xl border overflow-hidden"
        style={{
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="h-2"
          style={{
            backgroundColor:
              service.status === "inactive" ? "#9ca3af" : "#2563eb",
          }}
          aria-hidden="true"
        />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-7">
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-2">
                {service.category}
              </p>
              <h1
                className="text-2xl font-extrabold text-gray-900"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {service.name}
              </h1>
            </div>
            <span
              className="inline-flex self-start px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor:
                  service.status === "inactive" ? "#f3f4f6" : "#f0fdf4",
                color: service.status === "inactive" ? "#6b7280" : "#15803d",
              }}
            >
              {service.status === "inactive" ? "Inactivo" : "Activo"}
            </span>
          </div>

          <div
            className="rounded-xl border divide-y mb-6"
            style={{ borderColor: "#e5e7eb" }}
          >
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Descripción
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {service.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Precio
                </p>
                <p className="font-bold" style={{ color: "#2563eb" }}>
                  {service.price}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Duración estimada
                </p>
                <p className="font-semibold text-gray-900">
                  {service.duration}
                </p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Proveedor
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {service.provider}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold border transition-colors"
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
            >
              Eliminar servicio
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold border text-gray-600 transition-colors"
                style={{ borderColor: "#d1d5db" }}
              >
                Ver mis servicios
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ backgroundColor: "#2563eb" }}
              >
                Editar servicio
              </button>
            </div>
          </div>
        </div>
      </article>

      {showDeleteConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,24,39,0.55)" }}
            onClick={() => setShowDeleteConfirmation(false)}
          />
          <div
            className="relative bg-white rounded-2xl border w-full max-w-md p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-service-title"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M7 8v8M11 8v8M15 8v8M4 5h14M8 5V3h6v2M5.5 5l.7 14h9.6l.7-14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              id="delete-service-title"
              className="text-xl font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              ¿Eliminar servicio?
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Eliminarás <strong>{service.name}</strong>. Dejará de aparecer en
              tu panel y en el catálogo, y esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <p
                className="mt-4 rounded-xl border px-3 py-2.5 text-sm text-red-700"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                }}
                role="alert"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  setDeleteError("")
                }}
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
                style={{ borderColor: "#d1d5db" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#dc2626" }}
              >
                Sí, eliminar servicio
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
