'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { ThumbsUp } from 'lucide-react'

// Animated thumbs-up shown on every success toast, so any saved change
// gets the same little confirmation across the whole app.
function ThumbsUpIcon() {
  return (
    <span className="thumbs-up-burst inline-flex text-primary">
      <ThumbsUp className="h-4 w-4 fill-current" aria-hidden="true" />
    </span>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{ success: <ThumbsUpIcon /> }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
