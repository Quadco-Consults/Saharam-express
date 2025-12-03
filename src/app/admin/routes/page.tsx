'use client'
import { useState, useEffect } from 'react'
import { Route, Plus, Edit, Trash2, MapPin, Clock, DollarSign, Activity, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface RouteStats {
  totalTrips: number
  activeTrips: number
  upcomingTrips: number
  completedTrips: number
}

interface RouteData {
  id: string
  from_city: string
  to_city: string
  distance: number
  base_fare: number
  estimated_duration: number
  is_active: boolean
  created_at: string
  updated_at: string
  stats: RouteStats
}

interface RouteFormData {
  from_city: string
  to_city: string
  distance: string
  base_fare: string
  estimated_duration: string
}

const initialFormData: RouteFormData = {
  from_city: '',
  to_city: '',
  distance: '',
  base_fare: '',
  estimated_duration: ''
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null)
  const [formData, setFormData] = useState<RouteFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)


  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/routes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        setRoutes(result.data.routes)
      } else {
        toast.error(result.error || 'Failed to load routes')
      }
    } catch (error) {
      console.error('Error loading routes:', error)
      toast.error('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (route?: RouteData) => {
    if (route) {
      setEditingRoute(route)
      setFormData({
        from_city: route.from_city,
        to_city: route.to_city,
        distance: route.distance.toString(),
        base_fare: route.base_fare.toString(),
        estimated_duration: route.estimated_duration.toString()
      })
    } else {
      setEditingRoute(null)
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRoute(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof RouteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.from_city.trim()) {
      toast.error('From city is required')
      return false
    }
    if (!formData.to_city.trim()) {
      toast.error('To city is required')
      return false
    }
    if (!formData.distance || isNaN(Number(formData.distance)) || Number(formData.distance) <= 0) {
      toast.error('Valid distance is required')
      return false
    }
    if (!formData.base_fare || isNaN(Number(formData.base_fare)) || Number(formData.base_fare) <= 0) {
      toast.error('Valid base fare is required')
      return false
    }
    if (!formData.estimated_duration || isNaN(Number(formData.estimated_duration)) || Number(formData.estimated_duration) <= 0) {
      toast.error('Valid estimated duration is required')
      return false
    }

    if (formData.from_city.trim().toLowerCase() === formData.to_city.trim().toLowerCase()) {
      toast.error('From and to cities must be different')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload: any = {
        ...formData,
        distance: parseInt(formData.distance),
        base_fare: parseFloat(formData.base_fare),
        estimated_duration: parseInt(formData.estimated_duration)
      }

      if (editingRoute) {
        payload.id = editingRoute.id
        payload.is_active = editingRoute.is_active
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/routes', {
        method: editingRoute ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingRoute ? 'Route updated successfully' : 'Route created successfully')
        await loadRoutes()
        closeModal()
      } else {
        toast.error(result.error || 'Failed to save route')
      }
    } catch (error) {
      console.error('Error saving route:', error)
      toast.error('Failed to save route')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (routeId: string) => {
    if (deleteConfirm !== routeId) {
      setDeleteConfirm(routeId)
      toast.warning('Click delete again to confirm')
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const response = await fetch(`/api/admin/routes?id=${routeId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message || 'Route deleted successfully')
        await loadRoutes()
        setDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete route')
      }
    } catch (error) {
      console.error('Error deleting route:', error)
      toast.error('Failed to delete route')
    }
  }

  const toggleRouteStatus = async (route: RouteData) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/routes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...route,
          is_active: !route.is_active
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Route ${route.is_active ? 'deactivated' : 'activated'} successfully`)
        await loadRoutes()
      } else {
        toast.error(result.error || 'Failed to update route status')
      }
    } catch (error) {
      console.error('Error updating route status:', error)
      toast.error('Failed to update route status')
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const formatCurrency = (amount: number): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₦0'
    }
    return `₦${amount.toLocaleString()}`
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
              <Route className="w-8 h-8 text-saharan-600" />
              Route & Pricing Management
            </h1>
            <p className="text-gray-600 mt-1">Manage travel routes and pricing structure</p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
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
                <p className="text-sm text-gray-600">Active Routes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.filter(r => r.is_active).length}
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
                  {routes.reduce((sum, r) => sum + r.stats.activeTrips, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Base Fare</p>
                <p className="text-2xl font-bold text-gray-900">
                  {routes.length > 0
                    ? formatCurrency(routes.reduce((sum, r) => sum + r.base_fare, 0) / routes.length)
                    : '₦0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Card key={route.id} className={`relative ${!route.is_active ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {route.from_city} → {route.to_city}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={route.is_active}
                    onCheckedChange={() => toggleRouteStatus(route)}
                  />
                  {route.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {!route.is_active && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Inactive
                </span>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-600">Distance</p>
                  <p className="font-bold text-gray-900">{route.distance} km</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-bold text-gray-900">{formatDuration(route.estimated_duration)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-600">Base Fare</p>
                  <p className="font-bold text-gray-900">{formatCurrency(route.base_fare)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="font-bold text-gray-900">{route.stats.totalTrips}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="font-bold text-green-600">{route.stats.completedTrips}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="font-bold text-blue-600">{route.stats.activeTrips}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="font-bold text-saharan-600">{route.stats.upcomingTrips}</p>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <p>Created: {new Date(route.created_at).toLocaleDateString()}</p>
                {route.updated_at !== route.created_at && (
                  <p>Updated: {new Date(route.updated_at).toLocaleDateString()}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal(route)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(route.id)}
                  className={`flex-1 ${deleteConfirm === route.id ? 'bg-red-600' : ''}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {deleteConfirm === route.id ? 'Confirm' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {routes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Route className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first route</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Route Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoute ? 'Edit Route' : 'Add New Route'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_city">From City *</Label>
                <Input
                  id="from_city"
                  value={formData.from_city}
                  onChange={(e) => handleInputChange('from_city', e.target.value)}
                  placeholder="Lagos"
                />
              </div>
              <div>
                <Label htmlFor="to_city">To City *</Label>
                <Input
                  id="to_city"
                  value={formData.to_city}
                  onChange={(e) => handleInputChange('to_city', e.target.value)}
                  placeholder="Abuja"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance">Distance (km) *</Label>
                <Input
                  id="distance"
                  type="number"
                  min="1"
                  value={formData.distance}
                  onChange={(e) => handleInputChange('distance', e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="estimated_duration">Duration (minutes) *</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  min="1"
                  value={formData.estimated_duration}
                  onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                  placeholder="480"
                />
                {formData.estimated_duration && (
                  <p className="text-xs text-gray-600 mt-1">
                    Approx: {formatDuration(parseInt(formData.estimated_duration) || 0)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="base_fare">Base Fare (₦) *</Label>
              <Input
                id="base_fare"
                type="number"
                min="0"
                step="0.01"
                value={formData.base_fare}
                onChange={(e) => handleInputChange('base_fare', e.target.value)}
                placeholder="15000"
              />
              {formData.base_fare && (
                <p className="text-xs text-gray-600 mt-1">
                  Display: {formatCurrency(parseFloat(formData.base_fare) || 0)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingRoute ? 'Update Route' : 'Add Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}