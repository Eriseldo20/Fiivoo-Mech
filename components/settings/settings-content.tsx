'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Building2, 
  Globe, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

interface SettingsContentProps {
  profile: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    shop_id: string | null
    shop?: {
      id: string
      name: string
      address: string | null
      phone: string | null
      email: string | null
    } | null
  } | null
}

const tabs = [
  { id: 'profile', icon: User, labelKey: 'profile' },
  { id: 'shop', icon: Building2, labelKey: 'shop' },
  { id: 'language', icon: Globe, labelKey: 'language' },
  { id: 'appearance', icon: Palette, labelKey: 'appearance' },
  { id: 'notifications', icon: Bell, labelKey: 'notifications' },
]

export function SettingsContent({ profile }: SettingsContentProps) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
  })

  const [shopData, setShopData] = useState({
    name: profile?.shop?.name || '',
    address: profile?.shop?.address || '',
    phone: profile?.shop?.phone || '',
    email: profile?.shop?.email || '',
  })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile?.id)

    setIsSaving(false)
    router.refresh()
  }

  const handleSaveShop = async () => {
    if (!profile?.shop_id) return
    setIsSaving(true)
    const supabase = createClient()
    
    await supabase
      .from('shops')
      .update({
        name: shopData.name,
        address: shopData.address,
        phone: shopData.phone,
        email: shopData.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.shop_id)

    setIsSaving(false)
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Tab Selector */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-4 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0 gap-2"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-20">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {t(tab.labelKey)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('profile')}</h2>
                  <p className="text-sm text-muted-foreground">{t('profileDescription')}</p>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('firstName')}</Label>
                      <Input
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('lastName')}</Label>
                      <Input
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">{t('emailCannotChange')}</p>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('saveChanges')}
                </Button>
              </div>
            )}

            {/* Shop Settings */}
            {activeTab === 'shop' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('shop')}</h2>
                  <p className="text-sm text-muted-foreground">{t('shopDescription')}</p>
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {t('shopName')}
                    </Label>
                    <Input
                      value={shopData.name}
                      onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {t('address')}
                    </Label>
                    <Textarea
                      value={shopData.address}
                      onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {t('phone')}
                      </Label>
                      <Input
                        value={shopData.phone}
                        onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {t('email')}
                      </Label>
                      <Input
                        type="email"
                        value={shopData.email}
                        onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveShop} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('saveChanges')}
                </Button>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('language')}</h2>
                  <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
                </div>
                
                <LanguageSwitcher />
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('appearance')}</h2>
                  <p className="text-sm text-muted-foreground">{t('appearanceDescription')}</p>
                </div>
                
                <div className="space-y-4">
                  <Label>{t('theme')}</Label>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">{t('themeHint')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('notifications')}</h2>
                  <p className="text-sm text-muted-foreground">{t('notificationsDescription')}</p>
                </div>
                
                <p className="text-sm text-muted-foreground italic">{t('comingSoon')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
