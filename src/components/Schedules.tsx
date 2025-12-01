'use client'
import { Clock, MapPin, Car, Users, Calendar, ArrowRight } from 'lucide-react'

const schedules = [
  {
    route: 'Kano → Kaduna',
    distance: '160 km',
    duration: '2 hours',
    dailyTrips: [
      { time: '06:00 AM', arrival: '08:00 AM', vehicle: 'Toyota Hiace', seats: 18 },
      { time: '08:00 AM', arrival: '10:00 AM', vehicle: 'Mercedes Sprinter', seats: 22 },
      { time: '10:00 AM', arrival: '12:00 PM', vehicle: 'Toyota Coaster', seats: 30 },
      { time: '02:00 PM', arrival: '04:00 PM', vehicle: 'Iveco Daily', seats: 25 },
      { time: '04:00 PM', arrival: '06:00 PM', vehicle: 'Ford Transit', seats: 20 },
      { time: '06:00 PM', arrival: '08:00 PM', vehicle: 'Toyota Hiace', seats: 18 }
    ],
    price: '₦2,000'
  },
  {
    route: 'Kaduna → Kano',
    distance: '160 km',
    duration: '2 hours',
    dailyTrips: [
      { time: '06:30 AM', arrival: '08:30 AM', vehicle: 'Mercedes Sprinter', seats: 22 },
      { time: '08:30 AM', arrival: '10:30 AM', vehicle: 'Toyota Coaster', seats: 30 },
      { time: '10:30 AM', arrival: '12:30 PM', vehicle: 'Toyota Hiace', seats: 18 },
      { time: '02:30 PM', arrival: '04:30 PM', vehicle: 'Ford Transit', seats: 20 },
      { time: '04:30 PM', arrival: '06:30 PM', vehicle: 'Iveco Daily', seats: 25 },
      { time: '06:30 PM', arrival: '08:30 PM', vehicle: 'Mercedes Sprinter', seats: 22 }
    ],
    price: '₦2,000'
  },
  {
    route: 'Kano → Lagos',
    distance: '1,050 km',
    duration: '11 hours',
    dailyTrips: [
      { time: '06:00 AM', arrival: '05:00 PM', vehicle: 'Mercedes Sprinter', seats: 22 },
      { time: '10:00 AM', arrival: '09:00 PM', vehicle: 'Toyota Coaster', seats: 30 },
      { time: '02:00 PM', arrival: '01:00 AM+1', vehicle: 'Iveco Daily', seats: 25 }
    ],
    price: '₦6,500'
  },
  {
    route: 'Abuja → Kano',
    distance: '350 km',
    duration: '4 hours',
    dailyTrips: [
      { time: '06:00 AM', arrival: '10:00 AM', vehicle: 'Toyota Coaster', seats: 30 },
      { time: '10:00 AM', arrival: '02:00 PM', vehicle: 'Mercedes Sprinter', seats: 22 },
      { time: '02:00 PM', arrival: '06:00 PM', vehicle: 'Ford Transit', seats: 20 }
    ],
    price: '₦3,500'
  }
]

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Schedules() {
  return (
    <section id="schedules" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Trip Schedules</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plan your journey with our comprehensive daily schedules.
            All times shown are departure times from our terminals.
          </p>
        </div>

        {/* Schedule Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-saharan-50 rounded-xl p-6 text-center border border-saharan-100">
            <Calendar className="w-8 h-8 text-saharan-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Operating Days</h3>
            <p className="text-sm text-gray-600">Monday - Sunday</p>
            <p className="text-xs text-gray-500 mt-1">Reduced service on Sundays</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Punctuality</h3>
            <p className="text-sm text-gray-600">99.5% On-time</p>
            <p className="text-xs text-gray-500 mt-1">We value your time</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Advance Booking</h3>
            <p className="text-sm text-gray-600">Up to 30 days</p>
            <p className="text-xs text-gray-500 mt-1">Secure your seat early</p>
          </div>
        </div>

        {/* Routes and Schedules */}
        <div className="space-y-12">
          {schedules.map((schedule, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8">
              {/* Route Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-saharan-100 p-3 rounded-full">
                    <MapPin className="w-6 h-6 text-saharan-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{schedule.route}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{schedule.distance}</span>
                      <span>•</span>
                      <span>{schedule.duration}</span>
                      <span>•</span>
                      <span className="font-semibold text-saharan-600">{schedule.price}</span>
                    </div>
                  </div>
                </div>
                <button className="bg-saharan-500 text-white px-6 py-3 rounded-lg hover:bg-saharan-600 transition-colors font-medium flex items-center gap-2">
                  Book Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Daily Schedule Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.dailyTrips.map((trip, tripIndex) => (
                  <div key={tripIndex} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-800">{trip.time}</div>
                        <div className="text-sm text-gray-600">Arrives: {trip.arrival}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Available</div>
                        <div className="font-semibold text-green-600">{trip.seats} seats</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4" />
                        <span>{trip.vehicle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="mt-16 bg-yellow-50 rounded-xl p-8 border border-yellow-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Important Schedule Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Boarding Requirements:</h4>
              <ul className="space-y-1">
                <li>• Arrive 30 minutes before departure</li>
                <li>• Valid ID required for all passengers</li>
                <li>• Children under 2 travel free (no seat)</li>
                <li>• Luggage limit: 20kg per passenger</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Schedule Notes:</h4>
              <ul className="space-y-1">
                <li>• Times may vary during holidays</li>
                <li>• Sunday service reduced by 30%</li>
                <li>• Weather conditions may affect timing</li>
                <li>• Free rescheduling up to 24 hours before</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Ready to book your trip? Choose from our available schedules above.
          </p>
          <a
            href="#search"
            className="inline-flex items-center gap-2 bg-saharan-500 text-white px-8 py-4 rounded-lg hover:bg-saharan-600 transition-colors font-medium text-lg"
          >
            Search & Book Trips
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}