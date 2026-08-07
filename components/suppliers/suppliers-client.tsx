'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Building2,
  Plus,
  Trash2,
  Pencil,
  Euro,
  Receipt,
  FileText,
  Package,
  X,
  ChevronDown,
} from 'lucide-react'
import { useCurrency } from '@/components/providers/currency-provider'
import { toCurrencyCode } from '@/lib/currency'
import {
  saveSupplier,
  deleteSupplier,
  savePurchase,
  deletePurchase,
} from '@/lib/actions/suppliers'

type Supplier = Record<string, any>
type Purchase = Record<string, any>
type InventoryItem = Record<string, any>

interface SuppliersClientProps {
  suppliers: Supplier[]
  purchases: Purchase[]
  inventory: InventoryItem[]
  summary: {
    allTime: number
    thisMonth: number
    invoiceCount: number
    bySupplier: { supplierId: string; name: string; total: number; count: number }[]
  }
}

type LineItem = {
  inventory_id: string | null
  description: string
  quantity: string
  unit_cost: string
}

const emptyLine = (): LineItem => ({
  inventory_id: null,
  description: '',
  quantity: '1',
  unit_cost: '0',
})

export function SuppliersClient({
  suppliers,
  purchases,
  inventory,
  summary,
}: SuppliersClientProps) {
  const t = useTranslations('suppliers')
  const router = useRouter()
  const money = useCurrency()

  // Supplier dialog
  const [supplierDialog, setSupplierDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  // Purchase dialog
  const [purchaseDialog, setPurchaseDialog] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const [lines, setLines] = useState<LineItem[]>([emptyLine()])

  const [isSaving, setIsSaving] = useState(false)
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null)
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const spendBySupplier = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    for (const s of summary.bySupplier) map.set(s.supplierId, { total: s.total, count: s.count })
    return map
  }, [summary])

  const purchaseTotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_cost) || 0),
        0,
      ),
    [lines],
  )

  // ---- Supplier handlers ----
  const openNewSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm({ name: '', contact_name: '', phone: '', email: '', address: '', notes: '' })
    setSupplierDialog(true)
  }

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s)
    setSupplierForm({
      name: s.name ?? '',
      contact_name: s.contact_name ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      notes: s.notes ?? '',
    })
    setSupplierDialog(true)
  }

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) return
    setIsSaving(true)
    const result = await saveSupplier(editingSupplier?.id ?? null, supplierForm)
    setIsSaving(false)
    if (!result.ok) return
    setSupplierDialog(false)
    router.refresh()
  }

  const handleDeleteSupplier = async () => {
    if (!deleteSupplierId) return
    const result = await deleteSupplier(deleteSupplierId)
    setDeleteSupplierId(null)
    if (result.ok) router.refresh()
  }

  // ---- Purchase handlers ----
  const openNewPurchase = () => {
    setPurchaseForm({
      supplier_id: suppliers[0]?.id ?? '',
      invoice_number: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      notes: '',
    })
    setLines([emptyLine()])
    setPurchaseDialog(true)
  }

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  const onPickInventory = (index: number, invId: string) => {
    if (invId === 'none') {
      updateLine(index, { inventory_id: null })
      return
    }
    const item = inventory.find((i) => i.id === invId)
    updateLine(index, {
      inventory_id: invId,
      description: item?.name ?? '',
      unit_cost: item?.unit_cost != null ? String(item.unit_cost) : lines[index].unit_cost,
    })
  }

  const handleSavePurchase = async () => {
    if (!purchaseForm.supplier_id) return
    setIsSaving(true)
    const result = await savePurchase({
      supplier_id: purchaseForm.supplier_id,
      invoice_number: purchaseForm.invoice_number,
      purchase_date: purchaseForm.purchase_date,
      notes: purchaseForm.notes,
      items: lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          inventory_id: l.inventory_id,
          description: l.description,
          quantity: parseFloat(l.quantity) || 0,
          unit_cost: parseFloat(l.unit_cost) || 0,
        })),
    })
    setIsSaving(false)
    if (!result.ok) return
    setPurchaseDialog(false)
    router.refresh()
  }

  const handleDeletePurchase = async () => {
    if (!deletePurchaseId) return
    const result = await deletePurchase(deletePurchaseId)
    setDeletePurchaseId(null)
    if (result.ok) router.refresh()
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header title={t('title')} description={t('description')} />

      <div className="p-4 md:p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Euro className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{money.base(summary.allTime)}</p>
                  <p className="text-sm text-muted-foreground">{t('totalSpent')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Receipt className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{money.base(summary.thisMonth)}</p>
                  <p className="text-sm text-muted-foreground">{t('spentThisMonth')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{summary.invoiceCount}</p>
                  <p className="text-sm text-muted-foreground">{t('invoices')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="suppliers" className="w-full">
          <TabsList>
            <TabsTrigger value="suppliers">{t('tabSuppliers')}</TabsTrigger>
            <TabsTrigger value="purchases">{t('tabPurchases')}</TabsTrigger>
          </TabsList>

          {/* Suppliers tab */}
          <TabsContent value="suppliers" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={openNewSupplier} className="rounded-none">
                <Plus className="h-4 w-4 mr-2" />
                {t('addSupplier')}
              </Button>
            </div>

            {suppliers.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-10 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  {t('noSuppliers')}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {suppliers.map((s) => {
                  const spend = spendBySupplier.get(s.id)
                  return (
                    <Card key={s.id} className="glass-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{s.name}</p>
                            {s.contact_name && (
                              <p className="text-sm text-muted-foreground truncate">
                                {s.contact_name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEditSupplier(s)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-500"
                              onClick={() => setDeleteSupplierId(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {s.phone && <p>{s.phone}</p>}
                          {s.email && <p className="truncate">{s.email}</p>}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-xs text-muted-foreground">
                            {t('invoiceCount', { count: spend?.count ?? 0 })}
                          </span>
                          <span className="font-semibold text-emerald-500">
                            {money.base(spend?.total ?? 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Purchases tab */}
          <TabsContent value="purchases" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button
                onClick={openNewPurchase}
                disabled={suppliers.length === 0}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addPurchase')}
              </Button>
            </div>

            {suppliers.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-10 text-center text-muted-foreground">
                  {t('addSupplierFirst')}
                </CardContent>
              </Card>
            ) : purchases.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-10 text-center text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  {t('noPurchases')}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>{t('colSupplier')}</TableHead>
                        <TableHead>{t('colInvoice')}</TableHead>
                        <TableHead>{t('colDate')}</TableHead>
                        <TableHead className="text-right">{t('colTotal')}</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => {
                        const isOpen = expanded === p.id
                        const items = (p.items as any[]) ?? []
                        return (
                          <Fragment key={p.id}>
                            <TableRow
                              className="cursor-pointer"
                              onClick={() => setExpanded(isOpen ? null : p.id)}
                            >
                              <TableCell>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {p.supplier?.name ?? '-'}
                              </TableCell>
                              <TableCell>
                                {p.invoice_number || (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{p.purchase_date}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {money.formatIn(Number(p.total) || 0, toCurrencyCode(p.currency))}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletePurchaseId(p.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isOpen && (
                              <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableCell colSpan={6} className="p-0">
                                  <div className="p-4 space-y-2">
                                    {items.map((it) => (
                                      <div
                                        key={it.id}
                                        className="flex items-center justify-between text-sm gap-3"
                                      >
                                        <span className="flex items-center gap-2 min-w-0">
                                          {it.inventory_id && (
                                            <Package className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                          )}
                                          <span className="truncate">{it.description}</span>
                                        </span>
                                        <span className="text-muted-foreground whitespace-nowrap">
                                          {it.quantity} &times;{' '}
                                          {money.formatIn(
                                            Number(it.unit_cost) || 0,
                                            toCurrencyCode(p.currency),
                                          )}{' '}
                                          ={' '}
                                          <span className="text-foreground font-medium">
                                            {money.formatIn(
                                              Number(it.line_total) || 0,
                                              toCurrencyCode(p.currency),
                                            )}
                                          </span>
                                        </span>
                                      </div>
                                    ))}
                                    {p.notes && (
                                      <p className="text-sm text-muted-foreground pt-2 border-t border-border/60">
                                        {p.notes}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Supplier dialog (large, square corners) ── */}
      <Dialog open={supplierDialog} onOpenChange={setSupplierDialog}>
        <DialogContent className="w-[95vw] sm:max-w-3xl rounded-none max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? t('editSupplier') : t('addSupplier')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="s-name">{t('name')}</Label>
              <Input
                id="s-name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-contact">{t('contactName')}</Label>
              <Input
                id="s-contact"
                value={supplierForm.contact_name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, contact_name: e.target.value })
                }
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-phone">{t('phone')}</Label>
              <Input
                id="s-phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">{t('email')}</Label>
              <Input
                id="s-email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-address">{t('address')}</Label>
              <Input
                id="s-address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="s-notes">{t('notes')}</Label>
              <Textarea
                id="s-notes"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSupplierDialog(false)}
              className="rounded-none"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveSupplier}
              disabled={isSaving || !supplierForm.name.trim()}
              className="rounded-none"
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Purchase dialog (large, square corners) ── */}
      <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
        <DialogContent className="w-[95vw] sm:max-w-5xl rounded-none max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addPurchase')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <Select
                value={purchaseForm.supplier_id}
                onValueChange={(v) => setPurchaseForm({ ...purchaseForm, supplier_id: v })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder={t('selectSupplier')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-invoice">{t('invoiceNumber')}</Label>
              <Input
                id="p-invoice"
                value={purchaseForm.invoice_number}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })
                }
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-date">{t('date')}</Label>
              <Input
                id="p-date"
                type="date"
                value={purchaseForm.purchase_date}
                onChange={(e) =>
                  setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })
                }
                className="rounded-none"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <Label>{t('lineItems')}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('addLine')}
              </Button>
            </div>

            {lines.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-end border border-border p-3"
              >
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-xs">{t('linkPart')}</Label>
                  <Select
                    value={line.inventory_id ?? 'none'}
                    onValueChange={(v) => onPickInventory(i, v)}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noPart')}</SelectItem>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-3 space-y-1">
                  <Label className="text-xs">{t('descriptionLabel')}</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">{t('qty')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div className="col-span-5 sm:col-span-2 space-y-1">
                  <Label className="text-xs">{t('unitCost')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(e) => updateLine(i, { unit_cost: e.target.value })}
                    className="rounded-none"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 flex justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-red-500 hover:text-red-500"
                    onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lines.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 py-2">
            <Label htmlFor="p-notes">{t('notes')}</Label>
            <Textarea
              id="p-notes"
              value={purchaseForm.notes}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
              className="rounded-none"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">{t('invoiceTotal')}</span>
            <span className="text-2xl font-bold text-emerald-500">
              {money.format(purchaseTotal)}
            </span>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseDialog(false)}
              className="rounded-none"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSavePurchase}
              disabled={isSaving || !purchaseForm.supplier_id}
              className="rounded-none"
            >
              {t('savePurchase')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete supplier confirm */}
      <AlertDialog
        open={!!deleteSupplierId}
        onOpenChange={(o) => !o && setDeleteSupplierId(null)}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteSupplierTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteSupplierDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="rounded-none bg-red-500 hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete purchase confirm */}
      <AlertDialog
        open={!!deletePurchaseId}
        onOpenChange={(o) => !o && setDeletePurchaseId(null)}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePurchaseTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deletePurchaseDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePurchase}
              className="rounded-none bg-red-500 hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
