import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const searchTripsSchema = z.object({
  fromCity: z.string().min(1, 'Origin city is required'),
  toCity: z.string().min(1, 'Destination city is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  passengers: z.number().min(1).max(10).default(1),
  sortBy: z.enum(['price', 'duration', 'departure']).default('departure')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const queryData = {
      fromCity: searchParams.get('fromCity') || '',
      toCity: searchParams.get('toCity') || '',
      departureDate: searchParams.get('departureDate') || '',
      passengers: parseInt(searchParams.get('passengers') || '1'),
      sortBy: (searchParams.get('sortBy') || 'departure') as 'price' | 'duration' | 'departure'
    }

    const validatedData = searchTripsSchema.parse(queryData)

    // Parse departure date
    const departureDate = new Date(validatedData.departureDate)
    const startOfDay = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // Search for trips
    const trips = await prisma.trip.findMany({
      where: {
        AND: [
          {
            route: {
              fromCity: {
                contains: validatedData.fromCity,
                mode: 'insensitive'
              }
            }
          },
          {
            route: {
              toCity: {
                contains: validatedData.toCity,
                mode: 'insensitive'
              }
            }
          },
          {
            departureTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          {
            isActive: true
          },
          {
            availableSeats: {
              gte: validatedData.passengers
            }
          },
          {
            departureTime: {
              gt: new Date() // Only future trips
            }
          }
        ]
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        seatBookings: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'PENDING']
                }
              }
            }
          }
        }
      },
      orderBy: getSortOrder(validatedData.sortBy)
    })

    // Format trips for response
    const formattedTrips = trips.map(trip => {
      const bookedSeats = trip.seatBookings.map(sb => sb.seatNumber)
      const availableSeats = getAvailableSeats(trip.vehicle.capacity, bookedSeats)

      // Calculate pricing
      const basePrice = Number(trip.basePrice)
      const pricePerSeat = basePrice
      const totalPrice = pricePerSeat * validatedData.passengers

      return {
        id: trip.id,
        route: {
          id: trip.route.id,
          fromCity: trip.route.fromCity,
          toCity: trip.route.toCity,
          distance: trip.route.distance
        },
        schedule: {
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          estimatedDuration: trip.route.estimatedDuration
        },
        vehicle: {
          id: trip.vehicle.id,
          model: trip.vehicle.model,
          plateNumber: trip.vehicle.plateNumber,
          capacity: trip.vehicle.capacity,
          year: trip.vehicle.year
        },
        driver: trip.driver ? {
          id: trip.driver.id,
          name: `${trip.driver.firstName} ${trip.driver.lastName}`,
          rating: Number(trip.driver.rating)
        } : null,
        pricing: {
          basePrice,
          pricePerSeat,
          totalPrice,
          currency: 'NGN'
        },
        seats: {
          total: trip.totalSeats,
          available: trip.availableSeats,
          booked: trip.totalSeats - trip.availableSeats,
          availableSeatNumbers: availableSeats.slice(0, 20), // Show first 20 available seats
          canAccommodatePassengers: trip.availableSeats >= validatedData.passengers
        },
        bookingStats: {
          totalBookings: trip._count.bookings,
          popularityScore: calculatePopularityScore(trip._count.bookings, trip.totalSeats)
        },
        amenities: getVehicleAmenities(trip.vehicle.model),
        bookingUrl: `/booking/create?tripId=${trip.id}`
      }
    })

    // Filter trips that can accommodate the requested number of passengers
    const availableTrips = formattedTrips.filter(trip => trip.seats.canAccommodatePassengers)

    return NextResponse.json({
      success: true,
      data: {
        searchCriteria: {
          fromCity: validatedData.fromCity,
          toCity: validatedData.toCity,
          departureDate: validatedData.departureDate,
          passengers: validatedData.passengers,
          sortBy: validatedData.sortBy
        },
        results: {
          total: availableTrips.length,
          trips: availableTrips
        },
        filters: {
          priceRange: getPriceRange(availableTrips),
          departureTimeRange: getTimeRange(availableTrips),
          availableVehicles: getUniqueVehicles(availableTrips)
        }
      }
    })

  } catch (error) {
    console.error('Trip search error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Trip search failed' },
      { status: 500 }
    )
  }
}

function getSortOrder(sortBy: string) {
  switch (sortBy) {
    case 'price':
      return { basePrice: 'asc' as const }
    case 'duration':
      return { route: { estimatedDuration: 'asc' as const } }
    case 'departure':
    default:
      return { departureTime: 'asc' as const }
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

function calculatePopularityScore(bookings: number, totalSeats: number): number {
  return Math.round((bookings / totalSeats) * 100)
}

function getVehicleAmenities(model: string): string[] {
  // Basic amenities based on vehicle model
  const basicAmenities = ['Air Conditioning', 'Comfortable Seating', 'Professional Driver']

  if (model.toLowerCase().includes('hiace') || model.toLowerCase().includes('bus')) {
    return [...basicAmenities, 'Spacious Interior', 'Overhead Storage']
  }

  if (model.toLowerCase().includes('luxury') || model.toLowerCase().includes('executive')) {
    return [...basicAmenities, 'Wi-Fi', 'USB Charging', 'Entertainment System', 'Refreshments']
  }

  return basicAmenities
}

function getPriceRange(trips: any[]): { min: number; max: number } {
  if (trips.length === 0) return { min: 0, max: 0 }

  const prices = trips.map(trip => trip.pricing.totalPrice)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
}

function getTimeRange(trips: any[]): { earliest: string; latest: string } {
  if (trips.length === 0) return { earliest: '', latest: '' }

  const times = trips.map(trip => trip.schedule.departureTime)
  return {
    earliest: new Date(Math.min(...times.map(t => new Date(t).getTime()))).toISOString(),
    latest: new Date(Math.max(...times.map(t => new Date(t).getTime()))).toISOString()
  }
}

function getUniqueVehicles(trips: any[]): Array<{ model: string; count: number }> {
  const vehicleMap = new Map<string, number>()

  trips.forEach(trip => {
    const model = trip.vehicle.model
    vehicleMap.set(model, (vehicleMap.get(model) || 0) + 1)
  })

  return Array.from(vehicleMap.entries()).map(([model, count]) => ({ model, count }))
}
