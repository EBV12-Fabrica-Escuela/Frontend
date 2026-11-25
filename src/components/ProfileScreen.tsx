import { useState } from "react"
import type { AccountProfileInput, AuthUser, UserRole } from "./AuthScreen"
import { hasUserRole } from "./AuthScreen"

interface Props {
  user: AuthUser
  onSave: (profile: AccountProfileInput) => string | null
  onBack: () => void
}

function getRoleLabel(user: AuthUser) {
  if (hasUserRole(user, "client") && hasUserRole(user, "provider")) {
    return "Cliente y proveedor"
  }

  const labels: Record<UserRole, string> = {
    client: "Cliente",
    provider: "Proveedor",
    admin: "Administrador",
  }
  return labels[user.role]
}

export default function ProfileScreen({ user, onSave, onBack }: Props) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const clearFeedback = (field: string) => {
    setSaved(false)
    if (errors[field] || errors.form) {
      setErrors((current) => ({ ...current, [field]: "", form: "" }))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = "El nombre completo es obligatorio"
    if (!email.trim()) nextErrors.email = "El correo electrónico es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Ingresa un correo electrónico válido"
    }
    if (!phone.trim()) nextErrors.phone = "El número de celular es obligatorio"
    else if (!/^[+\d][\d\s()-]{6,19}$/.test(phone.trim())) {
      nextErrors.phone = "Ingresa un número de celular válido"
    }

    if (Object.keys(nextErrors).length > 0) {
      setSaved(false)
      setErrors(nextErrors)
      return
    }

    const error = onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    })
    if (error) {
      setSaved(false)
      setErrors({ form: error })
      return
    }

    setErrors({})
    setSaved(true)
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const fieldStyle = (field: string) => ({
    borderColor: errors[field] ? "#ef4444" : "#d1d5db",
    outline: "none",
  })

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 fade-in">
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
        Volver al inicio
      </button>

      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="px-6 sm:px-8 py-7 border-b flex flex-col sm:flex-row sm:items-center gap-5"
          style={{
            borderColor: "#e5e7eb",
            background:
              "linear-gradient(135deg, #eff6ff 0%, #ffffff 65%, #f0fdf4 100%)",
          }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0"
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              fontFamily: "Nunito, sans-serif",
              boxShadow: "0 8px 20px rgba(37,99,235,0.2)",
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-1">
              Mi cuenta
            </p>
            <h1
              className="text-2xl font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Gestionar perfil
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Mantén actualizados tus datos personales y de contacto.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
          {errors.form && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm text-red-700"
              style={{
                backgroundColor: "#fef2f2",
                borderColor: "#fecaca",
              }}
              role="alert"
            >
              {errors.form}
            </div>
          )}

          {saved && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm text-green-800 flex items-center gap-2"
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
              Tu perfil se actualizó correctamente.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label
                htmlFor="profile-name"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Nombre completo
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  clearFeedback("name")
                }}
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
                style={fieldStyle("name")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "profile-name-error" : undefined
                }
              />
              {errors.name && (
                <p
                  id="profile-name-error"
                  className="mt-1.5 text-xs text-red-600"
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearFeedback("email")
                }}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
                style={fieldStyle("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "profile-email-error" : undefined
                }
              />
              {errors.email && (
                <p
                  id="profile-email-error"
                  className="mt-1.5 text-xs text-red-600"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Número de celular
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  clearFeedback("phone")
                }}
                autoComplete="tel"
                placeholder="300 123 4567"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
                style={fieldStyle("phone")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "profile-phone-error" : undefined
                }
              />
              {errors.phone && (
                <p
                  id="profile-phone-error"
                  className="mt-1.5 text-xs text-red-600"
                  role="alert"
                >
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <span className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tipo de usuario
              </span>
              <div
                className="w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3"
                style={{
                  borderColor: "#e5e7eb",
                  backgroundColor: "#f9fafb",
                  color: "#4b5563",
                }}
                aria-label={`Tipo de usuario: ${getRoleLabel(user)}. Este dato no se puede modificar.`}
              >
                <span className="font-semibold">{getRoleLabel(user)}</span>
                <span className="text-xs text-gray-400">No editable</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                El tipo de usuario no puede modificarse. Para usar otro rol,
                debes registrar una cuenta nueva con ese tipo de usuario.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#d1d5db" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: "#2563eb" }}
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
