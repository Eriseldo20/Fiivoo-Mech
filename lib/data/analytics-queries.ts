import { createClient } from '@/lib/supabase/server'
import { toBase, toCurrencyCode } from '@/lib/currency'

/**
 * Normalise a stored money row to the base currency (EUR).
 *
 * Amounts are saved exactly as they were typed, so a 400 lek invoice holds
 * `400`. Summing that raw alongside euro rows would overstate it 100x, so every
 * aggregate must pass through here first, using the rate stored on that row
 * rather than the shop's current rate.
 */
function baseAmount(row: {
  total?: number | string | null
  currency?: string | null
  exchange_rate?: number | string | null
}): number {
  const amount = Number(row.total) || 0
  const rate = Number(row.exchange_rate)
  return toBase(amount, toCurrencyCode(row.currency), Number.isFinite(rate) && rate > 0 ? rate : 1)
}

/** Columns every money query needs so `baseAmount` can convert correctly. */
const MONEY_COLUMNS = 'total, currency, exchange_rate'

export interface ExpenseBreakdown {
  rent: number
  utilities: number
  payroll: number
  misc: number
  total: number
  /** true when the figures came from a saved monthly_expenses row, false when falling back to defaults */
  isOverride: boolean
}

export interface InventoryProfitRow {
  inventoryId: string
  name: string
  sku: string | null
  quantityUsed: number
  unitCost: number
  sellPrice: number
  revenue: number
  cost: number
  profit: number
}

export interface EmployeePerformanceRow {
  employeeId: string
  name: string
  completedJobs: number
  revenue: number
}

export interface MonthlyTrendPoint {
  year: number
  month: number
  label: string
  revenue: number
  expenses: number
  netProfit: number
}

export interface MonthlyAnalytics {
  year: number
  month: number
  revenue: number
  approvedCount: number
  /** Revenue from approved estimates the client has already paid */
  paidRevenue: number
  /** Revenue from approved estimates still awaiting payment */
  outstandingRevenue: number
  /** Number of approved estimates still unpaid */
  unpaidCount: number
  inventoryProfit: number
  inventoryCost: number
  expenses: ExpenseBreakdown
  netProfit: number
  inventoryRows: InventoryProfitRow[]
  employees: EmployeePerformanceRow[]
}

