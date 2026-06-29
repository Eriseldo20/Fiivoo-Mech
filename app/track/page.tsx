import { getLocale } from 'next-intl/server'
import { TrackingPortal } from '@/components/track/tracking-portal'

export default async function TrackPage() {
  const locale = await getLocale()
  return <TrackingPortal locale={locale} />
}
