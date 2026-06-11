'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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

const serviceTypeValues = [
  'oil_change',
  'tire_rotation',
  'brake_inspection',
  'air_filter',
  'coolant_flush',
  'transmission_service',
  'battery_check',
  'wheel_alignment',
  'timing_belt',
  'general_inspection',
  'other',
]

const priorityColors = {
  low: 'bg-slate-50 text-slate-600 border-slate-400',
  normal: 'bg-blue-50 text-blue-700 border-blue-500',
  high: 'bg-amber-50 text-amber-700 border-amber-500',
  urgent: 'bg-red-50 text-red-700 border-red-500',
}

const statusColors = {
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  notified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function CalendarPage() {
  const t = useTranslations('calendar')
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
        title={t('title')} 
        description={t('description')}
        action={{
          label: t('newReminder'),
          onClick: handleAddReminder,
        }}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="rounded-xl border border-slate-200 overflow-hidden bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.12)]">
              <CardHeader className="pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-3 text-slate-900">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
                        <CalendarIcon className="h-4 w-4 text-white" />
                      </span>
                      {format(currentDate, 'MMMM yyyy')}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToday}
                      className="rounded-lg bg-white border-slate-200 text-slate-700 font-medium shadow-sm hover:bg-slate-50 hover:text-slate-900"
                    >
                      {t('today')}
                    </Button>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        onClick={handlePrevMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="h-5 w-px bg-slate-200" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-5 bg-white">
                {/* Day headers */}
                <div className="grid grid-cols-7">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                    <div key={day} className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 pb-3">
                      {t(`weekday_${day}`)}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
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
                          'group relative min-h-[84px] md:min-h-[116px] p-2 rounded-lg transition-all text-left border',
                          'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm',
                          !isCurrentMonth && 'bg-slate-50/60 border-transparent text-slate-300',
                          isToday(day) && 'border-slate-900/15 bg-slate-50',
                          isSelected && 'border-slate-900 bg-white shadow-md ring-1 ring-slate-900'
                        )}
                      >
                        <span className={cn(
                          'inline-flex items-center justify-center text-sm font-semibold h-7 min-w-7 px-1 transition-colors',
                          isToday(day)
                            ? 'rounded-full bg-slate-900 text-white'
                            : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {hasEvents && (
                          <div className="mt-1.5 space-y-1 overflow-hidden">
                            {dayReminders.slice(0, 2).map(reminder => (
                              <div
                                key={reminder.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openReminderDetail(reminder)
                                }}
                                className={cn(
                                  'text-[10px] md:text-xs px-2 py-1 rounded-md truncate cursor-pointer border-l-2 font-medium transition-transform hover:translate-x-0.5',
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
                                className="text-[10px] md:text-xs px-2 py-1 rounded-md truncate bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 font-medium transition-transform hover:translate-x-0.5"
                              >
                                <span className="hidden md:inline">{job.title}</span>
                                <span className="md:hidden"><Wrench className="h-2.5 w-2.5 inline" /></span>
                              </div>
                            ))}
                            {(dayReminders.length + dayJobs.length) > 3 && (
                              <div className="text-[10px] text-slate-400 font-medium pl-1">
                                {t('moreEvents', { count: dayReminders.length + dayJobs.length - 3 })}
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
              <Card className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)]">
                <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                  <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-3">
                  {(() => {
                    const { reminders: dayReminders, jobs: dayJobs } = getEventsForDay(selectedDate)
                    if (dayReminders.length === 0 && dayJobs.length === 0) {
                      return (
                        <p className="text-sm text-slate-400">{t('noEventsScheduled')}</p>
                      )
                    }
                    return (
                      <>
                        {dayReminders.map(reminder => (
                          <button
                            key={reminder.id}
                            onClick={() => openReminderDetail(reminder)}
                            className="w-full text-left p-2.5 rounded-lg bg-slate-50 border border-slate-100 border-l-2 border-l-blue-500 hover:bg-slate-100 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start gap-2.5">
                              <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-slate-900">{reminder.title}</p>
                                <p className="text-xs text-slate-500">
                                  {reminder.vehicle?.make} {reminder.vehicle?.model} - {reminder.vehicle?.license_plate}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                        {dayJobs.map(job => (
                          <div
                            key={job.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 border-l-2 border-l-emerald-500"
                          >
                            <div className="flex items-start gap-2.5">
                              <Wrench className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-slate-900">{job.title}</p>
                                <p className="text-xs text-slate-500">
                                  {t('jobNumber', { number: job.job_number })}
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
                    className="w-full mt-2 rounded-lg bg-slate-900 border-slate-900 text-white shadow-sm hover:bg-slate-800 hover:text-white"
                    onClick={handleAddReminder}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addReminder')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming reminders */}
            <Card className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)]">
              <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2 text-slate-900">
                  <Bell className="h-4 w-4 text-slate-500" />
                  {t('upcomingReminders')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3">
                {upcomingReminders.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('noUpcomingReminders')}</p>
                ) : (
                  upcomingReminders.map(reminder => (
                    <button
                      key={reminder.id}
                      onClick={() => openReminderDetail(reminder)}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm font-medium truncate text-slate-900">{reminder.title}</p>
                        <Badge variant="outline" className={cn('text-[10px] rounded-md capitalize shrink-0', priorityColors[reminder.priority])}>
                          {t(`priority_${reminder.priority}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
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
            <Card className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)]">
              <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">{t('legend')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-blue-50 border-l-2 border border-l-blue-500 border-blue-200" />
                  <span>{t('serviceReminder')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-emerald-50 border-l-2 border border-l-emerald-500 border-emerald-200" />
                  <span>{t('jobDueDate')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-amber-50 border-l-2 border border-l-amber-500 border-amber-200" />
                  <span>{t('priority_high')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-red-50 border-l-2 border border-l-red-500 border-red-200" />
                  <span>{t('priority_urgent')}</span>
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
              {t('scheduleServiceReminder')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('titleLabel')} *</Label>
              <Input
                id="title"
                placeholder={t('titlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">{t('serviceType')} *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypeValues.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`service_${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">{t('priority')}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('priority_low')}</SelectItem>
                    <SelectItem value="normal">{t('priority_normal')}</SelectItem>
                    <SelectItem value="high">{t('priority_high')}</SelectItem>
                    <SelectItem value="urgent">{t('priority_urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">{t('vehicle')} *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={handleVehicleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectVehicle')} />
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
              <Label htmlFor="customer">{t('customer')}</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCustomer')} />
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
                <Label htmlFor="scheduled_date">{t('scheduledDate')} *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_time">{t('timeOptional')}</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                placeholder={t('descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify_days_before">{t('reminderNotification')}</Label>
              <Select
                value={formData.notify_days_before.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notify_days_before: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('noReminder')}</SelectItem>
                  <SelectItem value="1">{t('dayBefore', { count: 1 })}</SelectItem>
                  <SelectItem value="3">{t('daysBefore', { count: 3 })}</SelectItem>
                  <SelectItem value="7">{t('weekBefore', { count: 1 })}</SelectItem>
                  <SelectItem value="14">{t('weeksBefore', { count: 2 })}</SelectItem>
                  <SelectItem value="30">{t('monthBefore', { count: 1 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.vehicle_id || !formData.scheduled_date}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t('scheduleReminder')}
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
                {selectedReminder?.status ? t(`status_${selectedReminder.status}`) : ''}
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
                  {serviceTypeValues.includes(selectedReminder.service_type) ? t(`service_${selectedReminder.service_type}`) : selectedReminder.service_type}
                </span>
              </div>

              {selectedReminder.description && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedReminder.description}</p>
                </div>
              )}

              {selectedReminder.notes && (
                <div className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                  <p className="text-xs text-muted-foreground mb-1">{t('notes')}</p>
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
                      {t('markComplete')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedReminder.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('cancel')}
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
                    {t('reopen')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteReminder(selectedReminder.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
