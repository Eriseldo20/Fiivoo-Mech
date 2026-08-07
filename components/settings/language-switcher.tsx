'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { setUserLocale } from '@/lib/actions/locale'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleChange = (newLocale: string) => {
    startTransition(() => {
      setUserLocale(newLocale as Locale)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <Label className="text-base font-medium">{t('language')}</Label>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {locales.map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? 'default' : 'outline'}
            className={cn(
              'h-11 md:h-12 justify-start gap-2 transition-all text-sm',
              locale === loc && 'ring-2 ring-primary/20',
              isPending && 'opacity-50 pointer-events-none'
            )}
            onClick={() => handleChange(loc)}
          >
            <span className="text-base md:text-lg">{getFlag(loc)}</span>
            <span className="flex-1 text-left truncate">{localeNames[loc]}</span>
            {locale === loc && <Check className="h-4 w-4 flex-shrink-0" />}
          </Button>
        ))}
      </div>
    </div>
  )
}

function getFlag(locale: string): string {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    sq: '🇦🇱',
    de: '🇩🇪',
    es: '🇪🇸',
    fr: '🇫🇷',
    it: '🇮🇹',
  }
  return flags[locale] || '🌐'
}

// Compact dropdown version for mobile
export function LanguageDropdown() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleChange = (newLocale: string) => {
    startTransition(() => {
      setUserLocale(newLocale as Locale)
    })
  }

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-full h-11">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{getFlag(locale)}</span>
            <span>{localeNames[locale as Locale]}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <div className="flex items-center gap-2">
              <span>{getFlag(loc)}</span>
              <span>{localeNames[loc]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
