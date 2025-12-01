'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Phone, Mail, Calendar, CheckCircle, XCircle, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface DriverStats {
  totalTrips: number
  completedTrips: number
  activeTrips: number
  upcomingTrips: number
}

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth?: string
  is_verified: boolean
  created_at: string
  updated_at: string
  stats: DriverStats
}

interface DriverFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
}

const initialFormData: DriverFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: ''
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState<DriverFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)


  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/drivers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        setDrivers(result.data.drivers)
      } else {
        toast.error(result.error || 'Failed to load drivers')
      }
    } catch (error) {
      console.error('Error loading drivers:', error)
      toast.error('Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver)
      setFormData({
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        phone: driver.phone,
        date_of_birth: driver.date_of_birth || ''
      })
    } else {
      setEditingDriver(null)
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDriver(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof DriverFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      toast.error('First name is required')
      return false
    }
    if (!formData.last_name.trim()) {
      toast.error('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    // Validate phone format
    if (formData.phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload: any = { ...formData }

      if (editingDriver) {
        payload.id = editingDriver.id
        payload.is_verified = editingDriver.is_verified
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/drivers', {
        method: editingDriver ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingDriver ? 'Driver updated successfully' : 'Driver created successfully')
        await loadDrivers()
        closeModal()
      } else {
        toast.error(result.error || 'Failed to save driver')
      }
    } catch (error) {
      console.error('Error saving driver:', error)
      toast.error('Failed to save driver')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (driverId: string) => {
    if (deleteConfirm !== driverId) {
      setDeleteConfirm(driverId)
      toast.warning('Click delete again to confirm')
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/drivers?id=${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Driver deleted successfully')
        await loadDrivers()
        setDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete driver')
      }
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast.error('Failed to delete driver')
    }
  }

  const toggleDriverStatus = async (driver: Driver) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...driver,
          is_verified: !driver.is_verified
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Driver ${driver.is_verified ? 'deactivated' : 'activated'} successfully`)
        await loadDrivers()
      } else {
        toast.error(result.error || 'Failed to update driver status')
      }
    } catch (error) {
      console.error('Error updating driver status:', error)
      toast.error('Failed to update driver status')
    }
  }

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saharan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-saharan-600" />
              Driver Management
            </h1>
            <p className="text-gray-600 mt-1">Manage driver accounts and track performance</p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.is_verified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Trips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.reduce((sum, d) => sum + d.stats.activeTrips, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.reduce((sum, d) => sum + d.stats.totalTrips, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className={`relative ${!driver.is_verified ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {driver.first_name} {driver.last_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={driver.is_verified}
                    onCheckedChange={() => toggleDriverStatus(driver)}
                  />
                  {driver.is_verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {!driver.is_verified && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Inactive
                </span>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{driver.phone}</span>
                </div>
                {driver.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      Age: {calculateAge(driver.date_of_birth)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="font-bold text-gray-900">{driver.stats.totalTrips}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="font-bold text-green-600">{driver.stats.completedTrips}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="font-bold text-blue-600">{driver.stats.activeTrips}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="font-bold text-orange-600">{driver.stats.upcomingTrips}</p>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <p>Joined: {formatDate(driver.created_at)}</p>
                {driver.updated_at !== driver.created_at && (
                  <p>Updated: {formatDate(driver.updated_at)}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal(driver)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(driver.id)}
                  className={`flex-1 ${deleteConfirm === driver.id ? 'bg-red-600' : ''}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {deleteConfirm === driver.id ? 'Confirm' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {drivers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first driver</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Driver Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+234 801 234 5678"
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}