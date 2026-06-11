'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, User } from 'lucide-react'

interface CustomerModalProps {
  open: boolean
  onClose: () => void
  shopId: string
  onCreated: (customer: { id: string; name: string; phone: string | null; email: string | null }) => void
}

export function CustomerModal({ open, onClose, shopId, onCreated }: CustomerModalProps) {
  const t = useTranslations('customers')
  const tc = useTranslations('common')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          shop_id: shopId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      onCreated(data)
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToCreate'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <User className="h-4 w-4 text-emerald-500" />
            </div>
            {t('addNewCustomer')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t('name')} *</Label>
            <Input
              id="customer-name"
              placeholder={t('customerNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 bg-background/50 border-border/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">{t('phone')}</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">{t('email')}</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10 bg-background/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-address">{t('address')}</Label>
            <Input
              id="customer-address"
              placeholder={t('addressPlaceholder')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-10 bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-notes">{t('notes')}</Label>
            <Textarea
              id="customer-notes"
              placeholder={t('notesPlaceholder')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px] bg-background/50 border-border/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('addCustomer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
