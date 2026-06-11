'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { CURRENCY } from '@/lib/currency'
import type { MonthlyTrendPoint } from '@/lib/data/analytics-queries'

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  netProfit: { label: 'Net Profit', color: 'var(--chart-3)' },
} satisfies ChartConfig

function compact(value: number) {
  return new Intl.NumberFormat(CURRENCY.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function RevenueTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profit Trend</CardTitle>
        <CardDescription>Last 12 months of approved revenue and net profit</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={11}
              tickFormatter={(v) => `${CURRENCY.symbol}${compact(v)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium">
                        {CURRENCY.symbol}
                        {Number(value).toLocaleString(CURRENCY.locale, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
            <Line
              dataKey="netProfit"
              type="monotone"
              stroke="var(--color-netProfit)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
