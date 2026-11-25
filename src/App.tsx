import { useEffect, useState } from "react"
import Header from "./components/Header"
import CatalogScreen from "./components/CatalogScreen"
import AvailabilityScreen from "./components/AvailabilityScreen"
import AuthScreen, {
  ACCOUNTS_STORAGE_KEY,
  deleteManagedAccount,
  getAccountUser,
  getManagedAccounts,
  hasUserRole,
  type ManagedAccount,
  type AuthUser,
  type UserRole,
  updateAccountProfile,
  updateManagedAccountRole,
} from "./components/AuthScreen"
import SummaryScreen from "./components/SummaryScreen"
import ConfirmedScreen from "./components/ConfirmedScreen"
import SlotTakenScreen from "./components/SlotTakenScreen"
import ProviderScreen from "./components/ProviderScreen"
import CreateServiceScreen, {
  NewServiceInput,
} from "./components/CreateServiceScreen"
import ServiceDetailScreen from "./components/ServiceDetailScreen"
import ScheduleConfigScreen from "./components/ScheduleConfigScreen"
import ProfileScreen from "./components/ProfileScreen"
import AdminScreen from "./components/AdminScreen"
import ReservationsScreen from "./components/ReservationsScreen"
import {
  Booking,
  BookingStatus,
  canCancelBooking,
  createDefaultSchedule,
  formatDateKey,
  getBookingStatus,
  getSlotAvailabilities,
  isSlotOccupied,
  ProviderSchedule,
} from "./schedule"

export type Screen = "catalog" | "availability" | "auth" | "profile" | "admin" | "reservations" | "summary" | "confirmed" | "slot-taken" | "provider" | "provider-create" | "provider-edit" | "provider-detail" | "provider-schedule"

const SESSION_KEY = "serviplus-session"
const SESSION_ID_KEY = "serviplus-session-id"
const ACTIVE_SESSIONS_KEY = "serviplus-active-sessions"
const CREATED_SERVICES_KEY = "serviplus-created-services"
const PROVIDER_SCHEDULES_KEY = "serviplus-provider-schedules"
const BOOKINGS_KEY = "serviplus-bookings"
const DEFAULT_TIME_SLOTS = ["08:00 AM", "10:00 AM", "02:00 PM", "04:00 PM"]
const ACCESS_DENIED_MESSAGE =
  "Acceso denegado: no cuentas con los permisos necesarios para ingresar a esta sección"

type ScreenPermission = UserRole | "authenticated"

const SCREEN_PERMISSIONS: Partial<Record<Screen, ScreenPermission>> = {
  profile: "authenticated",
  admin: "admin",
  reservations: "client",
  summary: "client",
  confirmed: "client",
  "slot-taken": "client",
  provider: "provider",
  "provider-create": "provider",
  "provider-edit": "provider",
  "provider-detail": "provider",
  "provider-schedule": "provider",
}

function getHomeScreen(user: AuthUser | null): Screen {
  if (hasUserRole(user, "admin")) return "admin"
  if (hasUserRole(user, "provider") && !hasUserRole(user, "client")) {
    return "provider"
  }
  return "catalog"
}

function getProviderScreenFromHash(hash: string): Screen {
  if (hash.startsWith("#/provider/create")) return "provider-create"
  if (hash.startsWith("#/provider/schedule")) return "provider-schedule"
  return "provider"
}

function getStoredSession(): AuthUser | null {
  try {
    const storedSession = sessionStorage.getItem(SESSION_KEY)
    return storedSession ? JSON.parse(storedSession) : null
  } catch {
    return null
  }
}

function getActiveSessions(): Record<string, string> {
  try {
    const storedSessions = localStorage.getItem(ACTIVE_SESSIONS_KEY)
    return storedSessions ? JSON.parse(storedSessions) : {}
  } catch {
    return {}
  }
}

function saveActiveSession(email: string, sessionId?: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const activeSessions = getActiveSessions()

  if (sessionId) activeSessions[normalizedEmail] = sessionId
  else delete activeSessions[normalizedEmail]

  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions))
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function hasCurrentActiveSession(user: AuthUser) {
  const sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  return (
    Boolean(sessionId) &&
    getActiveSessions()[user.email.trim().toLowerCase()] === sessionId
  )
}

