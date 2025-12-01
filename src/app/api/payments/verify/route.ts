import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { paymentManager, PaymentProvider } from '@/lib/payments/payment-manager'
import { prisma } from '@/lib/prisma'

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
  provider: z.enum(['paystack', 'opay'] as const)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifyPaymentSchema.parse(body)

    // Find booking by payment reference
    const booking = await prisma.booking.findFirst({
      where: { paymentReference: validatedData.reference },
      include: {
        trip: {
          include: {
            route: true,
            vehicle: true
          }
        },
        user: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found for this payment reference' },
        { status: 404 }
      )
    }

    // Verify payment with provider
    const verificationResult = await paymentManager.verifyPayment(
      validatedData.reference,
      validatedData.provider
    )

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || 'Payment verification failed',
          data: {
            reference: validatedData.reference,
            status: verificationResult.status,
            booking: {
              id: booking.id,
              reference: booking.bookingReference,
              status: booking.status,
              paymentStatus: booking.paymentStatus
            }
          }
        },
        { status: 400 }
      )
    }

    // Update booking payment status
    await paymentManager.updateBookingPaymentStatus(
      validatedData.reference,
      verificationResult
    )

    // Get updated booking
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        trip: {
          include: {
            route: true,
            vehicle: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        reference: validatedData.reference,
        provider: validatedData.provider,
        status: verificationResult.status,
        amount: verificationResult.amount,
        paidAt: verificationResult.paidAt,
        gatewayResponse: verificationResult.gatewayResponse,
        booking: {
          id: updatedBooking!.id,
          reference: updatedBooking!.bookingReference,
          status: updatedBooking!.status,
          paymentStatus: updatedBooking!.paymentStatus,
          loyaltyPointsEarned: updatedBooking!.loyaltyPointsEarned,
          trip: {
            route: `${updatedBooking!.trip.route.fromCity} to ${updatedBooking!.trip.route.toCity}`,
            departureTime: updatedBooking!.trip.departureTime,
            vehicle: {
              model: updatedBooking!.trip.vehicle.model,
              plateNumber: updatedBooking!.trip.vehicle.plateNumber
            }
          },
          seatNumbers: updatedBooking!.seatNumbers,
          passengerName: updatedBooking!.passengerName,
          passengerPhone: updatedBooking!.passengerPhone,
          totalAmount: updatedBooking!.totalAmount
        }
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)

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
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')
    const provider = searchParams.get('provider') as PaymentProvider

    if (!reference || !provider) {
      return NextResponse.json(
        { success: false, error: 'Reference and provider are required' },
        { status: 400 }
      )
    }

    // Verify using POST endpoint logic
    return NextResponse.json({ success: false, error: 'Use POST method for verification' }, { status: 405 })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
