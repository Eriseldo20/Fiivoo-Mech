export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  Package,
  Receipt,
  Wallet,
  Trophy,
  FileCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import {
  getMonthlyAnalytics,
  getMonthlyTrend,
} from '@/lib/data/analytics-queries'
import { MonthSelector } from '@/components/analytics/month-selector'
import { RevenueTrendChart } from '@/components/analytics/revenue-trend-chart'
import { ExpensesEditor } from '@/components/analytics/expenses-editor'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const shopId = profile?.shop_id
  if (!shopId) redirect('/onboarding')

  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear()
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1

  const [analytics, trend] = await Promise.all([
    getMonthlyAnalytics(shopId, year, month),
    getMonthlyTrend(shopId, year, month, 12),
  ])

  // Simple projection: trailing 3-month average of net profit (excluding current month)
  const past = trend.slice(0, -1)
  const lastThree = past.slice(-3)
  const projectedNet =
    lastThree.length > 0
      ? lastThree.reduce((s, p) => s + p.netProfit, 0) / lastThree.length
      : 0

  const profitPositive = analytics.netProfit >= 0
  const bestEmployee = analytics.employees[0]

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header
        title="Analytics & Revenue"
        description="Monthly performance, profit, and operating costs"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Period controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <MonthSelector year={year} month={month} />
          <ExpensesEditor year={year} month={month} expenses={analytics.expenses} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Revenue"
            value={formatCurrency(analytics.revenue)}
            icon={<TrendingUp className="h-5 w-5" />}
            hint={`${analytics.approvedCount} approved estimate${analytics.approvedCount !== 1 ? 's' : ''}`}
            tone="primary"
          />
          <KpiCard
            title="Inventory Profit"
            value={formatCurrency(analytics.inventoryProfit)}
            icon={<Package className="h-5 w-5" />}
            hint={`${formatCurrency(analytics.inventoryCost)} parts cost`}
            tone="neutral"
          />
          <KpiCard
            title="Operating Expenses"
            value={formatCurrency(analytics.expenses.total)}
            icon={<Receipt className="h-5 w-5" />}
            hint={analytics.expenses.isOverride ? 'Custom for this month' : 'Recurring defaults'}
            tone="neutral"
          />
          <KpiCard
            title="Net Profit"
            value={formatCurrency(analytics.netProfit)}
            icon={profitPositive ? <Wallet className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            hint="Revenue − parts cost − expenses"
            tone={profitPositive ? 'success' : 'danger'}
          />
        </div>

        {/* Trend chart */}
        <RevenueTrendChart data={trend} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Profit & Loss breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss</CardTitle>
              <CardDescription>How net profit is calculated this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <PnlRow label="Approved revenue" value={analytics.revenue} positive />
              <PnlRow label="Parts cost (COGS)" value={-analytics.inventoryCost} />
              <Divider />
              <PnlRow label="Rent" value={-analytics.expenses.rent} muted />
              <PnlRow label="Utilities" value={-analytics.expenses.utilities} muted />
              <PnlRow label="Payroll" value={-analytics.expenses.payroll} muted />
              <PnlRow label="Miscellaneous" value={-analytics.expenses.misc} muted />
              <Divider />
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold">Net Profit</span>
                <span className={`font-bold ${profitPositive ? 'text-[var(--chart-3)]' : 'text-destructive'}`}>
                  {formatCurrency(analytics.netProfit)}
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <Sparkles className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Projected net profit (3-month avg):{' '}
                  <span className="font-medium text-foreground">{formatCurrency(projectedNet)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Best employee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[var(--chart-5)]" />
                Top Performers
              </CardTitle>
              <CardDescription>Based on completed jobs this month</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.employees.length === 0 ? (
                <EmptyState icon={<FileCheck className="h-8 w-8" />} text="No completed jobs this month" />
              ) : (
                <div className="space-y-3">
                  {bestEmployee && (
                    <div className="flex items-center justify-between rounded-lg border border-[var(--chart-5)]/30 bg-[var(--chart-5)]/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--chart-5)]/15 text-[var(--chart-5)] font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold">{bestEmployee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {bestEmployee.completedJobs} job{bestEmployee.completedJobs !== 1 ? 's' : ''} completed
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">{formatCurrency(bestEmployee.revenue)}</span>
                    </div>
                  )}
                  {analytics.employees.slice(1).map((emp, i) => (
                    <div key={emp.employeeId} className="flex items-center justify-between px-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
                          {i + 2}
                        </div>
                        <span className="text-sm">{emp.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{emp.completedJobs} jobs</Badge>
                        <span className="text-sm text-muted-foreground">{formatCurrency(emp.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory profit table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Used & Profit</CardTitle>
            <CardDescription>Parts consumed this month (sell price − buy price)</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.inventoryRows.length === 0 ? (
              <EmptyState icon={<Package className="h-8 w-8" />} text="No inventory used this month" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Buy</TableHead>
                      <TableHead className="text-right">Sell</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.inventoryRows.map((row) => (
                      <TableRow key={row.inventoryId}>
                        <TableCell>
                          <div className="font-medium">{row.name}</div>
                          {row.sku && <div className="text-xs text-muted-foreground">{row.sku}</div>}
                        </TableCell>
                        <TableCell className="text-right">{row.quantityUsed}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(row.unitCost)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(row.sellPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-[var(--chart-3)]">
                          {formatCurrency(row.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  hint,
  tone,
}: {
  title: string
  value: string
  icon: React.ReactNode
  hint: string
  tone: 'primary' | 'success' | 'danger' | 'neutral'
}) {
  const toneClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)]',
    danger: 'bg-destructive/10 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
  }
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function PnlRow({
  label,
  value,
  positive,
  muted,
}: {
  label: string
  value: number
  positive?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className={positive ? 'font-medium text-[var(--chart-3)]' : value < 0 ? 'text-destructive' : ''}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border my-1" />
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  )
}