function getStoredServices(): Service[] {
  try {
    const storedServices = localStorage.getItem(CREATED_SERVICES_KEY)
    return storedServices ? JSON.parse(storedServices) : []
  } catch {
    return []
  }
}

function getStoredSchedules(): Record<string, ProviderSchedule> {
  try {
    const storedSchedules = localStorage.getItem(PROVIDER_SCHEDULES_KEY)
    return storedSchedules ? JSON.parse(storedSchedules) : {}
  } catch {
    return {}
  }
}

function getStoredBookings(): Booking[] {
  try {
    const storedBookings = localStorage.getItem(BOOKINGS_KEY)
    return storedBookings ? JSON.parse(storedBookings) : []
  } catch {
    return []
  }
}

export interface Service {
  id: string
  name: string
  category: string
  provider: string
  price: string
  priceNum: number
  duration: string
  durationHours: number
  image: string
  description: string
  status?: "active" | "inactive"
}

export const SERVICES: Service[] = [
  {
    id: "1",
    name: "Limpieza residencial",
    category: "Limpieza",
    provider: "Hogar Express",
    price: "$80.000 COP",
    priceNum: 80000,
    duration: "2 horas",
    durationHours: 2,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format",
    description:
      "Limpieza completa del hogar con productos ecológicos. Cubre todos los ambientes de tu vivienda con atención al detalle.",
  },
  {
    id: "2",
    name: "Reparación de computador",
    category: "Tecnología",
    provider: "TechFix",
    price: "$120.000 COP",
    priceNum: 120000,
    duration: "2 horas",
    durationHours: 2,
    image:
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=220&fit=crop&auto=format",
    description:
      "Diagnóstico y reparación de equipos de cómputo. Software, hardware y mantenimiento preventivo con garantía.",
  },
  {
    id: "3",
    name: "Mantenimiento de aire acondicionado",
    category: "Mantenimiento",
    provider: "ClimaPro",
    price: "$150.000 COP",
    priceNum: 150000,
    duration: "3 horas",
    durationHours: 3,
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=220&fit=crop&auto=format",
    description:
      "Limpieza profunda, carga de gas y revisión técnica de tu sistema de aire acondicionado.",
  },
  {
    id: "4",
    name: "Diseño de logo",
    category: "Diseño",
    provider: "Creativa Studio",
    price: "$200.000 COP",
    priceNum: 200000,
    duration: "4 horas",
    durationHours: 4,
    image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=220&fit=crop&auto=format",
    description:
      "Diseño profesional de identidad visual. Incluye 3 propuestas, rondas de revisión y archivos en todos los formatos.",
  },
  {
    id: "5",
    name: "Instalación eléctrica",
    category: "Mantenimiento",
    provider: "ElectroServ",
    price: "$95.000 COP",
    priceNum: 95000,
    duration: "2 horas",
    durationHours: 2,
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=220&fit=crop&auto=format",
    description:
      "Instalación y reparación de puntos eléctricos, tomacorrientes e interruptores con certificado de seguridad.",
  },
  {
    id: "6",
    name: "Fotografía de eventos",
    category: "Diseño",
    provider: "FotoMoments",
    price: "$180.000 COP",
    priceNum: 180000,
    duration: "4 horas",
    durationHours: 4,
    image:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=220&fit=crop&auto=format",
    description:
      "Cobertura fotográfica profesional para eventos sociales y corporativos. Entrega digital en alta resolución.",
  },
]

