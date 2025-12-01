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
  Eye,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
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
  } | null
}

interface Route {
  id: string
  from_city: string
  to_city: string
  distance: number
  estimated_duration: number
  is_active: boolean
}

interface Vehicle {
  id: string
  plate_number: string
  model: string
  capacity: number
  is_active: boolean
}

interface Driver {
  id: string
  first_name: string
  last_name: string
  is_verified: boolean
}

interface TripFormData {
  routeId: string
  vehicleId: string
  driverId: string
  departureTime: string
  basePrice: string
}

const initialFormData: TripFormData = {
  routeId: '',
  vehicleId: '',
  driverId: '',
  departureTime: '',
  basePrice: ''
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState<TripFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchTrips()
    fetchFormData()
  }, [])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const [routesRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/admin/routes', { headers }),
        fetch('/api/admin/vehicles', { headers }),
        fetch('/api/admin/drivers', { headers })
      ])

      const [routesData, vehiclesData, driversData] = await Promise.all([
        routesRes.json(),
        vehiclesRes.json(),
        driversRes.json()
      ])

      if (routesData.success) setRoutes(routesData.data.routes.filter((r: Route) => r.is_active !== false))
      if (vehiclesData.success) setVehicles(vehiclesData.data.vehicles.filter((v: Vehicle) => v.is_active))
      if (driversData.success) setDrivers(driversData.data.drivers.filter((d: Driver) => d.is_verified))

    } catch (error) {
      console.error('Error fetching form data:', error)
    }
  }

  const openModal = (trip?: Trip) => {
    if (trip) {
      setEditingTrip(trip)
      // Find the route, vehicle, and driver IDs based on the trip data
      // This is a simplified approach - in a real app you'd want to store these IDs in the trip data
      const route = routes.find(r => r.from_city === trip.route.from_city && r.to_city === trip.route.to_city)
      const vehicle = vehicles.find(v => v.plate_number === trip.vehicle.plate_number)
      const driver = drivers.find(d => trip.driver && d.first_name === trip.driver.first_name && d.last_name === trip.driver.last_name)

      setFormData({
        routeId: route?.id || '',
        vehicleId: vehicle?.id || '',
        driverId: driver?.id || '',
        departureTime: new Date(trip.departure_time).toISOString().slice(0, 16),
        basePrice: trip.base_price.toString()
      })
    } else {
      setEditingTrip(null)
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTrip(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof TripFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.routeId.trim()) {
      toast.error('Please select a route')
      return false
    }
    if (!formData.vehicleId.trim()) {
      toast.error('Please select a vehicle')
      return false
    }
    if (!formData.driverId.trim()) {
      toast.error('Please select a driver')
      return false
    }
    if (!formData.departureTime.trim()) {
      toast.error('Please select departure time')
      return false
    }
    if (!formData.basePrice || isNaN(Number(formData.basePrice)) || Number(formData.basePrice) <= 0) {
      toast.error('Valid base price is required')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload: any = {
        routeId: formData.routeId,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        departureTime: new Date(formData.departureTime).toISOString(),
        basePrice: parseFloat(formData.basePrice)
      }

      if (editingTrip) {
        payload.id = editingTrip.id
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/trips', {
        method: editingTrip ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingTrip ? 'Trip updated successfully' : 'Trip created successfully')
        await fetchTrips()
        closeModal()
      } else {
        toast.error(result.error || 'Failed to save trip')
      }
    } catch (error) {
      console.error('Error saving trip:', error)
      toast.error('Failed to save trip')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (deleteConfirm !== tripId) {
      setDeleteConfirm(tripId)
      toast.warning('Click delete again to confirm')
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/trips?id=${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Trip deleted successfully')
        await fetchTrips()
        setDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast.error('Failed to delete trip')
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
      (trip.driver && `${trip.driver.first_name} ${trip.driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))

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
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
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
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
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
                          <span>
                            {trip.driver
                              ? `${trip.driver.first_name} ${trip.driver.last_name}`
                              : 'No driver assigned'
                            }
                          </span>
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
                        <span className="font-medium text-saharan-600">
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
                            className="p-1 text-gray-400 hover:text-saharan-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(trip)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Trip"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className={`p-1 text-gray-400 hover:text-red-600 transition-colors ${deleteConfirm === trip.id ? 'bg-red-100 text-red-600' : ''}`}
                            title={deleteConfirm === trip.id ? 'Confirm Delete' : 'Delete Trip'}
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
                <button className="px-3 py-1 text-sm bg-saharan-500 text-white rounded">
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

      {/* Add/Edit Trip Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrip ? 'Edit Trip' : 'Add New Trip'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Route Selection */}
            <div>
              <Label htmlFor="routeId">Route *</Label>
              <div className="relative">
                <select
                  id="routeId"
                  value={formData.routeId}
                  onChange={(e) => handleInputChange('routeId', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                >
                  <option value="">Select a route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.from_city} → {route.to_city} ({route.distance}km, ~{Math.round(route.estimated_duration / 60)}h)
                    </option>
                  ))}
                </select>
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <Label htmlFor="vehicleId">Vehicle *</Label>
              <div className="relative">
                <select
                  id="vehicleId"
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} - {vehicle.plate_number} ({vehicle.capacity} seats)
                    </option>
                  ))}
                </select>
                <Car className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Driver Selection */}
            <div>
              <Label htmlFor="driverId">Driver *</Label>
              <div className="relative">
                <select
                  id="driverId"
                  value={formData.driverId}
                  onChange={(e) => handleInputChange('driverId', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                >
                  <option value="">Select a driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </option>
                  ))}
                </select>
                <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <Label htmlFor="departureTime">Departure Time *</Label>
              <div className="relative">
                <Input
                  id="departureTime"
                  type="datetime-local"
                  value={formData.departureTime}
                  onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="pl-10"
                />
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Base Price */}
            <div>
              <Label htmlFor="basePrice">Base Price (₦) *</Label>
              <div className="relative">
                <Input
                  id="basePrice"
                  type="number"
                  step="100"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  placeholder="5000"
                  className="pl-10"
                />
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Price per seat for this trip
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingTrip ? 'Update Trip' : 'Add Trip'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}