'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  Car,
  User,
  Plus,
  ClipboardList,
  Search,
  List,
  Users,
} from 'lucide-react'
import { CustomerModal } from '@/components/jobs/customer-modal'
import { VehicleModal } from '@/components/jobs/vehicle-modal'
import { VinLookup } from '@/components/jobs/vin-lookup'
import type { JobCard, Vehicle } from '@/lib/types'

interface JobFormProps {
  shopId: string
  customers: { id: string; name: string; phone: string | null; email: string | null }[]
  vehicles: { id: string; make: string; model: string; year: number | null; license_plate: string | null; customer_id: string | null; vin: string | null }[]
  employees?: { id: string; first_name: string; last_name: string; role: string }[]
  initialData?: JobCard
}

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
  }>
}

export function JobForm({ shopId, customers: initialCustomers, vehicles: initialVehicles, employees = [], initialData }: JobFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState(initialCustomers)
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [prefillVin, setPrefillVin] = useState<string>('')
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState<VehicleWithHistory | null>(null)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    customer_id: initialData?.customer_id || '',
    vehicle_id: initialData?.vehicle_id || '',
    assigned_employee_id: (initialData as any)?.assigned_employee_id || '',
    priority: initialData?.priority || 'normal',
    status: initialData?.status || 'pending',
    estimated_hours: initialData?.estimated_hours?.toString() || '',
    due_date: initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '',
  })

  const generateJobNumber = () => {
    const date = new Date()
    const prefix = 'JOB'
    const timestamp = date.getFullYear().toString().slice(-2) + 
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const jobData = {
        shop_id: shopId,
        title: formData.title,
        description: formData.description || null,
        customer_id: formData.customer_id || null,
        vehicle_id: formData.vehicle_id || null,
        assigned_employee_id: formData.assigned_employee_id || null,
        priority: formData.priority as JobCard['priority'],
        status: formData.status as JobCard['status'],
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        due_date: formData.due_date || null,
        ...(isEditing ? {} : { job_number: generateJobNumber() }),
      }

      if (isEditing) {
        const { error } = await supabase
          .from('job_cards')
          .update(jobData)
          .eq('id', initialData.id)

        if (error) throw error
        router.push(`/dashboard/jobs/${initialData.id}`)
      } else {
        const { data, error } = await supabase
          .from('job_cards')
          .insert(jobData)
          .select()
          .single()

        if (error) throw error
        router.push(`/dashboard/jobs/${data.id}`)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job card')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerCreated = (customer: { id: string; name: string; phone: string | null; email: string | null }) => {
    setCustomers([...customers, customer])
    setFormData({ ...formData, customer_id: customer.id })
  }

  const handleVehicleCreated = (vehicle: { id: string; make: string; model: string; year: number | null; license_plate: string | null; customer_id: string | null; vin?: string | null }) => {
    setVehicles([...vehicles, { ...vehicle, vin: vehicle.vin || null }])
    setFormData({ ...formData, vehicle_id: vehicle.id })
    setSelectedVehicleInfo(null)
  }

  const handleVinVehicleFound = (vehicle: VehicleWithHistory) => {
    setFormData({ 
      ...formData, 
      vehicle_id: vehicle.id,
      customer_id: vehicle.customer?.id || formData.customer_id 
    })
    setSelectedVehicleInfo(vehicle)
  }

  const handleNewVehicleFromVin = (vin: string) => {
    setPrefillVin(vin)
    setShowVehicleModal(true)
  }

  const filteredVehicles = formData.customer_id
    ? vehicles.filter(v => v.customer_id === formData.customer_id || !v.customer_id)
    : vehicles

  return (
    <>
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditing ? 'Edit Job Card' : 'New Job Card'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Update the job details' : 'Create a new service job'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Selection - VIN Lookup First */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Vehicle</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrefillVin('')
                  setShowVehicleModal(true)
                }}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Vehicle
              </Button>
            </div>

            <Tabs defaultValue="vin-lookup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="vin-lookup" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  VIN Lookup
                </TabsTrigger>
                <TabsTrigger value="select-existing" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Select Existing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vin-lookup" className="mt-0">
                <VinLookup 
                  shopId={shopId}
                  onVehicleFound={handleVinVehicleFound}
                  onNewVehicle={handleNewVehicleFromVin}
                />
              </TabsContent>

              <TabsContent value="select-existing" className="mt-0">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Select Vehicle</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, vehicle_id: value })
                      setSelectedVehicleInfo(null)
                    }}
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/50">
                      <SelectValue placeholder="Choose a vehicle (optional)">
                        {formData.vehicle_id && (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            {(() => {
                              const v = vehicles.find(v => v.id === formData.vehicle_id)
                              return v ? `${v.make} ${v.model} ${v.year || ''}` : ''
                            })()}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span>{vehicle.make} {vehicle.model} {vehicle.year || ''}</span>
                            {vehicle.vin && (
                              <span className="text-muted-foreground font-mono text-xs">({vehicle.vin.slice(-6)})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Show selected vehicle info */}
            {selectedVehicleInfo && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {selectedVehicleInfo.year} {selectedVehicleInfo.make} {selectedVehicleInfo.model}
                  </span>
                  {selectedVehicleInfo.service_history && selectedVehicleInfo.service_history.length > 0 && (
                    <span className="text-muted-foreground">
                      • {selectedVehicleInfo.service_history.length} previous service{selectedVehicleInfo.service_history.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Customer</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerModal(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Customer
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Select Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger className="h-11 bg-background/50 border-border/50">
                  <SelectValue placeholder="Choose a customer (optional)">
                    {formData.customer_id && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {customers.find(c => c.id === formData.customer_id)?.name}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.name}</span>
                        {customer.phone && (
                          <span className="text-muted-foreground">({customer.phone})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Job Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Oil Change and Tire Rotation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 bg-background/50 border-border/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the work to be done..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px] bg-background/50 border-border/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_employee">Assign To</Label>
                  <Select
                    value={formData.assigned_employee_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_employee_id: value })}
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/50">
                      <SelectValue placeholder="Select employee (optional)">
                        {formData.assigned_employee_id && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {employees.find(e => e.id === formData.assigned_employee_id)?.first_name}{' '}
                            {employees.find(e => e.id === formData.assigned_employee_id)?.last_name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No employees found. Add employees in Settings.
                        </div>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{employee.first_name} {employee.last_name}</span>
                              <span className="text-xs text-muted-foreground">({employee.role})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-11 bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_hours">Estimated Hours</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 2.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="h-11 bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.title}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEditing ? 'Update Job Card' : 'Create Job Card'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <CustomerModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        shopId={shopId}
        onCreated={handleCustomerCreated}
      />

      <VehicleModal
        open={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false)
          setPrefillVin('')
        }}
        shopId={shopId}
        customerId={formData.customer_id || undefined}
        prefillVin={prefillVin}
        onCreated={handleVehicleCreated}
      />
    </>
  )
}
