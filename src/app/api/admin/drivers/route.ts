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

    // Get all drivers with additional stats
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        is_verified,
        created_at,
        updated_at
      `)
      .eq('role', 'driver')
      .order('first_name', { ascending: true })

    if (driversError) {
      console.error('Error fetching drivers:', driversError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    // Get trip statistics for each driver
    const driversWithStats = await Promise.all(
      (drivers || []).map(async (driver) => {
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('id, status, departure_date')
          .eq('driver_id', driver.id)

        let stats = {
          totalTrips: 0,
          completedTrips: 0,
          activeTrips: 0,
          upcomingTrips: 0
        }

        if (!tripsError && trips) {
          stats.totalTrips = trips.length
          stats.completedTrips = trips.filter(t => t.status === 'completed').length
          stats.activeTrips = trips.filter(t => t.status === 'active').length
          stats.upcomingTrips = trips.filter(t => t.status === 'scheduled').length
        }

        return {
          ...driver,
          stats
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        drivers: driversWithStats
      }
    })

  } catch (error) {
    console.error('Drivers fetch error:', error)
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
      first_name,
      last_name,
      email,
      phone,
      date_of_birth
    } = body

    // Validate required fields
    if (!first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: first_name, last_name, email, phone' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    if (phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Create driver
    const { data: driver, error: driverError } = await supabase
      .from('users')
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        date_of_birth: date_of_birth || null,
        role: 'driver',
        is_verified: true // Admin-created drivers are auto-verified
      })
      .select()
      .single()

    if (driverError) {
      console.error('Driver creation error:', driverError)
      if (driverError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Email or phone number already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { driver }
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
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      is_verified
    } = body

    // Validate required fields
    if (!id || !first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, first_name, last_name, email, phone' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format
    if (phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Ensure we're only updating driver accounts
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      )
    }

    if (existingUser.role !== 'driver') {
      return NextResponse.json(
        { success: false, error: 'Can only update driver accounts' },
        { status: 400 }
      )
    }

    // Update driver
    const { data: driver, error: driverError } = await supabase
      .from('users')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        date_of_birth: date_of_birth || null,
        is_verified: is_verified !== undefined ? is_verified : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'driver')
      .select()
      .single()

    if (driverError) {
      console.error('Driver update error:', driverError)
      if (driverError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Email or phone number already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { driver }
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
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Check if driver is assigned to any trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, status')
      .eq('driver_id', id)
      .limit(1)

    if (tripsError) {
      console.error('Error checking driver usage:', tripsError)
      return NextResponse.json(
        { success: false, error: 'Failed to check driver usage' },
        { status: 500 }
      )
    }

    if (trips && trips.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete driver with assigned trips. Update trips first.' },
        { status: 400 }
      )
    }

    // Check if it's actually a driver account
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      )
    }

    if (existingUser.role !== 'driver') {
      return NextResponse.json(
        { success: false, error: 'Can only delete driver accounts' },
        { status: 400 }
      )
    }

    // Delete driver
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'driver')

    if (deleteError) {
      console.error('Driver delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Driver deleted successfully' }
    })

  } catch (error) {
    console.error('Driver delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}