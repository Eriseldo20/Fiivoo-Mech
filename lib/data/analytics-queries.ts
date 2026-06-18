import { createClient } from '@/lib/supabase/server'

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
