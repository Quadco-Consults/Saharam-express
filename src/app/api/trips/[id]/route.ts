import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tripId = id

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        seatBookings: {
          include: {
            booking: {
              select: {
                status: true,
                paymentStatus: true
              }
            }
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            seatNumbers: true,
            passengerName: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Get seat availability
    const bookedSeats = trip.seatBookings
      .filter(sb => sb.booking.status === 'CONFIRMED' ||
                   (sb.booking.status === 'PENDING' && sb.booking.paymentStatus !== 'FAILED'))
      .map(sb => sb.seatNumber)

    const availableSeats = getAvailableSeats(trip.vehicle.capacity, bookedSeats)

    // Calculate trip status
    const now = new Date()
    let tripStatus: string

    if (!trip.isActive) {
      tripStatus = 'cancelled'
    } else if (trip.arrivalTime < now) {
      tripStatus = 'completed'
    } else if (trip.departureTime <= now && trip.arrivalTime > now) {
      tripStatus = 'in_transit'
    } else if (trip.departureTime > now) {
      tripStatus = 'scheduled'
    } else {
      tripStatus = 'unknown'
    }

    // Format response
    const formattedTrip = {
      id: trip.id,
      status: tripStatus,
      route: {
        id: trip.route.id,
        fromCity: trip.route.fromCity,
        toCity: trip.route.toCity,
        distance: trip.route.distance,
        estimatedDuration: trip.route.estimatedDuration,
        basePrice: Number(trip.route.basePrice)
      },
      schedule: {
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        isActive: trip.isActive
      },
      vehicle: {
        id: trip.vehicle.id,
        model: trip.vehicle.model,
        plateNumber: trip.vehicle.plateNumber,
        capacity: trip.vehicle.capacity,
        year: trip.vehicle.year,
        status: trip.vehicle.status
      },
      driver: trip.driver ? {
        id: trip.driver.id,
        name: `${trip.driver.firstName} ${trip.driver.lastName}`,
        phone: trip.driver.phone,
        licenseNumber: trip.driver.licenseNumber,
        rating: Number(trip.driver.rating),
        status: trip.driver.status
      } : null,
      pricing: {
        basePrice: Number(trip.basePrice),
        currency: 'NGN'
      },
      seats: {
        total: trip.totalSeats,
        available: trip.availableSeats,
        booked: trip.totalSeats - trip.availableSeats,
        bookedSeatNumbers: bookedSeats,
        availableSeatNumbers: availableSeats,
        seatMap: generateSeatMap(trip.vehicle.capacity, bookedSeats)
      },
      bookings: {
        total: trip.bookings.length,
        confirmed: trip.bookings.filter(b => b.status === 'CONFIRMED').length,
        pending: trip.bookings.filter(b => b.status === 'PENDING').length
      },
      amenities: getVehicleAmenities(trip.vehicle.vehicleType || 'HIACE', trip.vehicle.model),
      isBookable: trip.isActive &&
                 trip.availableSeats > 0 &&
                 trip.departureTime > new Date(),
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: formattedTrip
    })

  } catch (error) {
    console.error('Trip details error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get trip details' },
      { status: 500 }
    )
  }
}

function getAvailableSeats(capacity: number, bookedSeats: string[]): string[] {
  const allSeats: string[] = []
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seatsPerRow = 4

  for (let i = 0; i < capacity; i++) {
    const rowIndex = Math.floor(i / seatsPerRow)
    const seatIndex = (i % seatsPerRow) + 1
    const seatNumber = `${rowLetters[rowIndex]}${seatIndex}`
    allSeats.push(seatNumber)
  }

  return allSeats.filter(seat => !bookedSeats.includes(seat))
}

function generateSeatMap(capacity: number, bookedSeats: string[]): Array<{
  number: string
  status: 'available' | 'booked'
  position: { row: number; seat: number }
}> {
  const seatMap: Array<{
    number: string
    status: 'available' | 'booked'
    position: { row: number; seat: number }
  }> = []

  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seatsPerRow = 4

  for (let i = 0; i < capacity; i++) {
    const rowIndex = Math.floor(i / seatsPerRow)
    const seatIndex = (i % seatsPerRow) + 1
    const seatNumber = `${rowLetters[rowIndex]}${seatIndex}`

    seatMap.push({
      number: seatNumber,
      status: bookedSeats.includes(seatNumber) ? 'booked' : 'available',
      position: {
        row: rowIndex + 1,
        seat: seatIndex
      }
    })
  }

  return seatMap
}

function getVehicleAmenities(vehicleType: string, model: string): string[] {
  const basicAmenities = ['Air Conditioning', 'Comfortable Seating', 'Professional Driver']

  // Amenities based on vehicle type
  switch (vehicleType.toUpperCase()) {
    case 'SIENNA':
      return [...basicAmenities, 'Premium Interior', 'Spacious Legroom', 'USB Charging', 'Quiet Ride']

    case 'BUS':
      return [...basicAmenities, 'Large Capacity', 'Overhead Storage', 'Wide Aisles', 'Extra Luggage Space']

    case 'SALON_CAR':
      return [...basicAmenities, 'Luxury Interior', 'Privacy', 'Executive Seating', 'Premium Sound System']

    case 'HIACE':
      return [...basicAmenities, 'Spacious Interior', 'Overhead Storage', 'Reliable Engine']

    case 'COASTER':
      return [...basicAmenities, 'Mid-Size Comfort', 'Good Visibility', 'Smooth Ride', 'Adequate Storage']

    default:
      // Fallback to model-based detection for backward compatibility
      if (model.toLowerCase().includes('luxury') || model.toLowerCase().includes('executive')) {
        return [...basicAmenities, 'Wi-Fi', 'USB Charging', 'Entertainment System', 'Refreshments']
      }
      return basicAmenities
  }
}
