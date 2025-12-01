import QRCode from 'qrcode'

// QR Code data structure for tickets
export interface TicketQRData {
  bookingRef: string
  passengerName: string
  tripId: string
  seatNumbers: string[]
  departureTime: string
  route: string
  timestamp: number
  // Security hash to prevent tampering
  hash: string
}

// Generate security hash for QR data
function generateSecurityHash(data: Omit<TicketQRData, 'hash'>): string {
  const secret = process.env.JWT_SECRET || 'saharam-express-secret'
  const dataString = JSON.stringify(data)

  // Simple hash function (in production, use proper crypto)
  let hash = 0
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return (hash + secret.length).toString(36)
}

// Generate QR code data for a booking
export function generateQRData(booking: {
  booking_reference: string
  passenger_name: string
  trip_id: string
  seat_numbers: string[]
  trip?: {
    departure_time: string
    route?: {
      from_city: string
      to_city: string
    }
  }
}): TicketQRData {
  const baseData: Omit<TicketQRData, 'hash'> = {
    bookingRef: booking.booking_reference,
    passengerName: booking.passenger_name,
    tripId: booking.trip_id,
    seatNumbers: booking.seat_numbers,
    departureTime: booking.trip?.departure_time || '',
    route: booking.trip?.route ? `${booking.trip.route.from_city}-${booking.trip.route.to_city}` : '',
    timestamp: Date.now()
  }

  return {
    ...baseData,
    hash: generateSecurityHash(baseData)
  }
}

// Generate QR code image as base64 string
export async function generateQRCode(data: TicketQRData): Promise<string> {
  try {
    const qrString = JSON.stringify(data)

    const qrCode = await QRCode.toDataURL(qrString, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    return qrCode
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Verify QR code data integrity
export function verifyQRData(data: TicketQRData): boolean {
  try {
    const { hash, ...baseData } = data
    const expectedHash = generateSecurityHash(baseData)
    return hash === expectedHash
  } catch (error) {
    console.error('Error verifying QR data:', error)
    return false
  }
}

// Parse QR code string back to data
export function parseQRCode(qrString: string): TicketQRData | null {
  try {
    const data = JSON.parse(qrString) as TicketQRData

    // Verify required fields
    if (!data.bookingRef || !data.passengerName || !data.tripId || !data.hash) {
      return null
    }

    // Verify data integrity
    if (!verifyQRData(data)) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error parsing QR code:', error)
    return null
  }
}

// Check if QR code is still valid (not expired)
export function isQRCodeValid(data: TicketQRData, trip: { departure_time: string }): {
  valid: boolean
  reason?: string
} {
  const now = new Date()
  const departureTime = new Date(trip.departure_time)
  const qrGeneratedTime = new Date(data.timestamp)

  // QR code expires 24 hours after departure
  const expiryTime = new Date(departureTime.getTime() + (24 * 60 * 60 * 1000))

  if (now > expiryTime) {
    return {
      valid: false,
      reason: 'Ticket has expired'
    }
  }

  // QR code must be generated within reasonable time of booking (30 days max)
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
  if (now.getTime() - qrGeneratedTime.getTime() > maxAge) {
    return {
      valid: false,
      reason: 'QR code is too old'
    }
  }

  return { valid: true }
}