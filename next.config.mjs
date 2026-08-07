import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Serve modern, responsive image formats instead of the raw large PNG/AVIF assets.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Tree-shake large icon/utility/chart packages so only used exports ship to the client.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'radix-ui',
      '@radix-ui/react-icons',
    ],
  },
}

export default withNextIntl(nextConfig)
