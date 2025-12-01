import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

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

    const supabase = await createServerClient()

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', session.user.id)
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

    // Generate payment reference
    const generateReference = (): string => {
      const timestamp = Date.now().toString()
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `PAY_${timestamp}_${random}`
    }

    const reference = generateReference()

    // For testing - simulate payment gateway response
    const paymentResult = {
      authorization_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking-success?booking=${bookingId}&reference=${reference}`,
      access_code: `ac_${reference}`,
      reference: reference
    }

    // Create payment record using service client to bypass RLS
    const serviceSupabase = createServiceClient()
    const { data: payment, error: paymentError } = await serviceSupabase
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
        authorizationUrl: paymentResult.authorization_url || (paymentResult as any).cashierUrl,
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