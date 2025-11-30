import { format, parseISO, addHours } from 'date-fns'

// Format currency in Nigerian Naira
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date for display
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy')
}

// Format time for display
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'h:mm a')
}

// Format date and time for display
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy • h:mm a')
}

// Format duration in hours and minutes
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes}m`
  } else if (remainingMinutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${remainingMinutes}m`
  }
}

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Add Nigerian country code if missing
  if (digits.length === 10) {
    return `+234${digits}`
  } else if (digits.length === 11 && digits.startsWith('0')) {
    return `+234${digits.slice(1)}`
  } else if (digits.length === 13 && digits.startsWith('234')) {
    return `+${digits}`
  }

  return phone // Return original if can't format
}

// Generate booking reference
export const generateBookingReference = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SEL${timestamp}${random}`
}

// Format seat numbers for display
export const formatSeatNumbers = (seats: string[]): string => {
  if (seats.length === 1) {
    return `Seat ${seats[0]}`
  } else if (seats.length === 2) {
    return `Seats ${seats.join(' & ')}`
  } else {
    return `Seats ${seats.slice(0, -1).join(', ')} & ${seats.slice(-1)}`
  }
}

// Calculate estimated arrival time
export const calculateArrivalTime = (departureTime: string | Date, durationMinutes: number): Date => {
  const departureDate = typeof departureTime === 'string' ? parseISO(departureTime) : departureTime
  return addHours(departureDate, durationMinutes / 60)
}

// Format trip status for display
export const formatTripStatus = (status: string): string => {
  const statusMap = {
    'scheduled': 'Scheduled',
    'boarding': 'Boarding',
    'in_transit': 'In Transit',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// Format payment status for display
export const formatPaymentStatus = (status: string): string => {
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'failed': 'Failed',
    'refunded': 'Refunded'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// Format booking status for display
export const formatBookingStatus = (status: string): string => {
  const statusMap = {
    'confirmed': 'Confirmed',
    'cancelled': 'Cancelled',
    'completed': 'Completed'
  }
  return statusMap[status as keyof typeof statusMap] || status
}