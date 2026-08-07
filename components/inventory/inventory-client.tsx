'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  saveInventoryItem,
  restockInventoryItem,
  deleteInventoryItem,
} from '@/lib/actions/inventory'
import { Header } from '@/components/dashboard/header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Euro,
  MapPin,
  ImageIcon,
  Truck,
  Hash
} from 'lucide-react'
import { useCurrency } from '@/components/providers/currency-provider'
import { PhotoUpload } from '@/components/vehicles/photo-upload'
import { getBlobUrl } from '@/lib/blob'

interface InventoryItem {
  id: string
  shop_id: string
  sku: string | null
  name: string
  description: string | null
  category: string | null
  quantity: number
  min_quantity: number
  unit_cost: number | null
  sell_price: number | null
  location: string | null
  supplier: string | null
  image_url: string | null
  created_at: string
}

const categories = [
  'parts',
  'fluids',
  'filters',
  'tires',
  'brakes',
  'electrical',
  'accessories',
  'tools',
  'other',
]

const categoryColors: Record<string, string> = {
  parts: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  fluids: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  filters: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  tires: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  brakes: 'bg-red-500/10 text-red-500 border-red-500/20',
  electrical: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  accessories: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  tools: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

interface InventoryClientProps {
  initialInventory: InventoryItem[]
}

export function InventoryClient({ initialInventory }: InventoryClientProps) {
  const money = useCurrency()
  const t = useTranslations('inventory')
  const router = useRouter()
  // Data is server-rendered from the cached read; router.refresh() after a
  // mutation revalidates the tag and re-renders with fresh props.
  const inventory = initialInventory
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showRestockDialog, setShowRestockDialog] = useState(false)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'parts',
    quantity: '0',
    min_quantity: '5',
    unit_cost: '',
    sell_price: '',
    location: '',
    supplier: '',
    image_url: null as string | null,
  })

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: 'parts',
      quantity: '0',
      min_quantity: '5',
      unit_cost: '',
      sell_price: '',
      location: '',
      supplier: '',
      image_url: null,
    })
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      sku: item.sku || '',
      name: item.name,
      description: item.description || '',
      category: item.category || 'parts',
      quantity: item.quantity.toString(),
      min_quantity: item.min_quantity.toString(),
      unit_cost: item.unit_cost?.toString() || '',
      sell_price: item.sell_price?.toString() || '',
      location: item.location || '',
      supplier: item.supplier || '',
      image_url: item.image_url || null,
    })
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name) return

    setIsSaving(true)
    const result = await saveInventoryItem(editingItem?.id ?? null, {
      sku: formData.sku || null,
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      min_quantity: parseInt(formData.min_quantity) || 0,
      unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
      sell_price: formData.sell_price ? parseFloat(formData.sell_price) : null,
      location: formData.location || null,
      supplier: formData.supplier || null,
      image_url: formData.image_url || null,
    })
    setIsSaving(false)

    if (!result.ok) return

    setShowAddDialog(false)
    setEditingItem(null)
    resetForm()
    router.refresh()
  }

  const handleRestock = async () => {
    if (!restockItem || !restockQty) return

    const qty = parseInt(restockQty)
    const result = await restockInventoryItem(restockItem.id, restockItem.quantity, qty)
    if (!result.ok) return

    setShowRestockDialog(false)
    setRestockItem(null)
    setRestockQty('')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteInventoryItem(deleteId)
    if (!result.ok) return

    setDeleteId(null)
    router.refresh()
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity)
  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.unit_cost || 0)), 0)

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title={t('title')} 
        description={t('description')}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{inventory.length}</p>
                  <p className="text-sm text-muted-foreground">{t('totalItems')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{lowStockItems.length}</p>
                  <p className="text-sm text-muted-foreground">{t('lowStock')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Euro className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{money.base(totalValue)}</p>
                  <p className="text-sm text-muted-foreground">{t('inventoryValue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {inventory.reduce((acc, item) => acc + item.quantity, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('totalUnits')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-amber-500">{t('lowStockAlert')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 5).map(item => (
                  <Badge key={item.id} variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {t('itemsLeft', { name: item.name, count: item.quantity })}
                  </Badge>
                ))}
                {lowStockItems.length > 5 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {t('moreItems', { count: lowStockItems.length - 5 })}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchInventory')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{t(`category_${cat}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('addItem')}</span>
              <span className="sm:hidden">{t('add')}</span>
            </Button>
          </div>
        </div>

        {/* Inventory Table/Cards */}
        {filteredInventory.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{t('noItemsFound')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all' ? t('tryAdjustingFilters') : t('getStartedAdding')}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addItem')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredInventory.map((item) => (
                <Card key={item.id} className={`glass-card ${item.quantity <= item.min_quantity ? 'border-amber-500/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="flex flex-1 min-w-0 items-start gap-3 text-left"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted/40">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getBlobUrl(item.image_url) || ''}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          {item.quantity <= item.min_quantity && (
                            <TrendingDown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        {item.sku && (
                          <p className="text-xs text-muted-foreground font-mono mb-2">{item.sku}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.category && (
                            <Badge variant="outline" className={`text-xs ${categoryColors[item.category] || categoryColors.other}`}>
                              {item.category ? t(`category_${item.category}`) : item.category}
                            </Badge>
                          )}
                          {item.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.location}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">{t('qty')}</p>
                            <p className={`font-medium ${item.quantity <= item.min_quantity ? 'text-amber-500' : ''}`}>
                              {item.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">{t('cost')}</p>
                            <p className="font-medium">{item.unit_cost ? money.base(item.unit_cost) : '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">{t('price')}</p>
                            <p className="font-medium">{item.sell_price ? money.base(item.sell_price) : '-'}</p>
                          </div>
                        </div>
                      </div>
                      </button>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setRestockItem(item)
                            setShowRestockDialog(true)
                          }}
                        >
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="glass-card hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">{t('image')}</TableHead>
                  <TableHead>{t('item')}</TableHead>
                  <TableHead>{t('sku')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead className="text-right">{t('qty')}</TableHead>
                  <TableHead className="text-right">{t('unitCost')}</TableHead>
                  <TableHead className="text-right">{t('sellPrice')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead className="w-[100px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer ${item.quantity <= item.min_quantity ? 'bg-amber-500/5' : ''}`}
                    onClick={() => setDetailItem(item)}
                  >
                    <TableCell>
                      <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted/40">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getBlobUrl(item.image_url) || ''}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium hover:underline">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.sku || '-'}
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="outline" className={categoryColors[item.category] || categoryColors.other}>
                          {item.category ? t(`category_${item.category}`) : item.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.quantity <= item.min_quantity && (
                          <TrendingDown className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={item.quantity <= item.min_quantity ? 'text-amber-500 font-medium' : ''}>
                          {item.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unit_cost ? money.base(item.unit_cost) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.sell_price ? money.base(item.sell_price) : '-'}
                    </TableCell>
                    <TableCell>
                      {item.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setRestockItem(item)
                            setShowRestockDialog(true)
                          }}
                          title={t('restock')}
                        >
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingItem(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editItem') : t('addInventoryItem')}</DialogTitle>
            <DialogDescription>
              {editingItem ? t('updateItemInfo') : t('addNewItemDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <PhotoUpload
              label={t('itemPhoto')}
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">{t('itemName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('itemNamePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">{t('sku')}</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="OIL-FLT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t('category')}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{t(`category_${cat}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('quantity')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_quantity">{t('minQuantity')}</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_cost">{t('unitCostField')}</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell_price">{t('sellPriceField')}</Label>
                <Input
                  id="sell_price"
                  type="number"
                  step="0.01"
                  value={formData.sell_price}
                  onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">{t('storageLocation')}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Shelf A-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">{t('supplier')}</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="AutoParts Inc"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.name}
            >
              {isSaving ? t('saving') : editingItem ? t('update') : t('addItem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={showRestockDialog} onOpenChange={(open) => {
        setShowRestockDialog(open)
        if (!open) {
          setRestockItem(null)
          setRestockQty('')
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('restockItem')}</DialogTitle>
            <DialogDescription>
              {t('addStockTo', { name: restockItem?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">{t('currentQuantity')}</p>
              <p className="text-3xl font-semibold">{restockItem?.quantity}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock_qty">{t('addQuantity')}</Label>
              <Input
                id="restock_qty"
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder={t('enterQuantityToAdd')}
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestockDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleRestock} 
              disabled={!restockQty || parseInt(restockQty) <= 0}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('restock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {detailItem && (
            <>
              <div className="relative aspect-video w-full bg-muted">
                {detailItem.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getBlobUrl(detailItem.image_url) || ''}
                    alt={detailItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
                    <ImageIcon className="h-12 w-12" />
                    <span className="text-sm">{t('noImage')}</span>
                  </div>
                )}
                {detailItem.quantity <= detailItem.min_quantity && (
                  <Badge variant="outline" className="absolute top-3 left-3 bg-amber-500/90 text-white border-transparent">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {t('lowStock')}
                  </Badge>
                )}
              </div>

              <div className="p-6 max-h-[55vh] overflow-y-auto">
                <DialogHeader className="text-left">
                  <div className="flex items-start justify-between gap-3">
                    <DialogTitle className="text-xl">{detailItem.name}</DialogTitle>
                    {detailItem.category && (
                      <Badge variant="outline" className={categoryColors[detailItem.category] || categoryColors.other}>
                        {t(`category_${detailItem.category}`)}
                      </Badge>
                    )}
                  </div>
                  {detailItem.description && (
                    <DialogDescription>{detailItem.description}</DialogDescription>
                  )}
                </DialogHeader>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">{t('qty')}</p>
                    <p className={`text-lg font-semibold ${detailItem.quantity <= detailItem.min_quantity ? 'text-amber-500' : ''}`}>
                      {detailItem.quantity}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">{t('minQuantity')}</p>
                    <p className="text-lg font-semibold">{detailItem.min_quantity}</p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">{t('unitCost')}</p>
                    <p className="text-lg font-semibold">{detailItem.unit_cost ? money.base(detailItem.unit_cost) : '-'}</p>
                  </div>
                  <div className="rounded-lg border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">{t('sellPrice')}</p>
                    <p className="text-lg font-semibold">{detailItem.sell_price ? money.base(detailItem.sell_price) : '-'}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {detailItem.sku && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono">{detailItem.sku}</span>
                    </div>
                  )}
                  {detailItem.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{detailItem.location}</span>
                    </div>
                  )}
                  {detailItem.supplier && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>{detailItem.supplier}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      const item = detailItem
                      setDetailItem(null)
                      setRestockItem(item)
                      setShowRestockDialog(true)
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2 text-emerald-200" />
                    {t('restock')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const item = detailItem
                      setDetailItem(null)
                      handleEdit(item)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('editItem')}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-600 ml-auto"
                    onClick={() => {
                      setDeleteId(detailItem.id)
                      setDetailItem(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
