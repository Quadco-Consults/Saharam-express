'use client'
import { Car, Star, Shield, Clock } from 'lucide-react'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-saharam-500 via-saharam-400 to-saharam-600 opacity-90" />

      {/* Pattern overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full p-4 shadow-2xl">
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-16 h-16 text-saharam-500" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            Saharam Express
          </h1>
          <p className="text-xl md:text-2xl font-light mb-2">EXPRESS LIMITED</p>
          <div className="w-24 h-px bg-saharam-200 mx-auto mb-4" />
          <p className="text-lg italic">...driving excellence one mile at a time</p>
        </div>

        {/* Value propositions */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="flex flex-col items-center">
            <Shield className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
            <p className="text-saharam-100">Professional drivers and well-maintained vehicles</p>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Always On Time</h3>
            <p className="text-saharam-100">Reliable schedules you can count on</p>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Premium Service</h3>
            <p className="text-saharam-100">Comfortable rides at competitive prices</p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Kano ↔ Kaduna Daily Service
          </h2>
          <p className="text-xl mb-8 text-saharam-100">
            Book your comfortable journey today
          </p>
          <button className="bg-white text-saharam-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-saharam-50 transition-colors shadow-lg">
            Book Your Trip Now
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}