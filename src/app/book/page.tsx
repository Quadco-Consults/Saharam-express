'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Shield,
  CheckCircle
} from 'lucide-react'
import Header from '@/components/Header'
import SeatMap from '@/components/SeatMap'
import { useAuth } from '@/hooks/useAuth'
import { Trip } from '@/types'
import { formatDateTime, formatCurrency, formatSeatNumbers } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const dynamic = 'force-dynamic'

const bookingSchema = z.object({
  passengerName: z.string().min(2, 'Passenger name must be at least 2 characters'),
  passengerPhone: z.string().min(11, 'Please enter a valid phone number'),
  passengerEmail: z.string().email('Please enter a valid email address'),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface TripDetails {
  id: string
  route: {
    from_city: string
    to_city: string
    distance: number
    estimated_duration: number
  }
  departure_time: string
  arrival_time: string
  base_price: number
  total_seats: number
  available_seats: number
  bookedSeats: string[]
  vehicle: {
    plate_number: string
    model: string
    capacity: number
  }
  driver: {
    first_name: string
    last_name: string
  } | null
}

function BookContent() {
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'seats' | 'details' | 'payment'>('seats')

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const tripId = searchParams.get('trip')

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      passengerEmail: user?.email || '',
      passengerPhone: '',
    }
  })

  useEffect(() => {
    if (tripId) {
      fetchTripDetails()
    } else {
      router.push('/search')
    }
  }, [tripId])

  useEffect(() => {
    // Set default values when user data is available
    if (user) {
      setValue('passengerName', `${user.firstName || ''} ${user.lastName || ''}`.trim())
      setValue('passengerEmail', user.email || '')
      setValue('passengerPhone', '')
    }
  }, [user, setValue])

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trip details')
      }

      setTripDetails(data.data)
    } catch (error: any) {
      console.error('Error fetching trip:', error)
      setError(error.message || 'Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  const handleSeatSelect = (seatNumber: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber)
      } else {
        return [...prev, seatNumber]
      }
    })
  }

  const handleContinueToDetails = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat')
      return
    }
    setStep('details')
  }

  const handleContinueToPayment = (data: BookingFormData) => {
    // Store booking data for payment
    setStep('payment')
    initiatePayment(data)
  }

  const initiatePayment = async (bookingData: BookingFormData) => {
    if (!tripDetails || selectedSeats.length === 0) return

    setIsSubmitting(true)

    try {
      // Create booking first
      const bookingResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: tripDetails.id,
          passengerName: bookingData.passengerName,
          passengerPhone: bookingData.passengerPhone,
          passengerEmail: bookingData.passengerEmail,
          selectedSeats,
          totalAmount: tripDetails.base_price * selectedSeats.length
        })
      })

      const bookingResult = await bookingResponse.json()

      if (!bookingResponse.ok) {
        throw new Error(bookingResult.error || 'Failed to create booking')
      }

      // Initialize payment
      const paymentResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'paystack', // Default to Paystack
          bookingId: bookingResult.data.booking.id,
          amount: tripDetails.base_price * selectedSeats.length,
          email: bookingData.passengerEmail,
          customerName: bookingData.passengerName,
          customerPhone: bookingData.passengerPhone,
        })
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'Failed to initialize payment')
      }

      // Redirect to payment gateway
      window.location.href = paymentResult.data.authorizationUrl

    } catch (error: any) {
      console.error('Booking error:', error)
      setError(error.message || 'Failed to process booking')
      setStep('details')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = tripDetails ? tripDetails.base_price * selectedSeats.length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tripDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-xl p-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || 'Trip not found'}
              </h2>
              <p className="text-gray-600 mb-6">
                Please try selecting a different trip or go back to search.
              </p>
              <button
                onClick={() => router.push('/search')}
                className="px-6 py-3 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => step === 'seats' ? router.back() : setStep('seats')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
              <p className="text-gray-600">
                {tripDetails.route.from_city} → {tripDetails.route.to_city}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[
                { key: 'seats', label: 'Select Seats', icon: MapPin },
                { key: 'details', label: 'Passenger Details', icon: User },
                { key: 'payment', label: 'Payment', icon: CreditCard }
              ].map(({ key, label, icon: Icon }, index) => (
                <div key={key} className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    step === key ? "bg-saharan-500 text-white" :
                    (step === 'details' && key === 'seats') || (step === 'payment' && key !== 'payment')
                      ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                  )}>
                    {((step === 'details' && key === 'seats') || (step === 'payment' && key !== 'payment')) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">{label}</span>
                  {index < 2 && <div className="w-8 h-px bg-gray-300 ml-4"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 'seats' && (
                <SeatMap
                  totalSeats={tripDetails.total_seats}
                  bookedSeats={tripDetails.bookedSeats}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSeats={4}
                />
              )}

              {step === 'details' && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Passenger Information</h3>

                  <form onSubmit={handleSubmit(handleContinueToPayment)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('passengerName')}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                          placeholder="Enter passenger full name"
                        />
                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      {errors.passengerName && (
                        <p className="text-red-600 text-sm mt-1">{errors.passengerName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          {...register('passengerPhone')}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                          placeholder="08012345678"
                        />
                        <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      {errors.passengerPhone && (
                        <p className="text-red-600 text-sm mt-1">{errors.passengerPhone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          {...register('passengerEmail')}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                        <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      {errors.passengerEmail && (
                        <p className="text-red-600 text-sm mt-1">{errors.passengerEmail.message}</p>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep('seats')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back to Seats
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-saharan-500 text-white py-3 rounded-lg font-semibold hover:bg-saharan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {tripDetails.route.from_city} → {tripDetails.route.to_city}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tripDetails.vehicle.model} • {tripDetails.vehicle.plate_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(tripDetails.departure_time)}
                      </p>
                      <p className="text-sm text-gray-600">Departure</p>
                    </div>
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatSeatNumbers(selectedSeats)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedSeats.length} passenger{selectedSeats.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per seat</span>
                    <span className="font-medium">{formatCurrency(tripDetails.base_price)}</span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-saharan-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                {step === 'seats' && (
                  <button
                    onClick={handleContinueToDetails}
                    disabled={selectedSeats.length === 0}
                    className="w-full mt-6 bg-saharan-500 text-white py-3 rounded-lg font-semibold hover:bg-saharan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharan-500"></div>
      </div>
    }>
      <BookContent />
    </Suspense>
  )
}