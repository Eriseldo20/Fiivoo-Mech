'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, Loader2, ShieldOff, UserX, Car, Wrench, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  searchCustomersForErasure,
  anonymizeCustomer,
  type GdprCustomer,
} from '@/lib/actions/gdpr'

export function PrivacySettings() {
  const t = useTranslations('settings')
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<GdprCustomer[]>([])
  const [target, setTarget] = useState<GdprCustomer | null>(null)
  const [isErasing, setIsErasing] = useState(false)

  const runSearch = async () => {
    setIsSearching(true)
    const res = await searchCustomersForErasure(term)
    setIsSearching(false)
    setHasSearched(true)
    if (!res.success) {
      toast.error(res.error ?? t('privacyError'))
      return
    }
    setResults(res.customers)
  }

  const confirmErase = async () => {
    if (!target) return
    setIsErasing(true)
    const res = await anonymizeCustomer(target.id)
    setIsErasing(false)
    if (!res.success) {
      toast.error(res.error ?? t('privacyError'))
      return
    }
    toast.success(t('privacyErasedToast'))
    setTarget(null)
    // Reflect the anonymized state in the current results
    setResults((prev) =>
      prev.map((c) =>
        c.id === target.id
          ? { ...c, name: 'Erased customer', email: null, phone: null, anonymized_at: new Date().toISOString() }
          : c,
      ),
    )
    router.refresh()
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('privacy')}</h2>
        <p className="text-sm text-muted-foreground">{t('privacyDescription')}</p>
      </div>

      {/* What happens notice */}
      <div className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
        <ShieldOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t('privacyHowTitle')}</p>
          <p>{t('privacyHowBody')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('privacySearchLabel')}</label>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            runSearch()
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('privacySearchPlaceholder')}
              className="h-11 pl-9"
            />
          </div>
          <Button type="submit" disabled={isSearching} className="h-11 shrink-0">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('privacySearchButton')}
          </Button>
        </form>
      </div>

      {/* Results */}
      {hasSearched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">{t('privacyNoResults')}</p>
      )}

      {results.length > 0 && (
        <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
          {results.map((c) => {
            const isErased = !!c.anonymized_at
            return (
              <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.name}</p>
                    {isErased && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('privacyErasedBadge')}
                      </Badge>
                    )}
                  </div>
                  {!isErased && (c.email || c.phone) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {[c.email, c.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Car className="h-3 w-3" />{c.vehicleCount}</span>
                    <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{c.jobCount}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{c.estimateCount}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                  disabled={isErased}
                  onClick={() => setTarget(c)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {t('privacyEraseButton')}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('privacyConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('privacyConfirmBody', { name: target?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isErasing}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmErase()
              }}
              disabled={isErasing}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isErasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
              {t('privacyConfirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
