import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    // Get drivers with stats
    const drivers = await prisma.driver.findMany()

    // For now, return drivers with placeholder stats
    const driversWithStats = drivers.map(driver => ({
      id: driver.id,
      first_name: driver.firstName,
      last_name: driver.lastName,
      email: driver.email || '',
      phone: driver.phone,
      date_of_birth: driver.licenseExpiry.toISOString(),
      is_verified: driver.status === 'ACTIVE',
      created_at: driver.createdAt.toISOString(),
      updated_at: driver.updatedAt.toISOString(),
      stats: {
        totalTrips: 0,
        completedTrips: 0,
        activeTrips: 0,
        upcomingTrips: 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        drivers: driversWithStats
      }
    })

  } catch (error) {
    console.error('Drivers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.phone) {
      return NextResponse.json({
        success: false,
        error: 'First name, last name, and phone are required'
      }, { status: 400 })
    }

    // Check if email already exists (if provided)
    if (body.email) {
      const existingDriver = await prisma.driver.findUnique({
        where: { email: body.email }
      })

      if (existingDriver) {
        return NextResponse.json({
          success: false,
          error: 'A driver with this email already exists'
        }, { status: 409 })
      }
    }

    // Generate a license number
    const licenseNumber = `LIC-${Date.now().toString().slice(-6)}`

    const driver = await prisma.driver.create({
      data: {
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email || null,
        phone: body.phone,
        licenseNumber: licenseNumber,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: body.is_verified ? 'ACTIVE' : 'INACTIVE',
        rating: 5.0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          first_name: driver.firstName,
          last_name: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          is_verified: driver.status === 'ACTIVE'
        }
      }
    })

  } catch (error) {
    console.error('Driver creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Driver ID is required'
      }, { status: 400 })
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: body.id }
    })

    if (!existingDriver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found'
      }, { status: 404 })
    }

    // Check email uniqueness if being updated
    if (body.email && body.email !== existingDriver.email) {
      const emailExists = await prisma.driver.findUnique({
        where: { email: body.email }
      })

      if (emailExists) {
        return NextResponse.json({
          success: false,
          error: 'A driver with this email already exists'
        }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (body.first_name) updateData.firstName = body.first_name
    if (body.last_name) updateData.lastName = body.last_name
    if (body.email) updateData.email = body.email
    if (body.phone) updateData.phone = body.phone
    if (body.is_verified !== undefined) {
      updateData.status = body.is_verified ? 'ACTIVE' : 'INACTIVE'
    }

    const driver = await prisma.driver.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          first_name: driver.firstName,
          last_name: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          is_verified: driver.status === 'ACTIVE'
        }
      }
    })

  } catch (error) {
    console.error('Driver update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('id')

    if (!driverId) {
      return NextResponse.json({
        success: false,
        error: 'Driver ID is required'
      }, { status: 400 })
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!existingDriver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found'
      }, { status: 404 })
    }

    // Check if driver has any upcoming trips
    const upcomingTrips = await prisma.trip.findFirst({
      where: {
        driverId: driverId,
        departureTime: { gte: new Date() }
      }
    })

    if (upcomingTrips) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete driver with upcoming trips. Please reassign trips first.'
      }, { status: 409 })
    }

    await prisma.driver.delete({
      where: { id: driverId }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Driver deleted successfully' }
    })

  } catch (error) {
    console.error('Driver deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}