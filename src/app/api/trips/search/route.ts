import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const date = searchParams.get('date')
    const passengers = searchParams.get('passengers')

    // Validate required parameters
    if (!from || !to || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required search parameters' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Parse date and set time range for the day
    const searchDate = new Date(date)
    const startOfDay = new Date(searchDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(searchDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Find matching route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('from_city', from)
      .eq('to_city', to)
      .eq('is_active', true)
      .single()

    if (routeError || !route) {
      return NextResponse.json({
        success: true,
        data: {
          trips: [],
          totalCount: 0,
          message: `No route available from ${from} to ${to}`
        }
      })
    }

    // Search for trips on the specified date
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        vehicle:vehicles(*),
        driver:users!trips_driver_id_fkey(first_name, last_name)
      `)
      .eq('route_id', route.id)
      .gte('departure_time', startOfDay.toISOString())
      .lt('departure_time', endOfDay.toISOString())
      .eq('status', 'scheduled')
      .gte('available_seats', parseInt(passengers || '1'))
      .order('departure_time', { ascending: true })

    if (tripsError) {
      console.error('Error fetching trips:', tripsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        trips: trips || [],
        totalCount: trips?.length || 0,
        searchCriteria: {
          from,
          to,
          date,
          passengers: parseInt(passengers || '1')
        }
      }
    })

  } catch (error) {
    console.error('Trip search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}