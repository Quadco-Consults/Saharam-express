'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, Car, Users, MapPin, Clock, DollarSign } from 'lucide-react'

const tripSchema = z.object({
  routeId: z.string().min(1, 'Please select a route'),
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  driverId: z.string().min(1, 'Please select a driver'),
  departureTime: z.string().min(1, 'Please select departure time'),
  arrivalTime: z.string().min(1, 'Please select arrival time'),
  basePrice: z.number().min(1, 'Base price must be greater than 0'),
})

type TripFormData = z.infer<typeof tripSchema>

interface Route {
  id: string
  from_city: string
  to_city: string
  distance: number
  estimated_duration: number
}

interface Vehicle {
  id: string
  plate_number: string
  model: string
  capacity: number
}

interface Driver {
  id: string
  first_name: string
  last_name: string
}

export default function CreateTripPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema)
  })

  const watchedRouteId = watch('routeId')
  const watchedDepartureTime = watch('departureTime')

  useEffect(() => {
    fetchFormData()
  }, [])

  useEffect(() => {
    // Auto-calculate arrival time when route or departure time changes
    if (selectedRoute && watchedDepartureTime) {
      const departureDate = new Date(watchedDepartureTime)
      const arrivalDate = new Date(departureDate.getTime() + selectedRoute.estimated_duration * 60 * 1000)
      setValue('arrivalTime', arrivalDate.toISOString().slice(0, 16))
    }
  }, [selectedRoute, watchedDepartureTime, setValue])

  useEffect(() => {
    // Set selected route when route changes
    const route = routes.find(r => r.id === watchedRouteId)
    setSelectedRoute(route || null)
  }, [watchedRouteId, routes])

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

      if (routesData.success) setRoutes(routesData.data.routes)
      if (vehiclesData.success) setVehicles(vehiclesData.data.vehicles)
      if (driversData.success) setDrivers(driversData.data.drivers)

    } catch (error) {
      console.error('Error fetching form data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TripFormData) => {
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push('/admin/trips')
      } else {
        alert(result.error || 'Failed to create trip')
      }
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Error creating trip')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule New Trip</h1>
            <p className="text-gray-600 mt-1">Create a new scheduled trip for passengers</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route
              </label>
              <div className="relative">
                <select
                  {...register('routeId')}
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
              {errors.routeId && (
                <p className="text-red-600 text-sm mt-1">{errors.routeId.message}</p>
              )}
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle
              </label>
              <div className="relative">
                <select
                  {...register('vehicleId')}
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
              {errors.vehicleId && (
                <p className="text-red-600 text-sm mt-1">{errors.vehicleId.message}</p>
              )}
            </div>

            {/* Driver Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver
              </label>
              <div className="relative">
                <select
                  {...register('driverId')}
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
              {errors.driverId && (
                <p className="text-red-600 text-sm mt-1">{errors.driverId.message}</p>
              )}
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  {...register('departureTime')}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                />
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.departureTime && (
                <p className="text-red-600 text-sm mt-1">{errors.departureTime.message}</p>
              )}
            </div>

            {/* Arrival Time (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Arrival Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  {...register('arrivalTime')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  readOnly
                />
                <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {selectedRoute && (
                <p className="text-sm text-gray-600 mt-1">
                  Auto-calculated based on route duration (~{Math.round(selectedRoute.estimated_duration / 60)} hours)
                </p>
              )}
              {errors.arrivalTime && (
                <p className="text-red-600 text-sm mt-1">{errors.arrivalTime.message}</p>
              )}
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price (₦)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  {...register('basePrice', { valueAsNumber: true })}
                  placeholder="5000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                />
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Price per seat for this trip
              </p>
              {errors.basePrice && (
                <p className="text-red-600 text-sm mt-1">{errors.basePrice.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Trip...' : 'Schedule Trip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}