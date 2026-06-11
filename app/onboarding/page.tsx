'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Phone, Mail, MapPin, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          owner_id: user.id,
        })
        .select()
        .single()

      if (shopError) throw shopError

      // Update profile with shop_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shop_id: shop.id, role: 'owner' })
        .eq('id', user.id)

      if (profileError) throw profileError

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shop')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src="/brand/fiivoo-logo-black.png"
            alt="Fiivoo"
            width={180}
            height={56}
            className="h-11 w-auto object-contain dark:invert"
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Set up your shop</h1>
            <p className="text-muted-foreground">
              Let&apos;s get your workshop ready to manage jobs and estimates
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Shop Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Mike's Auto Repair"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopEmail" className="text-sm font-medium">
                  Shop Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="shopEmail"
                    type="email"
                    placeholder="shop@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !formData.name}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can update these details later in settings
        </p>
      </div>
    </div>
  )
}
