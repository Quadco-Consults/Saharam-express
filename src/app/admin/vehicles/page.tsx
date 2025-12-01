'use client'
import { useState, useEffect } from 'react'
import { Car, Plus, Edit, Trash2, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Vehicle {
  id: string
  plate_number: string
  model: string
  vehicle_type: string
  capacity: number
  year: number
  color?: string
  is_active: boolean
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
  updated_at: string
}

interface VehicleFormData {
  plate_number: string
  model: string
  vehicle_type: string
  capacity: string
  year: string
  color: string
  last_maintenance: string
  next_maintenance: string
}

const initialFormData: VehicleFormData = {
  plate_number: '',
  model: '',
  vehicle_type: 'HIACE',
  capacity: '',
  year: '',
  color: '',
  last_maintenance: '',
  next_maintenance: ''
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)


  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        setVehicles(result.data.vehicles)
      } else {
        toast.error(result.error || 'Failed to load vehicles')
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setFormData({
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        vehicle_type: vehicle.vehicle_type,
        capacity: vehicle.capacity.toString(),
        year: vehicle.year.toString(),
        color: vehicle.color || '',
        last_maintenance: vehicle.last_maintenance || '',
        next_maintenance: vehicle.next_maintenance || ''
      })
    } else {
      setEditingVehicle(null)
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVehicle(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.plate_number.trim()) {
      toast.error('Plate number is required')
      return false
    }
    if (!formData.model.trim()) {
      toast.error('Vehicle model is required')
      return false
    }
    if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
      toast.error('Valid capacity is required')
      return false
    }
    if (!formData.year || isNaN(Number(formData.year)) || Number(formData.year) < 1900) {
      toast.error('Valid year is required')
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
        capacity: parseInt(formData.capacity),
        year: parseInt(formData.year),
        last_maintenance: formData.last_maintenance || null,
        next_maintenance: formData.next_maintenance || null
      }

      if (editingVehicle) {
        payload.id = editingVehicle.id
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/vehicles', {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle created successfully')
        await loadVehicles()
        closeModal()
      } else {
        toast.error(result.error || 'Failed to save vehicle')
      }
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Failed to save vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (vehicleId: string) => {
    if (deleteConfirm !== vehicleId) {
      setDeleteConfirm(vehicleId)
      toast.warning('Click delete again to confirm')
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/vehicles?id=${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message || 'Vehicle deleted successfully')
        await loadVehicles()
        setDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete vehicle')
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Failed to delete vehicle')
    }
  }

  const toggleVehicleStatus = async (vehicle: Vehicle) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/vehicles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...vehicle,
          is_active: !vehicle.is_active
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Vehicle ${vehicle.is_active ? 'deactivated' : 'activated'} successfully`)
        await loadVehicles()
      } else {
        toast.error(result.error || 'Failed to update vehicle status')
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      toast.error('Failed to update vehicle status')
    }
  }

  const getMaintenanceStatus = (vehicle: Vehicle) => {
    if (!vehicle.next_maintenance) return null

    const nextMaintenance = new Date(vehicle.next_maintenance)
    const today = new Date()
    const daysUntil = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return { status: 'overdue', message: 'Maintenance overdue', color: 'text-red-600' }
    if (daysUntil <= 7) return { status: 'due', message: `Due in ${daysUntil} days`, color: 'text-orange-600' }
    return { status: 'ok', message: `Due in ${daysUntil} days`, color: 'text-green-600' }
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
              <Car className="w-8 h-8 text-saharan-600" />
              Vehicle Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your fleet vehicles and maintenance schedules</p>
          </div>
          <Button
            onClick={() => openModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
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
                <p className="text-sm text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => v.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance Due</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => {
                    const status = getMaintenanceStatus(v)
                    return status?.status === 'due' || status?.status === 'overdue'
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => v.is_active).reduce((sum, v) => sum + v.capacity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => {
          const maintenanceStatus = getMaintenanceStatus(vehicle)

          return (
            <Card key={vehicle.id} className={`relative ${!vehicle.is_active ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {vehicle.plate_number}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vehicle.is_active}
                      onCheckedChange={() => toggleVehicleStatus(vehicle)}
                    />
                  </div>
                </div>
                {!vehicle.is_active && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Inactive
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-medium text-gray-900">{vehicle.model}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">
                    {vehicle.vehicle_type?.replace('_', ' ').replace('SALON_CAR', 'Salon Car') || 'Hiace'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-medium text-gray-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-medium text-gray-900">{vehicle.capacity}</p>
                  </div>
                </div>

                {vehicle.color && (
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <p className="font-medium text-gray-900">{vehicle.color}</p>
                  </div>
                )}

                {maintenanceStatus && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4 h-4 ${maintenanceStatus.color}`} />
                    <span className={`text-sm font-medium ${maintenanceStatus.color}`}>
                      {maintenanceStatus.message}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(vehicle)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(vehicle.id)}
                    className={`flex-1 ${deleteConfirm === vehicle.id ? 'bg-red-600' : ''}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deleteConfirm === vehicle.id ? 'Confirm' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {vehicles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Car className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first vehicle</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plate_number">Plate Number *</Label>
                <Input
                  id="plate_number"
                  value={formData.plate_number}
                  onChange={(e) => handleInputChange('plate_number', e.target.value)}
                  placeholder="ABC-123"
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Toyota Hiace"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => handleInputChange('vehicle_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIENNA">Sienna</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="SALON_CAR">Salon Car</SelectItem>
                    <SelectItem value="HIACE">Hiace</SelectItem>
                    <SelectItem value="COASTER">Coaster</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="14"
                />
              </div>
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="White"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last_maintenance">Last Maintenance</Label>
                <Input
                  id="last_maintenance"
                  type="date"
                  value={formData.last_maintenance}
                  onChange={(e) => handleInputChange('last_maintenance', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="next_maintenance">Next Maintenance</Label>
                <Input
                  id="next_maintenance"
                  type="date"
                  value={formData.next_maintenance}
                  onChange={(e) => handleInputChange('next_maintenance', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}