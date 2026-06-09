'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { PhotoUpload } from '@/components/vehicles/photo-upload'
import Link from 'next/link'

interface VehicleEditPageProps {
  params: Promise<{ id: string }>
}

export default function VehicleEditPage({ params }: VehicleEditPageProps) {
  const router = useRouter()
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    color: '',
    mileage: '',
    notes: '',
    primary_photo: '',
    secondary_photo: '',
  })

  useEffect(() => {
    params.then(p => setVehicleId(p.id))
  }, [params])

  useEffect(() => {
    if (!vehicleId) return

    async function fetchVehicle() {
      const supabase = createClient()
      
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (error || !vehicle) {
        setError('Vehicle not found')
        setIsLoading(false)
        return
      }

      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage?.toString() || '',
        notes: vehicle.notes || '',
        primary_photo: vehicle.primary_photo || '',
        secondary_photo: vehicle.secondary_photo || '',
      })
      setIsLoading(false)
    }

    fetchVehicle()
  }, [vehicleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId) return
    
    setIsSaving(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin || null,
        license_plate: formData.license_plate || null,
        color: formData.color || null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        notes: formData.notes || null,
        primary_photo: formData.primary_photo || null,
        secondary_photo: formData.secondary_photo || null,
      })
      .eq('id', vehicleId)

    setIsSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/dashboard/vehicles')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!vehicleId) return
    if (!confirm('Are you sure you want to delete this vehicle? This will also affect any linked job cards.')) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)

    setIsDeleting(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.push('/dashboard/vehicles')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error && !formData.make) {
    return (
      <div className="p-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Link href="/dashboard/vehicles">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vehicles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Vehicle</h1>
          <p className="text-muted-foreground">
            {formData.year} {formData.make} {formData.model}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Details */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Update the vehicle information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="Toyota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                    min="1900"
                    max="2100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Silver"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                    placeholder="1HGBH41JXMN109186"
                    maxLength={17}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    placeholder="ABC 1234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="45000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this vehicle..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Photos */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Vehicle Photos</CardTitle>
              <CardDescription>Update vehicle photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhotoUpload
                label="Primary Photo"
                value={formData.primary_photo}
                onChange={(url) => setFormData({ ...formData, primary_photo: url })}
              />
              <PhotoUpload
                label="Secondary Photo"
                value={formData.secondary_photo}
                onChange={(url) => setFormData({ ...formData, secondary_photo: url })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Vehicle
              </>
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/vehicles">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
