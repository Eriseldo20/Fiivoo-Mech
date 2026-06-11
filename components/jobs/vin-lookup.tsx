'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Search, Car, CheckCircle, AlertCircle, History, Wrench, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { getBlobUrl } from '@/lib/blob'
import type { Vehicle } from '@/lib/types'

interface VehicleWithHistory extends Vehicle {
  customer?: {
    id: string
    name: string
    phone: string | null
    email: string | null
  } | null
  service_history?: Array<{
    id: string
    job_number: string
    title: string
    description: string | null
    status: string
    completed_date: string | null
    created_at: string
    mileage_at_service?: number
  }>
  primary_photo?: string | null
  secondary_photo?: string | null
}

interface VinLookupProps {
  onVehicleFound: (vehicle: VehicleWithHistory) => void
  onNewVehicle: (vin: string) => void
  shopId: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  in_progress: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  awaiting_parts: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  invoiced: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function VinLookup({ onVehicleFound, onNewVehicle, shopId }: VinLookupProps) {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleWithHistory | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!vin.trim()) return
    
    setLoading(true)
    setError(null)
    setSearched(true)
    
    const supabase = createClient()
    
    try {
      // Look up vehicle by VIN including photos
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          customer:customers(id, name, phone, email)
        `)
        .eq('shop_id', shopId)
        .eq('vin', vin.trim().toUpperCase())
        .single()

      if (vehicleError && vehicleError.code !== 'PGRST116') {
        throw vehicleError
      }

      if (vehicleData) {
        // Fetch service history for this vehicle
        const { data: historyData, error: historyError } = await supabase
          .from('job_cards')
          .select('id, job_number, title, description, status, completed_date, created_at')
          .eq('vehicle_id', vehicleData.id)
          .order('created_at', { ascending: false })

        if (historyError) throw historyError

        const vehicleWithHistory: VehicleWithHistory = {
          ...vehicleData,
          service_history: historyData || []
        }

        setVehicle(vehicleWithHistory)
        onVehicleFound(vehicleWithHistory)
      } else {
        setVehicle(null)
      }
    } catch (err) {
      console.error('VIN lookup error:', err)
      setError('Failed to look up VIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleUseNewVehicle = () => {
    onNewVehicle(vin.trim().toUpperCase())
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vin-search" className="text-foreground">VIN Lookup</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="vin-search"
              placeholder="Enter VIN to search vehicle history..."
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              className="pl-10 uppercase font-mono bg-card border-border"
              maxLength={17}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading || !vin.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? <Spinner className="h-4 w-4" /> : 'Search'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the 17-character Vehicle Identification Number
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {searched && !loading && (
        <>
          {vehicle ? (
            <Card className="bg-card/50 border-primary/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </CardTitle>
                      <CardDescription className="font-mono">{vehicle.vin}</CardDescription>
                    </div>
                  </div>
                  {vehicle.customer && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {vehicle.customer.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle Photos */}
                {(vehicle.primary_photo || vehicle.secondary_photo) && (
                  <div className="grid grid-cols-2 gap-3">
                    {vehicle.primary_photo && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                        <img
                          src={getBlobUrl(vehicle.primary_photo) || ''}
                          alt="Primary vehicle photo"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Primary
                        </div>
                      </div>
                    )}
                    {vehicle.secondary_photo && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                        <img
                          src={getBlobUrl(vehicle.secondary_photo) || ''}
                          alt="Secondary vehicle photo"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Secondary
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">License Plate</span>
                    <p className="font-medium">{vehicle.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color</span>
                    <p className="font-medium">{vehicle.color || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mileage</span>
                    <p className="font-medium">{vehicle.mileage?.toLocaleString() || 'N/A'} km</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Services</span>
                    <p className="font-medium">{vehicle.service_history?.length || 0} jobs</p>
                  </div>
                </div>

                {vehicle.service_history && vehicle.service_history.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Service History</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {vehicle.service_history.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{job.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {job.job_number} • {format(new Date(job.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={statusColors[job.status] || ''}
                          >
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => onVehicleFound(vehicle)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Use This Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No vehicle found</p>
                    <p className="text-sm text-muted-foreground">
                      VIN <span className="font-mono">{vin}</span> is not in the system yet
                    </p>
                  </div>
                  <Button 
                    onClick={handleUseNewVehicle}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Register New Vehicle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
