import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Fiivoo — Track your service',
  description: 'Follow your vehicle service progress in real time.',
}

export default async function TrackLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('tracking')
  return (
    <div className="track-light flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Image
            src="/brand/fiivoo-logo-black.png"
            alt="Fiivoo"
            width={150}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="text-sm font-medium text-muted-foreground">{t('headerTag')}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
          {t('poweredBy')}
        </div>
      </footer>
    </div>
  )
}
