'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getBlobUrl } from '@/lib/blob'
import { compressImage } from '@/lib/image-compress'

interface PhotoUploadProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

export function PhotoUpload({ label, value, onChange, className }: PhotoUploadProps) {
  const t = useTranslations('photoUpload')
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (original: File) => {
    if (!original.type.startsWith('image/')) {
      alert(t('selectImageFile'))
      return
    }

    // Guard against absurdly large originals before we even read them
    if (original.size > 25 * 1024 * 1024) {
      alert(t('imageTooLarge'))
      return
    }

    setIsUploading(true)
    try {
      // Downscale + re-encode in the browser so we store/serve a small file
      // instead of a multi-megabyte phone photo
      const file = await compressImage(original, {
        maxDimension: 1600,
        quality: 0.8,
        maxBytes: 5 * 1024 * 1024,
      })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      // Store the pathname for private blobs - will be served via /api/file route
      onChange(data.pathname)
    } catch (error) {
      console.error('Upload error:', error)
      alert(t('uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRemove = () => {
    onChange(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {value ? (
        <div className="relative group">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-card">
            <img
              src={getBlobUrl(value) || ''}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {t('remove')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative aspect-video rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            'flex flex-col items-center justify-center gap-2',
            'bg-card/50 hover:bg-card hover:border-primary/50',
            dragOver && 'border-primary bg-primary/5',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">{t('uploading')}</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-muted">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {t('clickToUpload')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('fileTypes')}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
