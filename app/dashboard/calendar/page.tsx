'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Car,
  User,
  Wrench,
  Bell,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'

interface ServiceReminder {
  id: string
  shop_id: string
  vehicle_id: string
  customer_id: string | null
  job_card_id: string | null
  title: string
  description: string | null
  service_type: string
  scheduled_date: string
  scheduled_time: string | null
  reminder_date: string | null
  status: 'scheduled' | 'notified' | 'completed' | 'cancelled' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notify_customer: boolean
  notify_days_before: number
  notes: string | null
  vehicle?: {
    id: string
    make: string
    model: string
    year: number
    license_plate: string
  }
  customer?: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
}

interface JobCard {
  id: string
  job_number: string
  title: string
  status: string
  priority: string
  due_date: string | null
  vehicle?: {
    make: string
    model: string
    license_plate: string
  }
  customer?: {
    name: string
  }
}

const serviceTypes = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'brake_inspection', label: 'Brake Inspection' },
  { value: 'air_filter', label: 'Air Filter' },
  { value: 'coolant_flush', label: 'Coolant Flush' },
  { value: 'transmission_service', label: 'Transmission Service' },
  { value: 'battery_check', label: 'Battery Check' },
  { value: 'wheel_alignment', label: 'Wheel Alignment' },
  { value: 'timing_belt', label: 'Timing Belt' },
  { value: 'general_inspection', label: 'General Inspection' },
  { value: 'other', label: 'Other' },
]

const priorityColors = {
  low: 'bg-slate-100 text-slate-700 border-slate-400',
  normal: 'bg-blue-100 text-blue-700 border-blue-500',
  high: 'bg-amber-100 text-amber-700 border-amber-500',
  urgent: 'bg-red-100 text-red-700 border-red-500',
}