function monthRange(year: number, month: number) {
  // month is 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start: start.toISOString(), end: end.toISOString() }
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Resolve the expense breakdown for a given month.
 * Uses a saved monthly_expenses override if present, otherwise the shop's recurring defaults.
 */
export async function getExpensesForMonth(
  shopId: string,
  year: number,
  month: number,
): Promise<ExpenseBreakdown> {
  const supabase = await createClient()

  const [overrideResult, defaultsResult] = await Promise.all([
    supabase
      .from('monthly_expenses')
      .select('rent, utilities, payroll, misc')
      .eq('shop_id', shopId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle(),
    supabase
      .from('shop_expense_defaults')
      .select('rent, utilities, payroll, misc')
      .eq('shop_id', shopId)
      .maybeSingle(),
  ])

  const source = overrideResult.data ?? defaultsResult.data
  const rent = Number(source?.rent ?? 0)
  const utilities = Number(source?.utilities ?? 0)
  const payroll = Number(source?.payroll ?? 0)
  const misc = Number(source?.misc ?? 0)

  return {
    rent,
    utilities,
    payroll,
    misc,
    total: rent + utilities + payroll + misc,
    isOverride: Boolean(overrideResult.data),
  }
}

/** How long a debt has been outstanding. Buckets follow standard AR aging. */
export type AgingBucket = 'current' | 'thirty' | 'sixty' | 'ninety' | 'year'

export interface OverdueInvoice {
  id: string
  estimateNumber: string
  total: number
  createdAt: string
  /** Whole days since the invoice was raised. */
  daysOverdue: number
  bucket: AgingBucket
  vehicle: string | null
}

export interface OverdueCustomer {
  customerId: string
  name: string
  phone: string | null
  email: string | null
  /** Everything this customer still owes, across all invoices. */
  totalOwed: number
  invoiceCount: number
  /** Age of their single oldest unpaid invoice - drives the customer's badge. */
  oldestDays: number
  worstBucket: AgingBucket
  oldestDate: string
  newestDate: string
  invoices: OverdueInvoice[]
}

export interface ReceivablesAging {
  totalOwed: number
  customerCount: number
  invoiceCount: number
  /** Total owed per aging bucket, for the summary strip. */
  buckets: Record<AgingBucket, { total: number; count: number }>
  /** Owed the longest first, so the most urgent debt is at the top. */
  customers: OverdueCustomer[]
}

function bucketFor(days: number): AgingBucket {
  if (days >= 365) return 'year'
  if (days >= 90) return 'ninety'
  if (days >= 60) return 'sixty'
  if (days >= 30) return 'thirty'
  return 'current'
}

/**
 * Every unpaid approved invoice, grouped by customer, oldest debt first.
 *
 * Deliberately ALL-TIME and independent of the analytics month selector: a
 * debt from last year must stay visible no matter which month is on screen,
 * which is the entire point of an aging report.
 *
 * An estimate only becomes a receivable once it is `approved` - drafts,
 * rejected and expired estimates were never owed. This matches how
 * `getMonthlyAnalytics` recognises revenue, so the two always agree.
 */
export async function getReceivablesAging(shopId: string): Promise<ReceivablesAging> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('estimates')
    .select(
      `
      id, estimate_number, total, currency, exchange_rate, created_at, customer_id,
      customer:customers(id, name, phone, email),
      vehicle:vehicles(make, model, license_plate)
    `,
    )
    .eq('shop_id', shopId)
    .eq('status', 'approved')
    .eq('payment_status', 'unpaid')
    .order('created_at', { ascending: true })

  const rows = data ?? []
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const emptyBuckets = (): ReceivablesAging['buckets'] => ({
    current: { total: 0, count: 0 },
    thirty: { total: 0, count: 0 },
    sixty: { total: 0, count: 0 },
    ninety: { total: 0, count: 0 },
    year: { total: 0, count: 0 },
  })

  const buckets = emptyBuckets()
  const byCustomer = new Map<string, OverdueCustomer>()
  let totalOwed = 0

  for (const row of rows) {
    // Normalised to base EUR so lek and euro debts can be totalled together.
    const amount = baseAmount(row)
    const createdAt = String(row.created_at)

    // Compare calendar days so an invoice raised yesterday evening is 1 day
    // old, not 0 - avoids off-by-one flicker around midnight.
    const raised = new Date(createdAt)
    raised.setHours(0, 0, 0, 0)
    const daysOverdue = Math.max(
      0,
      Math.round((startOfToday.getTime() - raised.getTime()) / 86_400_000),
    )
    const bucket = bucketFor(daysOverdue)

    totalOwed += amount
    buckets[bucket].total += amount
    buckets[bucket].count += 1

    const customer = row.customer as unknown as {
      id: string
      name: string | null
      phone: string | null
      email: string | null
    } | null
    const vehicleRow = row.vehicle as unknown as {
      make: string | null
      model: string | null
      license_plate: string | null
    } | null

    const vehicle = vehicleRow
      ? [ [vehicleRow.make, vehicleRow.model].filter(Boolean).join(' '), vehicleRow.license_plate ]
          .filter(Boolean)
          .join(' • ') || null
      : null

    const invoice: OverdueInvoice = {
      id: String(row.id),
      estimateNumber: String(row.estimate_number ?? ''),
      total: amount,
      createdAt,
      daysOverdue,
      bucket,
      vehicle,
    }

    // Invoices with no customer attached still owe money, so group them under
    // a synthetic key rather than dropping them from the report.
    const key = customer?.id ?? `unassigned:${row.id}`
    const name = customer?.name?.trim() || 'Unknown customer'

    const existing = byCustomer.get(key)
    if (existing) {
      existing.totalOwed += amount
      existing.invoiceCount += 1
      existing.invoices.push(invoice)
      if (daysOverdue > existing.oldestDays) {
        existing.oldestDays = daysOverdue
        existing.worstBucket = bucket
        existing.oldestDate = createdAt
      }
      if (createdAt > existing.newestDate) existing.newestDate = createdAt
    } else {
      byCustomer.set(key, {
        customerId: customer?.id ?? key,
        name,
        phone: customer?.phone ?? null,
        email: customer?.email ?? null,
        totalOwed: amount,
        invoiceCount: 1,
        oldestDays: daysOverdue,
        worstBucket: bucket,
        oldestDate: createdAt,
        newestDate: createdAt,
        invoices: [invoice],
      })
    }
  }

  const customers = [...byCustomer.values()]
    // Oldest debt first; ties broken by who owes more.
    .sort((a, b) => b.oldestDays - a.oldestDays || b.totalOwed - a.totalOwed)
    .map((c) => ({
      ...c,
      invoices: [...c.invoices].sort((a, b) => b.daysOverdue - a.daysOverdue),
    }))

  return {
    totalOwed,
    customerCount: customers.length,
    invoiceCount: rows.length,
    buckets,
    customers,
  }
}

export interface PartsPurchaseSummary {
  /** Cash actually invoiced by suppliers in this month. */
  total: number
  invoiceCount: number
  /** Spend grouped by supplier, highest first. */
  bySupplier: { name: string; total: number }[]
}

/**
 * What the shop actually paid suppliers for parts in a given month.
 *
 * NOTE: this is reported alongside the P&L but deliberately NOT subtracted
 * from net profit. Parts already hit profit as COGS when they are consumed on
 * a job (see `inventoryCost`), so subtracting invoices too would double-count.
 */
export async function getPartsPurchasesForMonth(
  shopId: string,
  year: number,
  month: number,
): Promise<PartsPurchaseSummary> {
  const supabase = await createClient()

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data } = await supabase
    .from('supplier_purchases')
    .select('total, supplier:suppliers(name)')
    .eq('shop_id', shopId)
    .gte('purchase_date', monthStart)
    .lt('purchase_date', monthEnd)

  const rows = data ?? []
  const bySupplier = new Map<string, number>()
  let total = 0

  for (const row of rows) {
    const amount = Number(row.total) || 0
    total += amount
    const name = (row.supplier as unknown as { name: string } | null)?.name ?? 'Unknown'
    bySupplier.set(name, (bySupplier.get(name) ?? 0) + amount)
  }

  return {
    total,
    invoiceCount: rows.length,
    bySupplier: [...bySupplier.entries()]
      .map(([name, amount]) => ({ name, total: amount }))
      .sort((a, b) => b.total - a.total),
  }
}

