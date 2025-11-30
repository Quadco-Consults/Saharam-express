import { NextRequest, NextResponse } from 'next/server'
import { paystackService } from '@/lib/payments/paystack'
import { oPayService } from '@/lib/payments/opay'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gateway,
      bookingId,
      amount,
      email,
      customerName,
      customerPhone,
      metadata
    } = body

    // Validate required fields
    if (!gateway || !bookingId || !amount || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'success')
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment already completed' },
        { status: 400 }
      )
    }

    let paymentResult
    let reference

    // Initialize payment based on gateway
    switch (gateway.toLowerCase()) {
      case 'paystack':
        reference = paystackService.generateReference()
        paymentResult = await paystackService.initializePayment({
          email,
          amount: amount * 100, // Convert to kobo
          reference,
          metadata: {
            bookingId,
            customerName,
            customerPhone,
            ...metadata
          }
        })
        break

      case 'opay':
        reference = oPayService.generateReference()
        paymentResult = await oPayService.initializePayment({
          reference,
          amount: oPayService.formatAmount(amount),
          currency: 'NGN',
          userInfo: {
            userEmail: email,
            userName: customerName,
            userMobile: customerPhone
          },
          productInfo: {
            productName: `Saharam Express Ticket - ${booking.booking_reference}`,
            productDesc: 'Bus ticket booking payment'
          },
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success`
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported payment gateway' },
          { status: 400 }
        )
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount,
        currency: 'NGN',
        gateway,
        gateway_reference: reference,
        gateway_response: paymentResult,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Return payment initialization data
    return NextResponse.json({
      success: true,
      data: {
        reference,
        authorizationUrl: paymentResult.authorization_url || paymentResult.cashierUrl,
        accessCode: paymentResult.access_code,
        gateway,
        payment
      }
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}