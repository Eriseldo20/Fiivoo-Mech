'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useCallback } from 'react'

interface EstimateFiltersProps {
  currentStatus?: string
  currentSearch?: string
}

const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
]

export function EstimateFilters({ currentStatus, currentSearch }: EstimateFiltersProps) {
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

  const hasFilters = currentStatus || currentSearch

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search estimates..."
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
