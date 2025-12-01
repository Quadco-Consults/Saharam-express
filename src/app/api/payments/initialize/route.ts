import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { paymentManager, PaymentProvider } from '@/lib/payments/payment-manager'
import { prisma } from '@/lib/prisma'

const initializePaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  provider: z.enum(['paystack', 'opay'] as const),
  returnUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = initializePaymentSchema.parse(body)

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        trip: {
          include: {
            route: true
          }
        },
        user: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Booking already paid for' },
        { status: 400 }
      )
    }

    // Initialize payment
    const paymentResult = await paymentManager.initializePayment({
      bookingId: booking.id,
      amount: Number(booking.totalAmount),
      customerEmail: booking.passengerEmail || booking.user?.email || '',
      customerName: booking.passengerName,
      customerPhone: booking.passengerPhone,
      provider: validatedData.provider,
      metadata: {
        tripRoute: `${booking.trip.route.fromCity} to ${booking.trip.route.toCity}`,
        departureTime: booking.trip.departureTime.toISOString(),
        seatNumbers: booking.seatNumbers,
        returnUrl: validatedData.returnUrl
      }
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        reference: paymentResult.reference,
        authorizationUrl: paymentResult.authorizationUrl,
        provider: paymentResult.provider,
        amount: booking.totalAmount,
        booking: {
          id: booking.id,
          reference: booking.bookingReference,
          route: `${booking.trip.route.fromCity} to ${booking.trip.route.toCity}`,
          departureTime: booking.trip.departureTime,
          seatNumbers: booking.seatNumbers,
          passengerName: booking.passengerName
        }
      }
    })

  } catch (error) {
    console.error('Payment initialization error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Payment initialization failed' },
      { status: 500 }
    )
  }
}
