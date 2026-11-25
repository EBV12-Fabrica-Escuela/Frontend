export interface ScheduleBreak {
  id: string
  start: string
  end: string
}

export interface DaySchedule {
  dayOfWeek: number
  label: string
  active: boolean
  start: string
  end: string
  breaks: ScheduleBreak[]
}

export interface BlockedSlot {
  date: string
  time: string
  reason?: string
}

export interface ProviderSchedule {
  provider: string
  days: DaySchedule[]
  exceptions: string[]
  blockedSlots?: BlockedSlot[]
}

export interface Booking {
  id: string
  provider: string
  serviceId: string
  serviceName?: string
  servicePrice?: string
  clientName?: string
  clientEmail?: string
  date: string
  time: string
  durationHours: number
  status?: BookingStatus
}

export type BookingStatus = "pending" | "confirmed" | "rejected" | "completed" | "cancelled"

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  completed: "Completada",
  cancelled: "Cancelada",
}

export function getBookingStatus(booking: Booking): BookingStatus {
  return booking.status ?? "confirmed"
}

export function bookingBlocksSlot(booking: Booking) {
  const status = getBookingStatus(booking)
  return status !== "cancelled" && status !== "rejected"
}

export interface SlotAvailability {
  time: string
  available: boolean
  reason?: "occupied" | "blocked" | "break" | "insufficient-duration"
}

export const DAY_DEFINITIONS = [
  { dayOfWeek: 1, label: "Lunes" },
  { dayOfWeek: 2, label: "Martes" },
  { dayOfWeek: 3, label: "Miércoles" },
  { dayOfWeek: 4, label: "Jueves" },
  { dayOfWeek: 5, label: "Viernes" },
  { dayOfWeek: 6, label: "Sábado" },
  { dayOfWeek: 0, label: "Domingo" },
]

export function createDefaultSchedule(provider: string): ProviderSchedule {
  return {
    provider,
    days: DAY_DEFINITIONS.map((day) => ({
      ...day,
      active: day.dayOfWeek !== 0,
      start: "08:00",
      end: day.dayOfWeek === 6 ? "12:00" : "18:00",
      breaks:
        day.dayOfWeek > 0 && day.dayOfWeek < 6
          ? [{ id: `default-${day.dayOfWeek}`, start: "12:00", end: "14:00" }]
          : [],
    })),
    exceptions: [],
    blockedSlots: [],
  }
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatSlot(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${String(displayHours).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`
}

export function displayTimeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/)
  if (!match) return -1
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (match[3] === "AM" && hours === 12) hours = 0
  if (match[3] === "PM" && hours !== 12) hours += 12
  return hours * 60 + minutes
}

export function getBookingDateTime(booking: Booking) {
  const dateTime = new Date(`${booking.date}T00:00:00`)
  dateTime.setMinutes(displayTimeToMinutes(booking.time))
  return dateTime
}

export function canCancelBooking(booking: Booking, now = new Date()) {
  const status = getBookingStatus(booking)
  return (
    (status === "pending" || status === "confirmed") &&
    getBookingDateTime(booking).getTime() - now.getTime() > 24 * 60 * 60 * 1000
  )
}

export function isSlotOccupied(
  provider: string,
  date: Date,
  time: string,
  durationHours: number,
  bookings: Booking[],
) {
  const slotStart = displayTimeToMinutes(time)
  const slotEnd = slotStart + durationHours * 60
  const dateKey = formatDateKey(date)

  return bookings.some((booking) => {
    if (
      booking.provider !== provider ||
      booking.date !== dateKey ||
      !bookingBlocksSlot(booking)
    ) {
      return false
    }
    const bookingStart = displayTimeToMinutes(booking.time)
    const bookingEnd = bookingStart + booking.durationHours * 60
    return slotStart < bookingEnd && slotEnd > bookingStart
  })
}

export function getSlotAvailabilities(
  schedule: ProviderSchedule,
  date: Date,
  durationHours: number,
  bookings: Booking[] = [],
): SlotAvailability[] {
  if (schedule.exceptions.includes(formatDateKey(date))) return []

  const day = schedule.days.find((item) => item.dayOfWeek === date.getDay())
  if (!day?.active) return []

  const workStart = timeToMinutes(day.start)
  const workEnd = timeToMinutes(day.end)
  const duration = durationHours * 60
  const slots: SlotAvailability[] = []

  for (let start = workStart; start < workEnd; start += 120) {
    const end = start + duration
    const time = formatSlot(start)
    const overlapsBreak = day.breaks.some((item) => {
      const breakStart = timeToMinutes(item.start)
      const breakEnd = timeToMinutes(item.end)
      return start < breakEnd && end > breakStart
    })
    const occupied = isSlotOccupied(
      schedule.provider,
      date,
      time,
      durationHours,
      bookings,
    )
    const blocked = (schedule.blockedSlots ?? []).some((blockedSlot) => {
      if (blockedSlot.date !== formatDateKey(date)) return false
      const blockedStart = displayTimeToMinutes(blockedSlot.time)
      const blockedEnd = blockedStart + 120
      return start < blockedEnd && end > blockedStart
    })
    const fitsWorkday = end <= workEnd

    slots.push({
      time,
      available: fitsWorkday && !overlapsBreak && !occupied && !blocked,
      reason: !fitsWorkday
        ? "insufficient-duration"
        : overlapsBreak
          ? "break"
          : occupied
            ? "occupied"
            : blocked
              ? "blocked"
              : undefined,
    })
  }

  return slots
}

export function getAvailableSlots(
  schedule: ProviderSchedule,
  date: Date,
  durationHours: number,
  bookings: Booking[] = [],
) {
  return getSlotAvailabilities(schedule, date, durationHours, bookings)
    .filter((slot) => slot.available)
    .map((slot) => slot.time)
}
