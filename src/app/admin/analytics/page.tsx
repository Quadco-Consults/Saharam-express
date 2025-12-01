'use client'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  Calendar,
  Clock,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

interface AnalyticsData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  bookings: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  passengers: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  routes: {
    mostPopular: Array<{
      route: string
      bookings: number
      revenue: number
    }>
  }
  monthlyData: Array<{
    month: string
    revenue: number
    bookings: number
  }>
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      // For now, using mock data since we don't have the analytics API yet
      // In a real implementation, you would fetch from /api/admin/analytics
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setAnalyticsData({
        revenue: {
          total: 2450000,
          thisMonth: 450000,
          lastMonth: 380000,
          growth: 18.4
        },
        bookings: {
          total: 1250,
          thisMonth: 220,
          lastMonth: 185,
          growth: 18.9
        },
        passengers: {
          total: 8500,
          thisMonth: 1480,
          lastMonth: 1250,
          growth: 18.4
        },
        routes: {
          mostPopular: [
            { route: 'Lagos → Abuja', bookings: 145, revenue: 2175000 },
            { route: 'Abuja → Kano', bookings: 98, revenue: 1470000 },
            { route: 'Lagos → Port Harcourt', bookings: 87, revenue: 1305000 },
            { route: 'Kano → Kaduna', bookings: 65, revenue: 975000 },
            { route: 'Abuja → Enugu', bookings: 54, revenue: 810000 }
          ]
        },
        monthlyData: [
          { month: 'Jan', revenue: 380000, bookings: 185 },
          { month: 'Feb', revenue: 420000, bookings: 205 },
          { month: 'Mar', revenue: 450000, bookings: 220 },
          { month: 'Apr', revenue: 390000, bookings: 190 },
          { month: 'May', revenue: 480000, bookings: 235 },
          { month: 'Jun', revenue: 520000, bookings: 250 }
        ]
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    growth,
    icon: Icon,
    color = 'blue'
  }: {
    title: string
    value: string
    subtitle: string
    growth: number
    icon: any
    color?: 'blue' | 'green' | 'purple' | 'orange'
  }) => {
    const isPositive = growth >= 0
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(growth)}%
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-gray-600 mt-1">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600 mt-1">Track your business performance and growth</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(analyticsData.revenue.thisMonth)}
            subtitle={`${formatCurrency(analyticsData.revenue.total)} all time`}
            growth={analyticsData.revenue.growth}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Bookings"
            value={analyticsData.bookings.thisMonth.toString()}
            subtitle={`${analyticsData.bookings.total} all time`}
            growth={analyticsData.bookings.growth}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Passengers"
            value={analyticsData.passengers.thisMonth.toString()}
            subtitle={`${analyticsData.passengers.total} all time`}
            growth={analyticsData.passengers.growth}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Popular Routes"
            value={analyticsData.routes.mostPopular.length.toString()}
            subtitle="Active routes"
            growth={12.5}
            icon={MapPin}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.monthlyData.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-8">{month.month}</span>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-3 w-48">
                        <div
                          className="bg-saharan-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(month.revenue / 600000) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-4">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Routes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Routes</h2>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.routes.mostPopular.map((route, index) => (
                <div key={route.route} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-saharan-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-saharan-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{route.route}</p>
                      <p className="text-sm text-gray-500">{route.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(route.revenue)}</p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Average Booking Value</p>
                <p className="text-2xl font-bold mt-2">₦{(analyticsData.revenue.thisMonth / analyticsData.bookings.thisMonth).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Occupancy Rate</p>
                <p className="text-2xl font-bold mt-2">87%</p>
              </div>
              <Activity className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Peak Travel Hours</p>
                <p className="text-2xl font-bold mt-2">8AM - 6PM</p>
              </div>
              <Clock className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}