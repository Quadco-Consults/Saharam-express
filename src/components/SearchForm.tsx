'use client'
import { useState } from 'react'
import { ArrowRightLeft, Calendar, Users, Search } from 'lucide-react'

export default function SearchForm() {
  const [formData, setFormData] = useState({
    from: 'Kano',
    to: 'Kaduna',
    departureDate: '',
    passengers: 1
  })

  const handleSwapLocations = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate departure date
    if (!formData.departureDate) {
      alert('Please select a departure date')
      return
    }

    // Create search URL
    const searchParams = new URLSearchParams({
      from: formData.from,
      to: formData.to,
      date: formData.departureDate,
      passengers: formData.passengers.toString()
    })

    // Navigate to search page
    window.location.href = `/search?${searchParams.toString()}`
  }

  return (
    <section id="search" className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Find Your Perfect Trip
          </h2>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="grid md:grid-cols-4 gap-6">
              {/* From/To Selection */}
              <div className="md:col-span-2 relative">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From
                    </label>
                    <select
                      value={formData.from}
                      onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    >
                      <option value="Kano">Kano</option>
                      <option value="Kaduna">Kaduna</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <select
                      value={formData.to}
                      onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    >
                      <option value="Kaduna">Kaduna</option>
                      <option value="Kano">Kano</option>
                    </select>
                  </div>
                </div>

                {/* Swap button */}
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-saharan-500 text-white p-2 rounded-full hover:bg-saharan-600 transition-colors shadow-md"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    required
                  />
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passengers
                </label>
                <div className="relative">
                  <select
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent appearance-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                  <Users className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-8 text-center">
              <button
                type="submit"
                className="bg-saharan-500 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-saharan-600 transition-colors shadow-lg inline-flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search Trips
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}