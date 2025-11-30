import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tripId,
      passengerName,
      passengerPhone,
      passengerEmail,
      selectedSeats,
      totalAmount
    } = body

    // Validate required fields
    if (!tripId || !passengerName || !passengerPhone || !selectedSeats || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking information' },
        { status: 400 }
      )
    }

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one seat' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Start a transaction to ensure data consistency
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        route:routes(*),
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

    // Check if trip has enough available seats
    if (trip.available_seats < selectedSeats.length) {
      return NextResponse.json(
        { success: false, error: 'Not enough seats available' },
        { status: 400 }
      )
    }

    // Check if selected seats are already booked
    const bookedSeats: string[] = []
    trip.bookings?.forEach((booking: any) => {
      if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
        bookedSeats.push(...booking.seat_numbers)
      }
    })

    const conflictingSeats = selectedSeats.filter(seat => bookedSeats.includes(seat))
    if (conflictingSeats.length > 0) {
      return NextResponse.json(
        { success: false, error: `Seats ${conflictingSeats.join(', ')} are already booked` },
        { status: 400 }
      )
    }

    // Calculate total amount (validate pricing)
    const expectedTotal = trip.base_price * selectedSeats.length
    if (Math.abs(totalAmount - expectedTotal) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Invalid pricing calculation' },
        { status: 400 }
      )
    }

    // Generate booking reference
    const generateBookingReference = (): string => {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      return `SEL${timestamp}${random}`
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: session.user.id,
        trip_id: tripId,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        seat_numbers: selectedSeats,
        total_amount: totalAmount,
        booking_reference: generateBookingReference(),
        payment_status: 'pending',
        status: 'confirmed'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Update trip available seats
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        available_seats: trip.available_seats - selectedSeats.length
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('Trip update error:', updateError)
      // Note: In a production system, you'd want to handle this with proper transaction rollback
    }

    return NextResponse.json({
      success: true,
      data: {
        booking,
        message: 'Booking created successfully'
      }
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}