'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
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
  Receipt,
  Coins,
  ArrowLeftRight,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_EUR_TO_ALL,
  getCurrency,
  toCurrencyCode,
  type CurrencyCode,
} from '@/lib/currency'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { PrivacySettings } from './privacy-settings'
import { saveExpenseDefaults } from '@/lib/actions/expenses'

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
      currency: string | null
      eur_to_all_rate: number | string | null
    } | null
  } | null
  expenseDefaults?: {
    rent: number
    utilities: number
    payroll: number
    misc: number
  }
}

const tabs = [
  { id: 'profile', icon: User, labelKey: 'profile' },
  { id: 'shop', icon: Building2, labelKey: 'shop' },
  { id: 'expenses', icon: Receipt, labelKey: 'expenses' },
  { id: 'currency', icon: Coins, labelKey: 'currency' },
  { id: 'language', icon: Globe, labelKey: 'language' },
  { id: 'appearance', icon: Palette, labelKey: 'appearance' },
  { id: 'notifications', icon: Bell, labelKey: 'notifications' },
  { id: 'privacy', icon: Shield, labelKey: 'privacy' },
]

export function SettingsContent({ profile, expenseDefaults }: SettingsContentProps) {
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

  // Display currency plus the default rate stamped onto new documents. Changing
  // these never rewrites existing invoices, which keep their own saved rate.
  const [currencyData, setCurrencyData] = useState({
    currency: toCurrencyCode(profile?.shop?.currency),
    rate: (() => {
      const saved = Number(profile?.shop?.eur_to_all_rate)
      return String(Number.isFinite(saved) && saved > 0 ? saved : DEFAULT_EUR_TO_ALL)
    })(),
  })

  // Expenses are entered in the shop currency, so label them with its symbol
  // rather than a hardcoded euro sign.
  const expenseSymbol = getCurrency(currencyData.currency).symbol

  const [expenseData, setExpenseData] = useState({
    rent: String(expenseDefaults?.rent ?? 0),
    utilities: String(expenseDefaults?.utilities ?? 0),
    payroll: String(expenseDefaults?.payroll ?? 0),
    misc: String(expenseDefaults?.misc ?? 0),
  })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    // `profiles` has no updated_at column either.
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      })
      .eq('id', profile?.id)

    setIsSaving(false)

    if (error) {
      toast.error(t('profileSaveFailed'), { description: error.message })
      return
    }

    toast.success(t('profileSaved'))
    router.refresh()
  }

  const handleSaveShop = async () => {
    if (!profile?.shop_id) return
    setIsSaving(true)
    const supabase = createClient()
    
    // Same as above: no updated_at column exists on `shops`.
    const { error } = await supabase
      .from('shops')
      .update({
        name: shopData.name,
        address: shopData.address,
        phone: shopData.phone,
        email: shopData.email,
      })
      .eq('id', profile.shop_id)

    setIsSaving(false)

    if (error) {
      toast.error(t('shopSaveFailed'), { description: error.message })
      return
    }

    toast.success(t('shopSaved'))
    router.refresh()
  }

  const handleSaveCurrency = async () => {
    if (!profile?.shop_id) return
    const parsedRate = parseFloat(currencyData.rate)
    // A zero or negative rate would make every conversion nonsense, so refuse
    // to save it and fall back to the last good value.
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) return

    setIsSaving(true)
    const supabase = createClient()

    // Note: `shops` has no updated_at column — including one makes Postgres
    // reject the whole update, so only write real columns here.
    const { error } = await supabase
      .from('shops')
      .update({
        currency: currencyData.currency,
        eur_to_all_rate: parsedRate,
      })
      .eq('id', profile.shop_id)

    setIsSaving(false)

    // Surface failures instead of silently pretending the save worked.
    if (error) {
      toast.error(t('currencySaveFailed'), { description: error.message })
      return
    }

    toast.success(t('currencySaved'))
    router.refresh()
  }

  const handleSaveExpenses = async () => {
    setIsSaving(true)
    await saveExpenseDefaults({
      rent: parseFloat(expenseData.rent) || 0,
      utilities: parseFloat(expenseData.utilities) || 0,
      payroll: parseFloat(expenseData.payroll) || 0,
      misc: parseFloat(expenseData.misc) || 0,
    })
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
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
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
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
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

            {/* Expense Defaults Settings */}
            {activeTab === 'expenses' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('expenses')}</h2>
                  <p className="text-sm text-muted-foreground">{t('expensesDescription')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('rent')} ({expenseSymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={expenseData.rent}
                      onChange={(e) => setExpenseData({ ...expenseData, rent: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('utilities')} ({expenseSymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={expenseData.utilities}
                      onChange={(e) => setExpenseData({ ...expenseData, utilities: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('payroll')} ({expenseSymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={expenseData.payroll}
                      onChange={(e) => setExpenseData({ ...expenseData, payroll: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('misc')} ({expenseSymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={expenseData.misc}
                      onChange={(e) => setExpenseData({ ...expenseData, misc: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveExpenses} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('saveChanges')}
                </Button>
              </div>
            )}

            {/* Currency Settings */}
            {activeTab === 'currency' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('currency')}</h2>
                  <p className="text-sm text-muted-foreground">{t('currencyDescription')}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    {t('displayCurrency')}
                  </Label>
                  <Select
                    value={currencyData.currency}
                    onValueChange={(value) =>
                      setCurrencyData({ ...currencyData, currency: value as CurrencyCode })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">{t('currencyEur')}</SelectItem>
                      <SelectItem value="ALL">{t('currencyAll')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    {t('exchangeRate')}
                  </Label>
                  <Input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    inputMode="decimal"
                    value={currencyData.rate}
                    onChange={(e) => setCurrencyData({ ...currencyData, rate: e.target.value })}
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">{t('exchangeRateHint')}</p>
                </div>

                {/* Existing invoices keep their own stored rate, so the user can
                    change this safely without altering past documents. */}
                <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">
                  {t('rateHistoryNote')}
                </p>

                <Button onClick={handleSaveCurrency} disabled={isSaving} className="w-full sm:w-auto">
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
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('language')}</h2>
                  <p className="text-sm text-muted-foreground">{t('languageDescription')}</p>
                </div>
                
                <LanguageSwitcher />
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
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
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-4 md:p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">{t('notifications')}</h2>
                  <p className="text-sm text-muted-foreground">{t('notificationsDescription')}</p>
                </div>
                
                <p className="text-sm text-muted-foreground italic">{t('comingSoon')}</p>
              </div>
            )}

            {/* Privacy & GDPR Settings */}
            {activeTab === 'privacy' && <PrivacySettings />}
          </div>
        </div>
      </div>
    </div>
  )
}
