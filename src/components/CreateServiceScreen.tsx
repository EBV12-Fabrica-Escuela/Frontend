import { useState } from "react"
import type { Service } from "../App"

export interface NewServiceInput {
  name: string
  description: string
  category: string
  price: number
  durationHours: number
  status: "active" | "inactive"
}

interface Props {
  initialService?: Service
  onSave: (service: NewServiceInput) => void
  onCancel: () => void
}

const CATEGORIES = ["Limpieza", "Tecnología", "Mantenimiento", "Diseño"]

export default function CreateServiceScreen({
  initialService,
  onSave,
  onCancel,
}: Props) {
  const isEditing = Boolean(initialService)
  const [name, setName] = useState(initialService?.name ?? "")
  const [description, setDescription] = useState(
    initialService?.description ?? "",
  )
  const [category, setCategory] = useState(initialService?.category ?? "")
  const [price, setPrice] = useState(
    initialService ? String(initialService.priceNum) : "",
  )
  const [duration, setDuration] = useState(
    initialService ? String(initialService.durationHours) : "",
  )
  const [status, setStatus] = useState<"active" | "inactive">(
    initialService?.status ?? "active",
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const numericPrice = Number(price)
    const numericDuration = Number(duration)

    if (!name.trim()) nextErrors.name = "El nombre del servicio es obligatorio"
    if (!description.trim())
      nextErrors.description = "La descripción es obligatoria"
    if (!category) nextErrors.category = "Selecciona una categoría"
    if (price.trim() === "") nextErrors.price = "El precio es obligatorio"
    else if (!Number.isFinite(numericPrice) || numericPrice < 0)
      nextErrors.price = "Ingresa un precio válido mayor o igual a cero"
    if (duration.trim() === "")
      nextErrors.duration = "La duración es obligatoria"
    else if (!Number.isFinite(numericDuration) || numericDuration <= 0)
      nextErrors.duration = "Ingresa una duración mayor que cero"

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      price: numericPrice,
      durationHours: numericDuration,
      status,
    })
  }

  const fieldStyle = (field: string) => ({
    borderColor: errors[field] ? "#ef4444" : "#d1d5db",
    outline: "none",
  })

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 fade-in">
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
        {isEditing ? "Volver al detalle" : "Volver al panel"}
      </button>

      <div
        className="bg-white rounded-2xl border p-6 sm:p-8"
        style={{
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div className="mb-7">
          <div
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold mb-4"
            style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
          >
            {isEditing ? "Editar servicio" : "Nuevo servicio"}
          </div>
          <h1
            className="text-2xl font-extrabold text-gray-900 mb-1"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {isEditing ? "Actualizar servicio" : "Crear servicio"}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditing
              ? "Modifica la información que verán tus clientes."
              : "Completa la información que verán tus clientes."}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="service-name"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Nombre del servicio{" "}
              <span aria-hidden="true" style={{ color: "#ef4444" }}>
                *
              </span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                clearError("name")
              }}
              placeholder="Ej. Limpieza de oficinas"
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
              style={fieldStyle("name")}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "service-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="service-name-error"
                className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                role="alert"
              >
                <span aria-hidden="true">⚠</span> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service-description"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Descripción{" "}
              <span aria-hidden="true" style={{ color: "#ef4444" }}>
                *
              </span>
            </label>
            <textarea
              id="service-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                clearError("description")
              }}
              placeholder="Describe el alcance y las características del servicio"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none"
              style={fieldStyle("description")}
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "service-description-error" : undefined
              }
            />
            {errors.description && (
              <p
                id="service-description-error"
                className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                role="alert"
              >
                <span aria-hidden="true">⚠</span> {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="service-category"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Categoría{" "}
                <span aria-hidden="true" style={{ color: "#ef4444" }}>
                  *
                </span>
              </label>
              <select
                id="service-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  clearError("category")
                }}
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all"
                style={fieldStyle("category")}
                aria-required="true"
                aria-invalid={!!errors.category}
                aria-describedby={
                  errors.category ? "service-category-error" : undefined
                }
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p
                  id="service-category-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <span aria-hidden="true">⚠</span> {errors.category}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="service-status"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Estado{" "}
                <span aria-hidden="true" style={{ color: "#ef4444" }}>
                  *
                </span>
              </label>
              <select
                id="service-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "active" | "inactive")
                }
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all"
                style={{ borderColor: "#d1d5db", outline: "none" }}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Solo los servicios activos aparecen en el catálogo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="service-price"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Precio (COP){" "}
                <span aria-hidden="true" style={{ color: "#ef4444" }}>
                  *
                </span>
              </label>
              <input
                id="service-price"
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value)
                  clearError("price")
                }}
                placeholder="80000"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                style={fieldStyle("price")}
                aria-required="true"
                aria-invalid={!!errors.price}
                aria-describedby={
                  errors.price ? "service-price-error" : undefined
                }
              />
              {errors.price && (
                <p
                  id="service-price-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <span aria-hidden="true">⚠</span> {errors.price}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="service-duration"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Duración estimada (horas){" "}
                <span aria-hidden="true" style={{ color: "#ef4444" }}>
                  *
                </span>
              </label>
              <input
                id="service-duration"
                type="number"
                min="0.5"
                step="0.5"
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value)
                  clearError("duration")
                }}
                placeholder="2"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                style={fieldStyle("duration")}
                aria-required="true"
                aria-invalid={!!errors.duration}
                aria-describedby={
                  errors.duration ? "service-duration-error" : undefined
                }
              />
              {errors.duration && (
                <p
                  id="service-duration-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <span aria-hidden="true">⚠</span> {errors.duration}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-sm font-semibold border transition-colors"
              style={{ color: "#374151", borderColor: "#d1d5db" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
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
              {isEditing ? "Guardar cambios" : "Guardar servicio"}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
