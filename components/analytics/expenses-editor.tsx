'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { saveMonthlyExpenses } from '@/lib/actions/expenses'
import type { ExpenseBreakdown } from '@/lib/data/analytics-queries'

const FIELDS: { key: keyof ExpenseBreakdown; labelKey: string }[] = [
  { key: 'rent', labelKey: 'rent' },
  { key: 'utilities', labelKey: 'utilities' },
  { key: 'payroll', labelKey: 'payroll' },
  { key: 'misc', labelKey: 'miscellaneous' },
]

export function ExpensesEditor({
  year,
  month,
  expenses,
}: {
  year: number
  month: number
  expenses: ExpenseBreakdown
}) {
  const router = useRouter()
  const t = useTranslations('analytics')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState({
    rent: String(expenses.rent),
    utilities: String(expenses.utilities),
    payroll: String(expenses.payroll),
    misc: String(expenses.misc),
  })

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await saveMonthlyExpenses(year, month, {
        rent: parseFloat(values.rent) || 0,
        utilities: parseFloat(values.utilities) || 0,
        payroll: parseFloat(values.payroll) || 0,
        misc: parseFloat(values.misc) || 0,
      })
      if (!result.success) {
        setError(result.error || t('failedToSave'))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          {t('editExpenses')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editMonthlyExpenses')}</DialogTitle>
          <DialogDescription>
            {expenses.isOverride ? t('overrideDescription') : t('defaultsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label htmlFor={`exp-${f.key}`}>{t(f.labelKey)} (€)</Label>
              <Input
                id={`exp-${f.key}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values[f.key as 'rent' | 'utilities' | 'payroll' | 'misc']}
                onChange={(e) =>
                  setValues({ ...values, [f.key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('saving') : t('saveExpenses')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
