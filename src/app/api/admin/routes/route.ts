import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

    // Get all active routes
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('from_city', { ascending: true })

    if (routesError) {
      console.error('Error fetching routes:', routesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch routes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        routes: routes || []
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