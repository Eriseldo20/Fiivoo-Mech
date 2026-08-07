'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        keepPreviousData: true,
        // Use localStorage for persistent cache
        provider: () => {
          const map = new Map<string, any>()
          
          // Try to restore from localStorage on mount
          if (typeof window !== 'undefined') {
            try {
              const cached = localStorage.getItem('swr-cache')
              if (cached) {
                const parsed = JSON.parse(cached)
                Object.entries(parsed).forEach(([key, value]) => {
                  map.set(key, value)
                })
              }
            } catch {
              // Ignore localStorage errors
            }
          }
          
          // Save to localStorage periodically
          const originalSet = map.set.bind(map)
          map.set = (key: string, value: any) => {
            const result = originalSet(key, value)
            
            // Debounce localStorage writes
            if (typeof window !== 'undefined') {
              clearTimeout((window as any).__swrSaveTimeout)
              ;(window as any).__swrSaveTimeout = setTimeout(() => {
                try {
                  const data: Record<string, any> = {}
                  map.forEach((v, k) => {
                    // Only cache data, not errors or loading states
                    if (v && !v.error && v.data) {
                      data[k] = { data: v.data, ts: Date.now() }
                    }
                  })
                  localStorage.setItem('swr-cache', JSON.stringify(data))
                } catch {
                  // Ignore localStorage errors
                }
              }, 1000)
            }
            
            return result
          }
          
          return map
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
