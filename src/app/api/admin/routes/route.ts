import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

async function verifyAdminAuth(supabase: any) {
  // Verify admin user
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session?.user) {
    return { error: 'Authentication required', status: 401 }
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (userError || user?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { success: true }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const authResult = await verifyAdminAuth(supabase)

    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get all routes with trip statistics
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .order('from_city', { ascending: true })

    if (routesError) {
      console.error('Error fetching routes:', routesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch routes' },
        { status: 500 }
      )
    }

    // Get trip statistics for each route
    const routesWithStats = await Promise.all(
      (routes || []).map(async (route) => {
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('id, status, departure_date')
          .eq('route_id', route.id)

        let stats = {
          totalTrips: 0,
          activeTrips: 0,
          upcomingTrips: 0,
          completedTrips: 0
        }

        if (!tripsError && trips) {
          stats.totalTrips = trips.length
          stats.activeTrips = trips.filter(t => t.status === 'active').length
          stats.upcomingTrips = trips.filter(t => t.status === 'scheduled').length
          stats.completedTrips = trips.filter(t => t.status === 'completed').length
        }

        return {
          ...route,
          stats
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        routes: routesWithStats
      }
    })

  } catch (error) {
    console.error('Routes fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const authResult = await verifyAdminAuth(supabase)

    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const {
      from_city,
      to_city,
      distance,
      base_fare,
      estimated_duration
    } = body

    // Validate required fields
    if (!from_city || !to_city || !distance || !base_fare || !estimated_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: from_city, to_city, distance, base_fare, estimated_duration' },
        { status: 400 }
      )
    }

    // Validate data types
    if (isNaN(distance) || distance <= 0) {
      return NextResponse.json(
        { success: false, error: 'Distance must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(base_fare) || base_fare <= 0) {
      return NextResponse.json(
        { success: false, error: 'Base fare must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(estimated_duration) || estimated_duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'Estimated duration must be a positive number (in minutes)' },
        { status: 400 }
      )
    }

    // Prevent duplicate city combinations
    if (from_city.trim().toLowerCase() === to_city.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'From and to cities must be different' },
        { status: 400 }
      )
    }

    // Create route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert({
        from_city: from_city.trim(),
        to_city: to_city.trim(),
        distance: parseInt(distance),
        base_fare: parseFloat(base_fare),
        estimated_duration: parseInt(estimated_duration),
        is_active: true
      })
      .select()
      .single()

    if (routeError) {
      console.error('Route creation error:', routeError)
      if (routeError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A route between these cities already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create route' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { route }
    })

  } catch (error) {
    console.error('Route creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const authResult = await verifyAdminAuth(supabase)

    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const {
      id,
      from_city,
      to_city,
      distance,
      base_fare,
      estimated_duration,
      is_active
    } = body

    // Validate required fields
    if (!id || !from_city || !to_city || !distance || !base_fare || !estimated_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, from_city, to_city, distance, base_fare, estimated_duration' },
        { status: 400 }
      )
    }

    // Validate data types
    if (isNaN(distance) || distance <= 0) {
      return NextResponse.json(
        { success: false, error: 'Distance must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(base_fare) || base_fare <= 0) {
      return NextResponse.json(
        { success: false, error: 'Base fare must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(estimated_duration) || estimated_duration <= 0) {
      return NextResponse.json(
        { success: false, error: 'Estimated duration must be a positive number (in minutes)' },
        { status: 400 }
      )
    }

    // Prevent duplicate city combinations
    if (from_city.trim().toLowerCase() === to_city.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'From and to cities must be different' },
        { status: 400 }
      )
    }

    // Update route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .update({
        from_city: from_city.trim(),
        to_city: to_city.trim(),
        distance: parseInt(distance),
        base_fare: parseFloat(base_fare),
        estimated_duration: parseInt(estimated_duration),
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (routeError) {
      console.error('Route update error:', routeError)
      if (routeError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A route between these cities already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update route' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { route }
    })

  } catch (error) {
    console.error('Route update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const authResult = await verifyAdminAuth(supabase)

    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Route ID is required' },
        { status: 400 }
      )
    }

    // Check if route is used in any trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .eq('route_id', id)
      .limit(1)

    if (tripsError) {
      console.error('Error checking route usage:', tripsError)
      return NextResponse.json(
        { success: false, error: 'Failed to check route usage' },
        { status: 500 }
      )
    }

    if (trips && trips.length > 0) {
      // Soft delete by setting is_active to false
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (routeError) {
        console.error('Route soft delete error:', routeError)
        return NextResponse.json(
          { success: false, error: 'Failed to deactivate route' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          route,
          message: 'Route deactivated (cannot be deleted due to existing trips)'
        }
      })
    }

    // Hard delete if not used in any trips
    const { error: deleteError } = await supabase
      .from('routes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Route delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete route' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Route deleted successfully' }
    })

  } catch (error) {
    console.error('Route delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}