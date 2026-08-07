'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/dashboard/header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Edit, 
  Trash2,
  Briefcase,
  Euro,
  Calendar,
  KeyRound,
} from 'lucide-react'
import { format } from 'date-fns'
import { CURRENCY } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { WorkerAccessDialog } from '@/components/employees/worker-access-dialog'

interface Employee {
  id: string
  shop_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string
  hourly_rate: number | null
  status: string
  hire_date: string | null
  notes: string | null
  created_at: string
  user_id: string | null
}

const roleColors: Record<string, string> = {
  technician: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  service_advisor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  manager: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

export default function EmployeesPage() {
  const t = useTranslations('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [shopId, setShopId] = useState<string | null>(null)
  const [accessEmployee, setAccessEmployee] = useState<Employee | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'technician',
    hourly_rate: '',
    status: 'active',
    hire_date: '',
    notes: '',
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()

    if (profile?.shop_id) {
      setShopId(profile.shop_id)
      
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('first_name')

      setEmployees(data || [])
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'technician',
      hourly_rate: '',
      status: 'active',
      hire_date: '',
      notes: '',
    })
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      hourly_rate: employee.hourly_rate?.toString() || '',
      status: employee.status,
      hire_date: employee.hire_date || '',
      notes: employee.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!shopId || !formData.first_name || !formData.last_name) return

    setIsSaving(true)
    const supabase = createClient()

    const employeeData = {
      shop_id: shopId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      status: formData.status,
      hire_date: formData.hire_date || null,
      notes: formData.notes || null,
    }

    if (editingEmployee) {
      await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', editingEmployee.id)
    } else {
      await supabase
        .from('employees')
        .insert(employeeData)
    }

    setIsSaving(false)
    setShowAddDialog(false)
    setEditingEmployee(null)
    resetForm()
    loadEmployees()
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const supabase = createClient()
    await supabase.from('employees').delete().eq('id', deleteId)
    
    setDeleteId(null)
    loadEmployees()
  }

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone?.includes(searchQuery)
  })

  const activeEmployees = filteredEmployees.filter(e => e.status === 'active')
  const inactiveEmployees = filteredEmployees.filter(e => e.status === 'inactive')

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title={t('title')} description={t('description')} />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header 
        title={t('title')} 
        description={t('description')}
      />
      
      <div className="p-6 space-y-6">
        {/* Search and Add */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchEmployees')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addEmployee')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{activeEmployees.length}</p>
                  <p className="text-sm text-muted-foreground">{t('activeEmployees')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Briefcase className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {employees.filter(e => e.role === 'technician').length}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('technicians')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Euro className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {CURRENCY.symbol}{employees.reduce((acc, e) => acc + (e.hourly_rate || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('avgHourlyRate')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee List */}
        {filteredEmployees.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{t('noEmployeesFound')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? t('tryAdjustingSearch') : t('getStartedAdding')}
              </p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addEmployee')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="glass-card hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {employee.first_name[0]}{employee.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <Badge variant="outline" className={roleColors[employee.role]}>
                          {t(`role_${employee.role}`)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8',
                          employee.user_id ? 'text-emerald-500 hover:text-emerald-600' : ''
                        )}
                        title={t('portalAccess')}
                        onClick={() => setAccessEmployee(employee)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteId(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    {employee.hourly_rate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span>{CURRENCY.symbol}{employee.hourly_rate}{t('perHour')}</span>
                      </div>
                    )}
                    {employee.hire_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{t('hiredOn', { date: format(new Date(employee.hire_date), 'MMM d, yyyy') })}</span>
                      </div>
                    )}
                  </div>

                  {employee.status === 'inactive' && (
                    <Badge variant="outline" className="mt-3 bg-red-500/10 text-red-500 border-red-500/20">
                      {t('inactive')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingEmployee(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? t('editEmployee') : t('addEmployee')}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? t('updateEmployeeInfo') : t('addNewMemberDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('firstName')} *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder={t('firstNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('lastName')} *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder={t('lastNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t('role')}</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">{t('role_technician')}</SelectItem>
                    <SelectItem value="service_advisor">{t('role_service_advisor')}</SelectItem>
                    <SelectItem value="manager">{t('role_manager')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">{t('hourlyRate', { symbol: CURRENCY.symbol })}</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">{t('hireDate')}</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.first_name || !formData.last_name}
            >
              {isSaving ? t('saving') : editingEmployee ? t('update') : t('addEmployee')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Worker portal access */}
      <WorkerAccessDialog
        open={!!accessEmployee}
        onOpenChange={(open) => !open && setAccessEmployee(null)}
        employee={accessEmployee}
        onChanged={loadEmployees}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEmployee')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
