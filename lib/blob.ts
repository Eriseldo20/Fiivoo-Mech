/**
 * Generates the URL for a private blob file
 * Private blobs are served through /api/file route
 */
export function getBlobUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  
  // If it's already a full URL (legacy or public blob), return as-is
  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    return pathname
  }
  
  // For private blobs, serve through our API route
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}
