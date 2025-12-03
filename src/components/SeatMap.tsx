'use client'
import { useState } from 'react'
import { User, Car } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SeatMapProps {
  totalSeats: number
  bookedSeats: string[]
  selectedSeats: string[]
  onSeatSelect: (seatNumber: string) => void
  maxSeats?: number
}

export default function SeatMap({
  totalSeats,
  bookedSeats,
  selectedSeats,
  onSeatSelect,
  maxSeats = 4 // Maximum seats a user can select
}: SeatMapProps) {
  // Generate seat layout for typical bus configuration
  const generateSeatLayout = (total: number) => {
    const seats = []
    const seatsPerRow = 4 // 2 + aisle + 2
    const rows = Math.ceil(total / seatsPerRow)

    for (let row = 1; row <= rows; row++) {
      const rowSeats = []

      // Left side (2 seats)
      for (let seat = 1; seat <= 2; seat++) {
        const seatNumber = ((row - 1) * seatsPerRow + seat).toString()
        if (parseInt(seatNumber) <= total) {
          rowSeats.push({
            number: seatNumber,
            position: seat === 1 ? 'window-left' : 'aisle-left',
            side: 'left'
          })
        }
      }

      // Right side (2 seats)
      for (let seat = 3; seat <= 4; seat++) {
        const seatNumber = ((row - 1) * seatsPerRow + seat).toString()
        if (parseInt(seatNumber) <= total) {
          rowSeats.push({
            number: seatNumber,
            position: seat === 3 ? 'aisle-right' : 'window-right',
            side: 'right'
          })
        }
      }

      seats.push({
        row,
        seats: rowSeats
      })
    }

    return seats
  }

  const seatLayout = generateSeatLayout(totalSeats)

  const getSeatStatus = (seatNumber: string) => {
    if (bookedSeats.includes(seatNumber)) return 'booked'
    if (selectedSeats.includes(seatNumber)) return 'selected'
    return 'available'
  }

  const getSeatClasses = (seatNumber: string) => {
    const status = getSeatStatus(seatNumber)
    const baseClasses = "w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all cursor-pointer hover:scale-105"

    switch (status) {
      case 'booked':
        return cn(baseClasses, "bg-red-100 border-red-300 text-red-600 cursor-not-allowed hover:scale-100")
      case 'selected':
        return cn(baseClasses, "bg-saharan-500 border-saharan-600 text-white shadow-md")
      case 'available':
        return cn(baseClasses, "bg-green-100 border-green-300 text-green-700 hover:bg-green-200")
      default:
        return baseClasses
    }
  }

  const handleSeatClick = (seatNumber: string) => {
    const status = getSeatStatus(seatNumber)

    if (status === 'booked') return

    if (status === 'selected') {
      // Deselect seat
      onSeatSelect(seatNumber)
    } else {
      // Select seat if under limit
      if (selectedSeats.length < maxSeats) {
        onSeatSelect(seatNumber)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Seats</h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-saharan-500 border border-saharan-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="max-w-md mx-auto">
        {/* Driver Section */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Car className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Driver</span>
          </div>
        </div>

        {/* Seats */}
        <div className="space-y-3">
          {seatLayout.map((row) => (
            <div key={row.row} className="flex items-center justify-between">
              {/* Row number */}
              <div className="w-8 text-center text-xs text-gray-500 font-medium">
                {row.row}
              </div>

              {/* Left seats */}
              <div className="flex gap-1">
                {row.seats.filter(seat => seat.side === 'left').map((seat) => (
                  <button
                    key={seat.number}
                    onClick={() => handleSeatClick(seat.number)}
                    className={getSeatClasses(seat.number)}
                    disabled={getSeatStatus(seat.number) === 'booked'}
                    title={`Seat ${seat.number} - ${getSeatStatus(seat.number)}`}
                  >
                    {getSeatStatus(seat.number) === 'booked' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      seat.number
                    )}
                  </button>
                ))}
              </div>

              {/* Aisle */}
              <div className="w-6 text-center text-xs text-gray-400">
                <div className="h-px bg-gray-200"></div>
              </div>

              {/* Right seats */}
              <div className="flex gap-1">
                {row.seats.filter(seat => seat.side === 'right').map((seat) => (
                  <button
                    key={seat.number}
                    onClick={() => handleSeatClick(seat.number)}
                    className={getSeatClasses(seat.number)}
                    disabled={getSeatStatus(seat.number) === 'booked'}
                    title={`Seat ${seat.number} - ${getSeatStatus(seat.number)}`}
                  >
                    {getSeatStatus(seat.number) === 'booked' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      seat.number
                    )}
                  </button>
                ))}
              </div>

              {/* Row number (right) */}
              <div className="w-8 text-center text-xs text-gray-500 font-medium">
                {row.row}
              </div>
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedSeats.length > 0 && (
          <div className="mt-6 p-4 bg-saharan-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-saharan-900 mb-1">
                Selected Seats
              </p>
              <p className="text-lg font-bold text-saharan-600">
                {selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
              </p>
              <p className="text-xs text-saharan-600 mt-1">
                {selectedSeats.length} of {maxSeats} seats selected
              </p>
            </div>
          </div>
        )}

        {/* Seat selection limit warning */}
        {selectedSeats.length >= maxSeats && (
          <div className="mt-4 p-3 bg-saharan-50 border border-saharan-200 rounded-lg">
            <p className="text-sm text-saharan-700 text-center">
              Maximum of {maxSeats} seats can be selected per booking
            </p>
          </div>
        )}
      </div>
    </div>
  )
}