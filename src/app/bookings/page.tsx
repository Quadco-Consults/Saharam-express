'use client'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, CreditCard, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import { formatDateTime, formatCurrency, formatSeatNumbers } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface Booking {
  id: string
  trip_id: string
  passenger_name: string
  passenger_phone: string
  seat_numbers: string[]
  total_amount: number
  booking_reference: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  trip: {
    departure_time: string
    arrival_time: string
    route: {
      from_city: string
      to_city: string
    }
    vehicle: {
      plate_number: string
      model: string
    }
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        setBookings(result.data || [])
      } else {
        console.error('Error fetching bookings:', result.error)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-700 bg-green-100'
      case 'completed':
        return 'text-blue-700 bg-blue-100'
      case 'cancelled':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-700 bg-green-100'
      case 'pending':
        return 'text-yellow-700 bg-yellow-100'
      case 'failed':
        return 'text-red-700 bg-red-100'
      case 'refunded':
        return 'text-purple-700 bg-purple-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const departureTime = new Date(booking.trip.departure_time)

    switch (filter) {
      case 'upcoming':
        return departureTime > now && booking.status === 'confirmed'
      case 'completed':
        return booking.status === 'completed' || departureTime < now
      case 'cancelled':
        return booking.status === 'cancelled'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 space-y-4">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    filter === key
                      ? "bg-white text-saharam-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? "You haven't made any bookings yet. Book your first trip today!"
                  : `No ${filter} bookings found.`
                }
              </p>
              <a
                href="#search"
                className="inline-flex items-center px-6 py-3 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors"
              >
                Book a Trip
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    {/* Booking Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.trip.route.from_city} → {booking.trip.route.to_city}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Booking Reference: <span className="font-mono font-medium">{booking.booking_reference}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          getStatusColor(booking.status)
                        )}>
                          {booking.status === 'confirmed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {booking.status === 'cancelled' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          getPaymentStatusColor(booking.payment_status)
                        )}>
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Trip Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Departure</p>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(booking.trip.departure_time)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Vehicle</p>
                            <p className="text-sm text-gray-600">
                              {booking.trip.vehicle.model} • {booking.trip.vehicle.plate_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Passenger</p>
                            <p className="text-sm text-gray-600">
                              {booking.passenger_name} • {booking.passenger_phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatSeatNumbers(booking.seat_numbers)} • {formatCurrency(booking.total_amount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Booked on {formatDateTime(booking.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex gap-3">
                          <button className="px-4 py-2 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors text-sm">
                            View Ticket
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                            Download Receipt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}