'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function PortalHeader({
  shopName,
  workerName,
}: {
  shopName: string
  workerName: string | null
}) {
  const router = useRouter()
  const t = useTranslations('portal')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/fiivoo-icon.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {shopName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {workerName ? t('greeting', { name: workerName }) : t('workerPortal')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('signOut')}</span>
        </Button>
      </div>
    </header>
  )
}
