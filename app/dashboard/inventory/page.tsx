'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  MapPin
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

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
  created_at: string
}

const categories = [
  { value: 'parts', label: 'Parts' },
  { value: 'fluids', label: 'Fluids' },
  { value: 'filters', label: 'Filters' },
  { value: 'tires', label: 'Tires' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'tools', label: 'Tools' },
  { value: 'other', label: 'Other' },
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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showRestockDialog, setShowRestockDialog] = useState(false)
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [shopId, setShopId] = useState<string | null>(null)

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
  })

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()

    if (profile?.shop_id) {
      setShopId(profile.shop_id)
      
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('name')

      setInventory(data || [])
    }
    setIsLoading(false)
  }

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
    })
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!shopId || !formData.name) return

    setIsSaving(true)
    const supabase = createClient()

    const itemData = {
      shop_id: shopId,
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
    }

    if (editingItem) {
      await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', editingItem.id)
    } else {
      await supabase
        .from('inventory')
        .insert(itemData)
    }

    setIsSaving(false)
    setShowAddDialog(false)
    setEditingItem(null)
    resetForm()
    loadInventory()
  }

  const handleRestock = async () => {
    if (!restockItem || !restockQty) return

    const supabase = createClient()
    const qty = parseInt(restockQty)
    
    // Update inventory quantity
    await supabase
      .from('inventory')
      .update({ quantity: restockItem.quantity + qty })
      .eq('id', restockItem.id)

    // Record transaction
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('inventory_transactions')
      .insert({
        inventory_id: restockItem.id,
        transaction_type: 'in',
        quantity: qty,
        notes: 'Manual restock',
        created_by: user?.id,
      })

    setShowRestockDialog(false)
    setRestockItem(null)
    setRestockQty('')
    loadInventory()
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const supabase = createClient()
    await supabase.from('inventory').delete().eq('id', deleteId)
    
    setDeleteId(null)
    loadInventory()
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

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header title="Inventory" description="Track parts and supplies" />
        <div className="p-4 md:p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title="Inventory" 
        description="Track parts and supplies"
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
                  <p className="text-sm text-muted-foreground">Total Items</p>
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
                  <p className="text-sm text-muted-foreground">Low Stock</p>
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
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
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
                  <p className="text-sm text-muted-foreground">Total Units</p>
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
                <span className="font-semibold text-amber-500">Low Stock Alert</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 5).map(item => (
                  <Badge key={item.id} variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {item.name} ({item.quantity} left)
                  </Badge>
                ))}
                {lowStockItems.length > 5 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    +{lowStockItems.length - 5} more
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
              placeholder="Search inventory..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
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
              <h3 className="font-semibold mb-1">No inventory items found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first item'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
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
                              {categories.find(c => c.value === item.category)?.label || item.category}
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
                            <p className="text-muted-foreground text-xs">Qty</p>
                            <p className={`font-medium ${item.quantity <= item.min_quantity ? 'text-amber-500' : ''}`}>
                              {item.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Cost</p>
                            <p className="font-medium">{item.unit_cost ? formatCurrency(item.unit_cost) : '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Price</p>
                            <p className="font-medium">{item.sell_price ? formatCurrency(item.sell_price) : '-'}</p>
                          </div>
                        </div>
                      </div>
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
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Sell Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id} className={item.quantity <= item.min_quantity ? 'bg-amber-500/5' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
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
                          {categories.find(c => c.value === item.category)?.label || item.category}
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
                      {item.unit_cost ? formatCurrency(item.unit_cost) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.sell_price ? formatCurrency(item.sell_price) : '-'}
                    </TableCell>
                    <TableCell>
                      {item.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setRestockItem(item)
                            setShowRestockDialog(true)
                          }}
                          title="Restock"
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
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item information' : 'Add a new item to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Oil Filter"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="OIL-FLT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_quantity">Min Quantity (Alert)</Label>
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
                <Label htmlFor="unit_cost">Unit Cost ($)</Label>
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
                <Label htmlFor="sell_price">Sell Price ($)</Label>
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
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Shelf A-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
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
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.name}
            >
              {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
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
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>
              Add stock to {restockItem?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Current Quantity</p>
              <p className="text-3xl font-semibold">{restockItem?.quantity}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock_qty">Add Quantity</Label>
              <Input
                id="restock_qty"
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder="Enter quantity to add"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestockDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestock} 
              disabled={!restockQty || parseInt(restockQty) <= 0}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
