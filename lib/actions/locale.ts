'use server'

import { cookies } from 'next/headers'
import { locales, type Locale } from '@/lib/i18n/config'

export async function setUserLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error('Invalid locale')
  }
  
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
}

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value
  return locales.includes(locale as Locale) ? (locale as Locale) : 'en'
}
