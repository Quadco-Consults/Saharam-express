import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verify admin user
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Run all queries in parallel
    const [
      totalTripsResult,
      totalBookingsResult,
      totalRevenueResult,
      activeUsersResult,
      todayTripsResult,
      todayBookingsResult,
      monthlyRevenueResult,
      recentBookingsResult,
      upcomingTripsResult
    ] = await Promise.all([
      // Total trips
      supabase
        .from('trips')
        .select('id', { count: 'exact' }),

      // Total bookings
      supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('payment_status', 'paid'),

      // Total revenue
      supabase
        .from('bookings')
        .select('total_amount')
        .eq('payment_status', 'paid'),

      // Active users (users with bookings in last 30 days)
      supabase
        .from('bookings')
        .select('user_id')
        .eq('payment_status', 'paid')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Today's trips
      supabase
        .from('trips')
        .select('id', { count: 'exact' })
        .gte('departure_time', today.toISOString())
        .lt('departure_time', tomorrow.toISOString()),

      // Today's bookings
      supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('payment_status', 'paid')
        .gte('created_at', today.toISOString()),

      // This month revenue
      supabase
        .from('bookings')
        .select('total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', thisMonth.toISOString()),

      // Recent bookings
      supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          passenger_name,
          total_amount,
          created_at,
          trip:trips(
            departure_time,
            route:routes(from_city, to_city)
          )
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(5),

      // Upcoming trips
      supabase
        .from('trips')
        .select(`
          id,
          departure_time,
          available_seats,
          total_seats,
          route:routes(from_city, to_city),
          vehicle:vehicles(plate_number, model)
        `)
        .gte('departure_time', now.toISOString())
        .order('departure_time', { ascending: true })
        .limit(5)
    ])

    // Process results
    const totalTrips = totalTripsResult.count || 0
    const totalBookings = totalBookingsResult.count || 0

    const totalRevenue = totalRevenueResult.data?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0

    const activeUsers = new Set(activeUsersResult.data?.map(b => b.user_id)).size

    const todayTrips = todayTripsResult.count || 0
    const todayBookings = todayBookingsResult.count || 0

    const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0

    // Calculate occupancy rate
    const occupancyData = await supabase
      .from('trips')
      .select('total_seats, available_seats')
      .gte('departure_time', thisMonth.toISOString())

    const totalSeatsThisMonth = occupancyData.data?.reduce((sum, trip) => sum + trip.total_seats, 0) || 0
    const availableSeatsThisMonth = occupancyData.data?.reduce((sum, trip) => sum + trip.available_seats, 0) || 0
    const occupancyRate = totalSeatsThisMonth > 0
      ? ((totalSeatsThisMonth - availableSeatsThisMonth) / totalSeatsThisMonth) * 100
      : 0

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
        recentBookings: recentBookingsResult.data || [],
        upcomingTrips: upcomingTripsResult.data || []
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