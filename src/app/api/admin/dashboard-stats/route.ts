import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify admin user
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Run all queries in parallel
    const [
      totalTrips,
      totalBookings,
      totalRevenueData,
      activeUsersData,
      todayTrips,
      todayBookings,
      monthlyRevenueData,
      recentBookings,
      upcomingTrips,
      occupancyData
    ] = await Promise.all([
      // Total trips
      prisma.trip.count(),

      // Total bookings
      prisma.booking.count({
        where: { paymentStatus: 'COMPLETED' }
      }),

      // Total revenue
      prisma.booking.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true }
      }),

      // Active users (users with bookings in last 30 days)
      prisma.booking.findMany({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { userId: true },
        distinct: ['userId']
      }),

      // Today's trips
      prisma.trip.count({
        where: {
          departureTime: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // Today's bookings
      prisma.booking.count({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: today }
        }
      }),

      // This month revenue
      prisma.booking.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thisMonth }
        },
        _sum: { totalAmount: true }
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: { paymentStatus: 'COMPLETED' },
        include: {
          trip: {
            include: {
              route: {
                select: { fromCity: true, toCity: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Upcoming trips
      prisma.trip.findMany({
        where: {
          departureTime: { gte: now }
        },
        include: {
          route: {
            select: { fromCity: true, toCity: true }
          },
          vehicle: {
            select: { plateNumber: true, model: true }
          }
        },
        orderBy: { departureTime: 'asc' },
        take: 5
      }),

      // Occupancy data for this month
      prisma.trip.findMany({
        where: {
          departureTime: { gte: thisMonth }
        },
        select: { totalSeats: true, availableSeats: true }
      })
    ])

    // Process results
    const totalRevenue = Number(totalRevenueData._sum.totalAmount) || 0
    const activeUsers = activeUsersData.length
    const monthlyRevenue = Number(monthlyRevenueData._sum.totalAmount) || 0

    // Calculate occupancy rate
    const totalSeatsThisMonth = occupancyData.reduce((sum, trip) => sum + trip.totalSeats, 0)
    const availableSeatsThisMonth = occupancyData.reduce((sum, trip) => sum + trip.availableSeats, 0)
    const occupancyRate = totalSeatsThisMonth > 0
      ? ((totalSeatsThisMonth - availableSeatsThisMonth) / totalSeatsThisMonth) * 100
      : 0

    // Format recent bookings
    const formattedRecentBookings = recentBookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.bookingReference,
      passengerName: booking.passengerName,
      totalAmount: Number(booking.totalAmount),
      createdAt: booking.createdAt.toISOString(),
      trip: {
        departureTime: booking.trip.departureTime.toISOString(),
        route: {
          fromCity: booking.trip.route.fromCity,
          toCity: booking.trip.route.toCity
        }
      }
    }))

    // Format upcoming trips
    const formattedUpcomingTrips = upcomingTrips.map(trip => ({
      id: trip.id,
      departureTime: trip.departureTime.toISOString(),
      availableSeats: trip.availableSeats,
      totalSeats: trip.totalSeats,
      route: {
        fromCity: trip.route.fromCity,
        toCity: trip.route.toCity
      },
      vehicle: {
        plateNumber: trip.vehicle.plateNumber,
        model: trip.vehicle.model
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTrips,
          totalBookings,
          totalRevenue,
          activeUsers,
          todayTrips,
          todayBookings,
          monthlyRevenue,
          occupancyRate: Math.round(occupancyRate * 10) / 10
        },
        recentBookings: formattedRecentBookings,
        upcomingTrips: formattedUpcomingTrips
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}