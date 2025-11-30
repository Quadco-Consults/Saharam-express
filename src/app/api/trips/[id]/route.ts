import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    // Fetch trip details with related data
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes (
          from_city,
          to_city,
          distance,
          estimated_duration
        ),
        vehicle:vehicles (
          plate_number,
          model,
          capacity
        ),
        driver:users!trips_driver_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching trip:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trip details', details: error.message },
        { status: 500 }
      )
    }

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Fetch booked seats for this trip
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('selected_seats')
      .eq('trip_id', id)
      .eq('status', 'confirmed')

    if (bookingError) {
      console.error('Error fetching bookings:', bookingError)
    }

    // Extract booked seat numbers
    const bookedSeats: string[] = []
    bookings?.forEach(booking => {
      if (booking.selected_seats) {
        bookedSeats.push(...booking.selected_seats)
      }
    })

    // Calculate pricing
    const basePrice = trip.base_price || 4500 // Default price if not set
    const totalSeats = trip.total_seats || trip.vehicle?.capacity || 40

    const tripDetails = {
      ...trip,
      basePrice,
      totalSeats,
      bookedSeats,
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time
    }

    return NextResponse.json({
      success: true,
      data: tripDetails
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
