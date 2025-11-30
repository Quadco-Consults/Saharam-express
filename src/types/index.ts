// Database Types
export interface User {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  dateOfBirth?: Date
  isVerified: boolean
  role: 'customer' | 'admin' | 'driver'
  createdAt: Date
  updatedAt: Date
}

export interface Route {
  id: string
  fromCity: string
  toCity: string
  distance: number
  baseFare: number
  estimatedDuration: number // in minutes
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Vehicle {
  id: string
  plateNumber: string
  model: string
  capacity: number
  year: number
  color: string
  isActive: boolean
  lastMaintenance?: Date
  nextMaintenance?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Trip {
  id: string
  routeId: string
  vehicleId: string
  driverId: string
  departureTime: Date
  arrivalTime: Date
  availableSeats: number
  totalSeats: number
  basePrice: number
  status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date

  // Relations
  route?: Route
  vehicle?: Vehicle
  driver?: User
  bookings?: Booking[]
}

export interface Booking {
  id: string
  userId: string
  tripId: string
  passengerName: string
  passengerPhone: string
  seatNumbers: string[]
  totalAmount: number
  bookingReference: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: 'paystack' | 'opay' | 'flutterwave' | 'bank_transfer'
  paymentReference?: string
  qrCode?: string
  status: 'confirmed' | 'cancelled' | 'completed'
  createdAt: Date
  updatedAt: Date

  // Relations
  user?: User
  trip?: Trip
  payment?: Payment
}

export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  gateway: 'paystack' | 'opay' | 'flutterwave'
  gatewayReference: string
  gatewayResponse: any
  status: 'pending' | 'success' | 'failed'
  paidAt?: Date
  createdAt: Date
  updatedAt: Date

  // Relations
  booking?: Booking
}

export interface Notification {
  id: string
  userId: string
  type: 'sms' | 'email' | 'push'
  title: string
  message: string
  isRead: boolean
  sentAt?: Date
  createdAt: Date

  // Relations
  user?: User
}

// Form Types
export interface SearchFormData {
  from: string
  to: string
  departureDate: string
  passengers: number
}

export interface BookingFormData {
  passengerName: string
  passengerPhone: string
  email: string
  selectedSeats: string[]
}

export interface PaymentFormData {
  paymentMethod: 'paystack' | 'opay' | 'flutterwave'
  amount: number
  currency: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface SearchResults {
  trips: Trip[]
  totalCount: number
}

export interface PaymentInitResponse {
  authorizationUrl: string
  reference: string
  accessCode?: string
}

// Component Props Types
export interface TripCardProps {
  trip: Trip
  onBook: (trip: Trip) => void
}

export interface SeatMapProps {
  totalSeats: number
  bookedSeats: string[]
  selectedSeats: string[]
  onSeatSelect: (seatNumber: string) => void
}

export interface PaymentGatewayProps {
  amount: number
  email: string
  reference: string
  onSuccess: (reference: string) => void
  onClose: () => void
}

// Admin Dashboard Types
export interface DashboardStats {
  totalTrips: number
  totalBookings: number
  totalRevenue: number
  activeUsers: number
  todayTrips: number
  occupancyRate: number
}

export interface AdminFilters {
  dateFrom?: Date
  dateTo?: Date
  status?: string
  route?: string
}