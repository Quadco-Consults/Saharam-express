'use client'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Car,
  CreditCard,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { formatCurrency, formatDateTime, formatDate } from '@/utils/formatters'

interface DashboardStats {
  overview: {
    totalTrips: number
    totalBookings: number
    totalRevenue: number
    activeUsers: number
    todayTrips: number
    todayBookings: number
    monthlyRevenue: number
    occupancyRate: number
  }
  recentBookings: {
    id: string
    booking_reference: string
    passenger_name: string
    total_amount: number
    created_at: string
    trip: {
      departure_time: string
      route: {
        from_city: string
        to_city: string
      }
    }
  }[]
  upcomingTrips: {
    id: string
    departure_time: string
    available_seats: number
    total_seats: number
    route: {
      from_city: string
      to_city: string
    }
    vehicle: {
      plate_number: string
      model: string
    }
  }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      const data = await response.json()

      if (response.ok && data.success) {
        setStats(data.data)
      } else {
        console.error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load dashboard data</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-saharam-500 text-white rounded-lg hover:bg-saharam-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { overview, recentBookings, upcomingTrips } = stats

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue),
      icon: CreditCard,
      color: 'green',
      trend: '+12.5%'
    },
    {
      name: 'Total Bookings',
      value: overview.totalBookings.toLocaleString(),
      icon: Calendar,
      color: 'blue',
      trend: '+8.2%'
    },
    {
      name: 'Active Users',
      value: overview.activeUsers.toLocaleString(),
      icon: Users,
      color: 'purple',
      trend: '+5.1%'
    },
    {
      name: 'Occupancy Rate',
      value: `${overview.occupancyRate}%`,
      icon: Car,
      color: 'orange',
      trend: '+2.3%'
    }
  ]

  const todayStats = [
    {
      name: "Today's Trips",
      value: overview.todayTrips,
      icon: Calendar
    },
    {
      name: "Today's Bookings",
      value: overview.todayBookings,
      icon: CreditCard
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(overview.monthlyRevenue),
      icon: TrendingUp
    },
    {
      name: 'Total Trips',
      value: overview.totalTrips,
      icon: Car
    }
  ]

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Last updated</p>
            <p className="text-lg font-medium text-gray-900">{formatDateTime(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">{stat.trend}</span>
                  <span className="text-sm text-gray-600">from last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Today's Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {todayStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-saharam-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-saharam-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                  <a
                    href="/admin/bookings"
                    className="text-saharam-600 hover:text-saharam-700 text-sm font-medium"
                  >
                    View all
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{booking.passenger_name}</p>
                            <p className="text-sm text-gray-600">
                              {booking.trip.route.from_city} → {booking.trip.route.to_city}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {booking.booking_reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(booking.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(booking.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
                  <a
                    href="/admin/trips"
                    className="text-saharam-600 hover:text-saharam-700 text-sm font-medium"
                  >
                    View all
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-saharam-100 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-saharam-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {trip.route.from_city} → {trip.route.to_city}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trip.vehicle.model} • {trip.vehicle.plate_number}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(trip.departure_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {trip.available_seats}/{trip.total_seats} seats available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/trips/create"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-8 h-8 text-saharam-600" />
                <div>
                  <p className="font-medium text-gray-900">Schedule Trip</p>
                  <p className="text-sm text-gray-600">Create a new trip</p>
                </div>
              </a>
              <a
                href="/admin/vehicles"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Car className="w-8 h-8 text-saharam-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Vehicles</p>
                  <p className="text-sm text-gray-600">Add or edit vehicles</p>
                </div>
              </a>
              <a
                href="/admin/analytics"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-8 h-8 text-saharam-600" />
                <div>
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-600">Business insights</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}