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

    return NextResponse.json({
      success: false,
      error: 'Driver creation not implemented yet'
    }, { status: 501 })

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

    return NextResponse.json({
      success: false,
      error: 'Driver update not implemented yet'
    }, { status: 501 })

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

    return NextResponse.json({
      success: false,
      error: 'Driver deletion not implemented yet'
    }, { status: 501 })

  } catch (error) {
    console.error('Driver deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}