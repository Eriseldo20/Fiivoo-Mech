import { getLocale } from 'next-intl/server'
import { TrackingPortal } from '@/components/track/tracking-portal'

export default async function TrackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const locale = await getLocale()
  return <TrackingPortal initialToken={decodeURIComponent(token).toUpperCase()} locale={locale} />
}
