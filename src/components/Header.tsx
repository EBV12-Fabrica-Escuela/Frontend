import { hasUserRole } from "./AuthScreen"
import type { AuthUser } from "./AuthScreen"

interface HeaderProps {
  user: AuthUser | null
  onLogoClick: () => void
  onMisReservas: () => void
  onServices: () => void
  onProviderPanel: () => void
  onAdminPanel: () => void
  onProfile: () => void
  onLogin: () => void
  onLogout: () => void
}

export default function Header({
  user,
  onLogoClick,
  onMisReservas,
  onServices,
  onProviderPanel,
  onAdminPanel,
  onProfile,
  onLogin,
  onLogout,
}: HeaderProps) {
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header
      className="bg-white border-b sticky top-0 z-40"
      style={{
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
            aria-label="ServiPlus — ir al inicio"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#2563eb" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 2L11.5 7H16.5L12.5 10.5L14 15.5L9 12.5L4 15.5L5.5 10.5L1.5 7H6.5L9 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <span
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Servi<span style={{ color: "#2563eb" }}>Plus</span>
            </span>
          </button>

          {/* Nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Navegación principal"
          >
            <button
              onClick={onServices}
              className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "#374151" }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.color = "#2563eb"
                ;(e.target as HTMLElement).style.backgroundColor = "#eff6ff"
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.color = "#374151"
                ;(e.target as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              Servicios
            </button>
            {hasUserRole(user, "provider") && (
              <button
                onClick={onProviderPanel}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: "#374151" }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#2563eb"
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#eff6ff"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#374151"
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
              >
                Panel de proveedor
              </button>
            )}
            {hasUserRole(user, "admin") && (
              <button
                onClick={onAdminPanel}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: "#374151" }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#2563eb"
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#eff6ff"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#374151"
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
              >
                Gestionar roles
              </button>
            )}
            {hasUserRole(user, "client") && (
              <button
                onClick={onMisReservas}
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: "#374151" }}
                onMouseEnter={(e) => {
                  ;(e.target as HTMLElement).style.color = "#2563eb"
                  ;(e.target as HTMLElement).style.backgroundColor = "#eff6ff"
                }}
                onMouseLeave={(e) => {
                  ;(e.target as HTMLElement).style.color = "#374151"
                  ;(e.target as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
              >
                Mis reservas
              </button>
            )}
            <a
              href="#"
              className="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "#374151" }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.color = "#2563eb"
                ;(e.target as HTMLElement).style.backgroundColor = "#eff6ff"
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.color = "#374151"
                ;(e.target as HTMLElement).style.backgroundColor = "transparent"
              }}
            >
              Ayuda
            </a>
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={onProfile}
                  className="flex items-center gap-2"
                  aria-label={`Abrir perfil de ${user.name}`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-gray-700 block leading-tight">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {hasUserRole(user, "client") &&
                      hasUserRole(user, "provider")
                        ? "Cliente y proveedor"
                        : user.role === "provider"
                          ? "Proveedor"
                          : user.role === "admin"
                            ? "Administrador"
                            : "Cliente"}
                    </span>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="text-sm font-semibold px-3 py-2 rounded-lg border transition-colors"
                  style={{ color: "#6b7280", borderColor: "#e5e7eb" }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor =
                      "#f9fafb"
                    ;(e.currentTarget as HTMLElement).style.color = "#374151"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent"
                    ;(e.currentTarget as HTMLElement).style.color = "#6b7280"
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors"
                style={{ color: "#2563eb", borderColor: "#bfdbfe" }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#eff6ff"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent"
                }}
              >
                Iniciar sesión
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
