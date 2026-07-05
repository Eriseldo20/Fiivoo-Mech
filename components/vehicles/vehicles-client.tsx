'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/dashboard/header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Car, History, User, Wrench, Calendar, Hash, Camera, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { getBlobUrl } from '@/lib/blob'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import Link from 'next/link'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number | null
  vin: string | null
  license_plate: string | null
  color: string | null
  mileage: number | null
  last_mileage: number | null
  customer_id: string | null
  created_at: string
  primary_photo: string | null
  secondary_photo: string | null
  customer?: {
    id: string
    name: string
    phone: string | null
  } | null
}

interface ServiceRecord {
  id: string
  job_number: string
  title: string
  description: string | null
  status: string
  created_at: string
  completed_date: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  in_progress: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  awaiting_parts: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  invoiced: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

interface VehiclesClientProps {
  initialVehicles: Vehicle[]
  shopId: string
}

export function VehiclesClient({ initialVehicles, shopId }: VehiclesClientProps) {
  const t = useTranslations('vehicles')
  const [searchVin, setSearchVin] = useState('')
  const [searchPlate, setSearchPlate] = useState('')
  const [vehicles] = useState<Vehicle[]>(initialVehicles)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const supabase = createClient()

  const searchByVin = async () => {
    if (!searchVin.trim() || !shopId) return
    
    setIsSearching(true)
    const { data } = await supabase
      .from('vehicles')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .eq('shop_id', shopId)
      .ilike('vin', `%${searchVin.trim()}%`)

    if (data && data.length > 0) {
      setSelectedVehicle(data[0])
      loadServiceHistory(data[0].id)
    } else {
      setSelectedVehicle(null)
      setServiceHistory([])
    }
    setIsSearching(false)
  }

  const searchByPlate = async () => {
    if (!searchPlate.trim() || !shopId) return
    
    setIsSearching(true)
    const { data } = await supabase
      .from('vehicles')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .eq('shop_id', shopId)
      .ilike('license_plate', `%${searchPlate.trim()}%`)

    if (data && data.length > 0) {
      setSelectedVehicle(data[0])
      loadServiceHistory(data[0].id)
    } else {
      setSelectedVehicle(null)
      setServiceHistory([])
    }
    setIsSearching(false)
  }

  const loadServiceHistory = async (vehicleId: string) => {
    const { data } = await supabase
      .from('job_cards')
      .select('id, job_number, title, description, status, created_at, completed_date')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (data) {
      setServiceHistory(data)
    }
  }

  const selectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    loadServiceHistory(vehicle.id)
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      <Header 
        title={t('title')} 
        description={t('description')}
      />

      {/* Search Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              {t('searchByVin')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="flex gap-2">
              <Input
                placeholder={t('enterVin')}
                value={searchVin}
                onChange={(e) => setSearchVin(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchByVin()}
                className="font-mono text-sm"
              />
              <Button onClick={searchByVin} disabled={isSearching} size="sm" className="px-3">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              {t('searchByPlate')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="flex gap-2">
              <Input
                placeholder={t('enterPlate')}
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchByPlate()}
                className="font-mono text-sm"
              />
              <Button onClick={searchByPlate} disabled={isSearching} size="sm" className="px-3">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t('allVehicles')}</CardTitle>
            <CardDescription>{t('vehiclesRegistered', { count: vehicles.length })}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => selectVehicle(vehicle)}
                  className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                    selectedVehicle?.id === vehicle.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  {vehicle.vin && (
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      {t('vinLabel', { vin: vehicle.vin })}
                    </div>
                  )}
                  {vehicle.license_plate && (
                    <div className="text-xs text-muted-foreground">
                      {t('plateLabel', { plate: vehicle.license_plate })}
                    </div>
                  )}
                </button>
              ))}
              {vehicles.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  {t('noVehiclesYet')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details & Service History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVehicle ? (
            <>
              {/* Vehicle Info Card */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </CardTitle>
                      {selectedVehicle.vin && (
                        <CardDescription className="font-mono mt-1">
                          {t('vinLabel', { vin: selectedVehicle.vin })}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/vehicles/${selectedVehicle.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit')}
                        </Button>
                      </Link>
                      <Link href={`/dashboard/jobs/new?vehicle=${selectedVehicle.id}`}>
                        <Button size="sm">
                          <Wrench className="h-4 w-4 mr-2" />
                          {t('newJob')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Vehicle Photos */}
                  {(selectedVehicle.primary_photo || selectedVehicle.secondary_photo) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {selectedVehicle.primary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <ImageLightbox
                            src={getBlobUrl(selectedVehicle.primary_photo) || ''}
                            alt={t('primaryPhoto')}
                            caption={t('primaryPhoto')}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1 pointer-events-none">
                            <Camera className="h-3 w-3" />
                            {t('primary')}
                          </div>
                        </div>
                      )}
                      {selectedVehicle.secondary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <ImageLightbox
                            src={getBlobUrl(selectedVehicle.secondary_photo) || ''}
                            alt={t('secondaryPhoto')}
                            caption={t('secondaryPhoto')}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-xs text-white flex items-center gap-1 pointer-events-none">
                            <Camera className="h-3 w-3" />
                            {t('secondary')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{t('licensePlate')}</div>
                      <div className="font-medium font-mono">
                        {selectedVehicle.license_plate || '-'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{t('color')}</div>
                      <div className="font-medium">{selectedVehicle.color || '-'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{t('currentMileage')}</div>
                      <div className="font-medium">
                        {selectedVehicle.mileage?.toLocaleString() || '-'} km
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{t('lastRecorded')}</div>
                      <div className="font-medium">
                        {selectedVehicle.last_mileage != null ? `${selectedVehicle.last_mileage.toLocaleString()} km` : '-'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{t('registered')}</div>
                      <div className="font-medium">
                        {format(new Date(selectedVehicle.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  {selectedVehicle.customer && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedVehicle.customer.name}</span>
                        {selectedVehicle.customer.phone && (
                          <span className="text-muted-foreground">
                            {selectedVehicle.customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service History */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    {t('serviceHistory')}
                  </CardTitle>
                  <CardDescription>
                    {t('serviceRecordsFound', { count: serviceHistory.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {serviceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {serviceHistory.map((record) => (
                        <Link
                          key={record.id}
                          href={`/dashboard/jobs/${record.id}`}
                          className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  #{record.job_number}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={statusColors[record.status]}
                                >
                                  {t(`status_${record.status}`)}
                                </Badge>
                              </div>
                              <div className="font-medium mt-1">{record.title}</div>
                              {record.description && (
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {record.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm shrink-0">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(record.created_at), 'MMM d, yyyy')}
                              </div>
                              {record.completed_date && (
                                <div className="text-xs text-emerald-400 mt-1">
                                  {t('completedOn', { date: format(new Date(record.completed_date), 'MMM d, yyyy') })}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t('noServiceHistory')}</p>
                      <Link href={`/dashboard/jobs/new?vehicle=${selectedVehicle.id}`}>
                        <Button variant="outline" size="sm" className="mt-4">
                          {t('createFirstJob')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">{t('selectVehicle')}</h3>
                <p className="text-muted-foreground">
                  {t('selectVehicleDesc')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
