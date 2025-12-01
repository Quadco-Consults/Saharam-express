import { NextRequest, NextResponse } from 'next/server'
import { paystackService } from '@/lib/payments/paystack'
import { paymentManager } from '@/lib/payments/payment-manager'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    // Verify webhook signature
    if (!paystackService.validateWebhookSignature(payload, signature)) {
      console.error('Invalid Paystack webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    console.log('Paystack webhook received:', event.event, event.data?.reference)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data)
        break

      case 'transfer.success':
      case 'transfer.failed':
      case 'transfer.reversed':
        // Handle transfer events if needed for refunds
        console.log(`Transfer event: ${event.event}`, event.data?.reference)
        break

      default:
        console.log(`Unhandled Paystack webhook event: ${event.event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference

    if (!reference) {
      console.error('No reference in Paystack charge success event')
      return
    }

    // Find booking by payment reference
    const booking = await prisma.booking.findFirst({
      where: { paymentReference: reference },
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
      console.error(`Booking not found for Paystack reference: ${reference}`)
      return
    }

    if (booking.paymentStatus === 'COMPLETED') {
      console.log(`Payment already processed for booking: ${booking.bookingReference}`)
      return
    }

    // Verify payment with Paystack to ensure webhook is legitimate
    const verificationResult = await paymentManager.verifyPayment(reference, 'paystack')

    if (verificationResult.success && verificationResult.status === 'success') {
      // Update booking payment status
      await paymentManager.updateBookingPaymentStatus(reference, verificationResult)

      console.log(`Payment successful for booking: ${booking.bookingReference}`)

      // TODO: Send confirmation email/SMS to customer
      // await sendBookingConfirmation(booking)

      // TODO: Send notification to admin
      // await sendAdminNotification(booking)

    } else {
      console.error(`Payment verification failed for reference: ${reference}`)
    }

  } catch (error) {
    console.error('Error handling Paystack charge success:', error)
    throw error
  }
}

async function handleChargeFailed(data: any) {
  try {
    const reference = data.reference

    if (!reference) {
      console.error('No reference in Paystack charge failed event')
      return
    }

    // Find booking by payment reference
    const booking = await prisma.booking.findFirst({
      where: { paymentReference: reference }
    })

    if (!booking) {
      console.error(`Booking not found for Paystack reference: ${reference}`)
      return
    }

    // Update booking status to failed
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Release reserved seats
    await prisma.seatBooking.deleteMany({
      where: { bookingId: booking.id }
    })

    // Restore available seats to trip
    await prisma.trip.update({
      where: { id: booking.tripId },
      data: {
        availableSeats: {
          increment: booking.seatNumbers.length
        }
      }
    })

    console.log(`Payment failed for booking: ${booking.bookingReference}`)

    // TODO: Send failure notification to customer
    // await sendPaymentFailureNotification(booking, data.gateway_response)

  } catch (error) {
    console.error('Error handling Paystack charge failure:', error)
    throw error
  }
}