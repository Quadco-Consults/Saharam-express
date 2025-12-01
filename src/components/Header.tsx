'use client'
import { useState } from 'react'
import { Car, Menu, X, User, LogOut, Settings, History } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthModal from './AuthModal'
import { cn } from '@/utils/cn'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const { user, signOut, isAuthenticated, isAdmin } = useAuth()

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-saharam-500 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Saharam Express</h1>
                <p className="text-xs text-saharam-600 hidden sm:block">Express Limited</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-saharam-600 transition-colors">
                Home
              </a>
              <a href="#search" className="text-gray-700 hover:text-saharam-600 transition-colors">
                Book Trip
              </a>
              <a href="#schedules" className="text-gray-700 hover:text-saharam-600 transition-colors">
                Schedules
              </a>
              <a href="#about" className="text-gray-700 hover:text-saharam-600 transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-700 hover:text-saharam-600 transition-colors">
                Contact
              </a>
              {isAdmin && (
                <a href="/admin" className="text-saharam-600 hover:text-saharam-700 font-medium transition-colors">
                  Admin Dashboard
                </a>
              )}
            </nav>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-saharam-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role || 'Customer'}
                      </p>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <a
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </a>
                      <a
                        href="/bookings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <History className="w-4 h-4" />
                        My Bookings
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </a>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="px-4 py-2 text-saharam-600 hover:text-saharam-700 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-4 py-2 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="space-y-2">
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Home
                </a>
                <a
                  href="#search"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Book Trip
                </a>
                <a
                  href="#schedules"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Schedules
                </a>
                <a
                  href="#about"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  About
                </a>
                <a
                  href="#contact"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Contact
                </a>
                {isAdmin && (
                  <a
                    href="/admin"
                    className="block px-4 py-2 text-saharam-600 hover:bg-saharam-50 rounded-lg transition-colors font-medium"
                  >
                    Admin Dashboard
                  </a>
                )}
              </nav>

              {/* Mobile Auth */}
              {isAuthenticated && user ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-4 py-2 mb-3">
                    <div className="w-10 h-10 bg-saharam-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {user.role || 'Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <a
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </a>
                    <a
                      href="/bookings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <History className="w-4 h-4" />
                      My Bookings
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="block w-full text-left px-4 py-2 text-saharam-600 hover:bg-saharam-50 rounded-lg font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="block w-full text-left px-4 py-2 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  )
}