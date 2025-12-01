import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  model: z.string().min(1, 'Model is required'),
  vehicle_type: z.enum(['SIENNA', 'BUS', 'SALON_CAR', 'HIACE', 'COASTER']).default('HIACE'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  year: z.number().min(1900, 'Year must be valid'),
  color: z.string().optional(),
  last_maintenance: z.string().datetime().optional(),
  next_maintenance: z.string().datetime().optional(),
  is_active: z.boolean().optional().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Format vehicles for frontend
    const formattedVehicles = vehicles.map(vehicle => ({
      id: vehicle.id,
      plate_number: vehicle.plateNumber,
      model: vehicle.model,
      vehicle_type: vehicle.vehicleType,
      capacity: vehicle.capacity,
      year: vehicle.year,
      color: '',
      is_active: vehicle.status === 'ACTIVE',
      last_maintenance: vehicle.lastMaintenance?.toISOString() || null,
      next_maintenance: null, // Not in current schema
      created_at: vehicle.createdAt.toISOString(),
      updated_at: vehicle.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: { vehicles: formattedVehicles }
    })

  } catch (error) {
    console.error('Get vehicles error:', error)
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
    const validation = vehicleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const data = validation.data

    // Check if plate number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: data.plate_number }
    })

    if (existingVehicle) {
      return NextResponse.json({
        success: false,
        error: 'A vehicle with this plate number already exists'
      }, { status: 409 })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plate_number,
        model: data.model,
        vehicleType: data.vehicle_type,
        capacity: data.capacity,
        year: data.year,
        status: data.is_active ? 'ACTIVE' : 'INACTIVE',
        lastMaintenance: data.last_maintenance ? new Date(data.last_maintenance) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        vehicle: {
          id: vehicle.id,
          plate_number: vehicle.plateNumber,
          model: vehicle.model,
          vehicle_type: vehicle.vehicleType,
          capacity: vehicle.capacity,
          year: vehicle.year,
          is_active: vehicle.status === 'ACTIVE'
        }
      }
    })

  } catch (error) {
    console.error('Create vehicle error:', error)
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
      return NextResponse.json({ success: false, error: 'Vehicle ID is required' }, { status: 400 })
    }

    // For updates, make all fields optional except id
    const updateSchema = vehicleSchema.partial().extend({
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

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: data.id }
    })

    if (!existingVehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 })
    }

    // Check plate number uniqueness if being updated
    if (data.plate_number && data.plate_number !== existingVehicle.plateNumber) {
      const plateExists = await prisma.vehicle.findUnique({
        where: { plateNumber: data.plate_number }
      })

      if (plateExists) {
        return NextResponse.json({
          success: false,
          error: 'A vehicle with this plate number already exists'
        }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (data.plate_number) updateData.plateNumber = data.plate_number
    if (data.model) updateData.model = data.model
    if (data.vehicle_type) updateData.vehicleType = data.vehicle_type
    if (data.capacity) updateData.capacity = data.capacity
    if (data.year) updateData.year = data.year
    if (data.is_active !== undefined) updateData.status = data.is_active ? 'ACTIVE' : 'INACTIVE'
    if (data.last_maintenance) updateData.lastMaintenance = new Date(data.last_maintenance)

    const vehicle = await prisma.vehicle.update({
      where: { id: data.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        vehicle: {
          id: vehicle.id,
          plate_number: vehicle.plateNumber,
          model: vehicle.model,
          vehicle_type: vehicle.vehicleType,
          capacity: vehicle.capacity,
          year: vehicle.year,
          is_active: vehicle.status === 'ACTIVE'
        }
      }
    })

  } catch (error) {
    console.error('Update vehicle error:', error)
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
    const vehicleId = searchParams.get('id')

    if (!vehicleId) {
      return NextResponse.json({ success: false, error: 'Vehicle ID is required' }, { status: 400 })
    }

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!existingVehicle) {
      return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 })
    }

    // Check if vehicle has any active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        vehicleId: vehicleId,
        departureTime: { gte: new Date() }
      }
    })

    if (activeTrips) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete vehicle with upcoming trips. Please reassign or cancel trips first.'
      }, { status: 409 })
    }

    await prisma.vehicle.delete({
      where: { id: vehicleId }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Vehicle deleted successfully' }
    })

  } catch (error) {
    console.error('Delete vehicle error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
