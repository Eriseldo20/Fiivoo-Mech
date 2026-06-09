'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useState, useCallback } from 'react'

interface JobFiltersProps {
  currentStatus?: string
  currentPriority?: string
  currentSearch?: string
}

const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_parts', label: 'Awaiting Parts' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
]

const priorities = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function JobFilters({ currentStatus, currentPriority, currentSearch }: JobFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || '')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleFilter = (name: string, value: string) => {
    router.push(pathname + '?' + createQueryString(name, value))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilter('search', search)
  }

  const clearFilters = () => {
    setSearch('')
    router.push(pathname)
  }

  const hasFilters = currentStatus || currentPriority || currentSearch

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 bg-card/50 border-border/50 focus:border-primary/50"
        />
      </form>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={currentStatus || 'all'}
          onValueChange={(value) => handleFilter('status', value)}
        >
          <SelectTrigger className="w-[160px] h-10 bg-card/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentPriority || 'all'}
          onValueChange={(value) => handleFilter('priority', value)}
        >
          <SelectTrigger className="w-[160px] h-10 bg-card/50 border-border/50">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
