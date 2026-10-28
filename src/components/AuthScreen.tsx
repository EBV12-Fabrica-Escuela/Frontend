import { useState } from 'react'
import { Service } from '../App'

interface Props {
  service: Service | null
  onAuthenticate: (mode: AuthMode, payload: { name: string; email: string; password: string }) => Promise<void>
  onBack: () => void
}

type AuthMode = 'login' | 'register'

export default function AuthScreen({ service, onAuthenticate, onBack }: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'El correo electrónico es obligatorio'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      errs.email = 'Ingresa un correo electrónico válido'
    if (!password) errs.password = 'La contraseña es obligatoria'
    else if (password.length < 6)
      errs.password = 'La contraseña debe tener al menos 6 caracteres'
    if (mode === 'register') {
      if (!name) errs.name = 'El nombre es obligatorio'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setIsLoading(true)
    try {
      await onAuthenticate(mode, { name, email, password })
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      setErrors({ form: error instanceof Error ? error.message : 'No fue posible autenticarte.' })
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Context */}
        <div
          className="lg:w-80 shrink-0 bg-white rounded-2xl border p-6 w-full"
          style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-5"
            style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.4" />
              <path d="M7 4v3.5l2.5 1.5" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Reserva en progreso
          </div>

          <h2
            className="font-bold text-gray-900 text-lg mb-1"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Para continuar con tu reserva necesitas iniciar sesión
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Tu selección quedará guardada mientras te autentificas.
          </p>

          {service && <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: '#e5e7eb' }}
            aria-label="Servicio seleccionado"
          >
            <div className="h-28 overflow-hidden" style={{ backgroundColor: '#dbeafe' }}>
              <img
                src={service.image}
                alt={`Imagen de ${service.name}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <p
                className="font-bold text-sm text-gray-900"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {service.name}
              </p>
              <p className="text-xs text-gray-500">{service.provider}</p>
              <p className="text-sm font-bold mt-1" style={{ color: '#2563eb' }}>
                {service.price}
              </p>
            </div>
          </div>}

          <button
            onClick={onBack}
            className="mt-5 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al calendario
          </button>
        </div>

        {/* Right: Auth form */}
        <div
          className="flex-1 bg-white rounded-2xl border p-8 w-full"
          style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-7"
            style={{ backgroundColor: '#f3f4f6' }}
            role="tablist"
            aria-label="Modo de autenticación"
          >
            <button
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login')
                setErrors({})
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: mode === 'login' ? 'white' : 'transparent',
                color: mode === 'login' ? '#111827' : '#6b7280',
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Iniciar sesión
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register')
                setErrors({})
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: mode === 'register' ? 'white' : 'transparent',
                color: mode === 'register' ? '#111827' : '#6b7280',
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Registrarme
            </button>
          </div>

          <h1
            className="text-2xl font-extrabold text-gray-900 mb-1"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login'
              ? 'Ingresa tus credenciales para continuar con la reserva'
              : 'Regístrate para completar tu primera reserva'}
          </p>
          {errors.form && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errors.form}</p>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nombre completo <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                  style={{
                    borderColor: errors.name ? '#ef4444' : '#d1d5db',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    ;(e.target as HTMLElement).style.borderColor = '#2563eb'
                    ;(e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                  }}
                  onBlur={e => {
                    ;(e.target as HTMLElement).style.borderColor = errors.name ? '#ef4444' : '#d1d5db'
                    ;(e.target as HTMLElement).style.boxShadow = 'none'
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete={mode === 'login' ? 'email' : 'email'}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                style={{
                  borderColor: errors.email ? '#ef4444' : '#d1d5db',
                  outline: 'none',
                }}
                onFocus={e => {
                  ;(e.target as HTMLElement).style.borderColor = '#2563eb'
                  ;(e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                }}
                onBlur={e => {
                  ;(e.target as HTMLElement).style.borderColor = errors.email ? '#ef4444' : '#d1d5db'
                  ;(e.target as HTMLElement).style.boxShadow = 'none'
                }}
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Phone (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Número de celular <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="300 123 4567"
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                  style={{
                    borderColor: errors.phone ? '#ef4444' : '#d1d5db',
                    outline: 'none',
                  }}
                  onFocus={e => {
                    ;(e.target as HTMLElement).style.borderColor = '#2563eb'
                    ;(e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                  }}
                  onBlur={e => {
                    ;(e.target as HTMLElement).style.borderColor = errors.phone ? '#ef4444' : '#d1d5db'
                    ;(e.target as HTMLElement).style.boxShadow = 'none'
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.phone}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
                </label>
                {mode === 'login' && (
                  <span className="text-xs font-medium text-gray-400">
                    ¿Olvidaste tu contraseña?
                  </span>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all"
                style={{
                  borderColor: errors.password ? '#ef4444' : '#d1d5db',
                  outline: 'none',
                }}
                onFocus={e => {
                  ;(e.target as HTMLElement).style.borderColor = '#2563eb'
                  ;(e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                }}
                onBlur={e => {
                  ;(e.target as HTMLElement).style.borderColor = errors.password ? '#ef4444' : '#d1d5db'
                  ;(e.target as HTMLElement).style.boxShadow = 'none'
                }}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <span aria-hidden="true">⚠</span> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                cursor: isLoading ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!isLoading)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={e => {
                if (!isLoading)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'
              }}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin"
                    aria-hidden="true"
                  />
                  <span>Verificando...</span>
                </>
              ) : mode === 'login' ? (
                'Iniciar sesión y continuar →'
              ) : (
                'Crear cuenta y continuar →'
              )}
            </button>
          </form>

          <div
            className="mt-5 p-3 rounded-xl text-xs text-gray-500 flex items-start gap-2"
            style={{ backgroundColor: '#fafafa', border: '1px solid #f3f4f6' }}
          >
            <span aria-hidden="true">💡</span>
            <span>
              <strong className="text-gray-700">Cuenta requerida:</strong> usa una cuenta registrada en el backend o selecciona “Registrarme” para crear una cuenta de cliente.
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
