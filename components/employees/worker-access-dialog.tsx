'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { KeyRound, Copy, Check, ShieldOff, Loader2 } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { createWorkerAccount, revokeWorkerAccount } from '@/lib/actions/staff'

interface WorkerAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    user_id: string | null
  } | null
  onChanged: () => void
}

/** Generates a readable temporary password. */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pw = ''
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  for (let i = 0; i < 12; i++) pw += chars[arr[i] % chars.length]
  return pw
}

export function WorkerAccessDialog({ open, onOpenChange, employee, onChanged }: WorkerAccessDialogProps) {
  const t = useTranslations('employees')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [created, setCreated] = useState(false)

  // Sync form when the dialog opens for a specific employee.
  const dialogKey = employee?.id ?? 'none'

  function reset() {
    setEmail(employee?.email ?? '')
    setPassword(generatePassword())
    setError(null)
    setCreated(false)
    setCopied(false)
  }

  const hasAccount = Boolean(employee?.user_id)

  async function handleCreate() {
    if (!employee) return
    setBusy(true)
    setError(null)
    const res = await createWorkerAccount({ employeeId: employee.id, email, password })
    setBusy(false)
    if (res.ok) {
      setCreated(true)
      onChanged()
    } else {
      setError(res.error)
    }
  }

  async function handleRevoke() {
    if (!employee) return
    setBusy(true)
    setError(null)
    const res = await revokeWorkerAccount(employee.id)
    setBusy(false)
    if (res.ok) {
      onChanged()
      onOpenChange(false)
    } else {
      setError(res.error)
    }
  }

  function copyCredentials() {
    navigator.clipboard.writeText(`${t('portalEmail')}: ${email}\n${t('portalPassword')}: ${password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onOpenChange={(o) => {
        if (o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {t('portalAccess')}
          </DialogTitle>
          <DialogDescription>
            {employee ? `${employee.first_name} ${employee.last_name}` : ''}
          </DialogDescription>
        </DialogHeader>

        {hasAccount ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t('accountActiveDesc')}</p>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              {employee?.email}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button variant="destructive" onClick={handleRevoke} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              {t('revokeAccess')}
            </Button>
          </div>
        ) : created ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-emerald-600">{t('accountCreatedDesc')}</p>
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 text-sm font-mono">
              <div>{email}</div>
              <div>{password}</div>
            </div>
            <Button variant="outline" onClick={copyCredentials} className="w-full">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? t('copied') : t('copyCredentials')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t('createAccountDesc')}</p>
            <div className="space-y-2">
              <Label htmlFor="worker-email">{t('portalEmail')}</Label>
              <Input
                id="worker-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="worker@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker-pw">{t('portalPassword')}</Label>
              <div className="flex gap-2">
                <Input
                  id="worker-pw"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
                  {t('regenerate')}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={busy || !email || password.length < 8}
                className="w-full"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                {t('createLogin')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
