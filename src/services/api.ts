const configuredApiUrl = import.meta.env.VITE_API_URL

if (!configuredApiUrl) {
  throw new Error('VITE_API_URL no está configurada. Define la URL de la API en el archivo .env.')
}

const API_URL = configuredApiUrl.replace(/\/+$/, '')

export interface ApiError {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
}

export interface ApiResponse<T> {
  data: T
}

export interface AuthUser {
  id?: string
  userId?: string
  name?: string
  email?: string
  role: 'CLIENT' | 'PROVIDER'
  targetScreen?: string
  token?: string
}

export interface ApiService {
  id: string
  proveedorId: string
  nombre: string
  categoria: string
  descripcion: string
  precio: number
  duracionMinutos: number
  activo: boolean
}

export interface AvailabilitySlot {
  id: string
  servicioId: string
  fecha: string
  horaInicio: string
  horaFin: string
  disponible: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'CLIENT' | 'PROVIDER'
  termsAccepted: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface BookingRequest {
  clienteId: string
  servicioId: string
  slotId: string
  observaciones: string
}

const TOKEN_KEY = 'serviplus.auth'

export function getAuth(): AuthUser | null {
  const raw = sessionStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    sessionStorage.removeItem(TOKEN_KEY)
    return null
  }
}

export function setAuth(auth: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(auth))
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: { includeAuth?: boolean } = {},
): Promise<T> {
  const auth = getAuth()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (config.includeAuth !== false && auth?.token) headers.set('Authorization', `Bearer ${auth.token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T> & ApiError

  if (!response.ok) {
    if (response.status === 401) clearAuth()
    throw new Error(body.message || 'No fue posible completar la solicitud.')
  }
  return body.data
}

export const api = {
  register: (payload: RegisterRequest) =>
    request<AuthUser>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }, { includeAuth: false }),
  login: (payload: LoginRequest) =>
    request<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }, { includeAuth: false }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  services: (params: { page?: number; size?: number; query?: string; categoria?: string; precioMin?: number; precioMax?: number } = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value))
    })
    return request<ApiService[]>(
      `/v1/services${query.toString() ? `?${query}` : ''}`,
    )
  },
  availability: (serviceId: string, date: string, providerId: string, duration: number) =>
    request<AvailabilitySlot[]>(
      `/api/servicios/${serviceId}/disponibilidad?fecha=${date}&proveedorId=${providerId}&duracionMinutos=${duration}`,
    ),
  createBooking: (payload: BookingRequest) =>
    request<Record<string, unknown>>('/api/reservas', { method: 'POST', body: JSON.stringify(payload) }),
}

export function getApiMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
