'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CreditCard,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface Booking {
  id: string
  booking_reference: string
  passenger_name: string
  passenger_phone: string
  passenger_email?: string
  seat_numbers: string[]
  total_amount: number
  payment_method?: string
  payment_reference?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'completed' | 'failed'
  qr_code?: string
  loyalty_points_earned: number
  loyalty_points_used: number
  created_at: string
  updated_at: string
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
    driver: {
      first_name: string
      last_name: string
    } | null
  }
  user: {
    first_name: string
    last_name: string
    email: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const router = useRouter()

  useEffect(() => {
    fetchBookings()
  }, [pagination.page, statusFilter, paymentStatusFilter])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        payment_status: paymentStatusFilter
      })

      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setBookings(data.data.bookings)
        setPagination(data.data.pagination)
      } else {
        console.error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const updateData: any = { id: bookingId, status }
      if (paymentStatus) updateData.payment_status = paymentStatus

      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        await fetchBookings() // Refresh the list
      } else {
        alert('Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Error updating booking')
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchBookings()
      } else {
        alert('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Error cancelling booking')
    }
  }

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    const statusMap = {
      pending: { color: 'yellow', label: 'Pending', icon: AlertCircle },
      confirmed: { color: 'green', label: 'Confirmed', icon: CheckCircle },
      cancelled: { color: 'red', label: 'Cancelled', icon: XCircle },
      completed: { color: 'blue', label: 'Completed', icon: CheckCircle }
    }

    const paymentMap = {
      pending: { color: 'yellow', label: 'Payment Pending' },
      completed: { color: 'green', label: 'Paid' },
      failed: { color: 'red', label: 'Payment Failed' }
    }

    const { color, label, icon: Icon } = statusMap[status as keyof typeof statusMap] ||
      { color: 'gray', label: status, icon: AlertCircle }

    return (
      <div className="flex flex-col gap-1">
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          {
            'bg-yellow-100 text-yellow-700': color === 'yellow',
            'bg-green-100 text-green-700': color === 'green',
            'bg-red-100 text-red-700': color === 'red',
            'bg-blue-100 text-blue-700': color === 'blue',
            'bg-gray-100 text-gray-700': color === 'gray',
          }
        )}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
        {paymentStatus && (
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            {
              'bg-yellow-100 text-yellow-700': paymentMap[paymentStatus as keyof typeof paymentMap]?.color === 'yellow',
              'bg-green-100 text-green-700': paymentMap[paymentStatus as keyof typeof paymentMap]?.color === 'green',
              'bg-red-100 text-red-700': paymentMap[paymentStatus as keyof typeof paymentMap]?.color === 'red',
            }
          )}>
            {paymentMap[paymentStatus as keyof typeof paymentMap]?.label || paymentStatus}
          </span>
        )}
      </div>
    )
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passenger_phone.includes(searchTerm) ||
      booking.trip.route.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.to_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="grid grid-cols-8 gap-4">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600 mt-1">Manage passenger bookings and reservations</p>
          </div>
          <button
            onClick={() => {/* Add export functionality if needed */}}
            className="inline-flex items-center gap-2 px-4 py-2 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Bookings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings, passengers, routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="pending">Payment Pending</option>
            <option value="completed">Paid</option>
            <option value="failed">Payment Failed</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="p-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {bookings.length === 0
                ? "No bookings have been made yet."
                : "No bookings match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-2">Booking Details</div>
                  <div className="col-span-2">Passenger</div>
                  <div className="col-span-2">Trip Route</div>
                  <div className="col-span-2">Travel Date</div>
                  <div className="col-span-1">Seats</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <p className="font-medium text-saharan-600">#{booking.booking_reference}</p>
                          <p className="text-gray-600 text-xs">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.passenger_name}</p>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span className="text-xs">{booking.passenger_phone}</span>
                          </div>
                          {booking.passenger_email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">{booking.passenger_email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {booking.trip.route.from_city} → {booking.trip.route.to_city}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {booking.trip.vehicle.model} ({booking.trip.vehicle.plate_number})
                        </p>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {new Date(booking.trip.departure_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {new Date(booking.trip.departure_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <span className="font-medium">
                          {booking.seat_numbers.join(', ')}
                        </span>
                        <p className="text-xs text-gray-600">
                          ({booking.seat_numbers.length} seat{booking.seat_numbers.length > 1 ? 's' : ''})
                        </p>
                      </div>

                      <div className="col-span-1">
                        <div className="space-y-1">
                          <span className="font-medium text-saharan-600">
                            {formatCurrency(booking.total_amount)}
                          </span>
                          {booking.payment_method && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{booking.payment_method}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1">
                        {getStatusBadge(booking.status, booking.payment_status)}
                      </div>

                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            className="p-1 text-gray-400 hover:text-saharan-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Confirm Booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {pagination.total} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="px-3 py-1 text-sm bg-saharan-500 text-white rounded">
                  {pagination.page}
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}