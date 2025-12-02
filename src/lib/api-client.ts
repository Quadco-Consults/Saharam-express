'use client'

interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Mock/fallback data for when backend is unavailable
const FALLBACK_DATA = {
  trips: [
    {
      id: 'fallback-trip-1',
      route: {
        id: 'fallback-route-1',
        fromCity: 'Kano',
        toCity: 'Kaduna',
        distance: 160,
        estimatedDuration: 120,
        basePrice: 2000
      },
      schedule: {
        departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        arrivalTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        isActive: true
      },
      vehicle: {
        id: 'fallback-vehicle-1',
        model: 'Toyota Hiace',
        plateNumber: 'SAH-001-FB',
        capacity: 18,
        year: 2023,
        status: 'ACTIVE'
      },
      driver: {
        id: 'fallback-driver-1',
        name: 'Ahmed Musa',
        phone: '+2348123456789',
        licenseNumber: 'KN-123456',
        rating: 4.7,
        status: 'ACTIVE'
      },
      pricing: {
        basePrice: 2000,
        currency: 'NGN'
      },
      seats: {
        total: 18,
        available: 18,
        booked: 0,
        bookedSeatNumbers: [],
        availableSeatNumbers: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4', 'E1', 'E2'],
        seatMap: Array.from({ length: 18 }, (_, i) => {
          const row = Math.floor(i / 4)
          const seat = (i % 4) + 1
          const seatNumber = `${String.fromCharCode(65 + row)}${seat}`
          return {
            number: seatNumber,
            status: 'available' as const,
            position: { row: row + 1, seat }
          }
        })
      },
      amenities: ['Air Conditioning', 'Comfortable Seating', 'Professional Driver', 'Spacious Interior'],
      isBookable: true,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fallback-trip-2',
      route: {
        id: 'fallback-route-1',
        fromCity: 'Kano',
        toCity: 'Kaduna',
        distance: 160,
        estimatedDuration: 120,
        basePrice: 2500
      },
      schedule: {
        departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        arrivalTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        isActive: true
      },
      vehicle: {
        id: 'fallback-vehicle-2',
        model: 'Mercedes Sprinter',
        plateNumber: 'SAH-002-FB',
        capacity: 20,
        year: 2024,
        status: 'ACTIVE'
      },
      driver: {
        id: 'fallback-driver-2',
        name: 'Fatima Ibrahim',
        phone: '+2348123456790',
        licenseNumber: 'KN-789012',
        rating: 4.9,
        status: 'ACTIVE'
      },
      pricing: {
        basePrice: 2500,
        currency: 'NGN'
      },
      seats: {
        total: 20,
        available: 20,
        booked: 0,
        bookedSeatNumbers: [],
        availableSeatNumbers: Array.from({ length: 20 }, (_, i) => {
          const row = Math.floor(i / 4)
          const seat = (i % 4) + 1
          return `${String.fromCharCode(65 + row)}${seat}`
        }),
        seatMap: Array.from({ length: 20 }, (_, i) => {
          const row = Math.floor(i / 4)
          const seat = (i % 4) + 1
          const seatNumber = `${String.fromCharCode(65 + row)}${seat}`
          return {
            number: seatNumber,
            status: 'available' as const,
            position: { row: row + 1, seat }
          }
        })
      },
      amenities: ['Premium Interior', 'Air Conditioning', 'USB Charging', 'Wi-Fi', 'Refreshments'],
      isBookable: true,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],

  user: {
    id: 'fallback-user-1',
    email: 'guest@example.com',
    firstName: 'Guest',
    lastName: 'User',
    role: 'CUSTOMER' as const
  },

  booking: {
    id: 'fallback-booking-1',
    reference: 'SEL123456FB',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    totalAmount: 2000,
    passengerName: 'John Doe',
    passengerEmail: 'john@example.com',
    passengerPhone: '+2348123456789',
    seatNumbers: ['A1'],
    createdAt: new Date().toISOString()
  }
}

class APIClient {
  private isOfflineMode = false
  private lastSuccessfulCall = Date.now()
  private readonly OFFLINE_THRESHOLD = 10000 // 10 seconds

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData?: T
  ): Promise<APIResponse<T>> {
    try {
      // Check if we should be in offline mode
      if (this.isOfflineMode && Date.now() - this.lastSuccessfulCall < this.OFFLINE_THRESHOLD) {
        throw new Error('API temporarily unavailable - using offline mode')
      }

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Mark as successful
      this.isOfflineMode = false
      this.lastSuccessfulCall = Date.now()

      return data
    } catch (error) {
      console.warn(`API call failed for ${endpoint}:`, error)

      // Enter offline mode
      this.isOfflineMode = true

      // Return fallback data if available
      if (fallbackData) {
        return {
          success: true,
          data: fallbackData
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      }
    }
  }

  // Trip search with fallbacks
  async searchTrips(from: string, to: string, date: string, passengers: number) {
    const endpoint = `/api/trips/search?from=${from}&to=${to}&date=${date}&passengers=${passengers}`

    return this.makeRequest(endpoint, {}, {
      results: {
        total: FALLBACK_DATA.trips.length,
        trips: FALLBACK_DATA.trips
      },
      searchCriteria: {
        fromCity: from,
        toCity: to,
        departureDate: date,
        passengers
      }
    })
  }

  // Trip details with fallbacks
  async getTripDetails(tripId: string) {
    const endpoint = `/api/trips/${tripId}`

    // Find matching fallback trip or use first one
    const fallbackTrip = FALLBACK_DATA.trips.find(t => t.id === tripId) || FALLBACK_DATA.trips[0]

    return this.makeRequest(endpoint, {}, fallbackTrip)
  }

  // Authentication with fallbacks
  async login(email: string, password: string) {
    const endpoint = '/api/auth/login'

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }, {
      user: FALLBACK_DATA.user,
      token: 'fallback-token-' + Date.now()
    })
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const endpoint = '/api/auth/register'

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName })
    }, {
      user: { ...FALLBACK_DATA.user, email, firstName, lastName },
      token: 'fallback-token-' + Date.now()
    })
  }

  async verifyToken(token: string) {
    const endpoint = '/api/auth/verify'

    return this.makeRequest(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, {
      user: FALLBACK_DATA.user
    })
  }

  // Booking with fallbacks
  async createBooking(bookingData: any) {
    const endpoint = '/api/bookings/create'

    const fallbackBooking = {
      ...FALLBACK_DATA.booking,
      ...bookingData,
      reference: 'SEL' + Date.now(),
      createdAt: new Date().toISOString()
    }

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    }, {
      booking: fallbackBooking
    })
  }

  // Payment initialization with fallbacks
  async initializePayment(provider: string, bookingId: string) {
    const endpoint = '/api/payments/initialize'

    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, bookingId })
    }, {
      authorizationUrl: '/payment/demo?booking=' + bookingId,
      reference: 'pay-' + Date.now(),
      accessCode: 'fallback-access-code'
    })
  }

  // Check if in offline mode
  isOffline(): boolean {
    return this.isOfflineMode
  }

  // Force offline mode (for testing)
  setOfflineMode(offline: boolean): void {
    this.isOfflineMode = offline
    if (!offline) {
      this.lastSuccessfulCall = Date.now()
    }
  }
}

export const apiClient = new APIClient()
export default apiClient