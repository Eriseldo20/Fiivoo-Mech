'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import {
  ArrowLeft,
  Loader2,
  Car,
  User,
  Plus,
  FileText,
  Trash2,
  ClipboardList,
  Package,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BASE_CURRENCY,
  formatMoney,
  getCurrency,
  toBase,
  toCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency'
import { useCurrency } from '@/components/providers/currency-provider'
import type { Estimate, EstimateItem } from '@/lib/types'

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  sell_price: number | null
  quantity: number
  category: string | null
}

interface EstimateFormProps {
  shopId: string
  customers: { id: string; name: string; phone: string | null; email: string | null }[]
  vehicles: { id: string; make: string; model: string; year: number | null; license_plate: string | null; customer_id: string | null }[]
  jobCards: { id: string; job_number: string; title: string; customer_id: string | null; vehicle_id: string | null }[]
  linkedJob?: { id: string; job_number: string; title: string; customer_id: string | null; vehicle_id: string | null } | null
  initialData?: Estimate & { items: EstimateItem[] }
}

interface LineItem {
  id: string
  type: 'labor' | 'parts' | 'other'
  description: string
  quantity: number
  unit_price: number
  inventory_id?: string | null
}

export function EstimateForm({ shopId, customers, vehicles, jobCards, linkedJob, initialData }: EstimateFormProps) {
  const t = useTranslations('estimateForm')
  const router = useRouter()
  const shopCurrency = useCurrency()
  const isEditing = !!initialData

  // An existing invoice keeps the currency and rate it was written in; a new
  // one starts from the shop default. Never re-stamp a saved document, or its
  // stored figures would silently change meaning.
  const [currency, setCurrency] = useState<CurrencyCode>(() =>
    isEditing ? toCurrencyCode((initialData as { currency?: string }).currency) : shopCurrency.currency,
  )
  const [rateInput, setRateInput] = useState(() => {
    const saved = Number((initialData as { exchange_rate?: number | string } | undefined)?.exchange_rate)
    if (isEditing && Number.isFinite(saved) && saved > 0) return String(saved)
    return String(shopCurrency.eurToAllRate)
  })

  const currencyConfig = getCurrency(currency)
  const parsedRate = parseFloat(rateInput)
  const effectiveRate =
    currency === BASE_CURRENCY ? 1 : Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : shopCurrency.eurToAllRate
  const money = (amount: number) => formatMoney(amount, currency)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || linkedJob?.customer_id || '',
    vehicle_id: initialData?.vehicle_id || linkedJob?.vehicle_id || '',
    job_card_id: initialData?.job_card_id || linkedJob?.id || '',
    status: initialData?.status || 'draft',
    valid_until: initialData?.valid_until ? new Date(initialData.valid_until).toISOString().split('T')[0] : '',
    notes: initialData?.notes || '',
    tax_rate: initialData?.tax_rate?.toString() || '0',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.items?.map(item => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      inventory_id: (item as any).inventory_id || null,
    })) || [
      { id: crypto.randomUUID(), type: 'labor', description: '', quantity: 1, unit_price: 0, inventory_id: null },
    ]
  )

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('inventory')
        .select('id, name, sku, sell_price, quantity, category')
        .eq('shop_id', shopId)
        .gt('quantity', 0)
        .order('name')
      setInventory(data || [])
    }
    loadInventory()
  }, [shopId])

  // Generate estimate number
  const generateEstimateNumber = () => {
    const date = new Date()
    const prefix = 'EST'
    const timestamp = date.getFullYear().toString().slice(-2) + 
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const taxRate = parseFloat(formData.tax_rate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), type: 'labor', description: '', quantity: 1, unit_price: 0, inventory_id: null },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number | null) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Handle inventory selection - auto-fills description and price
  const handleInventorySelect = (lineItemId: string, inventoryId: string) => {
    const invItem = inventory.find(i => i.id === inventoryId)
    if (invItem) {
      setLineItems(lineItems.map(item => 
        item.id === lineItemId 
          ? { 
              ...item, 
              inventory_id: inventoryId,
              description: invItem.name + (invItem.sku ? ` (${invItem.sku})` : ''),
              unit_price: invItem.sell_price || 0,
            } 
          : item
      ))
    }
  }

  // Auto-fill customer/vehicle when job is selected
  useEffect(() => {
    if (formData.job_card_id) {
      const job = jobCards.find(j => j.id === formData.job_card_id)
      if (job) {
        setFormData(prev => ({
          ...prev,
          customer_id: job.customer_id || prev.customer_id,
          vehicle_id: job.vehicle_id || prev.vehicle_id,
        }))
      }
    }
  }, [formData.job_card_id, jobCards])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const estimateData = {
        shop_id: shopId,
        customer_id: formData.customer_id || null,
        vehicle_id: formData.vehicle_id || null,
        job_card_id: formData.job_card_id || null,
        status: formData.status as Estimate['status'],
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        // Amounts are stored exactly as typed, so the currency and the rate in
        // force must travel with them or a 400 lek total reads as 400 euro.
        currency,
        exchange_rate: effectiveRate,
        ...(isEditing ? {} : { estimate_number: generateEstimateNumber() }),
      }

      let estimateId: string

      if (isEditing) {
        const { error } = await supabase
          .from('estimates')
          .update(estimateData)
          .eq('id', initialData.id)

        if (error) throw error
        estimateId = initialData.id

        // Delete old items and insert new ones
        await supabase
          .from('estimate_items')
          .delete()
          .eq('estimate_id', estimateId)
      } else {
        const { data, error } = await supabase
          .from('estimates')
          .insert(estimateData)
          .select()
          .single()

        if (error) throw error
        estimateId = data.id
      }

      // Insert line items
      const itemsToInsert = lineItems
        .filter(item => item.description.trim())
        .map(item => ({
          estimate_id: estimateId,
          shop_id: shopId,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          inventory_id: item.inventory_id || null,
        }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('estimate_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      router.push(`/dashboard/estimates/${estimateId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToSave'))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter vehicles by selected customer
  const filteredVehicles = formData.customer_id
    ? vehicles.filter(v => v.customer_id === formData.customer_id || !v.customer_id)
    : vehicles

  return (
    <>
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToEstimates')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditing ? t('editEstimate') : t('newEstimate')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? t('editSubtitle') : t('newSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Line Items */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{t('lineItems')}</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addItem')}
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground px-1">
                    <div className="col-span-2">{t('type')}</div>
                    <div className="col-span-5">{t('descriptionLabel')}</div>
                    <div className="col-span-1">{t('qty')}</div>
                    <div className="col-span-2">{t('price')}</div>
                    <div className="col-span-1">{t('total')}</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Items */}
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="space-y-2">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2">
                          <Select
                            value={item.type}
                            onValueChange={(value) => {
                              updateLineItem(item.id, 'type', value as 'labor' | 'parts' | 'other')
                              // Clear inventory_id when switching away from parts
                              if (value !== 'parts') {
                                updateLineItem(item.id, 'inventory_id', null)
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 bg-background/50 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="labor">{t('labor')}</SelectItem>
                              <SelectItem value="parts">{t('parts')}</SelectItem>
                              <SelectItem value="other">{t('other')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder={t('descriptionLabel')}
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="h-10 bg-background/50 border-border/50"
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="1"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-10 bg-background/50 border-border/50"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {currencyConfig.symbol}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              // Lek has no subunit, so step in whole numbers.
                              step={currencyConfig.decimals === 0 ? '1' : '0.01'}
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="h-10 pl-7 bg-background/50 border-border/50"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <p className="font-medium text-right">
                            {money(item.quantity * item.unit_price)}
                          </p>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length <= 1}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Inventory selector for parts */}
                      {item.type === 'parts' && (
                        <div className="ml-[16.666%] col-span-5 flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={item.inventory_id || ''}
                            onValueChange={(value) => handleInventorySelect(item.id, value)}
                          >
                            <SelectTrigger className="h-9 bg-background/50 border-border/50 text-sm flex-1">
                              <SelectValue placeholder={t('selectInventory')} />
                            </SelectTrigger>
                            <SelectContent>
                              {inventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  <div className="flex items-center justify-between gap-4 w-full">
                                    <span>{inv.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {t('inStock', { count: inv.quantity })} • {money(inv.sell_price || 0)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                              {inventory.length === 0 && (
                                <SelectItem value="_empty" disabled>
                                  {t('noInventory')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('subtotal')}</span>
                        <span className="font-medium">{money(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center gap-4">
                        <span className="text-muted-foreground">{t('taxRate')}</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                          className="w-20 h-8 text-right bg-background/50 border-border/50"
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('taxAmount')}</span>
                        <span className="font-medium">{money(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border/50">
                        <span>{t('total')}</span>
                        <span className="text-primary">{money(total)}</span>
                      </div>
                      {/* Euro equivalent, so a lek invoice is still readable
                          against the shop's base-currency reporting. */}
                      {currency !== BASE_CURRENCY && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('baseEquivalent')}</span>
                          <span>{formatMoney(toBase(total, currency, effectiveRate), BASE_CURRENCY)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">{t('notes')}</h2>
                <Textarea
                  placeholder={t('notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[100px] bg-background/50 border-border/50"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Currency */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">{t('currency')}</h2>
                </div>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as CurrencyCode)}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">{t('currencyEur')}</SelectItem>
                    <SelectItem value="ALL">{t('currencyAll')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Rate only matters for non-base currencies. Editable per
                    invoice so a one-off agreed rate can be honoured. */}
                {currency !== BASE_CURRENCY && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="exchange-rate" className="text-sm text-muted-foreground">
                      {t('exchangeRate')}
                    </Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="h-10 bg-background/50 border-border/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('rateHint', {
                        rate: formatMoney(effectiveRate, currency),
                        base: formatMoney(1, BASE_CURRENCY),
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Job Card Link */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">{t('linkToJobCard')}</h2>
                </div>
                <Select
                  value={formData.job_card_id}
                  onValueChange={(value) => setFormData({ ...formData, job_card_id: value })}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder={t('selectJob')} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCards.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_number} - {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-emerald-500" />
                  <h2 className="font-semibold">{t('customer')}</h2>
                </div>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder={t('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="h-4 w-4 text-amber-500" />
                  <h2 className="font-semibold">{t('vehicle')}</h2>
                </div>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder={t('selectVehicle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} {vehicle.year || ''} {vehicle.license_plate && `(${vehicle.license_plate})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valid Until */}
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h2 className="font-semibold mb-4">{t('validUntil')}</h2>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="h-11 bg-background/50 border-border/50"
                />
              </div>

              {isEditing && (
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                  <h2 className="font-semibold mb-4">{t('status')}</h2>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as typeof formData.status })
                    }
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft')}</SelectItem>
                      <SelectItem value="sent">{t('sent')}</SelectItem>
                      <SelectItem value="approved">{t('approved')}</SelectItem>
                      <SelectItem value="rejected">{t('rejected')}</SelectItem>
                      <SelectItem value="expired">{t('expired')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              disabled={isLoading || lineItems.every(item => !item.description.trim())}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isEditing ? t('updateEstimate') : t('createEstimate')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
