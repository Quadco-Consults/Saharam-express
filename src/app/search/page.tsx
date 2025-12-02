'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, Calendar, MapPin, Users } from 'lucide-react'
import Header from '@/components/Header'
import TripCard from '@/components/TripCard'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'
import BookingOptionsModal from '@/components/BookingOptionsModal'
import ErrorBoundary from '@/components/ErrorBoundary'
import ClientOnlyOfflineIndicator from '@/components/ClientOnlyOfflineIndicator'
import { Trip } from '@/types'
import { formatDate } from '@/utils/formatters'
import { apiClient } from '@/lib/api-client'

export const dynamic = 'force-dynamic'

interface SearchResults {
  results: {
    total: number
    trips: any[]
  }
  searchCriteria: {
    fromCity: string
    toCity: string
    departureDate: string
    passengers: number
  }
}

function SearchContent() {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBookingOptions, setShowBookingOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const from = searchParams.get('from') || 'Kano'
  const to = searchParams.get('to') || 'Kaduna'
  const date = searchParams.get('date') || ''
  const passengers = parseInt(searchParams.get('passengers') || '1')

  useEffect(() => {
    if (from && to && date) {
      searchTrips()
    }
  }, [from, to, date, passengers])

  const searchTrips = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.searchTrips(from, to, date, passengers)

      if (!response.success) {
        throw new Error(response.error || 'Failed to search trips')
      }

      if (!response.data) {
        throw new Error('No search results received')
      }

      setSearchResults(response.data)
    } catch (error: any) {
      console.error('Search error:', error)
      setError(error.message || 'Failed to search for trips')
    } finally {
      setLoading(false)
    }
  }

  const handleTripSelect = (trip: any) => {
    setSelectedTrip(trip)

    if (!isAuthenticated) {
      setShowBookingOptions(true)
      return
    }

    // Navigate to booking page for authenticated users
    router.push(`/book?tripId=${trip.id}`)
  }

  const handleGuestBooking = () => {
    if (selectedTrip) {
      // Navigate to booking page with guest flag
      router.push(`/book?tripId=${selectedTrip.id}&guest=true`)
      setShowBookingOptions(false)
      setSelectedTrip(null)
    }
  }

  const handleSignInAndBook = () => {
    // Close booking options and show auth modal
    setShowBookingOptions(false)
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    // After successful authentication, proceed to booking
    if (selectedTrip) {
      router.push(`/book?tripId=${selectedTrip.id}`)
      setShowAuthModal(false)
      setSelectedTrip(null)
    }
  }

  const handleBackToSearch = () => {
    router.push('/#search')
  }

  const handleNewSearch = () => {
    router.push('/#search')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientOnlyOfflineIndicator />
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* Search Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToSearch}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Trips</h1>
            <p className="text-gray-600">
              {from} → {to} • {date ? formatDate(date) : ''} • {passengers} passenger{passengers > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search Summary Card */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-saharan-500" />
                <span className="font-medium">{from} → {to}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-saharan-500" />
                <span className="font-medium">{date ? formatDate(date) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-saharan-500" />
                <span className="font-medium">{passengers} passenger{passengers > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              onClick={handleNewSearch}
              className="flex items-center gap-2 px-4 py-2 border border-saharan-300 text-saharan-600 rounded-lg hover:bg-saharan-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              New Search
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-48"></div>
                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="text-center space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
                      <div className="h-4 bg-gray-300 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-300 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 rounded w-40"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={searchTrips}
              className="px-6 py-3 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : searchResults && searchResults.results.trips.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Found {searchResults.results.total} trip{searchResults.results.total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sort by:</span>
                <select className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-saharan-500 focus:border-transparent">
                  <option value="departure">Departure Time</option>
                  <option value="price">Price</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {searchResults.results.trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onSelect={handleTripSelect}
                  isSelected={selectedTrip?.id === trip.id}
                />
              ))}
            </div>
          </div>
        ) : searchResults ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trips Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any available trips for your search criteria.
              Try adjusting your dates or passenger count.
            </p>
            <button
              onClick={handleNewSearch}
              className="px-6 py-3 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors"
            >
              Modify Search
            </button>
          </div>
        ) : null}
      </div>

      {/* Booking Options Modal */}
      <BookingOptionsModal
        isOpen={showBookingOptions}
        onClose={() => {
          setShowBookingOptions(false)
          setSelectedTrip(null)
        }}
        onGuestBooking={handleGuestBooking}
        onSignInBooking={handleSignInAndBook}
        tripDetails={selectedTrip}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          setSelectedTrip(null)
        }}
        mode="signin"
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharan-500"></div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </ErrorBoundary>
  )
}