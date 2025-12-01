import { NextRequest, NextResponse } from 'next/server'
import { oPayService } from '@/lib/payments/opay'
import { paymentManager } from '@/lib/payments/payment-manager'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('signature') || ''

    // Verify webhook signature
    if (!oPayService.validateWebhookSignature(payload, signature)) {
      console.error('Invalid OPay webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('OPay webhook received:', payload.status, payload.reference)

    // Handle payment status
    switch (payload.status?.toUpperCase()) {
      case 'SUCCESS':
        await handlePaymentSuccess(payload)
        break

      case 'FAIL':
      case 'CLOSE':
        await handlePaymentFailed(payload)
        break

      case 'PENDING':
      case 'INITIAL':
        // Payment is still processing, no action needed
        console.log(`OPay payment pending: ${payload.reference}`)
        break

      default:
        console.log(`Unhandled OPay webhook status: ${payload.status}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('OPay webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(data: any) {
  try {
    const reference = data.reference

    if (!reference) {
      console.error('No reference in OPay payment success event')
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
      console.error(`Booking not found for OPay reference: ${reference}`)
      return
    }

    if (booking.paymentStatus === 'COMPLETED') {
      console.log(`Payment already processed for booking: ${booking.bookingReference}`)
      return
    }

    // Verify payment with OPay to ensure webhook is legitimate
    const verificationResult = await paymentManager.verifyPayment(reference, 'opay')

    if (verificationResult.success && verificationResult.status === 'success') {
      // Update booking payment status
      await paymentManager.updateBookingPaymentStatus(reference, verificationResult)

      console.log(`OPay payment successful for booking: ${booking.bookingReference}`)

      // TODO: Send confirmation email/SMS to customer
      // await sendBookingConfirmation(booking)

      // TODO: Send notification to admin
      // await sendAdminNotification(booking)

    } else {
      console.error(`OPay payment verification failed for reference: ${reference}`)
    }

  } catch (error) {
    console.error('Error handling OPay payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const reference = data.reference

    if (!reference) {
      console.error('No reference in OPay payment failed event')
      return
    }

    // Find booking by payment reference
    const booking = await prisma.booking.findFirst({
      where: { paymentReference: reference }
    })

    if (!booking) {
      console.error(`Booking not found for OPay reference: ${reference}`)
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

    console.log(`OPay payment failed for booking: ${booking.bookingReference}`)

    // TODO: Send failure notification to customer
    // await sendPaymentFailureNotification(booking, data.failureReason)

  } catch (error) {
    console.error('Error handling OPay payment failure:', error)
    throw error
  }
}