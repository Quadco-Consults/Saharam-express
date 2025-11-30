import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { parseQRCode, isQRCodeValid } from '@/lib/qr-code'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCodeData, tripId } = body

    if (!qrCodeData) {
      return NextResponse.json(
        { success: false, error: 'QR code data is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get current user session
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or driver
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || !['admin', 'driver'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin or driver role required' },
        { status: 403 }
      )
    }

    // Parse QR code data
    const qrData = parseQRCode(qrCodeData)
    if (!qrData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code format or tampered data',
        verification: {
          valid: false,
          reason: 'Invalid QR code format'
        }
      }, { status: 400 })
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip:trips(
          id,
          departure_time,
          arrival_time,
          status,
          route:routes(from_city, to_city),
          vehicle:vehicles(model, plate_number)
        ),
        user:users(first_name, last_name, email, phone)
      `)
      .eq('booking_reference', qrData.bookingRef)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        verification: {
          valid: false,
          reason: 'Booking does not exist'
        }
      }, { status: 404 })
    }

    // Verify QR data matches booking
    if (
      booking.trip_id !== qrData.tripId ||
      booking.passenger_name !== qrData.passengerName ||
      JSON.stringify(booking.seat_numbers.sort()) !== JSON.stringify(qrData.seatNumbers.sort())
    ) {
      return NextResponse.json({
        success: false,
        error: 'QR code data does not match booking details',
        verification: {
          valid: false,
          reason: 'Data mismatch detected'
        }
      })
    }

    // Check if trip ID matches (if provided)
    if (tripId && booking.trip_id !== tripId) {
      return NextResponse.json({
        success: false,
        error: 'Ticket is not valid for this trip',
        verification: {
          valid: false,
          reason: 'Wrong trip'
        }
      })
    }

    // Check if booking is paid and confirmed
    if (booking.payment_status !== 'paid' || booking.status !== 'confirmed') {
      return NextResponse.json({
        success: false,
        error: 'Booking is not confirmed or paid',
        verification: {
          valid: false,
          reason: `Booking status: ${booking.status}, Payment: ${booking.payment_status}`
        }
      })
    }

    // Check if QR code is still valid (not expired)
    const validityCheck = isQRCodeValid(qrData, booking.trip)
    if (!validityCheck.valid) {
      return NextResponse.json({
        success: false,
        error: validityCheck.reason || 'Ticket has expired',
        verification: {
          valid: false,
          reason: validityCheck.reason || 'Expired'
        }
      })
    }

    // Check if trip is active
    const tripDate = new Date(booking.trip.departure_time)
    const now = new Date()
    const timeDiff = tripDate.getTime() - now.getTime()
    const hoursUntilDeparture = timeDiff / (1000 * 60 * 60)

    let tripStatus = 'valid'
    let statusMessage = 'Valid ticket'

    if (hoursUntilDeparture < -24) {
      tripStatus = 'expired'
      statusMessage = 'Trip has ended'
    } else if (hoursUntilDeparture < 0) {
      tripStatus = 'boarding_ended'
      statusMessage = 'Trip has departed'
    } else if (hoursUntilDeparture < 2) {
      tripStatus = 'boarding'
      statusMessage = 'Boarding time'
    } else if (hoursUntilDeparture > 24) {
      tripStatus = 'too_early'
      statusMessage = 'Too early for boarding'
    }

    // Log verification attempt
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        type: 'push',
        title: 'Ticket Verified',
        message: `Your ticket for ${booking.trip.route.from_city} to ${booking.trip.route.to_city} was verified at ${new Date().toLocaleString()}`
      })

    return NextResponse.json({
      success: true,
      verification: {
        valid: true,
        status: tripStatus,
        message: statusMessage
      },
      data: {
        booking: {
          reference: booking.booking_reference,
          passenger_name: booking.passenger_name,
          seat_numbers: booking.seat_numbers,
          passenger_phone: booking.user.phone,
          total_amount: booking.total_amount
        },
        trip: {
          id: booking.trip.id,
          departure_time: booking.trip.departure_time,
          route: `${booking.trip.route.from_city} → ${booking.trip.route.to_city}`,
          vehicle: `${booking.trip.vehicle.model} (${booking.trip.vehicle.plate_number})`
        },
        verification_time: new Date().toISOString(),
        verified_by: session.user.id
      }
    })

  } catch (error) {
    console.error('Ticket verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        verification: {
          valid: false,
          reason: 'System error'
        }
      },
      { status: 500 }
    )
  }
}