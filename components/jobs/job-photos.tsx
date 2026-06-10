'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { getBlobUrl } from '@/lib/blob'
import { compressImage } from '@/lib/image-compress'

export interface JobPhoto {
  id: string
  pathname: string
  category: 'before' | 'after'
  caption: string | null
}

interface JobPhotosProps {
  jobId: string
  shopId: string
  photos: JobPhoto[]
}

const MAX_PER_CATEGORY = 5

export function JobPhotos({ jobId, shopId, photos }: JobPhotosProps) {
  const before = photos.filter((p) => p.category === 'before')
  const after = photos.filter((p) => p.category === 'after')

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Camera className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Job Photos</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Upload up to {MAX_PER_CATEGORY} photos for each stage. Phone photos are
        automatically compressed before upload.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhotoColumn
          jobId={jobId}
          shopId={shopId}
          category="before"
          title="Before"
          photos={before}
        />
        <PhotoColumn
          jobId={jobId}
          shopId={shopId}
          category="after"
          title="After"
          photos={after}
        />
      </div>
    </div>
  )
}

function PhotoColumn({
  jobId,
  shopId,
  category,
  title,
  photos,
}: {
  jobId: string
  shopId: string
  category: 'before' | 'after'
  title: string
  photos: JobPhoto[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const atLimit = photos.length >= MAX_PER_CATEGORY
  const remaining = MAX_PER_CATEGORY - photos.length

  const handleFiles = async (files: FileList) => {
    setError(null)
    const selected = Array.from(files).slice(0, remaining)
    if (selected.length === 0) return

    setIsUploading(true)
    const supabase = createClient()

    try {
      for (const original of selected) {
        if (!original.type.startsWith('image/')) {
          setError('Only image files are allowed')
          continue
        }

        // Compress phone photos down before uploading
        const file = await compressImage(original, {
          maxDimension: 1920,
          quality: 0.8,
          maxBytes: 5 * 1024 * 1024,
        })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'jobs')

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Upload failed')
        }
        const { pathname } = await res.json()

        const { error: insertError } = await supabase.from('job_photos').insert({
          shop_id: shopId,
          job_card_id: jobId,
          pathname,
          category,
        })
        if (insertError) throw insertError
      }
      router.refresh()
    } catch (err) {
      console.error('Photo upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (photo: JobPhoto) => {
    setBusyId(photo.id)
    setError(null)
    try {
      const supabase = createClient()
      const { error: delError } = await supabase
        .from('job_photos')
        .delete()
        .eq('id', photo.id)
      if (delError) throw delError
      router.refresh()
    } catch (err) {
      console.error('Photo delete error:', err)
      setError('Failed to remove photo')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PER_CATEGORY}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-background/50"
          >
            <img
              src={getBlobUrl(photo.pathname) || ''}
              alt={`${title} photo`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              disabled={busyId === photo.id}
              aria-label="Remove photo"
              className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-100"
            >
              {busyId === photo.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-border',
              'flex flex-col items-center justify-center gap-1 transition-colors',
              'bg-card/50 hover:bg-card hover:border-primary/50',
              isUploading && 'pointer-events-none opacity-50',
            )}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
