'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  src: string
  alt: string
  /** Classes applied to the thumbnail <img> */
  className?: string
  /** Optional caption shown in the fullscreen view */
  caption?: string
}

/**
 * Renders a clickable image thumbnail that opens a fullscreen overlay
 * to view the image at full size. Self-contained, no external deps.
 */
export function ImageLightbox({ src, alt, className, caption }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} full size`}
        className="group/lightbox relative block h-full w-full cursor-zoom-in"
      >
        <img src={src || '/placeholder.svg'} alt={alt} className={className} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/lightbox:bg-black/30 group-hover/lightbox:opacity-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
            <ZoomIn className="h-4 w-4" />
          </span>
        </span>
      </button>

      {mounted && open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              <figure
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-full max-w-5xl flex-col items-center gap-3"
              >
                <img
                  src={src || '/placeholder.svg'}
                  alt={alt}
                  className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
                />
                {caption ? (
                  <figcaption className="text-sm text-white/70">{caption}</figcaption>
                ) : null}
              </figure>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
