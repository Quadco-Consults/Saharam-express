import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { generateQRData, generateQRCode } from '@/lib/qr-code'
import { sendBookingConfirmation, sendPaymentConfirmation } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { paymentReference, gateway } = body

    const supabase = await createServerClient()
    const resolvedParams = await params
    const bookingId = resolvedParams.id

    // Get the current session
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch the booking with trip details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        passenger_name,
        passenger_phone,
        trip_id,
        seat_numbers,
        user_id,
        total_amount,
        trip:trips(
          id,
          departure_time,
          arrival_time,
          route:routes(
            from_city,
            to_city
          )
        ),
        user:users!bookings_user_id_fkey(
          email,
          first_name,
          last_name
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

    // Generate QR code data and image
    const qrData = generateQRData(booking as any)
    const qrCodeImage = await generateQRCode(qrData)

    // Update booking with payment status and QR code
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_reference: paymentReference,
        payment_method: gateway,
        qr_code: qrCodeImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: booking.total_amount,
        currency: 'NGN',
        gateway: gateway,
        gateway_reference: paymentReference,
        status: 'success',
        paid_at: new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      // Don't fail the request if payment record creation fails
    }

    // Send notification (SMS + Email) - don't block response
    try {
      const notificationData = {
        ...updatedBooking,
        qr_code: qrCodeImage,
        trip: booking.trip,
        user: booking.user
      }

      // Send booking confirmation
      const bookingNotification = await sendBookingConfirmation(notificationData)

      // Send payment confirmation
      const paymentNotification = await sendPaymentConfirmation({
        ...updatedBooking,
        user: booking.user,
        payment_method: gateway,
        payment_reference: paymentReference
      })

      console.log('Notifications sent:', {
        booking: bookingNotification,
        payment: paymentNotification
      })
    } catch (error) {
      console.error('Notification error (non-blocking):', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        booking: updatedBooking,
        qr_code: qrCodeImage,
        message: 'Payment completed and QR code generated'
      }
    })

  } catch (error) {
    console.error('Payment completion error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}