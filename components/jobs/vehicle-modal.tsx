'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Car } from 'lucide-react'
import { PhotoUpload } from '@/components/vehicles/photo-upload'

interface VehicleModalProps {
  open: boolean
  onClose: () => void
  shopId: string
  customerId?: string
  prefillVin?: string
  onCreated: (vehicle: { 
    id: string
    make: string
    model: string
    year: number | null
    license_plate: string | null
    customer_id: string | null
    vin: string | null
    primary_photo: string | null
    secondary_photo: string | null
  }) => void
}

export function VehicleModal({ open, onClose, shopId, customerId, prefillVin, onCreated }: VehicleModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: prefillVin || '',
    license_plate: '',
    color: '',
    mileage: '',
    notes: '',
    primary_photo: null as string | null,
    secondary_photo: null as string | null,
  })
  
  // Update VIN when prefillVin changes
  useEffect(() => {
    if (prefillVin) {
      setFormData(prev => ({ ...prev, vin: prefillVin }))
    }
  }, [prefillVin])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: prefillVin || '',
        license_plate: '',
        color: '',
        mileage: '',
        notes: '',
        primary_photo: null,
        secondary_photo: null,
      })
      setError(null)
    }
  }, [open, prefillVin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          shop_id: shopId,
          customer_id: customerId || null,
          make: formData.make,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : null,
          vin: formData.vin || null,
          license_plate: formData.license_plate || null,
          color: formData.color || null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          notes: formData.notes || null,
          primary_photo: formData.primary_photo,
          secondary_photo: formData.secondary_photo,
        })
        .select()
        .single()

      if (error) throw error

      onCreated(data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Car className="h-4 w-4 text-amber-500" />
            </div>
            Add New Vehicle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Photos */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-make">Make *</Label>
              <Input
                id="vehicle-make"
                placeholder="e.g., Toyota"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-model">Model *</Label>
              <Input
                id="vehicle-model"
                placeholder="e.g., Camry"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-year">Year</Label>
              <Input
                id="vehicle-year"
                type="number"
                min="1900"
                max="2030"
                placeholder="2024"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-color">Color</Label>
              <Input
                id="vehicle-color"
                placeholder="Silver"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-mileage">Mileage (km)</Label>
              <Input
                id="vehicle-mileage"
                type="number"
                placeholder="45000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-license">License Plate</Label>
              <Input
                id="vehicle-license"
                placeholder="ABC-1234"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-vin">VIN</Label>
              <Input
                id="vehicle-vin"
                placeholder="Vehicle ID number"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-notes">Notes</Label>
            <Textarea
              id="vehicle-notes"
              placeholder="Any additional notes about the vehicle..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px] bg-background/50 border-border/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.make || !formData.model}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Vehicle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
