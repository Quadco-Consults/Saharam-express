'use client'
import { Phone, Mail, MapPin, Car } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-saharam-500 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Saharam Express</h3>
                <p className="text-saharam-200 text-sm">EXPRESS LIMITED</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Nigeria's premier inter-city transport service connecting Kano and Kaduna
              with safety, comfort, and reliability at the forefront of everything we do.
            </p>
            <p className="text-saharam-400 italic">
              ...driving excellence one mile at a time
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-saharam-400 transition-colors">
                  Book a Trip
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-saharam-400 transition-colors">
                  My Bookings
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-saharam-400 transition-colors">
                  Schedules
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-saharam-400 transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-saharam-400 transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-saharam-400" />
                <span className="text-gray-300">+234 701 234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-saharam-400" />
                <span className="text-gray-300">info@saharamexpress.com.ng</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-saharam-400 mt-1" />
                <div className="text-gray-300">
                  <p className="font-medium">Kano Office:</p>
                  <p className="text-sm">Sabon Gari Transport Terminal</p>
                  <p className="text-sm">Kano State, Nigeria</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-saharam-400 mt-1" />
                <div className="text-gray-300">
                  <p className="font-medium">Kaduna Office:</p>
                  <p className="text-sm">Central Transport Terminal</p>
                  <p className="text-sm">Kaduna State, Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 mt-12 text-center">
          <p className="text-gray-400">
            © 2024 Saharam Express Limited. All rights reserved. |
            <span className="ml-2">
              <a href="#" className="hover:text-saharam-400 transition-colors">Privacy Policy</a>
              {' '} | {' '}
              <a href="#" className="hover:text-saharam-400 transition-colors">Terms of Service</a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}