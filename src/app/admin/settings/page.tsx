'use client'
import { useState, useEffect } from 'react'
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Mail,
  Smartphone,
  Clock,
  MapPin,
  DollarSign,
  Save,
  Eye,
  EyeOff,
  Key,
  Database,
  FileText,
  Download,
  Upload
} from 'lucide-react'

interface AdminSettings {
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  notifications: {
    emailBookings: boolean
    emailPayments: boolean
    emailComplaints: boolean
    smsBookings: boolean
    smsPayments: boolean
    pushNotifications: boolean
  }
  business: {
    companyName: string
    supportEmail: string
    supportPhone: string
    address: string
    taxRate: number
    currency: string
    timezone: string
  }
  pricing: {
    basePrice: number
    kmRate: number
    serviceFee: number
    cancellationFee: number
  }
  system: {
    maintenanceMode: boolean
    allowRegistration: boolean
    requireEmailVerification: boolean
    sessionTimeout: number
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // For now, using mock data since we don't have the settings API yet
      // In a real implementation, you would fetch from /api/admin/settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setSettings({
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@saharanexpress.com',
          phone: '+234 800 123 4567'
        },
        notifications: {
          emailBookings: true,
          emailPayments: true,
          emailComplaints: true,
          smsBookings: false,
          smsPayments: true,
          pushNotifications: true
        },
        business: {
          companyName: 'Saharan Express Limited',
          supportEmail: 'support@saharanexpress.com',
          supportPhone: '+234 800 SAHARAN',
          address: 'Plot 123, Victoria Island, Lagos, Nigeria',
          taxRate: 7.5,
          currency: 'NGN',
          timezone: 'Africa/Lagos'
        },
        pricing: {
          basePrice: 2500,
          kmRate: 45,
          serviceFee: 150,
          cancellationFee: 500
        },
        system: {
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: true,
          sessionTimeout: 30
        }
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      // In a real implementation, you would save to /api/admin/settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      console.log('Saving settings:', settings)

      // Show success message (you could use a toast notification)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (section: keyof AdminSettings, field: string, value: any) => {
    if (!settings) return

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'business', name: 'Business', icon: Globe },
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    { id: 'system', name: 'System', icon: Shield },
    { id: 'security', name: 'Security', icon: Key },
    { id: 'data', name: 'Data & Backup', icon: Database }
  ]

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="flex-1 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your admin preferences and system configuration</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-saharan-500 text-white rounded-lg hover:bg-saharan-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-saharan-50 text-saharan-700 border border-saharan-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">First Name</label>
                  <input
                    type="text"
                    value={settings.profile.firstName}
                    onChange={(e) => updateSetting('profile', 'firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={settings.profile.lastName}
                    onChange={(e) => updateSetting('profile', 'lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={settings.profile.phone}
                    onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Booking Notifications</p>
                      <p className="text-sm text-gray-600">Receive email notifications for new bookings</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailBookings}
                      onChange={(e) => updateSetting('notifications', 'emailBookings', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-saharan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saharan-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Notifications</p>
                      <p className="text-sm text-gray-600">Get notified about payment confirmations and failures</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailPayments}
                      onChange={(e) => updateSetting('notifications', 'emailPayments', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-saharan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saharan-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Send SMS alerts for important bookings</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsBookings}
                      onChange={(e) => updateSetting('notifications', 'smsBookings', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-saharan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saharan-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.business.companyName}
                    onChange={(e) => updateSetting('business', 'companyName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Support Email</label>
                  <input
                    type="email"
                    value={settings.business.supportEmail}
                    onChange={(e) => updateSetting('business', 'supportEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Support Phone</label>
                  <input
                    type="tel"
                    value={settings.business.supportPhone}
                    onChange={(e) => updateSetting('business', 'supportPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Business Address</label>
                  <textarea
                    value={settings.business.address}
                    onChange={(e) => updateSetting('business', 'address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.business.taxRate}
                    onChange={(e) => updateSetting('business', 'taxRate', parseFloat(e.target.value))}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Currency</label>
                  <select
                    value={settings.business.currency}
                    onChange={(e) => updateSetting('business', 'currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                  >
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent pr-10"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saharan-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Data Management & Backup</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-medium text-blue-900">Export Data</h3>
                  </div>
                  <p className="text-blue-800 mb-4">Download your business data for backup or analysis.</p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Download Full Backup
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-medium text-green-900">Reports</h3>
                  </div>
                  <p className="text-green-800 mb-4">Generate detailed business reports for analysis.</p>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Generate Reports
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}