const statusColors = {
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  notified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reminders, setReminders] = useState<ServiceReminder[]>([])
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [vehicles, setVehicles] = useState<{ id: string; make: string; model: string; year: number; license_plate: string; customer_id: string | null }[]>([])
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string | null; email: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<ServiceReminder | null>(null)
  const [shopId, setShopId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_type: 'oil_change',
    vehicle_id: '',
    customer_id: '',
    scheduled_date: '',
    scheduled_time: '',
    priority: 'normal' as const,
    notify_customer: true,
    notify_days_before: 7,
    notes: '',
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    
    // Get user's shop
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()

    if (!profile?.shop_id) return
    setShopId(profile.shop_id)

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Fetch reminders, jobs, vehicles, and customers in parallel
    const [remindersRes, jobsRes, vehiclesRes, customersRes] = await Promise.all([
      supabase
        .from('service_reminders')
        .select(`
          *,
          vehicle:vehicles(id, make, model, year, license_plate),
          customer:customers(id, name, phone, email)
        `)
        .eq('shop_id', profile.shop_id)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date'),
      
      supabase
        .from('job_cards')
        .select(`
          id, job_number, title, status, priority, due_date,
          vehicle:vehicles(make, model, license_plate),
          customer:customers(name)
        `)
        .eq('shop_id', profile.shop_id)
        .not('due_date', 'is', null)
        .gte('due_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('due_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('due_date'),
      
      supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate, customer_id')
        .eq('shop_id', profile.shop_id)
        .order('make'),
      
      supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('shop_id', profile.shop_id)
        .order('name'),
    ])

    setReminders(remindersRes.data || [])
    setJobs(jobsRes.data || [])
    setVehicles(vehiclesRes.data || [])
    setCustomers(customersRes.data || [])
    setIsLoading(false)
  }, [currentDate, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Generate calendar days
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayReminders = reminders.filter(r => r.scheduled_date === dateStr)
    const dayJobs = jobs.filter(j => j.due_date === dateStr)
    return { reminders: dayReminders, jobs: dayJobs }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setFormData(prev => ({
      ...prev,
      scheduled_date: format(date, 'yyyy-MM-dd'),
    }))
  }

  const handleAddReminder = () => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      }))
    }
    setShowAddDialog(true)
  }

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId,
      customer_id: vehicle?.customer_id || prev.customer_id,
    }))
  }

  const handleSubmit = async () => {
    if (!shopId || !formData.vehicle_id || !formData.scheduled_date || !formData.title) return

    const { data: { user } } = await supabase.auth.getUser()
    
    const reminderData = {
      shop_id: shopId,
      vehicle_id: formData.vehicle_id,
      customer_id: formData.customer_id || null,
      title: formData.title,
      description: formData.description || null,
      service_type: formData.service_type,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      priority: formData.priority,
      notify_customer: formData.notify_customer,
      notify_days_before: formData.notify_days_before,
      notes: formData.notes || null,
      reminder_date: formData.notify_days_before > 0 
        ? format(new Date(new Date(formData.scheduled_date).getTime() - formData.notify_days_before * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        : null,
      created_by: user?.id,
    }

    const { error } = await supabase
      .from('service_reminders')
      .insert(reminderData)

    if (!error) {
      setShowAddDialog(false)
      resetForm()
      fetchData()
    }
  }

  const handleUpdateStatus = async (reminderId: string, newStatus: ServiceReminder['status']) => {
    const { error } = await supabase
      .from('service_reminders')
      .update({ status: newStatus })
      .eq('id', reminderId)

    if (!error) {
      fetchData()
      setShowDetailDialog(false)
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    const { error } = await supabase
      .from('service_reminders')
      .delete()
      .eq('id', reminderId)

    if (!error) {
      fetchData()
      setShowDetailDialog(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      service_type: 'oil_change',
      vehicle_id: '',
      customer_id: '',
      scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      scheduled_time: '',
      priority: 'normal',
      notify_customer: true,
      notify_days_before: 7,
      notes: '',
    })
  }

  const openReminderDetail = (reminder: ServiceReminder) => {
    setSelectedReminder(reminder)
    setShowDetailDialog(true)
  }

  // Get upcoming reminders for sidebar
  const upcomingReminders = reminders
    .filter(r => r.status === 'scheduled' && new Date(r.scheduled_date) >= new Date())
    .slice(0, 5)

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title="Calendar" 
        description="Schedule and manage service reminders"
        action={{
          label: 'New Reminder',
          onClick: handleAddReminder,
        }}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="rounded-none border border-black/80 overflow-hidden bg-white text-black shadow-sm">
              <CardHeader className="pb-3 border-b border-black/80 bg-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-black">
                    <span className="flex h-8 w-8 items-center justify-center rounded-none bg-blue-600 border border-black">
                      <CalendarIcon className="h-4 w-4 text-white" />
                    </span>
                    {format(currentDate, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToday}
                      className="rounded-none bg-white border-black/80 text-black hover:bg-black hover:text-white"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-none bg-white border-black/80 text-black hover:bg-black hover:text-white"
                      onClick={handlePrevMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-none bg-white border-black/80 text-black hover:bg-black hover:text-white"
                      onClick={handleNextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-4 bg-white">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-0 border border-black/80 border-b-0">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[11px] font-semibold uppercase tracking-wider text-black/60 py-2.5 border-r border-black/15 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 border-l border-t border-black/80">
                  {calendarDays.map(day => {
                    const { reminders: dayReminders, jobs: dayJobs } = getEventsForDay(day)
                    const hasEvents = dayReminders.length > 0 || dayJobs.length > 0
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          'relative min-h-[80px] md:min-h-[110px] p-1.5 md:p-2 rounded-none transition-all text-left border-r border-b border-black/80',
                          'bg-white hover:bg-blue-50',
                          !isCurrentMonth && 'bg-black/[0.03] text-black/40',
                          isToday(day) && 'bg-blue-50',
                          isSelected && 'bg-blue-100 ring-2 ring-inset ring-blue-600'
                        )}
                      >
                        <span className={cn(
                          'inline-flex items-center justify-center text-sm font-semibold h-6 min-w-6 px-1',
                          isToday(day)
                            ? 'rounded-none bg-blue-600 text-white'
                            : 'text-black/80'
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {hasEvents && (
                          <div className="mt-1 space-y-0.5 overflow-hidden">
                            {dayReminders.slice(0, 2).map(reminder => (
                              <div
                                key={reminder.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openReminderDetail(reminder)
                                }}
                                className={cn(
                                  'text-[10px] md:text-xs px-1.5 py-0.5 rounded-none truncate cursor-pointer border-l-2 font-medium',
                                  priorityColors[reminder.priority]
                                )}
                              >
                                <span className="hidden md:inline">{reminder.title}</span>
                                <span className="md:hidden"><Bell className="h-2.5 w-2.5 inline" /></span>
                              </div>
                            ))}
                            {dayJobs.slice(0, 1).map(job => (
                              <div
                                key={job.id}
                                className="text-[10px] md:text-xs px-1.5 py-0.5 rounded-none truncate bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500 font-medium"
                              >
                                <span className="hidden md:inline">{job.title}</span>
                                <span className="md:hidden"><Wrench className="h-2.5 w-2.5 inline" /></span>
                              </div>
                            ))}
                            {(dayReminders.length + dayJobs.length) > 3 && (
                              <div className="text-[10px] text-black/50 font-medium">
                                +{dayReminders.length + dayJobs.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected date info */}
            {selectedDate && (
              <Card
                className="rounded-none border border-white/10 text-white"
                style={{ background: 'linear-gradient(160deg, oklch(0.16 0.03 255) 0%, oklch(0.10 0.015 248) 100%)' }}
              >
                <CardHeader className="pb-2 border-b border-white/10">
                  <CardTitle className="text-sm font-semibold text-white">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-3">
                  {(() => {
                    const { reminders: dayReminders, jobs: dayJobs } = getEventsForDay(selectedDate)
                    if (dayReminders.length === 0 && dayJobs.length === 0) {
                      return (
                        <p className="text-sm text-blue-200/50">No events scheduled</p>
                      )
                    }
                    return (
                      <>
                        {dayReminders.map(reminder => (
                          <button
                            key={reminder.id}
                            onClick={() => openReminderDetail(reminder)}
                            className="w-full text-left p-2 rounded-none bg-white/5 border-l-2 border-blue-400 hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-start gap-2">
                              <Bell className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{reminder.title}</p>
                                <p className="text-xs text-blue-200/50">
                                  {reminder.vehicle?.make} {reminder.vehicle?.model} - {reminder.vehicle?.license_plate}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                        {dayJobs.map(job => (
                          <div
                            key={job.id}
                            className="p-2 rounded-none bg-white/5 border-l-2 border-emerald-400"
                          >
                            <div className="flex items-start gap-2">
                              <Wrench className="h-4 w-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{job.title}</p>
                                <p className="text-xs text-blue-200/50">
                                  Job #{job.job_number}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )
                  })()}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 rounded-none bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white"
                    onClick={handleAddReminder}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reminder
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming reminders */}
            <Card
              className="rounded-none border border-white/10 text-white"
              style={{ background: 'linear-gradient(160deg, oklch(0.16 0.03 255) 0%, oklch(0.10 0.015 248) 100%)' }}
            >
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                  <Bell className="h-4 w-4 text-blue-300" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3">
                {upcomingReminders.length === 0 ? (
                  <p className="text-sm text-blue-200/50">No upcoming reminders</p>
                ) : (
                  upcomingReminders.map(reminder => (
                    <button
                      key={reminder.id}
                      onClick={() => openReminderDetail(reminder)}
                      className="w-full text-left p-2 rounded-none bg-white/5 border-l-2 border-blue-400/60 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate text-white">{reminder.title}</p>
                        <Badge variant="outline" className={cn('text-[10px] rounded-none', priorityColors[reminder.priority])}>
                          {reminder.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-200/50">
                        <Car className="h-3 w-3" />
                        <span className="truncate">
                          {reminder.vehicle?.license_plate}
                        </span>
                        <span>•</span>
                        <span>{format(parseISO(reminder.scheduled_date), 'MMM d')}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card
              className="rounded-none border border-white/10 text-white"
              style={{ background: 'linear-gradient(160deg, oklch(0.16 0.03 255) 0%, oklch(0.10 0.015 248) 100%)' }}
            >
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-sm font-semibold text-white">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <div className="w-3 h-3 rounded-none bg-blue-500/20 border border-blue-400/40" />
                  <span>Service Reminder</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <div className="w-3 h-3 rounded-none bg-emerald-500/20 border border-emerald-400/40" />
                  <span>Job Due Date</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <div className="w-3 h-3 rounded-none bg-amber-500/20 border border-amber-400/40" />
                  <span>High Priority</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <div className="w-3 h-3 rounded-none bg-red-500/20 border border-red-400/40" />
                  <span>Urgent</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Schedule Service Reminder
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Oil Change Due"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={handleVehicleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time (optional)</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the service..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify_days_before">Reminder Notification</Label>
              <Select
                value={formData.notify_days_before.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notify_days_before: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                  <SelectItem value="14">2 weeks before</SelectItem>
                  <SelectItem value="30">1 month before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.vehicle_id || !formData.scheduled_date}
            >
              <Bell className="h-4 w-4 mr-2" />
              Schedule Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {selectedReminder?.title}
              </span>
              <Badge variant="outline" className={cn(statusColors[selectedReminder?.status || 'scheduled'])}>
                {selectedReminder?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedReminder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedReminder.vehicle?.year} {selectedReminder.vehicle?.make} {selectedReminder.vehicle?.model}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedReminder.vehicle?.license_plate}
                  </p>
                </div>
              </div>

              {selectedReminder.customer && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedReminder.customer.name}</p>
                    {selectedReminder.customer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedReminder.customer.phone}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(parseISO(selectedReminder.scheduled_date), 'MMM d, yyyy')}
                  </span>
                </div>
                {selectedReminder.scheduled_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedReminder.scheduled_time}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {serviceTypes.find(t => t.value === selectedReminder.service_type)?.label || selectedReminder.service_type}
                </span>
              </div>

              {selectedReminder.description && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedReminder.description}</p>
                </div>
              )}

              {selectedReminder.notes && (
                <div className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedReminder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedReminder.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedReminder.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedReminder.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {selectedReminder.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedReminder.id, 'scheduled')}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reopen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteReminder(selectedReminder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