/**
 * Full analytics for a single month: revenue (approved estimates),
 * inventory profit, operating expenses, best employees, and net profit.
 */
export async function getMonthlyAnalytics(
  shopId: string,
  year: number,
  month: number,
): Promise<MonthlyAnalytics> {
  const supabase = await createClient()
  const { start, end } = monthRange(year, month)

  const [estimatesResult, txResult, expenses] = await Promise.all([
    // Approved estimates count as earned revenue, bucketed by created_at
    supabase
      .from('estimates')
      .select('id, total, job_card_id, created_at, payment_status')
      .eq('shop_id', shopId)
      .eq('status', 'approved')
      .gte('created_at', start)
      .lte('created_at', end),
    // Inventory consumed this month (transaction_type = 'out')
    supabase
      .from('inventory_transactions')
      .select('inventory_id, quantity, transaction_type, created_at, inventory:inventory(id, name, sku, unit_cost, sell_price)')
      .eq('transaction_type', 'out')
      .gte('created_at', start)
      .lte('created_at', end),
    getExpensesForMonth(shopId, year, month),
  ])

  const estimates = estimatesResult.data || []
  const revenue = estimates.reduce((sum, e) => sum + Number(e.total || 0), 0)
  const approvedCount = estimates.length

  // Split approved revenue into what the client has paid vs. still owes
  const paidRevenue = estimates
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, e) => sum + Number(e.total || 0), 0)
  const outstandingRevenue = revenue - paidRevenue
  const unpaidCount = estimates.filter((e) => e.payment_status !== 'paid').length

  // Inventory profit aggregation. RLS already scopes inventory to the shop,
  // so transactions whose inventory join is null belong to another shop and are skipped.
  const invMap = new Map<string, InventoryProfitRow>()
  for (const tx of txResult.data || []) {
    const inv = (tx as any).inventory as
      | { id: string; name: string; sku: string | null; unit_cost: number | null; sell_price: number | null }
      | null
    if (!inv) continue
    const qty = Math.abs(Number(tx.quantity || 0))
    const unitCost = Number(inv.unit_cost || 0)
    const sellPrice = Number(inv.sell_price || 0)

    const existing = invMap.get(inv.id)
    if (existing) {
      existing.quantityUsed += qty
      existing.revenue += sellPrice * qty
      existing.cost += unitCost * qty
      existing.profit = existing.revenue - existing.cost
    } else {
      invMap.set(inv.id, {
        inventoryId: inv.id,
        name: inv.name,
        sku: inv.sku,
        quantityUsed: qty,
        unitCost,
        sellPrice,
        revenue: sellPrice * qty,
        cost: unitCost * qty,
        profit: sellPrice * qty - unitCost * qty,
      })
    }
  }
  const inventoryRows = Array.from(invMap.values()).sort((a, b) => b.profit - a.profit)
  const inventoryProfit = inventoryRows.reduce((sum, r) => sum + r.profit, 0)
  const inventoryCost = inventoryRows.reduce((sum, r) => sum + r.cost, 0)

  // Best employee: completed jobs this month and the revenue from their linked approved estimates.
  const employees = await getEmployeePerformance(shopId, start, end)

  // Net profit = revenue - inventory cost (COGS) - operating expenses
  const netProfit = revenue - inventoryCost - expenses.total

  return {
    year,
    month,
    revenue,
    approvedCount,
    paidRevenue,
    outstandingRevenue,
    unpaidCount,
    inventoryProfit,
    inventoryCost,
    expenses,
    netProfit,
    inventoryRows,
    employees,
  }
}

