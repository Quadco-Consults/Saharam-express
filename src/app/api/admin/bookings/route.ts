import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || 'all' // all, pending, confirmed, cancelled, completed
    const paymentStatus = searchParams.get('payment_status') || 'all' // all, pending, completed, failed

    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {}

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus.toUpperCase()
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          trip: {
            select: {
              departureTime: true,
              arrivalTime: true,
              route: {
                select: {
                  fromCity: true,
                  toCity: true
                }
              },
              vehicle: {
                select: {
                  plateNumber: true,
                  model: true
                }
              },
              driver: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ])

    // Format bookings for frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      booking_reference: booking.bookingReference,
      passenger_name: booking.passengerName,
      passenger_phone: booking.passengerPhone,
      passenger_email: booking.passengerEmail,
      seat_numbers: booking.seatNumbers,
      total_amount: Number(booking.totalAmount),
      payment_method: booking.paymentMethod,
      payment_reference: booking.paymentReference,
      status: booking.status.toLowerCase(),
      payment_status: booking.paymentStatus.toLowerCase(),
      qr_code: booking.qrCode,
      loyalty_points_earned: booking.loyaltyPointsEarned,
      loyalty_points_used: booking.loyaltyPointsUsed,
      created_at: booking.createdAt.toISOString(),
      updated_at: booking.updatedAt.toISOString(),
      trip: {
        departure_time: booking.trip.departureTime.toISOString(),
        arrival_time: booking.trip.arrivalTime.toISOString(),
        route: {
          from_city: booking.trip.route.fromCity,
          to_city: booking.trip.route.toCity
        },
        vehicle: {
          plate_number: booking.trip.vehicle.plateNumber,
          model: booking.trip.vehicle.model
        },
        driver: booking.trip.driver ? {
          first_name: booking.trip.driver.firstName,
          last_name: booking.trip.driver.lastName
        } : null
      },
      user: booking.user ? {
        first_name: booking.user.firstName,
        last_name: booking.user.lastName,
        email: booking.user.email
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: body.id },
      include: {
        trip: {
          select: {
            departureTime: true
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Don't allow modification of bookings for trips that have already departed
    if (existingBooking.trip.departureTime < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot modify booking for trips that have already departed'
      }, { status: 409 })
    }

    const updateData: any = {}

    // Update allowed fields
    if (body.status !== undefined) updateData.status = body.status.toUpperCase()
    if (body.payment_status !== undefined) updateData.paymentStatus = body.payment_status.toUpperCase()
    if (body.payment_method !== undefined) updateData.paymentMethod = body.payment_method
    if (body.payment_reference !== undefined) updateData.paymentReference = body.payment_reference

    const booking = await prisma.booking.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          status: booking.status.toLowerCase(),
          payment_status: booking.paymentStatus.toLowerCase(),
          payment_method: booking.paymentMethod,
          payment_reference: booking.paymentReference
        }
      }
    })

  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          select: {
            departureTime: true
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Don't allow deletion of bookings for trips that have already departed
    if (existingBooking.trip.departureTime < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete booking for trips that have already departed'
      }, { status: 409 })
    }

    // Instead of hard delete, mark as cancelled
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Booking cancelled successfully' }
    })

  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}