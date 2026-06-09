'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLowStockItems } from '@/lib/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  Calendar,
  Car,
  Clock,
  X,
  ChevronRight,
  CheckCircle,
  Package,
  AlertTriangle,
} from 'lucide-react'
import { format, parseISO, differenceInDays, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface ServiceReminder {
  id: string
  title: string
  service_type: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  vehicle?: {
    make: string
    model: string
    license_plate: string
  }
  customer?: {
    name: string
  }
}

interface LowStockItem {
  id: string
  name: string
  sku: string | null
  category: string | null
  quantity: number
  min_quantity: number
  location: string | null
}

const priorityColors = {
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  normal: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export function NotificationBell() {
  const [reminders, setReminders] = useState<ServiceReminder[]>([])
  const [shopId, setShopId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [dismissedStockIds, setDismissedStockIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'services' | 'stock'>('services')
  const [shownStockToasts, setShownStockToasts] = useState<Set<string>>(new Set())
  const supabase = createClient()

  // Fetch shop ID first
  useEffect(() => {
    async function fetchShopId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single()

      if (profile?.shop_id) {
        setShopId(profile.shop_id)
      }
    }
    fetchShopId()
  }, [supabase])

  // Use SWR hook for low stock items
  const { data: lowStockItems = [] } = useLowStockItems(shopId)

  // Show toast notifications for low stock items (only once per session)
  useEffect(() => {
    if (lowStockItems.length > 0) {
      lowStockItems.forEach((item: LowStockItem) => {
        if (!shownStockToasts.has(item.id) && !dismissedStockIds.has(item.id)) {
          const isOutOfStock = item.quantity === 0
          
          if (isOutOfStock) {
            toast.error(`Out of Stock: ${item.name}`, {
              description: `${item.name} is completely out of stock. Restock immediately.`,
              duration: 8000,
              action: {
                label: 'View Inventory',
                onClick: () => window.location.href = '/dashboard/inventory',
              },
            })
          } else {
            toast.warning(`Low Stock Alert: ${item.name}`, {
              description: `Only ${item.quantity} left (min: ${item.min_quantity})`,
              duration: 6000,
              action: {
                label: 'Restock',
                onClick: () => window.location.href = '/dashboard/inventory',
              },
            })
          }
          
          setShownStockToasts(prev => new Set(prev).add(item.id))
        }
      })
    }
  }, [lowStockItems, shownStockToasts, dismissedStockIds])

  const fetchReminders = useCallback(async () => {
    if (!shopId) return

    // Get reminders for the next 14 days that are scheduled or overdue
    const today = new Date()
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { data } = await supabase
      .from('service_reminders')
      .select(`
        id, title, service_type, scheduled_date, scheduled_time, status, priority,
        vehicle:vehicles(make, model, license_plate),
        customer:customers(name)
      `)
      .eq('shop_id', shopId)
      .in('status', ['scheduled', 'notified', 'overdue'])
      .lte('scheduled_date', format(twoWeeksLater, 'yyyy-MM-dd'))
      .order('scheduled_date')
      .limit(10)

    setReminders(data || [])
  }, [supabase, shopId])

  useEffect(() => {
    if (shopId) {
      fetchReminders()
      // Refresh every 5 minutes
      const interval = setInterval(fetchReminders, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [fetchReminders, shopId])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id))
  }

  const handleDismissStock = (id: string) => {
    setDismissedStockIds(prev => new Set(prev).add(id))
  }

  const handleMarkComplete = async (id: string) => {
    await supabase
      .from('service_reminders')
      .update({ status: 'completed' })
      .eq('id', id)
    
    fetchReminders()
  }

  const activeReminders = reminders.filter(r => !dismissedIds.has(r.id))
  const activeLowStock = lowStockItems.filter((item: LowStockItem) => !dismissedStockIds.has(item.id))
  
  const urgentCount = activeReminders.filter(r => 
    r.priority === 'urgent' || 
    r.priority === 'high' ||
    differenceInDays(parseISO(r.scheduled_date), new Date()) <= 1
  ).length

  const criticalStockCount = activeLowStock.filter((item: LowStockItem) => item.quantity === 0).length
  const totalNotifications = activeReminders.length + activeLowStock.length
  const totalUrgent = urgentCount + criticalStockCount

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    const days = differenceInDays(date, new Date())
    if (days < 0) return 'Overdue'
    if (days <= 7) return `In ${days} days`
    return format(date, 'MMM d')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-white',
              totalUrgent > 0 ? 'bg-red-500' : 'bg-sky-500'
            )}>
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50" 
        align="end"
        sideOffset={8}
      >
        {/* Tab Headers */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('services')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === 'services' 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              Services
              {activeReminders.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {activeReminders.length}
                </Badge>
              )}
            </span>
            {activeTab === 'services' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === 'stock' 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              Stock
              {activeLowStock.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'h-5 px-1.5 text-[10px]',
                    criticalStockCount > 0 && 'bg-red-500/10 text-red-500'
                  )}
                >
                  {activeLowStock.length}
                </Badge>
              )}
            </span>
            {activeTab === 'stock' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <>
              {activeReminders.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No upcoming services</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeReminders.map(reminder => {
                    const dateLabel = getDateLabel(reminder.scheduled_date)
                    const isOverdue = dateLabel === 'Overdue'
                    const isUrgent = reminder.priority === 'urgent' || reminder.priority === 'high' || isOverdue || dateLabel === 'Today'

                    return (
                      <div 
                        key={reminder.id}
                        className={cn(
                          'p-3 transition-colors hover:bg-muted/50',
                          isUrgent && 'bg-red-500/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'mt-0.5 p-1.5 rounded-lg',
                            isUrgent ? 'bg-red-500/10' : 'bg-sky-500/10'
                          )}>
                            <Bell className={cn(
                              'h-4 w-4',
                              isUrgent ? 'text-red-500' : 'text-sky-500'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm truncate">{reminder.title}</p>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  'text-[10px] flex-shrink-0',
                                  isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : priorityColors[reminder.priority]
                                )}
                              >
                                {isOverdue ? 'Overdue' : dateLabel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span className="truncate">
                                {reminder.vehicle?.make} {reminder.vehicle?.model} - {reminder.vehicle?.license_plate}
                              </span>
                            </div>
                            {reminder.scheduled_time && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{reminder.scheduled_time}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleMarkComplete(reminder.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => handleDismiss(reminder.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Stock Tab */}
          {activeTab === 'stock' && (
            <>
              {activeLowStock.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">All stock levels are good</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeLowStock.map((item: LowStockItem) => {
                    const isOutOfStock = item.quantity === 0
                    const isCritical = item.quantity <= item.min_quantity / 2

                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          'p-3 transition-colors hover:bg-muted/50',
                          isOutOfStock ? 'bg-red-500/5' : isCritical ? 'bg-orange-500/5' : ''
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'mt-0.5 p-1.5 rounded-lg',
                            isOutOfStock ? 'bg-red-500/10' : isCritical ? 'bg-orange-500/10' : 'bg-amber-500/10'
                          )}>
                            <AlertTriangle className={cn(
                              'h-4 w-4',
                              isOutOfStock ? 'text-red-500' : isCritical ? 'text-orange-500' : 'text-amber-500'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  'text-[10px] flex-shrink-0',
                                  isOutOfStock 
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                    : isCritical
                                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                )}
                              >
                                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                              </Badge>
                            </div>
                            {item.sku && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="text-xs">
                                <span className="text-muted-foreground">Qty: </span>
                                <span className={cn(
                                  'font-medium',
                                  isOutOfStock ? 'text-red-500' : isCritical ? 'text-orange-500' : 'text-amber-500'
                                )}>
                                  {item.quantity}
                                </span>
                                <span className="text-muted-foreground"> / {item.min_quantity} min</span>
                              </div>
                              {item.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Link href="/dashboard/inventory" onClick={() => setIsOpen(false)}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  Restock
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => handleDismissStock(item.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border/50 p-2">
          <Link 
            href={activeTab === 'services' ? '/dashboard/calendar' : '/dashboard/inventory'} 
            onClick={() => setIsOpen(false)}
          >
            <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
              {activeTab === 'services' ? (
                <>
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Open Calendar
                </>
              ) : (
                <>
                  <Package className="h-3.5 w-3.5 mr-2" />
                  Open Inventory
                </>
              )}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