async function getEmployeePerformance(
  shopId: string,
  start: string,
  end: string,
): Promise<EmployeePerformanceRow[]> {
  const supabase = await createClient()

  // Finished jobs this month (completed or invoiced), with their assigned
  // employee and any linked approved estimate revenue. Invoiced jobs are also
  // credited to the technician since the work is done.
  const [jobsResult, employeesResult] = await Promise.all([
    supabase
      .from('job_cards')
      .select('id, assigned_employee_id, completed_date, status')
      .eq('shop_id', shopId)
      .in('status', ['completed', 'invoiced'])
      .gte('completed_date', start)
      .lte('completed_date', end),
    supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId),
  ])

  const jobs = (jobsResult.data || []).filter((j) => j.assigned_employee_id)
  const employees = employeesResult.data || []

  // Revenue per job via approved estimates linked to those jobs
  const jobIds = jobs.map((j) => j.id)
  const revenueByJob = new Map<string, number>()
  if (jobIds.length > 0) {
    const { data: linkedEstimates } = await supabase
      .from('estimates')
      .select('job_card_id, total, status')
      .eq('shop_id', shopId)
      .eq('status', 'approved')
      .in('job_card_id', jobIds)
    for (const est of linkedEstimates || []) {
      if (!est.job_card_id) continue
      revenueByJob.set(est.job_card_id, (revenueByJob.get(est.job_card_id) || 0) + Number(est.total || 0))
    }
  }

  const nameById = new Map(
    employees.map((e) => [e.id, `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || 'Unnamed']),
  )

  const statsByEmployee = new Map<string, EmployeePerformanceRow>()
  for (const job of jobs) {
    const empId = job.assigned_employee_id as string
    const existing = statsByEmployee.get(empId)
    const jobRevenue = revenueByJob.get(job.id) || 0
    if (existing) {
      existing.completedJobs += 1
      existing.revenue += jobRevenue
    } else {
      statsByEmployee.set(empId, {
        employeeId: empId,
        name: nameById.get(empId) || 'Unknown',
        completedJobs: 1,
        revenue: jobRevenue,
      })
    }
  }

  return Array.from(statsByEmployee.values()).sort(
    (a, b) => b.completedJobs - a.completedJobs || b.revenue - a.revenue,
  )
}

/**
 * 12-month trailing trend ending at the given year/month (inclusive).
 * Used for the chart and for the simple projection.
 */
export async function getMonthlyTrend(
  shopId: string,
  endYear: number,
  endMonth: number,
  months = 12,
): Promise<MonthlyTrendPoint[]> {
  const supabase = await createClient()

  // Window start
  const windowStart = new Date(Date.UTC(endYear, endMonth - months, 1))
  const windowEnd = new Date(Date.UTC(endYear, endMonth, 0, 23, 59, 59, 999))

  const [estimatesResult, txResult, defaultsResult, overridesResult] = await Promise.all([
    supabase
      .from('estimates')
      .select('total, created_at')
      .eq('shop_id', shopId)
      .eq('status', 'approved')
      .gte('created_at', windowStart.toISOString())
      .lte('created_at', windowEnd.toISOString()),
    supabase
      .from('inventory_transactions')
      .select('quantity, created_at, inventory:inventory(unit_cost)')
      .eq('transaction_type', 'out')
      .gte('created_at', windowStart.toISOString())
      .lte('created_at', windowEnd.toISOString()),
    supabase
      .from('shop_expense_defaults')
      .select('rent, utilities, payroll, misc')
      .eq('shop_id', shopId)
      .maybeSingle(),
    supabase
      .from('monthly_expenses')
      .select('year, month, rent, utilities, payroll, misc')
      .eq('shop_id', shopId),
  ])

  const defaults = defaultsResult.data
  const defaultTotal = defaults
    ? Number(defaults.rent || 0) + Number(defaults.utilities || 0) + Number(defaults.payroll || 0) + Number(defaults.misc || 0)
    : 0

  const overrideTotals = new Map<string, number>()
  for (const o of overridesResult.data || []) {
    overrideTotals.set(
      `${o.year}-${o.month}`,
      Number(o.rent || 0) + Number(o.utilities || 0) + Number(o.payroll || 0) + Number(o.misc || 0),
    )
  }

  // Build empty buckets
  const points: MonthlyTrendPoint[] = []
  const indexByKey = new Map<string, number>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endYear, endMonth - 1 - i, 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const key = `${y}-${m}`
    indexByKey.set(key, points.length)
    const expenseTotal = overrideTotals.has(key) ? overrideTotals.get(key)! : defaultTotal
    points.push({
      year: y,
      month: m,
      label: `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}`,
      revenue: 0,
      expenses: expenseTotal,
      netProfit: -expenseTotal,
    })
  }

  // Revenue per bucket
  for (const est of estimatesResult.data || []) {
    const d = new Date(est.created_at as string)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
    const idx = indexByKey.get(key)
    if (idx === undefined) continue
    points[idx].revenue += Number(est.total || 0)
  }

  // Inventory COGS per bucket (cost of consumed parts)
  for (const tx of txResult.data || []) {
    const inv = (tx as any).inventory as { unit_cost: number | null } | null
    if (!inv) continue
    const d = new Date(tx.created_at as string)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
    const idx = indexByKey.get(key)
    if (idx === undefined) continue
    const cogs = Math.abs(Number(tx.quantity || 0)) * Number(inv.unit_cost || 0)
    points[idx].netProfit -= cogs
  }

  // Finalize net profit = revenue - expenses - cogs (cogs already subtracted above)
  for (const p of points) {
    p.netProfit += p.revenue
  }

  return points
}

export async function getExpenseDefaults(shopId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shop_expense_defaults')
    .select('rent, utilities, payroll, misc')
    .eq('shop_id', shopId)
    .maybeSingle()
  return {
    rent: Number(data?.rent ?? 0),
    utilities: Number(data?.utilities ?? 0),
    payroll: Number(data?.payroll ?? 0),
    misc: Number(data?.misc ?? 0),
  }
}

export async function getMonthlyExpenseRow(shopId: string, year: number, month: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('monthly_expenses')
    .select('rent, utilities, payroll, misc, notes')
    .eq('shop_id', shopId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()
  return data
}
