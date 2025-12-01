'use client'
import { Shield, CreditCard, Smartphone, Headphones, MapPin, Clock } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Safe & Reliable',
    description: 'Licensed drivers, insured vehicles, and GPS tracking for your peace of mind'
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Pay safely with Paystack, OPay, or other trusted Nigerian payment gateways'
  },
  {
    icon: Smartphone,
    title: 'Mobile Tickets',
    description: 'Digital tickets with QR codes - no need for paper tickets'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer service to assist with your journey'
  },
  {
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track your trip progress and get live updates on arrival times'
  },
  {
    icon: Clock,
    title: 'Punctual Service',
    description: 'Consistent departure times and reliable schedules you can count on'
  }
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Why Choose Saharan Express?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We combine traditional Nigerian hospitality with modern technology to provide
            the best inter-city transport experience between Kano and Kaduna.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="bg-saharan-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-saharan-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Stats section */}
        <div className="mt-20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl font-bold text-saharan-600 mb-2">5000+</div>
              <div className="text-gray-600">Happy Passengers</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl font-bold text-saharan-600 mb-2">99.5%</div>
              <div className="text-gray-600">On-time Performance</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl font-bold text-saharan-600 mb-2">3 Years</div>
              <div className="text-gray-600">Of Excellence</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl font-bold text-saharan-600 mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}