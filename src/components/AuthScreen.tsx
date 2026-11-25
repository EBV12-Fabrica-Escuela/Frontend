import { useEffect, useState } from "react"
import type { Service } from "../App"

interface Props {
  service?: Service
  sessionNotice?: string
  onLogin: (user: AuthUser) => void
  onBack: () => void
}

type AuthMode = "login" | "register"

export type UserRole = "client" | "provider" | "admin"

export interface AuthUser {
  name: string
  email: string
  phone?: string
  role: UserRole
  roles?: UserRole[]
}

export function hasUserRole(user: AuthUser | null, role: UserRole) {
  return Boolean(user && (user.role === role || user.roles?.includes(role)))
}

interface PrototypeAccount extends AuthUser {
  password: string
  enabled: boolean
  originalEmail?: string
  deleted?: boolean
}

export const ACCOUNTS_STORAGE_KEY = "serviplus-prototype-accounts"
const LOGIN_ATTEMPTS_KEY = "serviplus-login-attempts"
const MAX_LOGIN_ATTEMPTS = 3
const LOCK_DURATION_MS = 5 * 60 * 1000

interface LoginAttempt {
  failedAttempts: number
  lockedUntil?: number
}

type LoginAttempts = Record<string, LoginAttempt>

const PROTOTYPE_ACCOUNTS: PrototypeAccount[] = [
  {
    name: "Juan Díaz",
    email: "cliente@serviplus.com",
    phone: "300 123 4567",
    password: "Cliente123",
    role: "client",
    enabled: true,
  },
  {
    name: "Ana Torres",
    email: "proveedor@serviplus.com",
    phone: "310 987 6543",
    password: "Proveedor123",
    role: "provider",
    enabled: true,
  },
  {
    name: "Camila Ruiz",
    email: "dual@serviplus.com",
    phone: "315 555 0184",
    password: "Dual1234",
    role: "client",
    roles: ["client", "provider"],
    enabled: true,
  },
  {
    name: "Laura Méndez",
    email: "admin@serviplus.com",
    phone: "320 555 0100",
    password: "Admin123",
    role: "admin",
    enabled: true,
  },
  {
    name: "Cuenta inactiva",
    email: "inactivo@serviplus.com",
    phone: "300 000 0000",
    password: "Inactivo123",
    role: "client",
    enabled: false,
  },
]

function getStoredAccounts(): PrototypeAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function findAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const storedAccounts = getStoredAccounts()
  const replacedPrototypeEmails = new Set(
    storedAccounts
      .map((account) => account.originalEmail?.toLowerCase())
      .filter(Boolean),
  )
  const availablePrototypeAccounts = PROTOTYPE_ACCOUNTS.filter(
    (account) => !replacedPrototypeEmails.has(account.email.toLowerCase()),
  )

  return [...storedAccounts, ...availablePrototypeAccounts].find(
    (account) =>
      !account.deleted && account.email.toLowerCase() === normalizedEmail,
  )
}

export interface ManagedAccount extends AuthUser {
  enabled: boolean
}

export function getManagedAccounts(): ManagedAccount[] {
  const storedAccounts = getStoredAccounts()
  const replacedPrototypeEmails = new Set(
    storedAccounts
      .map((account) => account.originalEmail?.toLowerCase())
      .filter(Boolean),
  )
  const availablePrototypeAccounts = PROTOTYPE_ACCOUNTS.filter(
    (account) => !replacedPrototypeEmails.has(account.email.toLowerCase()),
  )

  return [...storedAccounts, ...availablePrototypeAccounts]
    .filter((account) => !account.deleted)
    .map(({ name, email, phone, role, roles, enabled }) => ({
      name,
      email,
      phone,
      role,
      roles,
      enabled,
    }))
    .sort((first, second) => first.name.localeCompare(second.name, "es"))
}

export function getAccountUser(email: string): AuthUser | null {
  const account = findAccount(email)
  if (!account?.enabled) return null
  return {
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    roles: account.roles,
  }
}

