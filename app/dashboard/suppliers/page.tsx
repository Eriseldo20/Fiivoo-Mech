import { redirect } from 'next/navigation'
import { requireDashboardUser } from '@/lib/auth/roles'
import {
  getSuppliers,
  getSupplierPurchases,
  getSupplierSpendSummary,
  getInventory,
} from '@/lib/data/cached-queries'
import { SuppliersClient } from '@/components/suppliers/suppliers-client'

export default async function SuppliersPage() {
  // Owner/manager guard + shop resolution.
  const user = await requireDashboardUser()

  // Supplier spend is financial data: owner only.
  if (user.role !== 'owner') redirect('/dashboard')

  // All cached reads (produce cache HITs across navigations), scoped by shopId.
  const [suppliers, purchases, summary, inventory] = await Promise.all([
    getSuppliers(user.shopId),
    getSupplierPurchases(user.shopId),
    getSupplierSpendSummary(user.shopId),
    getInventory(user.shopId),
  ])

  return (
    <SuppliersClient
      suppliers={suppliers as never[]}
      purchases={purchases as never[]}
      inventory={inventory as never[]}
      summary={summary}
    />
  )
}
