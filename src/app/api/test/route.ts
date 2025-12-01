import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection and count records
    const [routeCount, vehicleCount, driverCount] = await Promise.all([
      prisma.route.count(),
      prisma.vehicle.count(),
      prisma.driver.count()
    ])

    return NextResponse.json({
      success: true,
      data: {
        database: 'connected',
        counts: {
          routes: routeCount,
          vehicles: vehicleCount,
          drivers: driverCount
        }
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}