export function updateManagedAccountRole(email: string, role: UserRole): {
  user?: AuthUser
  error?: string
} {
  if (!["client", "provider", "admin"].includes(role)) {
    return { error: "El rol seleccionado no existe." }
  }

  const account = findAccount(email)
  if (!account) return { error: "El usuario que intentas modificar no existe." }

  const activeAdministrators = getManagedAccounts().filter(
    (managedAccount) =>
      managedAccount.enabled && hasUserRole(managedAccount, "admin"),
  )
  if (
    hasUserRole(account, "admin") &&
    role !== "admin" &&
    activeAdministrators.length <= 1
  ) {
    return {
      error:
        "No puedes retirar este rol porque el sistema debe conservar al menos un administrador activo.",
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const updatedAccount: PrototypeAccount = {
    ...account,
    role,
    roles: undefined,
    originalEmail: account.originalEmail ?? normalizedEmail,
  }
  const nextStoredAccounts = getStoredAccounts().filter(
    (storedAccount) => storedAccount.email.toLowerCase() !== normalizedEmail,
  )
  localStorage.setItem(
    ACCOUNTS_STORAGE_KEY,
    JSON.stringify([...nextStoredAccounts, updatedAccount]),
  )

  return {
    user: {
      name: updatedAccount.name,
      email: updatedAccount.email,
      phone: updatedAccount.phone,
      role: updatedAccount.role,
    },
  }
}

export function deleteManagedAccount(email: string): string | null {
  const account = findAccount(email)
  if (!account) return "El usuario que intentas eliminar no existe."

  const activeAdministrators = getManagedAccounts().filter(
    (managedAccount) =>
      managedAccount.enabled && hasUserRole(managedAccount, "admin"),
  )
  if (
    account.enabled &&
    hasUserRole(account, "admin") &&
    activeAdministrators.length <= 1
  ) {
    return "No puedes eliminar este acceso porque el sistema debe conservar al menos un administrador activo."
  }

  const normalizedEmail = email.trim().toLowerCase()
  const isPrototypeAccount = PROTOTYPE_ACCOUNTS.some(
    (prototypeAccount) =>
      prototypeAccount.email.toLowerCase() ===
      (account.originalEmail ?? normalizedEmail).toLowerCase(),
  )
  const remainingAccounts = getStoredAccounts().filter(
    (storedAccount) => storedAccount.email.toLowerCase() !== normalizedEmail,
  )

  if (isPrototypeAccount) {
    remainingAccounts.push({
      ...account,
      enabled: false,
      deleted: true,
      originalEmail: account.originalEmail ?? normalizedEmail,
    })
  }

  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(remainingAccounts))
  return null
}

export interface AccountProfileInput {
  name: string
  email: string
  phone: string
}

export function updateAccountProfile(
  currentEmail: string,
  profile: AccountProfileInput,
): {
  user?: AuthUser
  error?: string
} {
  const account = findAccount(currentEmail)
  if (!account) return { error: "No fue posible encontrar la cuenta." }

  const normalizedCurrentEmail = currentEmail.trim().toLowerCase()
  const normalizedEmail = profile.email.trim().toLowerCase()
  const emailOwner = findAccount(normalizedEmail)
  if (emailOwner && emailOwner.email.toLowerCase() !== normalizedCurrentEmail) {
    return { error: "El correo electrónico ya está asociado a otra cuenta." }
  }

  const updatedAccount: PrototypeAccount = {
    ...account,
    name: profile.name.trim(),
    email: normalizedEmail,
    phone: profile.phone.trim(),
    originalEmail: account.originalEmail ?? normalizedCurrentEmail,
  }
  const nextStoredAccounts = getStoredAccounts().filter(
    (storedAccount) =>
      storedAccount.email.toLowerCase() !== normalizedCurrentEmail,
  )
  localStorage.setItem(
    ACCOUNTS_STORAGE_KEY,
    JSON.stringify([...nextStoredAccounts, updatedAccount]),
  )

  return {
    user: {
      name: updatedAccount.name,
      email: updatedAccount.email,
      phone: updatedAccount.phone,
      role: updatedAccount.role,
      roles: updatedAccount.roles,
    },
  }
}

function getLoginAttempts(): LoginAttempts {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function getLoginAttempt(email: string, now: number): LoginAttempt | undefined {
  const attempt = getLoginAttempts()[email.trim().toLowerCase()]
  if (attempt?.lockedUntil && attempt.lockedUntil <= now) return undefined
  return attempt
}

function saveLoginAttempt(email: string, attempt?: LoginAttempt) {
  const normalizedEmail = email.trim().toLowerCase()
  const attempts = getLoginAttempts()

  if (attempt) attempts[normalizedEmail] = attempt
  else delete attempts[normalizedEmail]

  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function AuthScreen({
  service,
  sessionNotice,
  onLogin,
  onBack,
}: Props) {
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [registrationRole, setRegistrationRole] = useState<UserRole | "">("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptDataPolicy, setAcceptDataPolicy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [loginComplete, setLoginComplete] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentTime, setCurrentTime] = useState(Date.now())

  const loginAttempt =
    mode === "login" ? getLoginAttempt(email, currentTime) : undefined
  const lockedUntil = loginAttempt?.lockedUntil
  const isTemporarilyLocked = Boolean(lockedUntil && lockedUntil > currentTime)
  const lockMessage = isTemporarilyLocked
    ? `Bloqueamos temporalmente el inicio de sesión por ${MAX_LOGIN_ATTEMPTS} intentos fallidos. Espera a que finalice el contador para intentarlo nuevamente.`
    : ""

  useEffect(() => {
    if (!isTemporarilyLocked) return

    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isTemporarilyLocked])

  const validate = () => {
    const errs: Record<string, string> = {}
    const normalizedEmail = email.trim()

    if (!normalizedEmail) errs.email = "El correo electrónico es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      errs.email = "Ingresa un correo electrónico válido"
    if (!password) errs.password = "La contraseña es obligatoria"
    if (mode === "register") {
      if (!name.trim()) errs.name = "El nombre completo es obligatorio"
      if (!phone.trim()) errs.phone = "El número de celular es obligatorio"
      if (!registrationRole)
        errs.role = "Selecciona el tipo de cuenta que deseas crear"
      if (
        password &&
        (password.length < 8 ||
          !/[a-z]/.test(password) ||
          !/[A-Z]/.test(password) ||
          !/\d/.test(password))
      ) {
        errs.password =
          "Usa mínimo 8 caracteres, una mayúscula, una minúscula y un número"
      }
      if (!confirmPassword) errs.confirmPassword = "Confirma tu contraseña"
      else if (password !== confirmPassword)
        errs.confirmPassword = "Las contraseñas no coinciden"
      if (!acceptTerms) errs.terms = "Debes aceptar los términos y condiciones"
      if (!acceptDataPolicy)
        errs.dataPolicy = "Debes aceptar la política de tratamiento de datos"
    }
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    if (mode === "login") {
      const activeAttempt = getLoginAttempt(email, Date.now())
      if (activeAttempt?.lockedUntil) {
        setCurrentTime(Date.now())
        setErrors({ auth: "Cuenta bloqueada temporalmente." })
        return
      }
    }
    setErrors({})
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      const account = findAccount(email)

      if (mode === "register" && account) {
        setErrors({
          email:
            "Este correo ya está registrado. Ingresa otro correo o inicia sesión.",
        })
        return
      }
      if (mode === "register") {
        const newAccount: PrototypeAccount = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: registrationRole as UserRole,
          enabled: true,
        }
        localStorage.setItem(
          ACCOUNTS_STORAGE_KEY,
          JSON.stringify([...getStoredAccounts(), newAccount]),
        )
        setRegistrationComplete(true)
        return
      }
      if (!account || !account.enabled || account.password !== password) {
        const previousAttempt = getLoginAttempt(email, Date.now())
        const failedAttempts = (previousAttempt?.failedAttempts ?? 0) + 1

        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
          saveLoginAttempt(email, {
            failedAttempts,
            lockedUntil: Date.now() + LOCK_DURATION_MS,
          })
          setCurrentTime(Date.now())
          setErrors({ auth: "Cuenta bloqueada temporalmente." })
          return
        }

        saveLoginAttempt(email, { failedAttempts })
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - failedAttempts
        setErrors({
          auth: `Correo o contraseña incorrectos. Te ${
            remainingAttempts === 1
              ? "queda 1 intento"
              : `quedan ${remainingAttempts} intentos`
          } antes del bloqueo temporal.`,
        })
        return
      }
      saveLoginAttempt(email)
      setLoginComplete(true)
      setTimeout(() => onLogin(account), 700)
    }, 1200)
  }

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setErrors({})
    setRegistrationComplete(false)
    setLoginComplete(false)
    setPassword("")
    setConfirmPassword("")
  }

  const registeredUser: AuthUser = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    role: registrationRole as UserRole,
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Context */}
        <div
          className="lg:w-80 shrink-0 bg-white rounded-2xl border p-6 w-full"
          style={{
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-5"
            style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.4" />
              <path
                d="M7 4v3.5l2.5 1.5"
                stroke="#2563eb"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {service ? "Reserva en progreso" : "Acceso seguro"}
          </div>

          <h2
            className="font-bold text-gray-900 text-lg mb-1"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {service
              ? "Para continuar con tu reserva necesitas iniciar sesión"
              : "Inicia sesión en tu cuenta ServiPlus"}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {service
              ? "Tu selección quedará guardada mientras te autentificas."
              : "Accede a tus servicios y gestiona tu actividad."}
          </p>

          {/* Service mini card */}
          {service && (
            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: "#e5e7eb" }}
              aria-label="Servicio seleccionado"
            >
              <div
                className="h-28 overflow-hidden"
                style={{ backgroundColor: "#dbeafe" }}
              >
                <img
                  src={service.image}
                  alt={`Imagen de ${service.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p
                  className="font-bold text-sm text-gray-900"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {service.name}
                </p>
                <p className="text-xs text-gray-500">{service.provider}</p>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: "#2563eb" }}
                >
                  {service.price}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="mt-5 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
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
            {service ? "Volver al calendario" : "Volver al catálogo"}
          </button>
        </div>

        {/* Right: Auth form */}
        <div
          className="flex-1 bg-white rounded-2xl border p-8 w-full"
          style={{
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-7"
            style={{ backgroundColor: "#f3f4f6" }}
            role="tablist"
            aria-label="Modo de autenticación"
          >
            <button
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => changeMode("login")}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: mode === "login" ? "white" : "transparent",
                color: mode === "login" ? "#111827" : "#6b7280",
                boxShadow:
                  mode === "login" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Iniciar sesión
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => changeMode("register")}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: mode === "register" ? "white" : "transparent",
                color: mode === "register" ? "#111827" : "#6b7280",
                boxShadow:
                  mode === "register" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Registrarme
            </button>
          </div>

          {sessionNotice && (
            <div
              className="mb-6 p-4 rounded-xl text-sm text-amber-900 flex items-start gap-3"
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fcd34d",
              }}
              role="alert"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path
                  d="M10 2.5a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-1v-2a4 4 0 0 0-4-4Z"
                  stroke="#b45309"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8.5v-2a2 2 0 1 1 4 0v2M10 11.5v2"
                  stroke="#b45309"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <p className="font-bold mb-0.5">Sesión finalizada</p>
                <p>{sessionNotice}</p>
              </div>
            </div>
          )}

          {registrationComplete ? (
            <div
              className="text-center py-3 fade-in"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "4px solid #bbf7d0",
                }}
                aria-hidden="true"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M8 20l8 8L32 12"
                    stroke="#16a34a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1
                className="text-2xl font-extrabold text-gray-900 mb-2"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                ¡Tu cuenta fue creada!
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Registramos tu cuenta con el correo{" "}
                <strong className="text-gray-700">{email.trim()}</strong>.
              </p>
              <div
                className="rounded-xl p-4 text-left mb-6"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Ya puedes continuar
                </p>
                <p className="text-sm text-green-700">
                  {registrationRole === "admin"
                    ? "Tu cuenta de administrador está lista. Puedes gestionar usuarios, roles y permisos desde el panel administrativo."
                    : registrationRole === "provider"
                      ? "Tu cuenta de proveedor está lista. Puedes reservar servicios como cliente y administrar tus propios servicios desde el panel."
                      : "Continúa con tu reserva usando la cuenta que acabas de crear. También podrás iniciar sesión más adelante con tu correo y contraseña."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onLogin(registeredUser)}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ backgroundColor: "#2563eb" }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#1d4ed8"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    "#2563eb"
                }}
              >
                {service
                  ? "Continuar con mi reserva →"
                  : registrationRole === "admin"
                    ? "Ir al panel administrativo →"
                    : registrationRole === "provider"
                      ? "Ir al panel de proveedor →"
                      : "Ir al catálogo →"}
              </button>
              <button
                type="button"
                onClick={() => changeMode("login")}
                className="mt-4 text-sm font-semibold transition-colors"
                style={{ color: "#2563eb" }}
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <h1
                className="text-2xl font-extrabold text-gray-900 mb-1"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {mode === "login"
                  ? service
                    ? "Ingresa tus credenciales para continuar con la reserva"
                    : "Ingresa tus credenciales para acceder a tu cuenta"
                  : "Regístrate para completar tu primera reserva"}
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {mode === "login" && (errors.auth || isTemporarilyLocked) && (
                  <div
                    className="p-3 rounded-xl text-sm text-red-700 flex items-start gap-2"
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                    role="alert"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      className="shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      <circle
                        cx="9"
                        cy="9"
                        r="7"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M9 5.5v4M9 12.5h.01"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>
                      {isTemporarilyLocked ? lockMessage : errors.auth}
                    </span>
                  </div>
                )}

                {mode === "login" && loginComplete && (
                  <div
                    className="p-3 rounded-xl text-sm text-green-700 flex items-center gap-2"
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 9l3 3 7-7"
                        stroke="#16a34a"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Inicio de sesión exitoso. Redirigiendo...</span>
                  </div>
                )}

                {/* Name (register only) */}
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                    >
                      Nombre completo{" "}
                      <span aria-hidden="true" style={{ color: "#ef4444" }}>
                        *
                      </span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Pérez"
                      autoComplete="name"
                      className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                      style={{
                        borderColor: errors.name ? "#ef4444" : "#d1d5db",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        ;(e.target as HTMLElement).style.borderColor = "#2563eb"
                        ;(e.target as HTMLElement).style.boxShadow =
                          "0 0 0 3px rgba(37,99,235,0.12)"
                      }}
                      onBlur={(e) => {
                        ;(e.target as HTMLElement).style.borderColor =
                          errors.name ? "#ef4444" : "#d1d5db"
                        ;(e.target as HTMLElement).style.boxShadow = "none"
                      }}
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p
                        id="name-error"
                        className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠</span> {errors.name}
                      </p>
                    )}
                  </div>
                )}

                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="registration-role"
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                    >
                      Tipo de cuenta{" "}
                      <span aria-hidden="true" style={{ color: "#ef4444" }}>
                        *
                      </span>
                    </label>
                    <select
                      id="registration-role"
                      value={registrationRole}
                      onChange={(e) => {
                        setRegistrationRole(e.target.value as UserRole | "")
                        if (errors.role)
                          setErrors((current) => ({ ...current, role: "" }))
                      }}
                      className="w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all"
                      style={{
                        borderColor: errors.role ? "#ef4444" : "#d1d5db",
                        outline: "none",
                      }}
                      aria-required="true"
                      aria-invalid={!!errors.role}
                      aria-describedby={
                        errors.role
                          ? "registration-role-error"
                          : "registration-role-help"
                      }
                    >
                      <option value="">Selecciona el tipo de cuenta</option>
                      <option value="client">Cliente</option>
                      <option value="provider">Proveedor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    {errors.role ? (
                      <p
                        id="registration-role-error"
                        className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠</span> {errors.role}
                      </p>
                    ) : (
                      <p
                        id="registration-role-help"
                        className="mt-1.5 text-xs text-gray-500"
                      >
                        El tipo de cuenta define los permisos iniciales dentro
                        de la plataforma.
                      </p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-1.5"
                  >
                    Correo electrónico{" "}
                    <span aria-hidden="true" style={{ color: "#ef4444" }}>
                      *
                    </span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email || errors.auth)
                        setErrors((current) => ({
                          ...current,
                          email: "",
                          auth: "",
                        }))
                    }}
                    placeholder="tu@correo.com"
                    autoComplete={mode === "login" ? "email" : "email"}
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{
                      borderColor: errors.email ? "#ef4444" : "#d1d5db",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      ;(e.target as HTMLElement).style.borderColor = "#2563eb"
                      ;(e.target as HTMLElement).style.boxShadow =
                        "0 0 0 3px rgba(37,99,235,0.12)"
                    }}
                    onBlur={(e) => {
                      ;(e.target as HTMLElement).style.borderColor =
                        errors.email ? "#ef4444" : "#d1d5db"
                      ;(e.target as HTMLElement).style.boxShadow = "none"
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                      role="alert"
                    >
                      <span aria-hidden="true">⚠</span> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone (register only) */}
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-gray-700 mb-1.5"
                    >
                      Número de celular{" "}
                      <span aria-hidden="true" style={{ color: "#ef4444" }}>
                        *
                      </span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="300 123 4567"
                      autoComplete="tel"
                      className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                      style={{
                        borderColor: errors.phone ? "#ef4444" : "#d1d5db",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        ;(e.target as HTMLElement).style.borderColor = "#2563eb"
                        ;(e.target as HTMLElement).style.boxShadow =
                          "0 0 0 3px rgba(37,99,235,0.12)"
                      }}
                      onBlur={(e) => {
                        ;(e.target as HTMLElement).style.borderColor =
                          errors.phone ? "#ef4444" : "#d1d5db"
                        ;(e.target as HTMLElement).style.boxShadow = "none"
                      }}
                      aria-required="true"
                      aria-invalid={!!errors.phone}
                      aria-describedby={
                        errors.phone ? "phone-error" : undefined
                      }
                    />
                    {errors.phone && (
                      <p
                        id="phone-error"
                        className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                        role="alert"
                      >
                        <span aria-hidden="true">⚠</span> {errors.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Contraseña{" "}
                      <span aria-hidden="true" style={{ color: "#ef4444" }}>
                        *
                      </span>
                    </label>
                    {mode === "login" && (
                      <a
                        href="#"
                        className="text-xs font-medium transition-colors"
                        style={{ color: "#2563eb" }}
                      >
                        ¿Olvidaste tu contraseña?
                      </a>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    disabled={isTemporarilyLocked}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password || errors.auth)
                        setErrors((current) => ({
                          ...current,
                          password: "",
                          auth: "",
                        }))
                    }}
                    placeholder={
                      mode === "register" ? "Mínimo 8 caracteres" : "••••••••"
                    }
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{
                      borderColor: errors.password ? "#ef4444" : "#d1d5db",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      ;(e.target as HTMLElement).style.borderColor = "#2563eb"
                      ;(e.target as HTMLElement).style.boxShadow =
                        "0 0 0 3px rgba(37,99,235,0.12)"
                    }}
                    onBlur={(e) => {
                      ;(e.target as HTMLElement).style.borderColor =
                        errors.password ? "#ef4444" : "#d1d5db"
                      ;(e.target as HTMLElement).style.boxShadow = "none"
                    }}
                    aria-required="true"
                    aria-disabled={isTemporarilyLocked}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  {errors.password && (
                    <p
                      id="password-error"
                      className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                      role="alert"
                    >
                      <span aria-hidden="true">⚠</span> {errors.password}
                    </p>
                  )}
                  {mode === "register" && !errors.password && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Mínimo 8 caracteres, con mayúscula, minúscula y número.
                    </p>
                  )}
                </div>

                {mode === "register" && (
                  <>
                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm font-semibold text-gray-700 mb-1.5"
                      >
                        Confirmar contraseña{" "}
                        <span aria-hidden="true" style={{ color: "#ef4444" }}>
                          *
                        </span>
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (errors.confirmPassword)
                            setErrors((current) => ({
                              ...current,
                              confirmPassword: "",
                            }))
                        }}
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                        style={{
                          borderColor: errors.confirmPassword
                            ? "#ef4444"
                            : "#d1d5db",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          ;(e.target as HTMLElement).style.borderColor =
                            "#2563eb"
                          ;(e.target as HTMLElement).style.boxShadow =
                            "0 0 0 3px rgba(37,99,235,0.12)"
                        }}
                        onBlur={(e) => {
                          ;(e.target as HTMLElement).style.borderColor =
                            errors.confirmPassword ? "#ef4444" : "#d1d5db"
                          ;(e.target as HTMLElement).style.boxShadow = "none"
                        }}
                        aria-required="true"
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={
                          errors.confirmPassword
                            ? "confirm-password-error"
                            : undefined
                        }
                      />
                      {errors.confirmPassword && (
                        <p
                          id="confirm-password-error"
                          className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                          role="alert"
                        >
                          <span aria-hidden="true">⚠</span>{" "}
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => {
                              setAcceptTerms(e.target.checked)
                              if (errors.terms)
                                setErrors((current) => ({
                                  ...current,
                                  terms: "",
                                }))
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-blue-600"
                            aria-invalid={!!errors.terms}
                            aria-describedby={
                              errors.terms ? "terms-error" : undefined
                            }
                          />
                          <span>
                            Acepto los{" "}
                            <a
                              href="#terminos"
                              className="font-semibold"
                              style={{ color: "#2563eb" }}
                            >
                              términos y condiciones
                            </a>
                            .
                          </span>
                        </label>
                        {errors.terms && (
                          <p
                            id="terms-error"
                            className="mt-1.5 ml-7 text-xs text-red-600 flex items-center gap-1"
                            role="alert"
                          >
                            <span aria-hidden="true">⚠</span> {errors.terms}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={acceptDataPolicy}
                            onChange={(e) => {
                              setAcceptDataPolicy(e.target.checked)
                              if (errors.dataPolicy)
                                setErrors((current) => ({
                                  ...current,
                                  dataPolicy: "",
                                }))
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-blue-600"
                            aria-invalid={!!errors.dataPolicy}
                            aria-describedby={
                              errors.dataPolicy
                                ? "data-policy-error"
                                : undefined
                            }
                          />
                          <span>
                            Autorizo el tratamiento de mis datos según la{" "}
                            <a
                              href="#politica-datos"
                              className="font-semibold"
                              style={{ color: "#2563eb" }}
                            >
                              política de tratamiento de datos
                            </a>
                            .
                          </span>
                        </label>
                        {errors.dataPolicy && (
                          <p
                            id="data-policy-error"
                            className="mt-1.5 ml-7 text-xs text-red-600 flex items-center gap-1"
                            role="alert"
                          >
                            <span aria-hidden="true">⚠</span>{" "}
                            {errors.dataPolicy}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading || loginComplete || isTemporarilyLocked}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor:
                      isLoading || loginComplete || isTemporarilyLocked
                        ? "#93c5fd"
                        : "#2563eb",
                    cursor: isLoading
                      ? "wait"
                      : loginComplete || isTemporarilyLocked
                        ? "default"
                        : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !loginComplete && !isTemporarilyLocked)
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "#1d4ed8"
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && !loginComplete && !isTemporarilyLocked)
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "#2563eb"
                  }}
                  aria-busy={isLoading}
                >
                  {isTemporarilyLocked && lockedUntil ? (
                    `Intenta de nuevo en ${formatRemainingTime(lockedUntil - currentTime)}`
                  ) : isLoading ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"
                        aria-hidden="true"
                      />
                      <span>
                        {mode === "register"
                          ? "Creando cuenta..."
                          : "Verificando..."}
                      </span>
                    </>
                  ) : mode === "login" ? (
                    "Iniciar sesión y continuar →"
                  ) : (
                    "Crear cuenta y continuar →"
                  )}
                </button>
              </form>

              {/* Demo note */}
              <div
                className="mt-5 p-3 rounded-xl text-xs text-gray-500 flex items-start gap-2"
                style={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #f3f4f6",
                }}
              >
                <span aria-hidden="true">💡</span>
                <span>
                  <strong className="text-gray-700">Modo prototipo:</strong>{" "}
                  {mode === "register"
                    ? "Usa cliente@serviplus.com para probar el estado de correo ya registrado."
                    : "Cliente: cliente@serviplus.com / Cliente123. Proveedor: proveedor@serviplus.com / Proveedor123. Administrador: admin@serviplus.com / Admin123. Ambos roles: dual@serviplus.com / Dual1234."}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
