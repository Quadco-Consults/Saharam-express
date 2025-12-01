import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const createBookingSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  passengerName: z.string().min(1, 'Passenger name is required'),
  passengerPhone: z.string().min(10, 'Valid phone number is required'),
  passengerEmail: z.string().email('Valid email is required'),
  seatNumbers: z.array(z.string()).min(1, 'At least one seat must be selected'),
  loyaltyPointsToUse: z.number().min(0).default(0)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Get authenticated user (optional)
    const user = await getAuthenticatedUser(request)

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: validatedData.tripId },
      include: {
        route: true,
        vehicle: true,
        seatBookings: true
      }
    })

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (!trip.isActive) {
      return NextResponse.json(
        { success: false, error: 'Trip is not available for booking' },
        { status: 400 }
      )
    }

    // Check if trip departure is in the future
    if (new Date(trip.departureTime) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot book trip that has already departed' },
        { status: 400 }
      )
    }

    // Check seat availability
    const bookedSeats = trip.seatBookings.map(sb => sb.seatNumber)
    const requestedSeats = validatedData.seatNumbers
    const unavailableSeats = requestedSeats.filter(seat => bookedSeats.includes(seat))

    if (unavailableSeats.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Seats ${unavailableSeats.join(', ')} are already booked`,
          data: { unavailableSeats, availableSeats: getAvailableSeats(trip.vehicle.capacity, bookedSeats) }
        },
        { status: 400 }
      )
    }

    // Check if requested seats exceed available seats
    if (trip.availableSeats < requestedSeats.length) {
      return NextResponse.json(
        { success: false, error: 'Not enough seats available' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const baseAmount = Number(trip.basePrice) * requestedSeats.length
    let loyaltyPointsUsed = 0
    let discountAmount = 0

    // Apply loyalty points if user is authenticated
    if (user && validatedData.loyaltyPointsToUse > 0) {
      const userWithPoints = await prisma.user.findUnique({
        where: { id: user.id }
      })

      if (userWithPoints && userWithPoints.loyaltyPoints >= validatedData.loyaltyPointsToUse) {
        loyaltyPointsUsed = validatedData.loyaltyPointsToUse
        discountAmount = loyaltyPointsUsed // 1 point = 1 NGN
      }
    }

    const totalAmount = Math.max(0, baseAmount - discountAmount)

    // Generate unique booking reference
    const bookingReference = generateBookingReference()

    // Create booking in database transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId: user?.id || null,
          tripId: validatedData.tripId,
          bookingReference,
          passengerName: validatedData.passengerName,
          passengerPhone: validatedData.passengerPhone,
          passengerEmail: validatedData.passengerEmail,
          seatNumbers: validatedData.seatNumbers,
          totalAmount: totalAmount.toString(),
          status: 'PENDING',
          paymentStatus: totalAmount === 0 ? 'COMPLETED' : 'PENDING',
          loyaltyPointsUsed
        },
        include: {
          trip: {
            include: {
              route: true,
              vehicle: true
            }
          }
        }
      })

      // Create seat bookings
      const seatBookingData = validatedData.seatNumbers.map(seatNumber => ({
        tripId: validatedData.tripId,
        bookingId: newBooking.id,
        seatNumber
      }))

      await tx.seatBooking.createMany({
        data: seatBookingData
      })

      // Update trip available seats
      await tx.trip.update({
        where: { id: validatedData.tripId },
        data: {
          availableSeats: trip.availableSeats - requestedSeats.length
        }
      })

      // Use loyalty points if applicable
      if (loyaltyPointsUsed > 0 && user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            loyaltyPoints: {
              decrement: loyaltyPointsUsed
            }
          }
        })

        await tx.loyaltyTransaction.create({
          data: {
            userId: user.id,
            bookingId: newBooking.id,
            pointsChange: -loyaltyPointsUsed,
            transactionType: 'used',
            description: `Points used for booking ${bookingReference}`
          }
        })
      }

      // If total amount is 0 (fully paid with points), confirm booking
      if (totalAmount === 0) {
        await tx.booking.update({
          where: { id: newBooking.id },
          data: { status: 'CONFIRMED' }
        })
      }

      return newBooking
    })

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          reference: booking.bookingReference,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          passengerName: booking.passengerName,
          passengerPhone: booking.passengerPhone,
          passengerEmail: booking.passengerEmail,
          seatNumbers: booking.seatNumbers,
          totalAmount: booking.totalAmount,
          loyaltyPointsUsed: booking.loyaltyPointsUsed,
          createdAt: booking.createdAt
        },
        trip: {
          id: booking.trip.id,
          route: `${booking.trip.route.fromCity} to ${booking.trip.route.toCity}`,
          departureTime: booking.trip.departureTime,
          arrivalTime: booking.trip.arrivalTime,
          vehicle: {
            model: booking.trip.vehicle.model,
            plateNumber: booking.trip.vehicle.plateNumber,
            capacity: booking.trip.vehicle.capacity
          },
          availableSeats: trip.availableSeats - requestedSeats.length
        },
        pricing: {
          baseAmount,
          discountAmount,
          totalAmount,
          loyaltyPointsUsed
        },
        requiresPayment: totalAmount > 0
      }
    })

  } catch (error) {
    console.error('Booking creation error:', error)

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
      { success: false, error: 'Booking creation failed' },
      { status: 500 }
    )
  }
}

function generateBookingReference(): string {
  const prefix = 'SAH'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

function getAvailableSeats(capacity: number, bookedSeats: string[]): string[] {
  const allSeats: string[] = []

  // Generate seat numbers (A1, A2, B1, B2, etc.)
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seatsPerRow = 4 // Assuming 4 seats per row

  for (let i = 0; i < capacity; i++) {
    const rowIndex = Math.floor(i / seatsPerRow)
    const seatIndex = (i % seatsPerRow) + 1
    const seatNumber = `${rowLetters[rowIndex]}${seatIndex}`
    allSeats.push(seatNumber)
  }

  return allSeats.filter(seat => !bookedSeats.includes(seat))
}
