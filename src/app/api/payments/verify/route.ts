import { NextRequest, NextResponse } from 'next/server'
import { paystackService } from '@/lib/payments/paystack'
import { oPayService } from '@/lib/payments/opay'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          *,
          trip:trips(
            *,
            route:routes(*),
            vehicle:vehicles(*)
          )
        )
      `)
      .eq('gateway_reference', reference)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If already verified, return the existing data
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        data: {
          payment,
          booking: payment.booking
        }
      })
    }

    // Verify payment with the gateway
    let verificationResult
    try {
      switch (payment.gateway) {
        case 'paystack':
          verificationResult = await paystackService.verifyPayment(reference)
          break
        case 'opay':
          verificationResult = await oPayService.verifyPayment(reference)
          break
        default:
          throw new Error('Unsupported payment gateway')
      }
    } catch (error) {
      console.error('Gateway verification error:', error)
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Check if payment was successful
    const isPaymentSuccessful =
      (payment.gateway === 'paystack' && verificationResult.status === 'success') ||
      (payment.gateway === 'opay' && verificationResult.code === '00000')

    if (isPaymentSuccessful) {
      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          paid_at: new Date().toISOString(),
          gateway_response: verificationResult
        })
        .eq('id', payment.id)

      if (updatePaymentError) {
        console.error('Payment update error:', updatePaymentError)
      }

      // Update booking payment status
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid'
        })
        .eq('id', payment.booking_id)

      if (updateBookingError) {
        console.error('Booking update error:', updateBookingError)
      }

      // Get updated booking data
      const { data: updatedBooking, error: bookingFetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            *,
            route:routes(*),
            vehicle:vehicles(*)
          )
        `)
        .eq('id', payment.booking_id)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          payment: { ...payment, status: 'success' },
          booking: updatedBooking || payment.booking,
          message: 'Payment verified successfully'
        }
      })
    } else {
      // Update payment as failed
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          gateway_response: verificationResult
        })
        .eq('id', payment.id)

      if (updatePaymentError) {
        console.error('Payment update error:', updatePaymentError)
      }

      // Update booking payment status
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed'
        })
        .eq('id', payment.booking_id)

      if (updateBookingError) {
        console.error('Booking update error:', updateBookingError)
      }

      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}