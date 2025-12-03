'use client'
import { Clock, MapPin, Users, Car, Star } from 'lucide-react'
import { Trip } from '@/types'
import { formatTime, formatCurrency, formatDuration } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface TripCardProps {
  trip: any
  onSelect: (trip: any) => void
  isSelected?: boolean
}

export default function TripCard({ trip, onSelect, isSelected = false }: TripCardProps) {
  const totalSeats = trip.seats?.total || trip.totalSeats || 0
  const availableSeats = trip.seats?.available || trip.availableSeats || 0
  const occupancyRate = totalSeats > 0 ? ((totalSeats - availableSeats) / totalSeats) * 100 : 0
  const isAlmostFull = occupancyRate > 80

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? "border-saharan-500 shadow-md ring-2 ring-saharan-100"
          : "border-gray-200 hover:border-saharan-300"
      )}
      onClick={() => onSelect(trip)}
    >
      {/* Trip Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-saharan-100 rounded-full flex items-center justify-center">
            <Car className="w-5 h-5 text-saharan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {trip.route?.fromCity || trip.route?.from_city} → {trip.route?.toCity || trip.route?.to_city}
            </h3>
            <p className="text-sm text-gray-600">
              {trip.vehicle?.model} • {trip.vehicle?.plateNumber || trip.vehicle?.plate_number}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-saharan-600">
            {formatCurrency(trip.pricing?.basePrice || trip.basePrice || trip.base_price || 4500)}
          </p>
          <p className="text-sm text-gray-600">per seat</p>
        </div>
      </div>

      {/* Time and Duration */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600">Departure</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(trip.schedule?.departureTime || trip.departureTime)}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600">Duration</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatDuration(trip.schedule?.estimatedDuration || trip.route?.estimated_duration || trip.route?.estimatedDuration)}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600">Arrival</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(trip.schedule?.arrivalTime || trip.arrivalTime)}
          </p>
        </div>
      </div>

      {/* Seat Availability */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {availableSeats} of {totalSeats} seats available
          </span>
        </div>

        {isAlmostFull && (
          <div className="flex items-center gap-1 px-2 py-1 bg-saharan-100 text-saharan-700 rounded-full text-xs font-medium">
            <Star className="w-3 h-3" />
            Almost Full
          </div>
        )}
      </div>

      {/* Seat Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              occupancyRate > 80 ? "bg-saharan-500" : "bg-green-500"
            )}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Driver: <span className="font-medium text-gray-900">
            {trip.driver ?
              (trip.driver.name || `${trip.driver.first_name} ${trip.driver.last_name}`) :
              'To be assigned'
            }
          </span>
        </div>

        <div className="flex items-center gap-1 text-green-600">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-medium">{trip.driver?.rating || 4.8}</span>
        </div>
      </div>

      {/* Select Button */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full bg-saharan-500 text-white py-2 rounded-lg font-medium hover:bg-saharan-600 transition-colors">
            Continue with this trip
          </button>
        </div>
      )}
    </div>
  )
}