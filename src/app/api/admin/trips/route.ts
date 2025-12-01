import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tripSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().optional(),
  departureTime: z.string().datetime('Valid departure time is required'),
  basePrice: z.number().min(0, 'Price must be positive')
})

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'all' // all, upcoming, completed

    const skip = (page - 1) * limit

    // Build where clause based on status filter
    const where: any = {}
    const now = new Date()

    if (status === 'upcoming') {
      where.departureTime = { gte: now }
    } else if (status === 'completed') {
      where.departureTime = { lt: now }
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          route: {
            select: {
              fromCity: true,
              toCity: true,
              distance: true
            }
          },
          vehicle: {
            select: {
              plateNumber: true,
              model: true,
              capacity: true
            }
          },
          driver: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: { departureTime: 'desc' },
        skip,
        take: limit
      }),
      prisma.trip.count({ where })
    ])

    // Format trips for frontend
    const formattedTrips = trips.map(trip => {
      // Determine trip status based on timing and activity
      const now = new Date()
      const departureTime = new Date(trip.departureTime)
      const arrivalTime = new Date(trip.arrivalTime)

      let status: string
      if (!trip.isActive) {
        status = 'cancelled'
      } else if (arrivalTime < now) {
        status = 'completed'
      } else if (departureTime <= now && arrivalTime > now) {
        status = 'in_transit'
      } else {
        status = 'scheduled'
      }

      return {
        id: trip.id,
        route: {
          from_city: trip.route.fromCity,
          to_city: trip.route.toCity,
          distance: trip.route.distance
        },
        vehicle: {
          plate_number: trip.vehicle.plateNumber,
          model: trip.vehicle.model,
          capacity: trip.vehicle.capacity
        },
        driver: trip.driver ? {
          first_name: trip.driver.firstName,
          last_name: trip.driver.lastName,
          phone: trip.driver.phone
        } : null,
        departure_time: trip.departureTime.toISOString(),
        arrival_time: trip.arrivalTime.toISOString(),
        base_price: Number(trip.basePrice),
        available_seats: trip.availableSeats,
        total_seats: trip.totalSeats,
        status: status,
        is_active: trip.isActive,
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        trips: formattedTrips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get trips error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validation = tripSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const data = validation.data

    // Validate route exists
    const route = await prisma.route.findUnique({
      where: { id: data.routeId }
    })

    if (!route) {
      return NextResponse.json({
        success: false,
        error: 'Route not found'
      }, { status: 404 })
    }

    // Validate vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId }
    })

    if (!vehicle || vehicle.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Vehicle not found or not active'
      }, { status: 404 })
    }

    // Validate driver if provided
    if (data.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver || driver.status !== 'ACTIVE') {
        return NextResponse.json({
          success: false,
          error: 'Driver not found or not active'
        }, { status: 404 })
      }
    }

    // Calculate arrival time based on route duration
    const departureTime = new Date(data.departureTime)
    const arrivalTime = new Date(departureTime.getTime() + route.estimatedDuration * 60000)

    const trip = await prisma.trip.create({
      data: {
        routeId: data.routeId,
        vehicleId: data.vehicleId,
        driverId: data.driverId || null,
        departureTime,
        arrivalTime,
        basePrice: data.basePrice,
        availableSeats: vehicle.capacity,
        totalSeats: vehicle.capacity,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          departure_time: trip.departureTime.toISOString(),
          arrival_time: trip.arrivalTime.toISOString(),
          base_price: trip.basePrice,
          total_seats: trip.totalSeats
        }
      }
    })

  } catch (error) {
    console.error('Create trip error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Trip ID is required' }, { status: 400 })
    }

    // Check if trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id: body.id },
      include: {
        route: true,
        bookings: true
      }
    })

    if (!existingTrip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 })
    }

    // Don't allow modification of trips with bookings
    if (existingTrip.bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot modify trip with existing bookings'
      }, { status: 409 })
    }

    const updateData: any = {}

    // Update basic fields
    if (body.departureTime) {
      const departureTime = new Date(body.departureTime)
      updateData.departureTime = departureTime
      // Recalculate arrival time
      updateData.arrivalTime = new Date(departureTime.getTime() + existingTrip.route.estimatedDuration * 60000)
    }

    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice
    if (body.driverId !== undefined) updateData.driverId = body.driverId
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const trip = await prisma.trip.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip.id,
          departure_time: trip.departureTime.toISOString(),
          arrival_time: trip.arrivalTime.toISOString(),
          base_price: trip.basePrice,
          is_active: trip.isActive
        }
      }
    })

  } catch (error) {
    console.error('Update trip error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('id')

    if (!tripId) {
      return NextResponse.json({ success: false, error: 'Trip ID is required' }, { status: 400 })
    }

    // Check if trip exists and has bookings
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: true
      }
    })

    if (!existingTrip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 })
    }

    // Don't allow deletion of trips with confirmed bookings
    const confirmedBookings = existingTrip.bookings.filter(
      booking => booking.status === 'CONFIRMED'
    )

    if (confirmedBookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete trip with confirmed bookings'
      }, { status: 409 })
    }

    // Cancel any pending bookings first
    if (existingTrip.bookings.length > 0) {
      await prisma.booking.updateMany({
        where: { tripId: tripId },
        data: { status: 'CANCELLED' }
      })
    }

    await prisma.trip.delete({
      where: { id: tripId }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Trip deleted successfully' }
    })

  } catch (error) {
    console.error('Delete trip error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
