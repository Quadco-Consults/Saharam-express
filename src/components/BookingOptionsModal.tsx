'use client'
import { X, User, UserPlus, ArrowRight, Shield, Clock, Star } from 'lucide-react'

interface BookingOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onGuestBooking: () => void
  onSignInBooking: () => void
  tripDetails?: {
    route: {
      fromCity: string
      toCity: string
    }
    departureTime: string
    basePrice: number
  }
}

export default function BookingOptionsModal({
  isOpen,
  onClose,
  onGuestBooking,
  onSignInBooking,
  tripDetails
}: BookingOptionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Booking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Summary */}
        {tripDetails && (
          <div className="p-6 bg-saharan-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Selected Trip</h3>
            <div className="text-sm text-gray-600">
              <p>{tripDetails.route.fromCity} → {tripDetails.route.toCity}</p>
              <p>Departure: {tripDetails.departureTime ? new Date(tripDetails.departureTime).toLocaleString() : 'TBD'}</p>
              <p className="font-semibold text-saharan-600">₦{tripDetails.basePrice ? tripDetails.basePrice.toLocaleString() : '0'}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-8 text-center">
            Choose how you'd like to proceed with your booking
          </p>

          {/* Guest Booking Option */}
          <div className="space-y-4">
            <button
              onClick={onGuestBooking}
              className="w-full border-2 border-saharan-200 rounded-xl p-6 hover:border-saharan-300 hover:bg-saharan-50 transition-all group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Book as Guest</h3>
                    <p className="text-sm text-gray-600">Quick booking without account creation</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-saharan-600 transition-colors" />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Faster checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>Email confirmation</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Sign In Option */}
            <button
              onClick={onSignInBooking}
              className="w-full border-2 border-gray-200 rounded-xl p-6 hover:border-saharan-300 hover:bg-gray-50 transition-all group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-saharan-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-saharan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Sign In or Create Account</h3>
                    <p className="text-sm text-gray-600">Access booking history and loyalty benefits</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-saharan-600 transition-colors" />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>Booking history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    <span>Loyalty points</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>Guest Booking:</strong> You'll receive email confirmation and can manage your booking using the confirmation code.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}