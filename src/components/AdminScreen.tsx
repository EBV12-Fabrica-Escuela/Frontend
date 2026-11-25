import { useMemo, useState } from "react"
import type { ManagedAccount, UserRole } from "./AuthScreen"

interface Props {
  accounts: ManagedAccount[]
  onChangeRole: (email: string, role: UserRole) => string | null
  onDelete: (email: string) => string | null
}

type PendingAction = {
  type: "role"
  account: ManagedAccount
  role: UserRole
} | {
  type: "delete"
  account: ManagedAccount
}

const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  provider: "Proveedor",
  admin: "Administrador",
}

export default function AdminScreen({
  accounts,
  onChangeRole,
  onDelete,
}: Props) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [search, setSearch] = useState("")

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return accounts
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        ROLE_LABELS[account.role].toLowerCase().includes(query),
    )
  }, [accounts, search])

  const confirmAction = () => {
    if (!pendingAction) return

    const error =
      pendingAction.type === "role"
        ? onChangeRole(pendingAction.account.email, pendingAction.role)
        : onDelete(pendingAction.account.email)

    if (error) {
      setFeedback({ type: "error", message: error })
    } else if (pendingAction.type === "role") {
      setFeedback({
        type: "success",
        message: `El rol de ${pendingAction.account.name} se actualizó a ${ROLE_LABELS[pendingAction.role]}. Los permisos ya fueron reajustados.`,
      })
    } else {
      setFeedback({
        type: "success",
        message: `El acceso de ${pendingAction.account.name} fue eliminado correctamente.`,
      })
    }
    setPendingAction(null)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <div
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold mb-4"
            style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
          >
            Acceso administrativo
          </div>
          <h1
            className="text-3xl font-extrabold text-gray-900"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Gestión de usuarios y roles
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Consulta las cuentas registradas, modifica sus permisos o elimina
            accesos que ya no deban estar habilitados.
          </p>
        </div>
        <div
          className="rounded-xl border px-4 py-3 bg-white"
          style={{ borderColor: "#e5e7eb" }}
        >
          <span className="text-2xl font-extrabold text-gray-900 block">
            {accounts.length}
          </span>
          <span className="text-xs text-gray-500">usuarios registrados</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-4 ${
            feedback.type === "success" ? "text-green-800" : "text-red-700"
          }`}
          style={{
            backgroundColor:
              feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: feedback.type === "success" ? "#bbf7d0" : "#fecaca",
          }}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          <span className="font-medium">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold shrink-0"
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      <section
        className="bg-white rounded-2xl border overflow-hidden"
        style={{
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
        aria-labelledby="users-title"
      >
        <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              id="users-title"
              className="text-lg font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Usuarios de la plataforma
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Los cambios de rol actualizan los permisos inmediatamente.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="5" stroke="#6b7280" strokeWidth="1.5" />
              <path
                d="m12 12 3 3"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o rol"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "#d1d5db", outline: "none" }}
              aria-label="Buscar usuarios"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Usuario
                </th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Contacto
                </th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Rol
                </th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const initials = account.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()

                return (
                  <tr key={account.email} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{
                            backgroundColor: "#dbeafe",
                            color: "#1d4ed8",
                          }}
                          aria-hidden="true"
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {account.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {account.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {account.phone || "Sin teléfono"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          account.enabled
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {account.enabled ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={account.role}
                        onChange={(event) =>
                          setPendingAction({
                            type: "role",
                            account,
                            role: event.target.value as UserRole,
                          })
                        }
                        className="w-40 px-3 py-2 rounded-lg border text-sm bg-white"
                        style={{ borderColor: "#d1d5db" }}
                        aria-label={`Cambiar rol de ${account.name}`}
                      >
                        <option value="client">Cliente</option>
                        <option value="provider">Proveedor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingAction({ type: "delete", account })
                        }
                        className="px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Eliminar acceso
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="font-bold text-gray-800">No encontramos usuarios</p>
            <p className="text-sm text-gray-500 mt-1">
              Intenta buscar con otro nombre, correo o rol.
            </p>
          </div>
        )}
      </section>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,24,39,0.55)" }}
            onClick={() => setPendingAction(null)}
          />
          <div
            className="relative bg-white rounded-2xl border w-full max-w-md p-6"
            style={{
              borderColor: "#e5e7eb",
              boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{
                backgroundColor:
                  pendingAction.type === "delete" ? "#fef2f2" : "#eff6ff",
                color: pendingAction.type === "delete" ? "#dc2626" : "#2563eb",
              }}
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M11 7v5M11 15h.01"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h2
              id="confirmation-title"
              className="text-xl font-extrabold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {pendingAction.type === "delete"
                ? "¿Eliminar acceso?"
                : "¿Confirmar cambio de rol?"}
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {pendingAction.type === "delete"
                ? `Eliminarás la cuenta de ${pendingAction.account.name} (${pendingAction.account.email}). Esta persona ya no podrá ingresar a la plataforma.`
                : `Cambiarás el rol de ${pendingAction.account.name} de ${ROLE_LABELS[pendingAction.account.role]} a ${ROLE_LABELS[pendingAction.role]}. Sus permisos se actualizarán inmediatamente.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
                style={{ borderColor: "#d1d5db" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{
                  backgroundColor:
                    pendingAction.type === "delete" ? "#dc2626" : "#2563eb",
                }}
              >
                {pendingAction.type === "delete"
                  ? "Sí, eliminar acceso"
                  : "Sí, cambiar rol"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
