'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Car,
  Users,
  MapPin,
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye
} from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface Trip {
  id: string
  departure_time: string
  arrival_time: string
  available_seats: number
  total_seats: number
  base_price: number
  status: 'scheduled' | 'boarding' | 'in_transit' | 'completed' | 'cancelled'
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
  }
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/admin/trips')
      const data = await response.json()

      if (response.ok && data.success) {
        setTrips(data.data.trips)
      } else {
        console.error('Failed to fetch trips')
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return

    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTrips(trips.filter(trip => trip.id !== tripId))
      } else {
        alert('Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Error deleting trip')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { color: 'blue', label: 'Scheduled' },
      boarding: { color: 'yellow', label: 'Boarding' },
      in_transit: { color: 'green', label: 'In Transit' },
      completed: { color: 'gray', label: 'Completed' },
      cancelled: { color: 'red', label: 'Cancelled' }
    }

    const { color, label } = statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status }

    return (
      <span className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        {
          'bg-blue-100 text-blue-700': color === 'blue',
          'bg-yellow-100 text-yellow-700': color === 'yellow',
          'bg-green-100 text-green-700': color === 'green',
          'bg-gray-100 text-gray-700': color === 'gray',
          'bg-red-100 text-red-700': color === 'red',
        }
      )}>
        {label}
      </span>
    )
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch =
      trip.route.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.route.to_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${trip.driver.first_name} ${trip.driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter

    const matchesDate = !dateFilter || trip.departure_time.startsWith(dateFilter)

    return matchesSearch && matchesStatus && matchesDate
  })

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="grid grid-cols-6 gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
            <p className="text-gray-600 mt-1">Manage all scheduled trips and routes</p>
          </div>
          <button
            onClick={() => router.push('/admin/trips/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Trip
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips, vehicles, or drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharam-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharam-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="boarding">Boarding</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharam-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Trips List */}
      <div className="p-8">
        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-6">
              {trips.length === 0
                ? "You haven't scheduled any trips yet."
                : "No trips match your current filters."
              }
            </p>
            <button
              onClick={() => router.push('/admin/trips/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-2">Route</div>
                  <div className="col-span-2">Vehicle</div>
                  <div className="col-span-2">Driver</div>
                  <div className="col-span-2">Departure</div>
                  <div className="col-span-1">Seats</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredTrips.map((trip) => (
                  <div key={trip.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {trip.route.from_city} → {trip.route.to_city}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{trip.vehicle.model}</p>
                            <p className="text-gray-600">{trip.vehicle.plate_number}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{trip.driver.first_name} {trip.driver.last_name}</span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {new Date(trip.departure_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-gray-600">
                              {new Date(trip.departure_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <span className="font-medium">
                          {trip.available_seats}/{trip.total_seats}
                        </span>
                      </div>

                      <div className="col-span-1">
                        <span className="font-medium text-saharam-600">
                          {formatCurrency(trip.base_price)}
                        </span>
                      </div>

                      <div className="col-span-1">
                        {getStatusBadge(trip.status)}
                      </div>

                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/trips/${trip.id}`)}
                            className="p-1 text-gray-400 hover:text-saharam-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/trips/${trip.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Trip"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Trip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                Showing {filteredTrips.length} of {trips.length} trips
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-saharam-500 text-white rounded">
                  1
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
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