export default function App() {
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(
    getStoredSession,
  )
  const [screen, setScreen] = useState<Screen>(() => getHomeScreen(sessionUser))
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [observations, setObservations] = useState("")
  const [createdServices, setCreatedServices] =
    useState<Service[]>(getStoredServices)
  const [managedService, setManagedService] = useState<Service | null>(null)
  const [showCreatedConfirmation, setShowCreatedConfirmation] = useState(false)
  const [showUpdatedConfirmation, setShowUpdatedConfirmation] = useState(false)
  const [providerSuccessMessage, setProviderSuccessMessage] = useState("")
  const [providerSchedules, setProviderSchedules] =
    useState<Record<string, ProviderSchedule>>(getStoredSchedules)
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [accessNotice, setAccessNotice] = useState<string | null>(null)
  const [managedAccounts, setManagedAccounts] =
    useState<ManagedAccount[]>(getManagedAccounts)
  const isLoggedIn = sessionUser !== null
  const hasProviderAccess = hasUserRole(sessionUser, "provider")
  const catalogServices = [
    ...SERVICES,
    ...createdServices.filter((service) => service.status !== "inactive"),
  ]
  const providerServices =
    hasProviderAccess && sessionUser
      ? createdServices.filter(
          (service) => service.provider === sessionUser.name,
        )
      : []

  const denyAccess = () => {
    setAccessNotice(ACCESS_DENIED_MESSAGE)
    setScreen(getHomeScreen(sessionUser))
    window.history.replaceState(
      null,
      "",
      getHomeScreen(sessionUser) === "provider" ? "#/provider" : "#/catalog",
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const canAccessScreen = (requestedScreen: Screen) => {
    const requiredRole = SCREEN_PERMISSIONS[requestedScreen]
    if (!requiredRole) return true
    if (requiredRole === "authenticated") return Boolean(sessionUser)
    return hasUserRole(sessionUser, requiredRole)
  }

  const openAuthorizedScreen = (requestedScreen: Screen) => {
    if (!canAccessScreen(requestedScreen)) {
      denyAccess()
      return false
    }
    setAccessNotice(null)
    setScreen(requestedScreen)
    window.scrollTo({ top: 0, behavior: "smooth" })
    return true
  }

  useEffect(() => {
    const closeReplacedSession = () => {
      if (!sessionUser || hasCurrentActiveSession(sessionUser)) return

      setSessionUser(null)
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_ID_KEY)
      setManagedService(null)
      setShowCreatedConfirmation(false)
      setShowUpdatedConfirmation(false)
      setSessionNotice(
        "Tu sesión se cerró porque se inició sesión en otro dispositivo",
      )
      setScreen("auth")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const syncStorage = (event: StorageEvent) => {
      if (event.key === PROVIDER_SCHEDULES_KEY) {
        setProviderSchedules(getStoredSchedules())
      }
      if (event.key === BOOKINGS_KEY) {
        setBookings(getStoredBookings())
      }
      if (event.key === ACTIVE_SESSIONS_KEY) {
        closeReplacedSession()
      }
      if (event.key === ACCOUNTS_STORAGE_KEY) {
        setManagedAccounts(getManagedAccounts())
        if (!sessionUser) return

        const refreshedUser = getAccountUser(sessionUser.email)
        if (!refreshedUser) {
          setSessionUser(null)
          sessionStorage.removeItem(SESSION_KEY)
          sessionStorage.removeItem(SESSION_ID_KEY)
          setSessionNotice(
            "Tu acceso a la plataforma fue eliminado por un administrador",
          )
          setScreen("auth")
          return
        }

        setSessionUser(refreshedUser)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(refreshedUser))
      }
    }

    const verifyVisibleSession = () => {
      if (document.visibilityState === "visible") closeReplacedSession()
    }

    closeReplacedSession()
    window.addEventListener("storage", syncStorage)
    window.addEventListener("focus", closeReplacedSession)
    document.addEventListener("visibilitychange", verifyVisibleSession)
    return () => {
      window.removeEventListener("storage", syncStorage)
      window.removeEventListener("focus", closeReplacedSession)
      document.removeEventListener("visibilitychange", verifyVisibleSession)
    }
  }, [sessionUser])

  useEffect(() => {
    const enforceScreenPermission = () => {
      const hash = window.location.hash.toLowerCase()

      if (hash.startsWith("#/admin")) {
        if (!hasUserRole(sessionUser, "admin")) {
          denyAccess()
          return
        }
        setAccessNotice(null)
        setScreen("admin")
        return
      }

      if (hash.startsWith("#/provider")) {
        const requestedScreen = getProviderScreenFromHash(hash)
        if (!canAccessScreen(requestedScreen)) {
          denyAccess()
          return
        }
        setAccessNotice(null)
        setScreen(requestedScreen)
        return
      }

      if (hash.startsWith("#/profile")) {
        if (!canAccessScreen("profile")) {
          denyAccess()
          return
        }
        setAccessNotice(null)
        setScreen("profile")
      }
    }

    enforceScreenPermission()
    window.addEventListener("hashchange", enforceScreenPermission)
    return () =>
      window.removeEventListener("hashchange", enforceScreenPermission)
  }, [sessionUser])

  useEffect(() => {
    const requiredRole = SCREEN_PERMISSIONS[screen]
    if (
      requiredRole &&
      ((requiredRole === "authenticated" && !sessionUser) ||
        (requiredRole !== "authenticated" &&
          !hasUserRole(sessionUser, requiredRole)))
    ) {
      denyAccess()
    }
  }, [screen, sessionUser])

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedTime(null)
    setScreen("availability")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleContinueFromAvailability = () => {
    if (!isLoggedIn) {
      setScreen("auth")
    } else if (!hasUserRole(sessionUser, "client")) {
      denyAccess()
    } else {
      openAuthorizedScreen("summary")
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleLogin = (user: AuthUser) => {
    const sessionId = createSessionId()

    setSessionUser(user)
    setSessionNotice(null)
    setAccessNotice(null)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    localStorage.removeItem(SESSION_KEY)
    saveActiveSession(user.email, sessionId)
    if (
      selectedService &&
      selectedDate &&
      selectedTime &&
      hasUserRole(user, "client")
    ) {
      setScreen("summary")
    } else if (hasUserRole(user, "admin")) {
      setScreen("admin")
    } else if (hasUserRole(user, "provider")) {
      setScreen("provider")
    } else {
      setScreen("catalog")
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleLogout = () => {
    if (sessionUser && hasCurrentActiveSession(sessionUser)) {
      saveActiveSession(sessionUser.email)
    }
    setSessionUser(null)
    setSessionNotice(null)
    setAccessNotice(null)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
    setManagedService(null)
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(false)
    setProviderSuccessMessage("")
    setScreen("auth")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOpenLogin = () => {
    setScreen("auth")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOpenProfile = () => {
    openAuthorizedScreen("profile")
  }

  const handleOpenReservations = () => {
    openAuthorizedScreen("reservations")
  }

  const handleOpenAdmin = () => {
    setManagedAccounts(getManagedAccounts())
    openAuthorizedScreen("admin")
  }

  const handleChangeManagedRole = (email: string, role: UserRole) => {
    if (!hasUserRole(sessionUser, "admin")) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }

    const result = updateManagedAccountRole(email, role)
    if (!result.user) {
      return result.error ?? "No fue posible actualizar el rol."
    }

    setManagedAccounts(getManagedAccounts())
    if (sessionUser?.email.toLowerCase() === email.toLowerCase()) {
      setSessionUser(result.user)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user))
    }
    return null
  }

  const handleDeleteManagedAccount = (email: string) => {
    if (!hasUserRole(sessionUser, "admin")) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }

    const error = deleteManagedAccount(email)
    if (error) return error

    setManagedAccounts(getManagedAccounts())
    if (sessionUser?.email.toLowerCase() === email.toLowerCase()) {
      if (hasCurrentActiveSession(sessionUser)) {
        saveActiveSession(sessionUser.email)
      }
      setSessionUser(null)
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_ID_KEY)
      setSessionNotice(
        "Tu acceso a la plataforma fue eliminado por un administrador",
      )
      setScreen("auth")
    }
    return null
  }

  const handleSaveProfile = ({
    name,
    email,
    phone,
  }: {
    name: string
    email: string
    phone: string
  }) => {
    if (!sessionUser) {
      denyAccess()
      return "Debes iniciar sesión para actualizar tu perfil."
    }

    const previousUser = sessionUser
    const result = updateAccountProfile(previousUser.email, {
      name,
      email,
      phone,
    })
    if (!result.user) {
      return result.error ?? "No fue posible actualizar el perfil."
    }

    const updatedUser = result.user
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY)
    if (sessionId && hasCurrentActiveSession(previousUser)) {
      saveActiveSession(previousUser.email)
      saveActiveSession(updatedUser.email, sessionId)
    }

    if (
      hasUserRole(previousUser, "provider") &&
      previousUser.name !== updatedUser.name
    ) {
      const nextServices = createdServices.map((service) =>
        service.provider === previousUser.name
          ? { ...service, provider: updatedUser.name }
          : service,
      )
      const currentSchedule = providerSchedules[previousUser.name]
      const nextSchedules = { ...providerSchedules }
      if (currentSchedule) {
        delete nextSchedules[previousUser.name]
        nextSchedules[updatedUser.name] = {
          ...currentSchedule,
          provider: updatedUser.name,
        }
      }
      const nextBookings = bookings.map((booking) =>
        booking.provider === previousUser.name
          ? { ...booking, provider: updatedUser.name }
          : booking,
      )

      setCreatedServices(nextServices)
      setProviderSchedules(nextSchedules)
      setBookings(nextBookings)
      localStorage.setItem(CREATED_SERVICES_KEY, JSON.stringify(nextServices))
      localStorage.setItem(
        PROVIDER_SCHEDULES_KEY,
        JSON.stringify(nextSchedules),
      )
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
    }

    setSessionUser(updatedUser)
    setManagedAccounts(getManagedAccounts())
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser))
    return null
  }

  const handleLogoClick = () => {
    if (hasProviderAccess && !hasUserRole(sessionUser, "client")) {
      openAuthorizedScreen("provider")
      return
    }
    handleBackToCatalog()
  }

  const handleOpenCreateService = () => {
    setProviderSuccessMessage("")
    openAuthorizedScreen("provider-create")
  }

  const handleCreateService = (input: NewServiceInput) => {
    if (!hasProviderAccess || !sessionUser) {
      denyAccess()
      return
    }

    const categoryImage =
      SERVICES.find((service) => service.category === input.category)?.image ??
      SERVICES[0].image
    const service: Service = {
      id: `provider-${Date.now()}`,
      name: input.name,
      description: input.description,
      category: input.category,
      provider: sessionUser.name,
      price: `$${input.price.toLocaleString("es-CO")} COP`,
      priceNum: input.price,
      duration:
        input.durationHours === 1
          ? "1 hora"
          : `${input.durationHours.toLocaleString("es-CO")} horas`,
      durationHours: input.durationHours,
      image: categoryImage,
      status: input.status,
    }
    const nextServices = [...createdServices, service]

    setCreatedServices(nextServices)
    localStorage.setItem(CREATED_SERVICES_KEY, JSON.stringify(nextServices))
    setManagedService(service)
    setShowCreatedConfirmation(true)
    setShowUpdatedConfirmation(false)
    setProviderSuccessMessage("")
    setScreen("provider-detail")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleViewManagedService = (service: Service) => {
    if (
      !hasProviderAccess ||
      !sessionUser ||
      service.provider !== sessionUser.name
    ) {
      denyAccess()
      return
    }
    setManagedService(service)
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(false)
    setProviderSuccessMessage("")
    setScreen("provider-detail")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOpenEditService = () => {
    if (
      !hasProviderAccess ||
      !sessionUser ||
      !managedService ||
      managedService.provider !== sessionUser.name ||
      !createdServices.some((service) => service.id === managedService.id)
    ) {
      denyAccess()
      return
    }
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(false)
    setScreen("provider-edit")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleUpdateService = (input: NewServiceInput) => {
    if (!hasProviderAccess || !sessionUser || !managedService) {
      denyAccess()
      return
    }

    const existingService = createdServices.find(
      (service) => service.id === managedService.id,
    )
    if (!existingService || existingService.provider !== sessionUser.name) {
      denyAccess()
      return
    }

    const categoryImage =
      SERVICES.find((service) => service.category === input.category)?.image ??
      existingService.image
    const updatedService: Service = {
      ...existingService,
      name: input.name,
      description: input.description,
      category: input.category,
      price: `$${input.price.toLocaleString("es-CO")} COP`,
      priceNum: input.price,
      duration:
        input.durationHours === 1
          ? "1 hora"
          : `${input.durationHours.toLocaleString("es-CO")} horas`,
      durationHours: input.durationHours,
      image: categoryImage,
      status: input.status,
    }
    const nextServices = createdServices.map((service) =>
      service.id === updatedService.id ? updatedService : service,
    )

    setCreatedServices(nextServices)
    localStorage.setItem(CREATED_SERVICES_KEY, JSON.stringify(nextServices))
    setManagedService(updatedService)
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(true)
    setProviderSuccessMessage("")
    setScreen("provider-detail")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeleteService = () => {
    if (!hasProviderAccess || !sessionUser || !managedService) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }

    const existingService = createdServices.find(
      (service) => service.id === managedService.id,
    )
    if (!existingService) {
      return "El servicio que intentas eliminar ya no existe."
    }
    if (existingService.provider !== sessionUser.name) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }

    const nextServices = createdServices.filter(
      (service) => service.id !== existingService.id,
    )
    setCreatedServices(nextServices)
    localStorage.setItem(CREATED_SERVICES_KEY, JSON.stringify(nextServices))
    if (selectedService?.id === existingService.id) {
      setSelectedService(null)
      setSelectedDate(null)
      setSelectedTime(null)
    }
    setManagedService(null)
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(false)
    setProviderSuccessMessage(
      `El servicio “${existingService.name}” fue eliminado correctamente.`,
    )
    setScreen("provider")
    window.scrollTo({ top: 0, behavior: "smooth" })
    return null
  }

  const handleBackToProvider = () => {
    if (!hasProviderAccess) {
      denyAccess()
      return
    }
    setManagedService(null)
    setShowCreatedConfirmation(false)
    setShowUpdatedConfirmation(false)
    setScreen("provider")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOpenSchedule = () => {
    openAuthorizedScreen("provider-schedule")
  }

  const handleSaveSchedule = (schedule: ProviderSchedule) => {
    if (!hasProviderAccess || !sessionUser) {
      denyAccess()
      return
    }
    const nextSchedules = {
      ...providerSchedules,
      [sessionUser.name]: schedule,
    }
    setProviderSchedules(nextSchedules)
    localStorage.setItem(PROVIDER_SCHEDULES_KEY, JSON.stringify(nextSchedules))
  }

  const handleConfirm = (simulateSlotTaken: boolean) => {
    if (!sessionUser || !hasUserRole(sessionUser, "client")) {
      denyAccess()
      return
    }
    if (!selectedService || !selectedDate || !selectedTime) return

    const latestSchedules = getStoredSchedules()
    const latestBookings = getStoredBookings()
    const providerSchedule = latestSchedules[selectedService.provider]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateIsCurrent = selectedDate >= today
    const slotIsAvailable = providerSchedule
      ? getSlotAvailabilities(
          providerSchedule,
          selectedDate,
          selectedService.durationHours,
          latestBookings,
        ).some((slot) => slot.time === selectedTime && slot.available)
      : DEFAULT_TIME_SLOTS.includes(selectedTime) &&
        !isSlotOccupied(
          selectedService.provider,
          selectedDate,
          selectedTime,
          selectedService.durationHours,
          latestBookings,
        )

    if (simulateSlotTaken || !dateIsCurrent || !slotIsAvailable) {
      if (simulateSlotTaken && dateIsCurrent && slotIsAvailable) {
        const competingBooking: Booking = {
          id: `competing-${Date.now()}`,
          provider: selectedService.provider,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          clientName: "Otro cliente",
          clientEmail: "otro-cliente@serviplus.com",
          date: formatDateKey(selectedDate),
          time: selectedTime,
          durationHours: selectedService.durationHours,
          status: "confirmed",
        }
        const nextBookings = [...latestBookings, competingBooking]
        setBookings(nextBookings)
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
      } else {
        setBookings(latestBookings)
        setProviderSchedules(latestSchedules)
      }
      setScreen("slot-taken")
    } else {
      const booking: Booking = {
        id: `booking-${Date.now()}`,
        provider: selectedService.provider,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        clientName: sessionUser.name,
        clientEmail: sessionUser.email.toLowerCase(),
        date: formatDateKey(selectedDate),
        time: selectedTime,
        durationHours: selectedService.durationHours,
        status: "confirmed",
      }
      const nextBookings = [...latestBookings, booking]
      setBookings(nextBookings)
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
      setScreen("confirmed")
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelBooking = (bookingId: string) => {
    if (!sessionUser) {
      denyAccess()
      return "Debes iniciar sesión para cancelar una reserva."
    }

    const latestBookings = getStoredBookings()
    const booking = latestBookings.find((item) => item.id === bookingId)
    if (!booking) return "La reserva que intentas cancelar ya no existe."

    const ownsAsClient =
      hasUserRole(sessionUser, "client") &&
      booking.clientEmail?.toLowerCase() === sessionUser.email.toLowerCase()
    const ownsAsProvider =
      hasUserRole(sessionUser, "provider") &&
      booking.provider === sessionUser.name
    if (!ownsAsClient && !ownsAsProvider) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }
    if (getBookingStatus(booking) === "cancelled") {
      return "La reserva ya está cancelada."
    }
    if (!canCancelBooking(booking)) {
      return getBookingStatus(booking) === "rejected" ||
        getBookingStatus(booking) === "completed"
        ? "El estado actual de la reserva no permite cancelarla."
        : "No se puede cancelar porque faltan 24 horas o menos para el servicio."
    }

    const nextBookings = latestBookings.map((item) =>
      item.id === booking.id ? { ...item, status: "cancelled" as const } : item,
    )
    setBookings(nextBookings)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
    return null
  }

  const handleUpdateBookingStatus = (
    bookingId: string,
    status: BookingStatus,
  ) => {
    if (!sessionUser || !hasUserRole(sessionUser, "provider")) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }

    const latestBookings = getStoredBookings()
    const booking = latestBookings.find((item) => item.id === bookingId)
    if (!booking) return "La reserva que intentas actualizar ya no existe."
    if (booking.provider !== sessionUser.name) {
      denyAccess()
      return ACCESS_DENIED_MESSAGE
    }
    if (booking.status === "cancelled") {
      return "Las reservas canceladas no se pueden editar."
    }
    if (status === "cancelled") {
      return "El estado Cancelada solo puede establecerse mediante la cancelación."
    }

    const nextBookings = latestBookings.map((item) =>
      item.id === bookingId ? { ...item, status } : item,
    )
    setBookings(nextBookings)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
    return null
  }

  const handleChooseAnotherTime = () => {
    setBookings(getStoredBookings())
    setProviderSchedules(getStoredSchedules())
    setSelectedTime(null)
    setScreen("availability")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToCatalog = () => {
    setScreen("catalog")
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setObservations("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToAvailability = () => {
    setScreen("availability")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f9fafb" }}>
      <Header
        user={sessionUser}
        onLogoClick={handleLogoClick}
        onMisReservas={handleOpenReservations}
        onServices={handleBackToCatalog}
        onProviderPanel={handleBackToProvider}
        onAdminPanel={handleOpenAdmin}
        onProfile={handleOpenProfile}
        onLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      {accessNotice && (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5"
          role="alert"
        >
          <div
            className="rounded-xl border px-4 py-3 flex items-start gap-3 text-sm text-red-800"
            style={{
              backgroundColor: "#fef2f2",
              borderColor: "#fecaca",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0"
              aria-hidden="true"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="#dc2626"
                strokeWidth="1.5"
              />
              <path
                d="M7 7l6 6M13 7l-6 6"
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-semibold">{accessNotice}</span>
          </div>
        </div>
      )}

      {screen === "catalog" && (
        <CatalogScreen
          services={catalogServices}
          onSelectService={handleSelectService}
        />
      )}

      {screen === "availability" && selectedService && (
        <AvailabilityScreen
          service={selectedService}
          schedule={providerSchedules[selectedService.provider]}
          bookings={bookings}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onContinue={handleContinueFromAvailability}
          onBack={handleBackToCatalog}
        />
      )}

      {screen === "auth" && (
        <AuthScreen
          service={selectedService ?? undefined}
          sessionNotice={sessionNotice ?? undefined}
          onLogin={handleLogin}
          onBack={
            selectedService ? handleBackToAvailability : handleBackToCatalog
          }
        />
      )}

      {screen === "profile" && sessionUser && (
        <ProfileScreen
          user={sessionUser}
          onSave={handleSaveProfile}
          onBack={() => openAuthorizedScreen(getHomeScreen(sessionUser))}
        />
      )}

      {screen === "admin" && hasUserRole(sessionUser, "admin") && (
        <AdminScreen
          accounts={managedAccounts}
          onChangeRole={handleChangeManagedRole}
          onDelete={handleDeleteManagedAccount}
        />
      )}

      {screen === "reservations" && sessionUser && (
        <ReservationsScreen
          bookings={bookings.filter(
            (booking) =>
              booking.clientEmail?.toLowerCase() ===
              sessionUser.email.toLowerCase(),
          )}
          services={catalogServices}
          onCancelBooking={handleCancelBooking}
          onBack={() => openAuthorizedScreen(getHomeScreen(sessionUser))}
        />
      )}

      {screen === "provider" && hasProviderAccess && sessionUser && (
        <ProviderScreen
          user={sessionUser}
          services={providerServices}
          bookings={bookings.filter(
            (booking) => booking.provider === sessionUser.name,
          )}
          schedule={
            providerSchedules[sessionUser.name] ??
            createDefaultSchedule(sessionUser.name)
          }
          successMessage={providerSuccessMessage || undefined}
          onCreateService={handleOpenCreateService}
          onViewService={handleViewManagedService}
          onConfigureSchedule={handleOpenSchedule}
          onBrowseServices={handleBackToCatalog}
          onCancelBooking={handleCancelBooking}
          onUpdateBookingStatus={handleUpdateBookingStatus}
        />
      )}

      {screen === "provider-create" && hasProviderAccess && (
        <CreateServiceScreen
          onSave={handleCreateService}
          onCancel={handleBackToProvider}
        />
      )}

      {screen === "provider-edit" && hasProviderAccess && managedService && (
        <CreateServiceScreen
          initialService={managedService}
          onSave={handleUpdateService}
          onCancel={() => openAuthorizedScreen("provider-detail")}
        />
      )}

      {screen === "provider-detail" && hasProviderAccess && managedService && (
        <ServiceDetailScreen
          service={managedService}
          showCreatedConfirmation={showCreatedConfirmation}
          showUpdatedConfirmation={showUpdatedConfirmation}
          onBack={handleBackToProvider}
          onEdit={handleOpenEditService}
          onDelete={handleDeleteService}
        />
      )}

      {screen === "provider-schedule" && hasProviderAccess && sessionUser && (
        <ScheduleConfigScreen
          schedule={
            providerSchedules[sessionUser.name] ??
            createDefaultSchedule(sessionUser.name)
          }
          bookings={bookings}
          onSave={handleSaveSchedule}
          onCancel={handleBackToProvider}
        />
      )}

      {screen === "summary" &&
        selectedService &&
        selectedDate &&
        selectedTime && (
          <SummaryScreen
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            observations={observations}
            onObservationsChange={setObservations}
            onConfirm={handleConfirm}
            onBack={handleBackToAvailability}
          />
        )}

      {screen === "confirmed" &&
        selectedService &&
        selectedDate &&
        selectedTime && (
          <ConfirmedScreen
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            bookingCode="SRV-2026-001245"
            onViewReservations={() => {}}
            onBackToCatalog={handleBackToCatalog}
          />
        )}

      {screen === "slot-taken" && (
        <SlotTakenScreen onChooseAnotherTime={handleChooseAnotherTime} />
      )}
    </div>
  )
}
