import { useState } from 'react'
import Header from './components/Header'
import CatalogScreen from './components/CatalogScreen'
import AvailabilityScreen from './components/AvailabilityScreen'
import AuthScreen from './components/AuthScreen'
import SummaryScreen from './components/SummaryScreen'
import ConfirmedScreen from './components/ConfirmedScreen'
import SlotTakenScreen from './components/SlotTakenScreen'

export type Screen = 'catalog' | 'availability' | 'auth' | 'summary' | 'confirmed' | 'slot-taken'

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
}

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Limpieza residencial',
    category: 'Limpieza',
    provider: 'Hogar Express',
    price: '$80.000 COP',
    priceNum: 80000,
    duration: '2 horas',
    durationHours: 2,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
    description: 'Limpieza completa del hogar con productos ecológicos. Cubre todos los ambientes de tu vivienda con atención al detalle.',
  },
  {
    id: '2',
    name: 'Reparación de computador',
    category: 'Tecnología',
    provider: 'TechFix',
    price: '$120.000 COP',
    priceNum: 120000,
    duration: '2 horas',
    durationHours: 2,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=220&fit=crop&auto=format',
    description: 'Diagnóstico y reparación de equipos de cómputo. Software, hardware y mantenimiento preventivo con garantía.',
  },
  {
    id: '3',
    name: 'Mantenimiento de aire acondicionado',
    category: 'Mantenimiento',
    provider: 'ClimaPro',
    price: '$150.000 COP',
    priceNum: 150000,
    duration: '3 horas',
    durationHours: 3,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=220&fit=crop&auto=format',
    description: 'Limpieza profunda, carga de gas y revisión técnica de tu sistema de aire acondicionado.',
  },
  {
    id: '4',
    name: 'Diseño de logo',
    category: 'Diseño',
    provider: 'Creativa Studio',
    price: '$200.000 COP',
    priceNum: 200000,
    duration: '4 horas',
    durationHours: 4,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=220&fit=crop&auto=format',
    description: 'Diseño profesional de identidad visual. Incluye 3 propuestas, rondas de revisión y archivos en todos los formatos.',
  },
  {
    id: '5',
    name: 'Instalación eléctrica',
    category: 'Mantenimiento',
    provider: 'ElectroServ',
    price: '$95.000 COP',
    priceNum: 95000,
    duration: '2 horas',
    durationHours: 2,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=220&fit=crop&auto=format',
    description: 'Instalación y reparación de puntos eléctricos, tomacorrientes e interruptores con certificado de seguridad.',
  },
  {
    id: '6',
    name: 'Fotografía de eventos',
    category: 'Diseño',
    provider: 'FotoMoments',
    price: '$180.000 COP',
    priceNum: 180000,
    duration: '4 horas',
    durationHours: 4,
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=220&fit=crop&auto=format',
    description: 'Cobertura fotográfica profesional para eventos sociales y corporativos. Entrega digital en alta resolución.',
  },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [observations, setObservations] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedTime(null)
    setScreen('availability')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueFromAvailability = () => {
    if (!isLoggedIn) {
      setScreen('auth')
    } else {
      setScreen('summary')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    setScreen('summary')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirm = (simulateSlotTaken: boolean) => {
    if (simulateSlotTaken) {
      setScreen('slot-taken')
    } else {
      setScreen('confirmed')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToCatalog = () => {
    setScreen('catalog')
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setObservations('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToAvailability = () => {
    setScreen('availability')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <Header
        isLoggedIn={isLoggedIn}
        onLogoClick={handleBackToCatalog}
        onMisReservas={() => {}}
      />

      {screen === 'catalog' && (
        <CatalogScreen onSelectService={handleSelectService} />
      )}

      {screen === 'availability' && selectedService && (
        <AvailabilityScreen
          service={selectedService}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onContinue={handleContinueFromAvailability}
          onBack={handleBackToCatalog}
        />
      )}

      {screen === 'auth' && selectedService && (
        <AuthScreen
          service={selectedService}
          onLogin={handleLogin}
          onBack={handleBackToAvailability}
        />
      )}

      {screen === 'summary' && selectedService && selectedDate && selectedTime && (
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

      {screen === 'confirmed' && selectedService && selectedDate && selectedTime && (
        <ConfirmedScreen
          service={selectedService}
          date={selectedDate}
          time={selectedTime}
          bookingCode="SRV-2026-001245"
          onViewReservations={() => {}}
          onBackToCatalog={handleBackToCatalog}
        />
      )}

      {screen === 'slot-taken' && (
        <SlotTakenScreen onChooseAnotherTime={handleBackToAvailability} />
      )}
    </div>
  )
}
