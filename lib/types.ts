export interface Shop {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  created_at: string
  owner_id: string
}

export interface Profile {
  id: string
  shop_id: string | null
  first_name: string | null
  last_name: string | null
  role: 'owner' | 'manager' | 'mechanic'
  avatar_url: string | null
  created_at: string
}

export interface Customer {
  id: string
  shop_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  shop_id: string
  customer_id: string | null
  make: string
  model: string
  year: number | null
  vin: string | null
  license_plate: string | null
  color: string | null
  mileage: number | null
  notes: string | null
  primary_photo: string | null
  secondary_photo: string | null
  created_at: string
  customer?: Customer
}

export interface JobCard {
  id: string
  shop_id: string
  vehicle_id: string | null
  customer_id: string | null
  assigned_to: string | null
  job_number: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'awaiting_parts' | 'completed' | 'invoiced'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimated_hours: number | null
  actual_hours: number | null
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  customer?: Customer
  assignee?: Profile
}

export interface Estimate {
  id: string
  shop_id: string
  vehicle_id: string | null
  customer_id: string | null
  job_card_id: string | null
  estimate_number: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  valid_until: string | null
  notes: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  customer?: Customer
  job_card?: JobCard
  items?: EstimateItem[]
}

export interface EstimateItem {
  id: string
  estimate_id: string
  shop_id: string
  type: 'labor' | 'parts' | 'other'
  description: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}
