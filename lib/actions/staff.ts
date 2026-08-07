'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/roles'

export type CreateWorkerResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

/**
 * Creates a login account for an existing employee and links it.
 * Only owners/managers may call this. The new account gets the
 * 'mechanic' role and is scoped to the caller's shop.
 */
export async function createWorkerAccount(formData: {
  employeeId: string
  email: string
  password: string
}): Promise<CreateWorkerResult> {
  const caller = await getCurrentUser()
  if (!caller) return { ok: false, error: 'Not authenticated' }
  if (caller.role !== 'owner' && caller.role !== 'manager') {
    return { ok: false, error: 'Not authorized' }
  }

  const email = formData.email.trim().toLowerCase()
  const { password, employeeId } = formData

  if (!email || !password) return { ok: false, error: 'Email and password are required' }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' }

  const supabase = await createClient()

  // Verify the employee belongs to the caller's shop and isn't already linked.
  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name, shop_id, user_id')
    .eq('id', employeeId)
    .single()

  if (!employee || employee.shop_id !== caller.shopId) {
    return { ok: false, error: 'Employee not found' }
  }
  if (employee.user_id) {
    return { ok: false, error: 'This employee already has a login account' }
  }

  const admin = createAdminClient()

  // 1. Create the auth user (email pre-confirmed so they can log in immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: employee.first_name,
      last_name: employee.last_name,
    },
  })

  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? 'Could not create account' }
  }

  const newUserId = created.user.id

  // 2. Create / upsert the profile row (mechanic, same shop).
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: newUserId,
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: 'mechanic',
      shop_id: caller.shopId,
    },
    { onConflict: 'id' }
  )

  if (profileErr) {
    // Roll back the auth user so we don't leave an orphan.
    await admin.auth.admin.deleteUser(newUserId)
    return { ok: false, error: profileErr.message }
  }

  // 3. Link the employee record to the new login + store the email.
  const { error: linkErr } = await admin
    .from('employees')
    .update({ user_id: newUserId, email })
    .eq('id', employeeId)

  if (linkErr) {
    await admin.auth.admin.deleteUser(newUserId)
    return { ok: false, error: linkErr.message }
  }

  revalidatePath('/dashboard/employees')
  return { ok: true, userId: newUserId }
}

/** Removes a worker's login access (unlinks + deletes the auth user). */
export async function revokeWorkerAccount(employeeId: string): Promise<CreateWorkerResult> {
  const caller = await getCurrentUser()
  if (!caller) return { ok: false, error: 'Not authenticated' }
  if (caller.role !== 'owner' && caller.role !== 'manager') {
    return { ok: false, error: 'Not authorized' }
  }

  const supabase = await createClient()
  const { data: employee } = await supabase
    .from('employees')
    .select('id, shop_id, user_id')
    .eq('id', employeeId)
    .single()

  if (!employee || employee.shop_id !== caller.shopId) {
    return { ok: false, error: 'Employee not found' }
  }
  if (!employee.user_id) return { ok: false, error: 'No linked account' }

  const admin = createAdminClient()
  await admin.from('employees').update({ user_id: null }).eq('id', employeeId)
  await admin.auth.admin.deleteUser(employee.user_id)

  revalidatePath('/dashboard/employees')
  return { ok: true, userId: employee.user_id }
}
