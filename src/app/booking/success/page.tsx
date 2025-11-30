'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, Mail, MessageSquare, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import { formatCurrency, formatDateTime, formatSeatNumbers } from '@/utils/formatters'

interface BookingDetails {
  id: string
  booking_reference: string
  passenger_name: string
  passenger_phone: string
  seat_numbers: string[]
  total_amount: number
  payment_status: string
  trip: {
    departure_time: string
    arrival_time: string
    route: {
      from_city: string
      to_city: string
    }
    vehicle: {
      plate_number: string
      model: string
    }
  }
}

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  const reference = searchParams.get('reference')

  useEffect(() => {
    if (reference) {
      verifyPayment()
    }
  }, [reference])

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payments/verify?reference=${reference}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setBooking(data.data.booking)
      } else {
        console.error('Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-2 border-saharam-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </p>
              <a
                href="/support"
                className="inline-flex items-center px-6 py-3 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Your trip has been successfully booked and paid for.
            </p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="bg-saharam-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    {booking.trip.route.from_city} → {booking.trip.route.to_city}
                  </h2>
                  <p className="text-saharam-100">
                    Booking Reference: <span className="font-mono font-medium">{booking.booking_reference}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(booking.total_amount)}</p>
                  <p className="text-saharam-100 text-sm">Total Paid</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure:</span>
                      <span className="font-medium">{formatDateTime(booking.trip.departure_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">
                        {booking.trip.vehicle.model} • {booking.trip.vehicle.plate_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats:</span>
                      <span className="font-medium">{formatSeatNumbers(booking.seat_numbers)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Passenger Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{booking.passenger_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{booking.passenger_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Confirmed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please arrive at the terminal 30 minutes before departure</li>
                  <li>• Bring a valid ID for verification</li>
                  <li>• Your booking reference is required for boarding</li>
                  <li>• Contact us if you need to make changes to your booking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors">
              <Download className="w-4 h-4" />
              Download Ticket
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Mail className="w-4 h-4" />
              Email Receipt
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              SMS Reminder
            </button>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-saharam-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-600">
                    We've sent your ticket and booking confirmation to your email address
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-saharam-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Save your booking reference</p>
                  <p className="text-sm text-gray-600">
                    Keep your booking reference <span className="font-mono bg-gray-100 px-1 rounded">{booking.booking_reference}</span> safe
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-saharam-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Arrive early</p>
                  <p className="text-sm text-gray-600">
                    Be at the terminal 30 minutes before your departure time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <a
              href="/bookings"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View All Bookings
            </a>
            <a
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-saharam-300 text-saharam-600 rounded-lg hover:bg-saharam-50 transition-colors"
            >
              Book Another Trip
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}