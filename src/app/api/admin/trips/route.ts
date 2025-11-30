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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('trips')
      .select(`
        *,
        route:routes(from_city, to_city),
        vehicle:vehicles(plate_number, model),
        driver:users!trips_driver_id_fkey(first_name, last_name)
      `)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)

      query = query
        .gte('departure_time', startDate.toISOString())
        .lt('departure_time', endDate.toISOString())
    }

    // Order and paginate
    query = query
      .order('departure_time', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: trips, error: tripsError, count } = await query

    if (tripsError) {
      console.error('Error fetching trips:', tripsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        trips: trips || [],
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Admin trips fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      routeId,
      vehicleId,
      driverId,
      departureTime,
      arrivalTime,
      basePrice
    } = body

    // Validate required fields
    if (!routeId || !vehicleId || !driverId || !departureTime || !arrivalTime || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get vehicle capacity
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('capacity')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        route_id: routeId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        available_seats: vehicle.capacity,
        total_seats: vehicle.capacity,
        base_price: basePrice,
        status: 'scheduled'
      })
      .select(`
        *,
        route:routes(from_city, to_city),
        vehicle:vehicles(plate_number, model),
        driver:users!trips_driver_id_fkey(first_name, last_name)
      `)
      .single()

    if (tripError) {
      console.error('Trip creation error:', tripError)
      return NextResponse.json(
        { success: false, error: 'Failed to create trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        trip,
        message: 'Trip created successfully'
      }
    })

  } catch (error) {
    console.error('Trip creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}