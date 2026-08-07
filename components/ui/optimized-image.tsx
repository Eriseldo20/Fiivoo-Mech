'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInView, setIsInView] = useState(priority)
  const ref = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [priority, isInView])

  // Generate a simple blur placeholder if none provided
  const defaultBlurDataURL = 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAEH/8QAHhAAAgICAgMAAAAAAAAAAAAAAQIAEQMEBRIGITH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBEQCEEP8AarStjytHi2VYZDFLqSPdCvU2T+yr/9k='

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <Skeleton 
          className={cn(
            'absolute inset-0',
            fill ? 'w-full h-full' : ''
          )}
          style={!fill ? { width, height } : undefined}
        />
      )}
      
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes || (fill ? '100vw' : undefined)}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  )
}

// Simple avatar with initials fallback
interface AvatarImageProps {
  src?: string | null
  alt: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function AvatarImage({
  src,
  alt,
  name,
  size = 'md',
  className,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false)
  
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={size === 'sm' ? '32px' : size === 'md' ? '40px' : '48px'}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
