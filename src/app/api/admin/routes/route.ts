import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const routeSchema = z.object({
  from_city: z.string().min(1, 'From city is required'),
  to_city: z.string().min(1, 'To city is required'),
  distance: z.number().min(1, 'Distance must be at least 1 km'),
  base_fare: z.number().min(0, 'Base fare must be positive'),
  estimated_duration: z.number().min(1, 'Duration must be at least 1 minute'),
  is_active: z.boolean().optional().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const routes = await prisma.route.findMany({
      include: {
        trips: {
          select: {
            id: true,
            departureTime: true,
            arrivalTime: true,
            bookings: {
              select: {
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate stats for each route
    const now = new Date()
    const formattedRoutes = routes.map(route => {
      const totalTrips = route.trips.length
      const completedTrips = route.trips.filter(trip => trip.arrivalTime < now).length
      const activeTrips = route.trips.filter(trip =>
        trip.departureTime <= now && trip.arrivalTime > now
      ).length
      const upcomingTrips = route.trips.filter(trip => trip.departureTime > now).length

      return {
        id: route.id,
        from_city: route.fromCity,
        to_city: route.toCity,
        distance: route.distance,
        base_fare: Number(route.basePrice),
        estimated_duration: route.estimatedDuration,
        is_active: route.isActive,
        created_at: route.createdAt.toISOString(),
        updated_at: route.updatedAt.toISOString(),
        stats: {
          totalTrips,
          activeTrips,
          upcomingTrips,
          completedTrips
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { routes: formattedRoutes }
    })

  } catch (error) {
    console.error('Get routes error:', error)
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
    const validation = routeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const data = validation.data

    // Check if route from_city to to_city already exists (unique constraint)
    const existingRoute = await prisma.route.findUnique({
      where: {
        fromCity_toCity: {
          fromCity: data.from_city,
          toCity: data.to_city
        }
      }
    })

    if (existingRoute) {
      return NextResponse.json({
        success: false,
        error: 'A route from this city to that city already exists'
      }, { status: 409 })
    }

    // Prevent creating routes from a city to itself
    if (data.from_city.toLowerCase() === data.to_city.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'From and to cities must be different'
      }, { status: 400 })
    }

    const route = await prisma.route.create({
      data: {
        fromCity: data.from_city,
        toCity: data.to_city,
        distance: data.distance,
        basePrice: data.base_fare,
        estimatedDuration: data.estimated_duration,
        isActive: data.is_active
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        route: {
          id: route.id,
          from_city: route.fromCity,
          to_city: route.toCity,
          distance: route.distance,
          base_fare: Number(route.basePrice),
          estimated_duration: route.estimatedDuration,
          is_active: route.isActive
        }
      }
    })

  } catch (error) {
    console.error('Create route error:', error)
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
      return NextResponse.json({ success: false, error: 'Route ID is required' }, { status: 400 })
    }

    // For updates, make all fields optional except id
    const updateSchema = routeSchema.partial().extend({
      id: z.string(),
      is_active: z.boolean().optional()
    })

    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const data = validation.data

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: data.id }
    })

    if (!existingRoute) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 })
    }

    // Check unique constraint if cities are being updated
    if ((data.from_city && data.from_city !== existingRoute.fromCity) ||
        (data.to_city && data.to_city !== existingRoute.toCity)) {

      const fromCity = data.from_city || existingRoute.fromCity
      const toCity = data.to_city || existingRoute.toCity

      if (fromCity.toLowerCase() === toCity.toLowerCase()) {
        return NextResponse.json({
          success: false,
          error: 'From and to cities must be different'
        }, { status: 400 })
      }

      const conflictingRoute = await prisma.route.findUnique({
        where: {
          fromCity_toCity: {
            fromCity: fromCity,
            toCity: toCity
          }
        }
      })

      if (conflictingRoute && conflictingRoute.id !== data.id) {
        return NextResponse.json({
          success: false,
          error: 'A route from this city to that city already exists'
        }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (data.from_city) updateData.fromCity = data.from_city
    if (data.to_city) updateData.toCity = data.to_city
    if (data.distance) updateData.distance = data.distance
    if (data.base_fare !== undefined) updateData.basePrice = data.base_fare
    if (data.estimated_duration) updateData.estimatedDuration = data.estimated_duration
    if (data.is_active !== undefined) updateData.isActive = data.is_active

    const route = await prisma.route.update({
      where: { id: data.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        route: {
          id: route.id,
          from_city: route.fromCity,
          to_city: route.toCity,
          distance: route.distance,
          base_fare: Number(route.basePrice),
          estimated_duration: route.estimatedDuration,
          is_active: route.isActive
        }
      }
    })

  } catch (error) {
    console.error('Update route error:', error)
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
    const routeId = searchParams.get('id')

    if (!routeId) {
      return NextResponse.json({ success: false, error: 'Route ID is required' }, { status: 400 })
    }

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        trips: {
          where: {
            departureTime: { gte: new Date() }
          }
        }
      }
    })

    if (!existingRoute) {
      return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 })
    }

    // Don't allow deletion of routes with upcoming trips
    if (existingRoute.trips.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete route with upcoming trips. Please cancel or reassign trips first.'
      }, { status: 409 })
    }

    await prisma.route.delete({
      where: { id: routeId }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Route deleted successfully' }
    })

  } catch (error) {
    console.error('Delete route error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
