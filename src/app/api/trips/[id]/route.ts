import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get trip details with related data
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
        vehicle:vehicles(*),
        driver:users!trips_driver_id_fkey(first_name, last_name),
        bookings(seat_numbers, status, payment_status)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Calculate booked seats from all confirmed bookings
    const bookedSeats: string[] = []

    trip.bookings?.forEach((booking: any) => {
      if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
        bookedSeats.push(...booking.seat_numbers)
      }
    })

    // Remove bookings from response for security
    const { bookings, ...tripData } = trip

    return NextResponse.json({
      success: true,
      data: {
        ...tripData,
        bookedSeats: [...new Set(bookedSeats)] // Remove duplicates
      }
    })

  } catch (error) {
    console.error('Trip fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}