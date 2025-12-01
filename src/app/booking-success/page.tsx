'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function BookingSuccessContent() {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingQR, setGeneratingQR] = useState(false)
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const paymentRef = searchParams.get('reference')
  const gateway = searchParams.get('gateway')

  useEffect(() => {
    if (bookingId && paymentRef && gateway) {
      completePayment()
    }
  }, [bookingId, paymentRef, gateway])

  const completePayment = async () => {
    if (!bookingId || !paymentRef || !gateway) return

    try {
      // Complete payment and generate QR code
      const response = await fetch(`/api/bookings/${bookingId}/complete-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentRef,
          gateway: gateway
        })
      })

      if (response.ok) {
        const result = await response.json()
        setBooking(result.data.booking)
      } else {
        console.error('Failed to complete payment')
      }
    } catch (error) {
      console.error('Payment completion error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (!bookingId || !booking) return

    setGeneratingQR(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/qr-code`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        setBooking((prev: any) => ({
          ...prev,
          qr_code: result.data.qr_code
        }))
      }
    } catch (error) {
      console.error('QR generation error:', error)
    } finally {
      setGeneratingQR(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your booking...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold mb-4">Booking not found</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-saharan-500 text-white px-6 py-3 rounded-lg hover:bg-saharan-600 transition-colors"
          >
            Return Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your payment has been processed and your ticket is ready.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Reference</span>
                <span className="font-mono font-bold text-saharan-600">{booking.booking_reference}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Passenger Name</span>
                <span className="font-medium">{booking.passenger_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Seats</span>
                <span className="font-medium">{booking.seat_numbers?.join(', ')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN'
                  }).format(booking.total_amount)}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Payment Confirmed</span>
                </div>
              </div>
            </div>

            {/* QR Code Generation */}
            {!booking.qr_code && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={generateQRCode}
                  disabled={generatingQR}
                  className="w-full flex items-center justify-center gap-2 bg-saharan-500 text-white py-3 px-4 rounded-lg hover:bg-saharan-600 transition-colors disabled:opacity-50"
                >
                  {generatingQR ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate Digital Ticket
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <Link
                href="/bookings"
                className="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View My Bookings
              </Link>

              <Link
                href="/"
                className="block w-full text-center bg-saharan-100 text-saharan-700 py-3 px-4 rounded-lg hover:bg-saharan-200 transition-colors"
              >
                Book Another Trip
              </Link>
            </div>
          </div>

          {/* Digital Ticket */}
          <div>
            {booking.qr_code ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Ticket</h3>
                <div className="text-center">
                  <img
                    src={booking.qr_code}
                    alt="QR Code"
                    className="mx-auto mb-4 w-32 h-32"
                  />
                  <p className="text-sm text-gray-600">
                    Show this QR code to the driver for verification
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Digital Ticket</h3>
                <p className="text-gray-600 mb-4">
                  Generate your digital ticket with QR code for easy verification.
                </p>
                <button
                  onClick={generateQRCode}
                  disabled={generatingQR}
                  className="bg-saharan-500 text-white py-2 px-4 rounded-lg hover:bg-saharan-600 transition-colors disabled:opacity-50"
                >
                  {generatingQR ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Important Information */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Please arrive at the terminal 30 minutes before departure time</li>
            <li>• Present your digital ticket QR code to the driver for verification</li>
            <li>• Carry a valid ID that matches the passenger name on the ticket</li>
            <li>• For changes or cancellations, contact our support team</li>
            <li>• Save this page or take a screenshot of your digital ticket</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharan-500"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}