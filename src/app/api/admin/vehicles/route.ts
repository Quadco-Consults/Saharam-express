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

    // Get all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .order('plate_number', { ascending: true })

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vehicles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        vehicles: vehicles || []
      }
    })

  } catch (error) {
    console.error('Vehicles fetch error:', error)
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
      plate_number,
      model,
      capacity,
      year,
      color,
      last_maintenance,
      next_maintenance
    } = body

    // Validate required fields
    if (!plate_number || !model || !capacity || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: plate_number, model, capacity, year' },
        { status: 400 }
      )
    }

    // Validate data types
    if (isNaN(capacity) || capacity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { success: false, error: 'Year must be valid' },
        { status: 400 }
      )
    }

    // Create vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        plate_number: plate_number.trim().toUpperCase(),
        model: model.trim(),
        capacity: parseInt(capacity),
        year: parseInt(year),
        color: color?.trim(),
        last_maintenance: last_maintenance || null,
        next_maintenance: next_maintenance || null,
        is_active: true
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('Vehicle creation error:', vehicleError)
      if (vehicleError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A vehicle with this plate number already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create vehicle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { vehicle }
    })

  } catch (error) {
    console.error('Vehicle creation error:', error)
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
      plate_number,
      model,
      capacity,
      year,
      color,
      is_active,
      last_maintenance,
      next_maintenance
    } = body

    // Validate required fields
    if (!id || !plate_number || !model || !capacity || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, plate_number, model, capacity, year' },
        { status: 400 }
      )
    }

    // Validate data types
    if (isNaN(capacity) || capacity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { success: false, error: 'Year must be valid' },
        { status: 400 }
      )
    }

    // Update vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .update({
        plate_number: plate_number.trim().toUpperCase(),
        model: model.trim(),
        capacity: parseInt(capacity),
        year: parseInt(year),
        color: color?.trim(),
        is_active: is_active !== undefined ? is_active : true,
        last_maintenance: last_maintenance || null,
        next_maintenance: next_maintenance || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (vehicleError) {
      console.error('Vehicle update error:', vehicleError)
      if (vehicleError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'A vehicle with this plate number already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update vehicle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { vehicle }
    })

  } catch (error) {
    console.error('Vehicle update error:', error)
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
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Check if vehicle is used in any trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .eq('vehicle_id', id)
      .limit(1)

    if (tripsError) {
      console.error('Error checking vehicle usage:', tripsError)
      return NextResponse.json(
        { success: false, error: 'Failed to check vehicle usage' },
        { status: 500 }
      )
    }

    if (trips && trips.length > 0) {
      // Soft delete by setting is_active to false
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (vehicleError) {
        console.error('Vehicle soft delete error:', vehicleError)
        return NextResponse.json(
          { success: false, error: 'Failed to deactivate vehicle' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          vehicle,
          message: 'Vehicle deactivated (cannot be deleted due to existing trips)'
        }
      })
    }

    // Hard delete if not used in any trips
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Vehicle delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete vehicle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Vehicle deleted successfully' }
    })

  } catch (error) {
    console.error('Vehicle delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}