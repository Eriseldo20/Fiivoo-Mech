// Shared i18n configuration - can be imported by client and server components

export const locales = ['en', 'sq', 'de', 'es', 'fr', 'it'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  sq: 'Shqip',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

export const defaultLocale: Locale = 'en'
