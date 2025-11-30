import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { generateQRData, generateQRCode } from '@/lib/qr-code'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Get the current session
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const bookingId = params.id

    // Fetch the booking with trip details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        passenger_name,
        trip_id,
        seat_numbers,
        payment_status,
        status,
        user_id,
        trip:trips(
          id,
          departure_time,
          arrival_time,
          route:routes(
            from_city,
            to_city
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to booking' },
        { status: 403 }
      )
    }

    // Check if booking is confirmed and paid
    if (booking.payment_status !== 'paid' || booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'QR code only available for confirmed and paid bookings' },
        { status: 400 }
      )
    }

    // Generate QR code data
    const qrData = generateQRData(booking)

    // Generate QR code image
    const qrCodeImage = await generateQRCode(qrData)

    // Update booking with QR code
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        qr_code: qrCodeImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking with QR code:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save QR code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        qr_code: qrCodeImage,
        booking_reference: booking.booking_reference,
        message: 'QR code generated successfully'
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}