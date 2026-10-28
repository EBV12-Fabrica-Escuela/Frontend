import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import CatalogScreen from './components/CatalogScreen'
import AvailabilityScreen from './components/AvailabilityScreen'
import AuthScreen from './components/AuthScreen'
import SummaryScreen from './components/SummaryScreen'
import ConfirmedScreen from './components/ConfirmedScreen'
import SlotTakenScreen from './components/SlotTakenScreen'
import { api, AvailabilitySlot, getApiMessage, getAuth, setAuth, clearAuth } from './services/api'

export type Screen = 'catalog' | 'availability' | 'auth' | 'summary' | 'confirmed' | 'slot-taken'

export interface Service {
  id: string
  providerId: string
  name: string
  category: string
  provider: string
  price: string
  priceNum: number
  duration: string
  durationMinutes: number
  image: string
  description: string
}

const formatPrice = (price: number) => `$${price.toLocaleString('es-CO')} COP`
const formatDuration = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? 'hora' : 'horas'}` : `${minutes} minutos`
const dateParam = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [services, setServices] = useState<Service[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [observations, setObservations] = useState('')
  const [auth, setAuthState] = useState(getAuth())
  const [bookingError, setBookingError] = useState('')
  const [navigationMessage, setNavigationMessage] = useState('')
  const availabilityRequest = useRef(0)

  const loadServices = async (params: Parameters<typeof api.services>[0] = {}) => {
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const result = await api.services({ page: 0, size: 50, ...params })
      setServices(result.map(service => ({
        id: service.id,
        providerId: service.proveedorId,
        name: service.nombre,
        category: service.categoria,
        provider: service.proveedorId,
        price: formatPrice(service.precio),
        priceNum: service.precio,
        duration: formatDuration(service.duracionMinutos),
        durationMinutes: service.duracionMinutos,
        image: '',
        description: service.descripcion,
      })))
    } catch (error) {
      setCatalogError(getApiMessage(error))
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    void loadServices()
  }, [])

  const selectDate = async (date: Date | null) => {
    const requestId = ++availabilityRequest.current
    setSelectedDate(date)
    setSelectedTime(null)
    setSelectedSlot(null)
    setSlots([])
    setAvailabilityError('')
    if (!date || !selectedService) return
    setAvailabilityLoading(true)
    try {
      const nextSlots = await api.availability(selectedService.id, dateParam(date), selectedService.providerId, selectedService.durationMinutes)
      if (requestId === availabilityRequest.current) setSlots(nextSlots)
    } catch (error) {
      if (requestId === availabilityRequest.current) setAvailabilityError(getApiMessage(error))
    } finally {
      if (requestId === availabilityRequest.current) setAvailabilityLoading(false)
    }
  }

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedTime(null)
    setSelectedSlot(null)
    setScreen('availability')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAuthenticate = async (mode: 'login' | 'register', payload: { name: string; email: string; password: string }) => {
    if (mode === 'register') {
      await api.register({ ...payload, role: 'CLIENT', termsAccepted: true })
    }
    const loggedIn = await api.login({ email: payload.email, password: payload.password })
    setAuth(loggedIn)
    setAuthState(loggedIn)
    setScreen('summary')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirm = async () => {
    const clientId = auth?.userId ?? auth?.id
    if (!clientId || !selectedService || !selectedSlot) {
      setBookingError('No se encontró la sesión del cliente. Inicia sesión nuevamente.')
      return
    }
    setBookingError('')
    try {
      await api.createBooking({
        clienteId: clientId,
        servicioId: selectedService.id,
        slotId: selectedSlot.id,
        observaciones,
      })
      setScreen('confirmed')
    } catch (error) {
      setBookingError(getApiMessage(error))
      if (getAuth() === null) setAuthState(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    try {
      if (auth?.token) await api.logout()
    } catch {
      // The local session must still be cleared when the remote session has expired.
    } finally {
      clearAuth()
      setAuthState(null)
      setScreen('catalog')
    }
  }

  const handleBackToCatalog = () => {
    setNavigationMessage('')
    setScreen('catalog')
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setSelectedSlot(null)
    setObservations('')
    setBookingError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <Header
        isLoggedIn={!!auth?.token}
        userName={auth?.name}
        onLogoClick={handleBackToCatalog}
        onLogin={() => setScreen('auth')}
        onMisReservas={() => {
          if (!auth?.token) {
            setScreen('auth')
            return
          }
          setNavigationMessage('La API actual no incluye una ruta para consultar las reservas del cliente.')
        }}
        onLogout={handleLogout}
      />
      {navigationMessage && (
        <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          <span>{navigationMessage}</span>
          <button onClick={() => setNavigationMessage('')} className="ml-4 font-semibold" aria-label="Cerrar mensaje">Cerrar</button>
        </div>
      )}
      {screen === 'catalog' && <CatalogScreen services={services} loading={catalogLoading} error={catalogError} onSearch={loadServices} onSelectService={handleSelectService} />}
      {screen === 'availability' && selectedService && (
        <AvailabilityScreen service={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} slots={slots} loading={availabilityLoading} error={availabilityError}
          onDateChange={selectDate} onTimeChange={(time, slot) => { setSelectedTime(time); setSelectedSlot(slot) }} onContinue={() => setScreen(auth?.token ? 'summary' : 'auth')} onBack={handleBackToCatalog} />
      )}
      {screen === 'auth' && <AuthScreen service={selectedService} onAuthenticate={handleAuthenticate} onBack={() => setScreen(selectedService ? 'availability' : 'catalog')} />}
      {screen === 'summary' && selectedService && selectedDate && selectedTime && <SummaryScreen service={selectedService} date={selectedDate} time={selectedTime} observations={observations} error={bookingError} onObservationsChange={setObservations} onConfirm={handleConfirm} onBack={() => setScreen('availability')} />}
      {screen === 'confirmed' && selectedService && selectedDate && selectedTime && <ConfirmedScreen service={selectedService} date={selectedDate} time={selectedTime} bookingCode="Reserva confirmada" onViewReservations={() => {}} onBackToCatalog={handleBackToCatalog} />}
      {screen === 'slot-taken' && <SlotTakenScreen onChooseAnotherTime={() => setScreen('availability')} />}
    </div>
  )
}
