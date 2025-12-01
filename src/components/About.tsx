'use client'
import { Award, Users, MapPin, Target, Shield, Heart } from 'lucide-react'

const stats = [
  { icon: Users, number: '5000+', label: 'Happy Passengers' },
  { icon: MapPin, number: '50+', label: 'Daily Trips' },
  { icon: Award, number: '99.5%', label: 'On-time Performance' },
  { icon: Shield, number: '3+', label: 'Years of Excellence' }
]

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Your safety is our top priority. All our vehicles are regularly maintained and our drivers are thoroughly trained and licensed.'
  },
  {
    icon: Heart,
    title: 'Customer Care',
    description: 'We treat every passenger like family, providing personalized service and support throughout your journey.'
  },
  {
    icon: Target,
    title: 'Reliability',
    description: 'Count on us for punctual departures, accurate schedules, and consistent service quality every time you travel.'
  }
]

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* About Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">About Saharan Express</h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Since 2021, Saharan Express has been Nigeria's trusted partner for safe, comfortable,
            and reliable inter-city transportation between Kano and Kaduna. We combine traditional
            Nigerian hospitality with modern transport technology to deliver an exceptional travel experience.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="bg-saharan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-saharan-600" />
                </div>
                <div className="text-3xl font-bold text-saharan-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Mission & Values */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              To connect Northern Nigeria's major cities through safe, reliable, and affordable
              transportation services while contributing to economic growth and social development
              in our communities.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe that quality transportation is fundamental to progress, and we're committed
              to providing world-class service that exceeds expectations while remaining accessible
              to all Nigerians.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Story</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Founded by transportation industry veterans who understood the need for reliable
              inter-city travel in Northern Nigeria, Saharan Express began with a simple vision:
              to make traveling between Kano and Kaduna safe, comfortable, and dependable.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, we operate a modern fleet of well-maintained vehicles and continue to set
              new standards for passenger transportation in Nigeria, always with our core values
              of safety, reliability, and customer satisfaction at heart.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-12">Our Core Values</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-saharan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-saharan-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-4">{value.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}