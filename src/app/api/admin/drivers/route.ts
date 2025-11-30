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

    // Get all drivers
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, is_verified')
      .eq('role', 'driver')
      .order('first_name', { ascending: true })

    if (driversError) {
      console.error('Error fetching drivers:', driversError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        drivers: drivers || []
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